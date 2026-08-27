import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";

export type ServiceRow = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_cents: number | null;
  active: boolean;
  sort_order: number;
};

export type BarberRow = {
  id: string;
  name: string;
  specialty: string | null;
  photo_url: string | null;
  work_hours: Record<string, { open: string; close: string } | null> | null;
  active: boolean;
  sort_order: number;
};

export type Hours = Record<string, { open: string; close: string } | null>;

export type SettingsRow = {
  id: number;
  address: string;
  phone: string;
  instagram: string;
  hours: Hours;
  buffer_min: number;
};

export type AppointmentRow = {
  id: string;
  client_id: string | null;
  barber_id: string | null;
  starts_at: string;
  ends_at: string;
  services: { id: string; name: string; duration_min: number; price_cents: number | null }[];
  total_cents: number;
  duration_min: number;
  status: string;
  notes: string | null;
  created_at: string;
};

export async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ---------------- sessão do admin ---------------- */

type AdminSession = { admin?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "savaya-admin",
    maxAge: 60 * 60 * 24 * 60,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function adminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export async function requireAdmin() {
  const session = await adminSession();
  if (!session.data.admin) throw new Error("NAO_AUTORIZADO");
  return session;
}

export function hashPin(pin: string): string {
  const salt = process.env["ADMIN_PIN_SALT"] ?? "savaya";
  return createHash("sha256").update(`${salt}:${pin}`, "utf8").digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function randomId() {
  return randomBytes(8).toString("hex");
}

/* ---------------- agenda ---------------- */

const TZ_OFFSET = "-03:00";

export function toInstant(dateISO: string, time: string): Date {
  return new Date(`${dateISO}T${time}:00${TZ_OFFSET}`);
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function weekdayOf(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

type Busy = { start: number; end: number; barberId: string | null };

export type SlotComputation = {
  slots: string[];
  closed: boolean;
};

export function computeSlots(params: {
  dateISO: string;
  durationMin: number;
  bufferMin: number;
  hours: Hours;
  barbers: BarberRow[];
  barberId: string | null;
  appointments: AppointmentRow[];
  blocks: { barber_id: string | null; start_time: string | null; end_time: string | null }[];
  nowISO?: string;
}): SlotComputation {
  const { dateISO, durationMin, bufferMin, hours, barbers, barberId, appointments, blocks } =
    params;

  const weekday = String(weekdayOf(dateISO));
  const shopHours = hours[weekday];
  if (!shopHours) return { slots: [], closed: true };

  // bloqueio de dia inteiro
  const fullDayBlock = blocks.find((b) => !b.start_time && !b.end_time);
  const scopedFull = fullDayBlock
    ? barberId
      ? fullDayBlock.barber_id === null || fullDayBlock.barber_id === barberId
      : fullDayBlock.barber_id === null
    : false;
  if (scopedFull) return { slots: [], closed: true };

  const candidates = barberId
    ? barbers.filter((b) => b.id === barberId)
    : barbers.filter((b) => b.active);
  const pool = candidates.length ? candidates : [];

  const busy: Busy[] = [];
  for (const a of appointments) {
    if (a.status === "cancelled") continue;
    const s = new Date(a.starts_at);
    const e = new Date(a.ends_at);
    busy.push({
      start: instantToMinutes(dateISO, s),
      end: instantToMinutes(dateISO, e),
      barberId: a.barber_id,
    });
  }
  for (const b of blocks) {
    if (!b.start_time || !b.end_time) continue;
    busy.push({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
      barberId: b.barber_id,
    });
  }

  const nowMin = currentMinutesIfToday(dateISO);
  const openMin = timeToMinutes(shopHours.open);
  const closeMin = timeToMinutes(shopHours.close);
  const step = 15;
  const slots: string[] = [];

  for (let t = openMin; t + durationMin <= closeMin; t += step) {
    if (nowMin !== null && t <= nowMin + 30) continue;

    const free = pool.some((barber) => {
      const bh = barber.work_hours?.[weekday];
      if (barber.work_hours && bh === null) return false;
      if (bh) {
        if (t < timeToMinutes(bh.open) || t + durationMin > timeToMinutes(bh.close)) return false;
      }
      return !busy.some((x) => {
        if (x.barberId !== null && x.barberId !== barber.id) return false;
        return t < x.end + bufferMin && t + durationMin + bufferMin > x.start;
      });
    });

    if (free) slots.push(minutesToTime(t));
  }

  return { slots, closed: false };
}

function instantToMinutes(dateISO: string, instant: Date): number {
  const base = new Date(`${dateISO}T00:00:00${TZ_OFFSET}`).getTime();
  return Math.round((instant.getTime() - base) / 60000);
}

function currentMinutesIfToday(dateISO: string): number | null {
  const now = new Date();
  const brasiliaNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayISO = brasiliaNow.toISOString().slice(0, 10);
  if (todayISO !== dateISO) return null;
  return brasiliaNow.getUTCHours() * 60 + brasiliaNow.getUTCMinutes();
}
