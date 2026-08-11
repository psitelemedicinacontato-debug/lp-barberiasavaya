import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const pinSchema = z.object({ pin: z.string().trim().min(4).max(32) });

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { db, adminSession } = await import("./savaya.server");
  const supabase = await db();
  const session = await adminSession();
  const { data } = await supabase.from("admin_auth").select("pin_hash").eq("id", 1).single();
  return { authed: !!session.data.admin, needsSetup: !data?.pin_hash };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pinSchema.parse(data))
  .handler(async ({ data }) => {
    const { db, adminSession, hashPin, safeEqual } = await import("./savaya.server");
    const supabase = await db();
    const { data: row } = await supabase.from("admin_auth").select("pin_hash").eq("id", 1).single();
    const session = await adminSession();

    if (!row?.pin_hash) {
      await supabase.from("admin_auth").update({ pin_hash: hashPin(data.pin) }).eq("id", 1);
      await session.update({ admin: true });
      return { ok: true as const, created: true };
    }

    if (!safeEqual(row.pin_hash, hashPin(data.pin))) {
      return { ok: false as const, error: "Senha incorreta." };
    }
    await session.update({ admin: true });
    return { ok: true as const, created: false };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { adminSession } = await import("./savaya.server");
  const session = await adminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminChangePin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pinSchema.parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin, hashPin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase.from("admin_auth").update({ pin_hash: hashPin(data.pin) }).eq("id", 1);
    return { ok: true as const };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ from: z.string(), to: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();

    const [appointments, clients, services, barbers, blocks, settings] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .gte("starts_at", `${data.from}T00:00:00-03:00`)
        .lte("starts_at", `${data.to}T23:59:59-03:00`)
        .order("starts_at"),
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("barbers").select("*").order("sort_order"),
      supabase.from("schedule_blocks").select("*").order("block_date"),
      supabase.from("business_settings").select("*").eq("id", 1).single(),
    ]);

    return {
      appointments: appointments.data ?? [],
      clients: clients.data ?? [],
      services: services.data ?? [],
      barbers: barbers.data ?? [],
      blocks: blocks.data ?? [],
      settings: settings.data ?? null,
    };
  });

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  duration_min: z.number().int().min(5).max(480),
  price_cents: z.number().int().min(0).max(10000000).nullable(),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export const saveService = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => serviceSchema.parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    const { id, ...values } = data;
    if (id) await supabase.from("services").update(values).eq("id", id);
    else await supabase.from("services").insert(values);
    return { ok: true as const };
  });

export const deleteService = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase.from("services").delete().eq("id", data.id);
    return { ok: true as const };
  });

const barberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  specialty: z.string().trim().max(80).nullable(),
  photo_url: z.string().trim().max(500).nullable(),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
  work_hours: z.record(z.string(), z.object({ open: z.string(), close: z.string() }).nullable()).nullable(),
});

export const saveBarber = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => barberSchema.parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    const { id, ...values } = data;
    if (id) await supabase.from("barbers").update(values).eq("id", id);
    else await supabase.from("barbers").insert(values);
    return { ok: true as const };
  });

export const deleteBarber = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase.from("barbers").delete().eq("id", data.id);
    return { ok: true as const };
  });

export const saveBlock = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        block_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        start_time: z.string().nullable(),
        end_time: z.string().nullable(),
        barber_id: z.string().uuid().nullable(),
        reason: z.string().trim().max(120).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase.from("schedule_blocks").insert(data);
    return { ok: true as const };
  });

export const deleteBlock = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase.from("schedule_blocks").delete().eq("id", data.id);
    return { ok: true as const };
  });

export const setAppointmentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["confirmed", "done", "cancelled", "noshow"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase.from("appointments").update({ status: data.status }).eq("id", data.id);
    return { ok: true as const };
  });

export const createManualAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(8).max(20),
        serviceIds: z.array(z.string().uuid()).min(1),
        barberId: z.string().uuid().nullable(),
        notes: z.string().trim().max(500).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db, requireAdmin, toInstant } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();

    const { data: services } = await supabase
      .from("services")
      .select("id,name,duration_min,price_cents")
      .in("id", data.serviceIds);
    if (!services?.length) return { ok: false as const, error: "Serviço inválido." };

    const durationMin = services.reduce((s, x) => s + (x.duration_min ?? 0), 0);
    const totalCents = services.reduce((s, x) => s + (x.price_cents ?? 0), 0);
    const phone = data.phone.replace(/\D/g, "");

    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    let clientId = existing?.id ?? null;
    if (!clientId) {
      const { data: created } = await supabase
        .from("clients")
        .insert({ name: data.name, phone })
        .select("id")
        .single();
      clientId = created?.id ?? null;
    }

    const startsAt = toInstant(data.date, data.time);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60000);

    await supabase.from("appointments").insert({
      client_id: clientId,
      barber_id: data.barberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      services,
      total_cents: totalCents,
      duration_min: durationMin,
      status: "confirmed",
      notes: data.notes,
    });

    return { ok: true as const };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        address: z.string().trim().min(3).max(240),
        phone: z.string().trim().min(8).max(30),
        instagram: z.string().trim().min(2).max(60),
        buffer_min: z.number().int().min(0).max(60),
        hours: z.record(z.string(), z.object({ open: z.string(), close: z.string() }).nullable()),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { db, requireAdmin } = await import("./savaya.server");
    await requireAdmin();
    const supabase = await db();
    await supabase
      .from("business_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    return { ok: true as const };
  });
