import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, CalendarPlus, MessageCircle, X } from "lucide-react";
import { getAvailability, createBooking } from "@/lib/booking.functions";
import {
  BUSINESS,
  addDaysISO,
  formatDateLong,
  formatDuration,
  formatPrice,
  isoToDate,
  maskPhone,
  todayISO,
  whatsappLink,
} from "@/lib/business";
import { cn } from "@/lib/utils";

export type PublicService = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_cents: number | null;
};
export type PublicBarber = { id: string; name: string; specialty: string | null; photo_url: string | null };

type Confirmation = {
  services: string[];
  barberName: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  totalCents: number;
};

const STEPS = ["Serviços", "Profissional", "Data e hora", "Seus dados"];

export function BookingFlow({
  open,
  onClose,
  services,
  barbers,
  preselect,
}: {
  open: boolean;
  onClose: () => void;
  services: PublicService[];
  barbers: PublicBarber[];
  preselect?: string | null;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  const fetchAvailability = useServerFn(getAvailability);
  const submitBooking = useServerFn(createBooking);

  const chosen = useMemo(
    () => services.filter((s) => selected.includes(s.id)),
    [services, selected],
  );
  const totalDuration = chosen.reduce((a, s) => a + s.duration_min, 0);
  const totalPrice = chosen.reduce((a, s) => a + (s.price_cents ?? 0), 0);
  const hasPrices = chosen.some((s) => s.price_cents != null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDone(null);
    setError(null);
    setSelected(preselect ? [preselect] : []);
    setTime(null);
    setDate(null);
    try {
      const saved = localStorage.getItem("savaya:client");
      if (saved) {
        const parsed = JSON.parse(saved) as { name?: string; phone?: string; email?: string };
        setForm((f) => ({
          ...f,
          name: parsed.name ?? "",
          phone: parsed.phone ?? "",
          email: parsed.email ?? "",
        }));
      }
    } catch {
      /* ignore */
    }
  }, [open, preselect]);

  useEffect(() => {
    if (!open || step !== 2 || !date || totalDuration === 0) return;
    let active = true;
    setLoadingSlots(true);
    setSlots(null);
    fetchAvailability({ data: { date, durationMin: totalDuration, barberId } })
      .then((res) => {
        if (active) setSlots(res.slots);
      })
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [open, step, date, totalDuration, barberId, fetchAvailability]);

  if (!open) return null;

  const days = Array.from({ length: 21 }, (_, i) => addDaysISO(todayISO(), i));
  const canAdvance =
    (step === 0 && selected.length > 0) ||
    step === 1 ||
    (step === 2 && !!date && !!time) ||
    (step === 3 && form.name.trim().length > 1 && form.phone.replace(/\D/g, "").length >= 10);

  const grouped = groupBy(services, (s) => s.category);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitBooking({
        data: {
          date: date!,
          time: time!,
          serviceIds: selected,
          barberId,
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim(),
          notes: form.notes.trim(),
        },
      });
      if (!res.ok) {
        setError(res.error);
        setStep(2);
        return;
      }
      localStorage.setItem(
        "savaya:client",
        JSON.stringify({ name: form.name.trim(), phone: form.phone, email: form.email.trim() }),
      );
      setDone({
        services: res.services,
        barberName: res.barberName,
        startsAt: res.startsAt,
        endsAt: res.endsAt,
        durationMin: res.durationMin,
        totalCents: res.totalCents,
      });
    } catch {
      setError("Algo deu errado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-8">
        <button
          type="button"
          onClick={() => (step === 0 || done ? onClose() : setStep(step - 1))}
          aria-label={step === 0 || done ? "Fechar agendamento" : "Voltar"}
          className="flex h-11 w-11 items-center justify-center rounded-sm border border-border text-bone transition-colors hover:border-brass hover:text-brass"
        >
          {step === 0 || done ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>
        <p className="label-mono text-brass">
          {done ? "[ confirmado ]" : `[ ${step + 1}/4 ] ${STEPS[step]}`}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar agendamento"
          className="label-mono h-11 px-2 text-mist transition-colors hover:text-bone"
        >
          sair
        </button>
      </header>

      <div className="h-px w-full bg-border">
        <div
          className="h-px bg-brass transition-all duration-500"
          style={{ width: done ? "100%" : `${((step + 1) / 4) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-40 sm:px-8">
          {done ? (
            <ConfirmationView data={done} onClose={onClose} />
          ) : (
            <>
              {error ? (
                <p className="mb-6 border-l-2 border-oxblood bg-oxblood/15 px-4 py-3 text-sm text-bone">
                  {error}
                </p>
              ) : null}

              {step === 0 ? (
                <div className="space-y-10">
                  <StepTitle title="O que você quer fazer hoje?" hint="Escolha um ou mais serviços." />
                  {Object.entries(grouped).map(([category, list]) => (
                    <div key={category}>
                      <p className="label-mono mb-3">[ {category} ]</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {list.map((s) => {
                          const active = selected.includes(s.id);
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelected((prev) =>
                                    prev.includes(s.id)
                                      ? prev.filter((x) => x !== s.id)
                                      : [...prev, s.id],
                                  )
                                }
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 border px-4 py-4 text-left transition-colors",
                                  active
                                    ? "border-brass bg-brass/10"
                                    : "border-border bg-graphite hover:border-mist",
                                )}
                              >
                                <span>
                                  <span className="block text-[15px] text-bone">{s.name}</span>
                                  <span className="label-mono">{formatDuration(s.duration_min)}</span>
                                </span>
                                <span className="font-mono text-xs text-brass">
                                  {s.price_cents != null ? formatPrice(s.price_cents) : "—"}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <StepTitle title="Com quem?" hint="Opcional. Sem preferência é mais rápido." />
                  <ul className="grid gap-2 sm:grid-cols-2">
                    <li>
                      <BarberOption
                        active={barberId === null}
                        name="Sem preferência"
                        specialty="Primeiro profissional livre"
                        onClick={() => setBarberId(null)}
                      />
                    </li>
                    {barbers.map((b) => (
                      <li key={b.id}>
                        <BarberOption
                          active={barberId === b.id}
                          name={b.name}
                          specialty={b.specialty}
                          photo={b.photo_url}
                          onClick={() => setBarberId(b.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-8">
                  <StepTitle title="Quando fica bom?" hint="Mostramos só o que está livre." />
                  <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                    {days.map((d) => {
                      const dt = isoToDate(d);
                      const closed = dt.getUTCDay() === 0;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={closed}
                          onClick={() => {
                            setDate(d);
                            setTime(null);
                          }}
                          className={cn(
                            "flex min-w-[64px] shrink-0 flex-col items-center gap-1 border px-3 py-3 transition-colors",
                            closed && "cursor-not-allowed border-border/40 text-mist/40",
                            !closed && date === d
                              ? "border-brass bg-brass/10 text-bone"
                              : !closed && "border-border text-bone hover:border-mist",
                          )}
                        >
                          <span className="label-mono text-[0.6rem]">
                            {dt.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })}
                          </span>
                          <span className="font-display text-lg">{d.slice(8)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {date ? (
                    <div>
                      <p className="label-mono mb-3">[ {formatDateLong(date)} ]</p>
                      {loadingSlots ? (
                        <p className="text-sm text-mist">Buscando horários…</p>
                      ) : slots && slots.length ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {slots.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTime(t)}
                              className={cn(
                                "border py-3 font-mono text-sm transition-colors",
                                time === t
                                  ? "border-oxblood bg-oxblood/25 text-bone"
                                  : "border-border text-bone hover:border-brass hover:text-brass",
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-mist">
                          Nenhum horário livre nesse dia. Tente outra data.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <StepTitle title="Só falta você." hint="Sem cadastro, sem senha, sem e-mail de confirmação." />
                  <Field label="Nome completo">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      maxLength={100}
                      autoComplete="name"
                      className="savaya-input"
                    />
                  </Field>
                  <Field label="WhatsApp">
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                      inputMode="tel"
                      placeholder="(61) 99999-9999"
                      className="savaya-input"
                    />
                  </Field>
                  <Field label="E-mail (opcional)">
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      type="email"
                      maxLength={160}
                      className="savaya-input"
                    />
                  </Field>
                  <Field label="Observação (opcional)">
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      maxLength={500}
                      placeholder="Alergias, preferência de corte, máquina…"
                      className="savaya-input resize-none"
                    />
                  </Field>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {!done ? (
        <footer className="border-t border-border bg-graphite/80 px-4 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="label-mono truncate">
                {selected.length
                  ? `[ ${selected.length} ] ${formatDuration(totalDuration)}`
                  : "[ 0 ] nenhum serviço"}
              </p>
              <p className="font-mono text-sm text-brass">
                {hasPrices ? formatPrice(totalPrice) : "valor sob consulta"}
              </p>
            </div>
            <button
              type="button"
              disabled={!canAdvance || submitting}
              onClick={() => (step === 3 ? submit() : setStep(step + 1))}
              className="h-12 min-w-[9rem] bg-brass px-6 font-mono text-xs tracking-[0.18em] text-ink uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            >
              {step === 3 ? (submitting ? "confirmando…" : "confirmar") : "continuar"}
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function StepTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl leading-tight text-bone sm:text-4xl">{title}</h2>
      <p className="mt-2 text-sm text-mist">{hint}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-mono mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function BarberOption({
  active,
  name,
  specialty,
  photo,
  onClick,
}: {
  active: boolean;
  name: string;
  specialty?: string | null;
  photo?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 border px-4 py-4 text-left transition-colors",
        active ? "border-brass bg-brass/10" : "border-border bg-graphite hover:border-mist",
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-ink font-display text-lg text-brass">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          name.charAt(0)
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] text-bone">{name}</span>
        <span className="label-mono block truncate">{specialty ?? "barbeiro"}</span>
      </span>
    </button>
  );
}

function ConfirmationView({ data, onClose }: { data: Confirmation; onClose: () => void }) {
  const start = new Date(data.startsAt);
  const dateText = start.toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });

  function downloadIcs() {
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Savaya Barbearia//PT-BR",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(new Date(data.endsAt))}`,
      `SUMMARY:Savaya Barbearia — ${data.services.join(", ")}`,
      `LOCATION:${BUSINESS.address}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "savaya-agendamento.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex h-14 w-14 items-center justify-center border border-brass text-brass">
        <Check className="h-6 w-6" />
      </div>
      <div>
        <h2 className="font-display text-4xl leading-tight text-bone">Horário reservado.</h2>
        <p className="mt-2 text-sm text-mist">
          Te esperamos na CLS 315. Chegue 5 minutos antes.
        </p>
      </div>

      <dl className="divide-y divide-border border-y border-border">
        <Row label="Serviços" value={data.services.join(" · ")} />
        <Row label="Profissional" value={data.barberName} />
        <Row label="Quando" value={dateText} />
        <Row label="Duração" value={formatDuration(data.durationMin)} />
        <Row label="Total" value={data.totalCents ? formatPrice(data.totalCents) : "sob consulta"} />
      </dl>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadIcs}
          className="inline-flex h-12 items-center gap-2 border border-brass px-5 font-mono text-xs tracking-[0.18em] text-brass uppercase"
        >
          <CalendarPlus className="h-4 w-4" /> calendário
        </button>
        <a
          href={whatsappLink(
            `Olá! Confirmei meu horário na Savaya: ${data.services.join(", ")} — ${dateText}.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 bg-brass px-5 font-mono text-xs tracking-[0.18em] text-ink uppercase"
        >
          <MessageCircle className="h-4 w-4" /> enviar no whatsapp
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-12 items-center px-2 font-mono text-xs tracking-[0.18em] text-mist uppercase"
        >
          voltar ao site
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
      <dt className="label-mono">{label}</dt>
      <dd className="text-right text-sm text-bone">{value}</dd>
    </div>
  );
}

function groupBy<T>(list: T[], key: (item: T) => string): Record<string, T[]> {
  return list.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}
