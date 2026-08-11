import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const availabilityInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMin: z.number().int().min(5).max(600),
  barberId: z.string().uuid().nullable(),
});

const bookingInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  serviceIds: z.array(z.string().uuid()).min(1).max(8),
  barberId: z.string().uuid().nullable(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const getPublicData = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./savaya.server");
  const supabase = await db();

  const [services, barbers, settings, blocks] = await Promise.all([
    supabase
      .from("services")
      .select("id,category,name,description,duration_min,price_cents,sort_order")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("barbers")
      .select("id,name,specialty,photo_url")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("business_settings").select("address,phone,instagram,hours").eq("id", 1).single(),
    supabase.from("schedule_blocks").select("block_date,start_time,barber_id"),
  ]);

  const closedDates = (blocks.data ?? [])
    .filter((b) => !b.start_time && b.barber_id === null)
    .map((b) => b.block_date as string);

  return {
    services: services.data ?? [],
    barbers: barbers.data ?? [],
    settings: settings.data ?? null,
    closedDates,
  };
});

export const getAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => availabilityInput.parse(data))
  .handler(async ({ data }) => {
    const { db, computeSlots } = await import("./savaya.server");
    const supabase = await db();

    const dayStart = `${data.date}T00:00:00-03:00`;
    const dayEnd = `${data.date}T23:59:59-03:00`;

    const [settings, barbers, appointments, blocks] = await Promise.all([
      supabase.from("business_settings").select("hours,buffer_min").eq("id", 1).single(),
      supabase.from("barbers").select("*").eq("active", true).order("sort_order"),
      supabase
        .from("appointments")
        .select("*")
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .neq("status", "cancelled"),
      supabase.from("schedule_blocks").select("barber_id,start_time,end_time").eq("block_date", data.date),
    ]);

    const result = computeSlots({
      dateISO: data.date,
      durationMin: data.durationMin,
      bufferMin: settings.data?.buffer_min ?? 5,
      hours: (settings.data?.hours ?? {}) as never,
      barbers: (barbers.data ?? []) as never,
      barberId: data.barberId,
      appointments: (appointments.data ?? []) as never,
      blocks: (blocks.data ?? []) as never,
    });

    return result;
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingInput.parse(data))
  .handler(async ({ data }) => {
    const { db, computeSlots, toInstant } = await import("./savaya.server");
    const supabase = await db();

    const { data: services } = await supabase
      .from("services")
      .select("id,name,duration_min,price_cents")
      .in("id", data.serviceIds)
      .eq("active", true);

    if (!services || services.length === 0) {
      return { ok: false as const, error: "Serviço indisponível." };
    }

    const durationMin = services.reduce((s, x) => s + (x.duration_min ?? 0), 0);
    const totalCents = services.reduce((s, x) => s + (x.price_cents ?? 0), 0);

    const dayStart = `${data.date}T00:00:00-03:00`;
    const dayEnd = `${data.date}T23:59:59-03:00`;
    const [settings, barbers, appointments, blocks] = await Promise.all([
      supabase.from("business_settings").select("hours,buffer_min").eq("id", 1).single(),
      supabase.from("barbers").select("*").eq("active", true).order("sort_order"),
      supabase
        .from("appointments")
        .select("*")
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .neq("status", "cancelled"),
      supabase.from("schedule_blocks").select("barber_id,start_time,end_time").eq("block_date", data.date),
    ]);

    const availability = computeSlots({
      dateISO: data.date,
      durationMin,
      bufferMin: settings.data?.buffer_min ?? 5,
      hours: (settings.data?.hours ?? {}) as never,
      barbers: (barbers.data ?? []) as never,
      barberId: data.barberId,
      appointments: (appointments.data ?? []) as never,
      blocks: (blocks.data ?? []) as never,
    });

    if (!availability.slots.includes(data.time)) {
      return { ok: false as const, error: "Esse horário acabou de ser reservado. Escolha outro." };
    }

    // resolve barbeiro quando "sem preferência"
    let barberId = data.barberId;
    if (!barberId) {
      const list = (barbers.data ?? []) as { id: string }[];
      for (const b of list) {
        const check = computeSlots({
          dateISO: data.date,
          durationMin,
          bufferMin: settings.data?.buffer_min ?? 5,
          hours: (settings.data?.hours ?? {}) as never,
          barbers: (barbers.data ?? []) as never,
          barberId: b.id,
          appointments: (appointments.data ?? []) as never,
          blocks: (blocks.data ?? []) as never,
        });
        if (check.slots.includes(data.time)) {
          barberId = b.id;
          break;
        }
      }
    }

    const phone = data.phone.replace(/\D/g, "");
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    let clientId = existing?.id ?? null;
    if (clientId) {
      await supabase
        .from("clients")
        .update({ name: data.name, email: data.email || null })
        .eq("id", clientId);
    } else {
      const { data: created, error } = await supabase
        .from("clients")
        .insert({ name: data.name, phone, email: data.email || null })
        .select("id")
        .single();
      if (error) return { ok: false as const, error: "Não foi possível salvar seus dados." };
      clientId = created.id;
    }

    const startsAt = toInstant(data.date, data.time);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60000);

    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        barber_id: barberId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        services,
        total_cents: totalCents,
        duration_min: durationMin,
        status: "confirmed",
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (apptError) return { ok: false as const, error: "Não foi possível concluir o agendamento." };

    const barber = (barbers.data ?? []).find((b: { id: string }) => b.id === barberId) as
      | { name: string }
      | undefined;

    return {
      ok: true as const,
      id: appointment.id,
      durationMin,
      totalCents,
      barberName: barber?.name ?? "Sem preferência",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      services: services.map((s) => s.name),
    };
  });
