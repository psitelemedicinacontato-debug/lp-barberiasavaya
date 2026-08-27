import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  Users,
  Scissors,
  UserCog,
  Ban,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import {
  adminStatus,
  adminLogin,
  adminLogout,
  adminOverview,
  saveService,
  deleteService,
  saveBarber,
  deleteBarber,
  saveBlock,
  deleteBlock,
  setAppointmentStatus,
  createManualAppointment,
  saveSettings,
  adminChangePin,
} from "@/lib/admin.functions";
import { Logo } from "@/components/savaya/primitives";
import { addDaysISO, formatDuration, formatPrice, maskPhone, todayISO } from "@/lib/business";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel · Savaya Barbearia" },
      { name: "description", content: "Área administrativa da Savaya Barbearia." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel · Savaya Barbearia" },
      { property: "og:description", content: "Área administrativa da Savaya Barbearia." },
    ],
  }),
  component: AdminPage,
});

type Tab = "agenda" | "clientes" | "servicos" | "barbeiros" | "bloqueios" | "metricas" | "config";

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "servicos", label: "Serviços", icon: Scissors },
  { id: "barbeiros", label: "Profissionais", icon: UserCog },
  { id: "bloqueios", label: "Bloqueios", icon: Ban },
  { id: "metricas", label: "Visão geral", icon: BarChart3 },
  { id: "config", label: "Configurações", icon: SettingsIcon },
];

const STATUS_LABEL: Record<string, string> = {
  confirmed: "confirmado",
  done: "concluído",
  cancelled: "cancelado",
  noshow: "faltou",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = {
  appointments: any[];
  clients: any[];
  services: any[];
  barbers: any[];
  blocks: any[];
  settings: any;
};

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [tab, setTab] = useState<Tab>("agenda");
  const [data, setData] = useState<Data | null>(null);
  const [range, setRange] = useState({ from: todayISO(), to: addDaysISO(todayISO(), 7) });

  const status = useServerFn(adminStatus);
  const overview = useServerFn(adminOverview);
  const logout = useServerFn(adminLogout);

  const refresh = useCallback(async () => {
    try {
      const res = await overview({ data: range });
      setData(res as Data);
    } catch {
      setData(null);
      setAuthed(false);
    }
  }, [overview, range]);

  useEffect(() => {
    status().then((s) => {
      setAuthed(s.authed);
      setNeedsSetup(s.needsSetup);
    });
  }, [status]);

  useEffect(() => {
    if (authed) void refresh();
  }, [authed, refresh]);

  if (authed === null) {
    return <div className="grid min-h-screen place-items-center text-sm text-mist">Carregando…</div>;
  }

  if (!authed) {
    return <PinScreen needsSetup={needsSetup} onDone={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-ink pb-24 lg:flex lg:pb-0">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-graphite/40 p-5 lg:block">
        <Logo className="h-10" />
        <nav className="mt-8 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-3 text-left font-mono text-[0.7rem] tracking-[0.14em] uppercase transition-colors",
                tab === t.id ? "bg-brass/10 text-brass" : "text-mist hover:text-bone",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await logout();
            setAuthed(false);
          }}
          className="mt-8 flex items-center gap-2 px-3 py-3 font-mono text-[0.7rem] tracking-[0.14em] text-mist uppercase hover:text-brass"
        >
          <LogOut className="h-4 w-4" /> sair
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-8 lg:pb-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl text-bone sm:text-2xl">
            <span className="text-brass">[</span> {TABS.find((t) => t.id === tab)?.label}{" "}
            <span className="text-brass">]</span>
          </h1>
          <button
            type="button"
            onClick={async () => {
              await logout();
              setAuthed(false);
            }}
            className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.14em] text-mist uppercase hover:text-brass lg:hidden"
          >
            <LogOut className="h-4 w-4" /> sair
          </button>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
              className="savaya-input min-w-0 flex-1 py-2 text-xs sm:w-auto sm:flex-none"
              aria-label="Data inicial"
            />
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
              className="savaya-input min-w-0 flex-1 py-2 text-xs sm:w-auto sm:flex-none"
              aria-label="Data final"
            />
          </div>
        </header>


        {!data ? (
          <p className="text-sm text-mist">Carregando dados…</p>
        ) : (
          <>
            {tab === "agenda" ? <AgendaTab data={data} refresh={refresh} /> : null}
            {tab === "clientes" ? <ClientsTab data={data} /> : null}
            {tab === "servicos" ? <ServicesTab data={data} refresh={refresh} /> : null}
            {tab === "barbeiros" ? <BarbersTab data={data} refresh={refresh} /> : null}
            {tab === "bloqueios" ? <BlocksTab data={data} refresh={refresh} /> : null}
            {tab === "metricas" ? <MetricsTab data={data} /> : null}
            {tab === "config" ? <SettingsTab data={data} refresh={refresh} /> : null}
          </>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-border bg-graphite/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-label={t.label}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-3",
              tab === t.id ? "text-brass" : "text-mist",
            )}
          >
            <t.icon className="h-4 w-4 shrink-0" />
            <span className="w-full truncate text-center font-mono text-[0.52rem] tracking-wider uppercase">
              {t.label}
            </span>
          </button>
        ))}
      </nav>

    </div>
  );
}

function PinScreen({ needsSetup, onDone }: { needsSetup: boolean; onDone: () => void }) {
  const login = useServerFn(adminLogin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          const res = await login({ data: { pin } });
          setLoading(false);
          if (res.ok) onDone();
          else setError(res.error);
        }}
        className="w-full max-w-sm border border-border bg-graphite p-8"
      >
        <Logo className="mx-auto h-12" />
        <p className="label-mono mt-6 text-center">
          {needsSetup ? "[ defina a senha do painel ]" : "[ acesso ao painel ]"}
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="senha"
          autoComplete="current-password"
          minLength={4}
          className="savaya-input mt-5 text-center tracking-[0.3em]"
        />
        {needsSetup ? (
          <p className="mt-3 text-xs leading-relaxed text-mist">
            Primeiro acesso: a senha que você digitar agora será salva como senha do painel.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-xs text-oxblood">{error}</p> : null}
        <button type="submit" disabled={loading || pin.length < 4} className="btn-brass mt-5 w-full">
          {loading ? "verificando…" : "entrar"}
        </button>
      </form>
    </div>
  );
}

/* ---------------- Agenda ---------------- */

function AgendaTab({ data, refresh }: { data: Data; refresh: () => Promise<void> }) {
  const setStatus = useServerFn(setAppointmentStatus);
  const createManual = useServerFn(createManualAppointment);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    time: "09:00",
    name: "",
    phone: "",
    serviceIds: [] as string[],
    barberId: "",
    notes: "",
  });

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of data.appointments) {
      const key = new Date(a.starts_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
      (map[key] ??= []).push(a);
    }
    return map;
  }, [data.appointments]);

  const clientName = (id: string | null) =>
    data.clients.find((c) => c.id === id)?.name ?? "Cliente";
  const clientPhone = (id: string | null) => data.clients.find((c) => c.id === id)?.phone ?? "";
  const barberName = (id: string | null) =>
    data.barbers.find((b) => b.id === id)?.name ?? "Sem preferência";

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => setOpen(!open)} className="btn-ghost">
        <Plus className="h-4 w-4" /> agendamento manual
      </button>

      {open ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createManual({
              data: {
                date: form.date,
                time: form.time,
                name: form.name,
                phone: form.phone,
                serviceIds: form.serviceIds,
                barberId: form.barberId || null,
                notes: form.notes || null,
              },
            });
            setOpen(false);
            setForm({ ...form, name: "", phone: "", serviceIds: [], notes: "" });
            await refresh();
          }}
          className="grid gap-3 border border-border bg-graphite p-5 sm:grid-cols-2"
        >
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="savaya-input" aria-label="Data" />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="savaya-input" aria-label="Hora" />
          <input placeholder="Nome do cliente" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="savaya-input" />
          <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="savaya-input" />
          <select
            multiple
            value={form.serviceIds}
            onChange={(e) =>
              setForm({ ...form, serviceIds: Array.from(e.target.selectedOptions, (o) => o.value) })
            }
            className="savaya-input h-32"
            aria-label="Serviços"
          >
            {data.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatDuration(s.duration_min)}
              </option>
            ))}
          </select>
          <select
            value={form.barberId}
            onChange={(e) => setForm({ ...form, barberId: e.target.value })}
            className="savaya-input"
            aria-label="Profissional"
          >
            <option value="">Sem preferência</option>
            {data.barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-brass sm:col-span-2" disabled={!form.serviceIds.length}>
            salvar agendamento
          </button>
        </form>
      ) : null}

      {Object.keys(byDay).length === 0 ? (
        <p className="text-sm text-mist">Nenhum agendamento no período selecionado.</p>
      ) : null}

      {Object.entries(byDay).map(([day, list]) => (
        <div key={day}>
          <p className="label-mono mb-3">[ {day} ]</p>
          <ul className="space-y-2">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 border border-border bg-graphite p-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-brass">
                    {new Date(a.starts_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                    {" · "}
                    {formatDuration(a.duration_min)}
                  </p>
                  <p className="text-[15px] text-bone">{clientName(a.client_id)}</p>
                  <p className="label-mono truncate">
                    {(a.services ?? []).map((s: any) => s.name).join(" · ")} — {barberName(a.barber_id)}
                  </p>
                  {clientPhone(a.client_id) ? (
                    <p className="label-mono">{maskPhone(clientPhone(a.client_id))}</p>
                  ) : null}
                  {a.notes ? <p className="mt-1 text-xs text-mist">Obs: {a.notes}</p> : null}
                </div>
                <select
                  value={a.status}
                  onChange={async (e) => {
                    await setStatus({ data: { id: a.id, status: e.target.value as any } });
                    await refresh();
                  }}
                  className="savaya-input w-auto py-2 text-xs"
                  aria-label="Status do agendamento"
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Clientes ---------------- */

function ClientsTab({ data }: { data: Data }) {
  const visits = (id: string) => data.appointments.filter((a) => a.client_id === id).length;
  return (
    <ul className="space-y-2">
      {data.clients.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-4 border border-border bg-graphite p-4">
          <div className="min-w-0">
            <p className="text-[15px] text-bone">{c.name}</p>
            <p className="label-mono">{maskPhone(c.phone)}</p>
            {c.notes ? <p className="text-xs text-mist">{c.notes}</p> : null}
          </div>
          <p className="font-mono text-xs text-brass">[ {visits(c.id)} visitas ]</p>
        </li>
      ))}
      {!data.clients.length ? <p className="text-sm text-mist">Nenhum cliente ainda.</p> : null}
    </ul>
  );
}

/* ---------------- Serviços ---------------- */

function ServicesTab({ data, refresh }: { data: Data; refresh: () => Promise<void> }) {
  const save = useServerFn(saveService);
  const remove = useServerFn(deleteService);
  const [draft, setDraft] = useState({ category: "Cabelo", name: "", duration_min: 30, price: "" });

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await save({
            data: {
              category: draft.category,
              name: draft.name,
              duration_min: Number(draft.duration_min),
              price_cents: draft.price ? Math.round(Number(draft.price) * 100) : null,
              active: true,
              sort_order: data.services.length + 1,
            },
          });
          setDraft({ ...draft, name: "", price: "" });
          await refresh();
        }}
        className="grid gap-3 border border-border bg-graphite p-5 sm:grid-cols-4"
      >
        <input placeholder="Categoria" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="savaya-input" />
        <input placeholder="Nome do serviço" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="savaya-input" />
        <input type="number" min={5} step={5} value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: Number(e.target.value) })} className="savaya-input" aria-label="Duração em minutos" />
        <input placeholder="Preço (R$)" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="savaya-input" inputMode="decimal" />
        <button type="submit" className="btn-brass sm:col-span-4" disabled={!draft.name}>
          <Plus className="h-4 w-4" /> adicionar serviço
        </button>
      </form>

      <ul className="space-y-2">
        {data.services.map((s) => (
          <ServiceRow key={s.id} service={s} onSaved={refresh} onRemove={async () => {
            await remove({ data: { id: s.id } });
            await refresh();
          }} />
        ))}
      </ul>
    </div>
  );
}

function ServiceRow({
  service,
  onSaved,
  onRemove,
}: {
  service: any;
  onSaved: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const save = useServerFn(saveService);
  const [row, setRow] = useState({
    category: service.category,
    name: service.name,
    duration_min: service.duration_min,
    price: service.price_cents != null ? String(service.price_cents / 100) : "",
    active: service.active,
  });

  async function persist(next = row) {
    await save({
      data: {
        id: service.id,
        category: next.category,
        name: next.name,
        duration_min: Number(next.duration_min),
        price_cents: next.price ? Math.round(Number(next.price) * 100) : null,
        active: next.active,
        sort_order: service.sort_order,
      },
    });
    await onSaved();
  }

  return (
    <li className="grid gap-3 border border-border bg-graphite p-4 sm:grid-cols-[1fr_1.4fr_auto_auto_auto_auto] sm:items-center">
      <input value={row.category} onChange={(e) => setRow({ ...row, category: e.target.value })} onBlur={() => persist()} className="savaya-input py-2 text-sm" aria-label="Categoria" />
      <input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} onBlur={() => persist()} className="savaya-input py-2 text-sm" aria-label="Nome" />
      <input type="number" min={5} step={5} value={row.duration_min} onChange={(e) => setRow({ ...row, duration_min: Number(e.target.value) })} onBlur={() => persist()} className="savaya-input w-24 py-2 text-sm" aria-label="Minutos" />
      <input value={row.price} placeholder="R$" onChange={(e) => setRow({ ...row, price: e.target.value })} onBlur={() => persist()} className="savaya-input w-28 py-2 text-sm" aria-label="Preço" />
      <button
        type="button"
        onClick={() => {
          const next = { ...row, active: !row.active };
          setRow(next);
          void persist(next);
        }}
        className={cn("font-mono text-[0.65rem] tracking-widest uppercase", row.active ? "text-brass" : "text-mist")}
      >
        {row.active ? "[ ativo ]" : "[ inativo ]"}
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remover ${service.name}`} className="justify-self-end text-mist hover:text-oxblood">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/* ---------------- Barbeiros ---------------- */

function BarbersTab({ data, refresh }: { data: Data; refresh: () => Promise<void> }) {
  const save = useServerFn(saveBarber);
  const remove = useServerFn(deleteBarber);
  const [draft, setDraft] = useState({ name: "", specialty: "", photo_url: "" });

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await save({
            data: {
              name: draft.name,
              specialty: draft.specialty || null,
              photo_url: draft.photo_url || null,
              active: true,
              sort_order: data.barbers.length + 1,
              work_hours: null,
            },
          });
          setDraft({ name: "", specialty: "", photo_url: "" });
          await refresh();
        }}
        className="grid gap-3 border border-border bg-graphite p-5 sm:grid-cols-3"
      >
        <input placeholder="Nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="savaya-input" />
        <input placeholder="Especialidade" value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} className="savaya-input" />
        <input placeholder="URL da foto" value={draft.photo_url} onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })} className="savaya-input" />
        <button type="submit" className="btn-brass sm:col-span-3" disabled={!draft.name}>
          <Plus className="h-4 w-4" /> adicionar profissional
        </button>
      </form>

      <ul className="space-y-2">
        {data.barbers.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-4 border border-border bg-graphite p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border font-display text-brass">
                {b.photo_url ? <img src={b.photo_url} alt="" className="h-full w-full object-cover" /> : b.name.charAt(0)}
              </span>
              <div>
                <p className="text-[15px] text-bone">{b.name}</p>
                <p className="label-mono">{b.specialty ?? "barbeiro"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={async () => {
                  await save({
                    data: {
                      id: b.id,
                      name: b.name,
                      specialty: b.specialty,
                      photo_url: b.photo_url,
                      active: !b.active,
                      sort_order: b.sort_order,
                      work_hours: b.work_hours ?? null,
                    },
                  });
                  await refresh();
                }}
                className={cn("font-mono text-[0.65rem] tracking-widest uppercase", b.active ? "text-brass" : "text-mist")}
              >
                {b.active ? "[ ativo ]" : "[ inativo ]"}
              </button>
              <button
                type="button"
                aria-label={`Remover ${b.name}`}
                onClick={async () => {
                  await remove({ data: { id: b.id } });
                  await refresh();
                }}
                className="text-mist hover:text-oxblood"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Bloqueios ---------------- */

function BlocksTab({ data, refresh }: { data: Data; refresh: () => Promise<void> }) {
  const save = useServerFn(saveBlock);
  const remove = useServerFn(deleteBlock);
  const [draft, setDraft] = useState({ block_date: todayISO(), start_time: "", end_time: "", barber_id: "", reason: "" });

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await save({
            data: {
              block_date: draft.block_date,
              start_time: draft.start_time || null,
              end_time: draft.end_time || null,
              barber_id: draft.barber_id || null,
              reason: draft.reason || null,
            },
          });
          setDraft({ ...draft, start_time: "", end_time: "", reason: "" });
          await refresh();
        }}
        className="grid gap-3 border border-border bg-graphite p-5 sm:grid-cols-5"
      >
        <input type="date" value={draft.block_date} onChange={(e) => setDraft({ ...draft, block_date: e.target.value })} className="savaya-input" aria-label="Data do bloqueio" />
        <input type="time" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} className="savaya-input" aria-label="Início (vazio = dia todo)" />
        <input type="time" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} className="savaya-input" aria-label="Fim" />
        <select value={draft.barber_id} onChange={(e) => setDraft({ ...draft, barber_id: e.target.value })} className="savaya-input" aria-label="Profissional">
          <option value="">Toda a loja</option>
          {data.barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input placeholder="Motivo" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} className="savaya-input" />
        <button type="submit" className="btn-brass sm:col-span-5">
          <Plus className="h-4 w-4" /> bloquear
        </button>
      </form>

      <p className="text-xs text-mist">Deixe início e fim vazios para bloquear o dia inteiro.</p>

      <ul className="space-y-2">
        {data.blocks.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-4 border border-border bg-graphite p-4">
            <div>
              <p className="font-mono text-sm text-brass">
                [ {b.block_date} ] {b.start_time ? `${b.start_time}–${b.end_time}` : "dia inteiro"}
              </p>
              <p className="label-mono">
                {b.barber_id ? data.barbers.find((x) => x.id === b.barber_id)?.name : "toda a loja"}
                {b.reason ? ` · ${b.reason}` : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label="Remover bloqueio"
              onClick={async () => {
                await remove({ data: { id: b.id } });
                await refresh();
              }}
              className="text-mist hover:text-oxblood"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Métricas ---------------- */

function MetricsTab({ data }: { data: Data }) {
  const active = data.appointments.filter((a) => a.status !== "cancelled");
  const counts: Record<string, number> = {};
  for (const a of active) for (const s of a.services ?? []) counts[s.name] = (counts[s.name] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const minutes = active.reduce((sum, a) => sum + (a.duration_min ?? 0), 0);
  const revenue = active.reduce((sum, a) => sum + (a.total_cents ?? 0), 0);

  const cards = [
    ["Agendamentos", String(active.length)],
    ["Serviço mais pedido", top ? `${top[0]} (${top[1]})` : "—"],
    ["Horas ocupadas", `${(minutes / 60).toFixed(1)}h`],
    ["Receita prevista", formatPrice(revenue)],
    ["Clientes cadastrados", String(data.clients.length)],
    ["Serviços ativos", String(data.services.filter((s) => s.active).length)],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([label, value]) => (
        <div key={label} className="border border-border bg-graphite p-5">
          <p className="label-mono">[ {label} ]</p>
          <p className="mt-3 font-display text-3xl text-bone">{value}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Configurações ---------------- */

const DAYS = [
  ["1", "Segunda"],
  ["2", "Terça"],
  ["3", "Quarta"],
  ["4", "Quinta"],
  ["5", "Sexta"],
  ["6", "Sábado"],
  ["0", "Domingo"],
];

function SettingsTab({ data, refresh }: { data: Data; refresh: () => Promise<void> }) {
  const save = useServerFn(saveSettings);
  const changePin = useServerFn(adminChangePin);
  const [form, setForm] = useState({
    address: data.settings?.address ?? "",
    phone: data.settings?.phone ?? "",
    instagram: data.settings?.instagram ?? "",
    buffer_min: data.settings?.buffer_min ?? 5,
    hours: (data.settings?.hours ?? {}) as Record<string, { open: string; close: string } | null>,
  });
  const [pin, setPin] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await save({ data: { ...form, buffer_min: Number(form.buffer_min) } });
          setSaved(true);
          await refresh();
        }}
        className="space-y-4 border border-border bg-graphite p-5"
      >
        <p className="label-mono">[ dados públicos ]</p>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="savaya-input" aria-label="Endereço" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="savaya-input" aria-label="Telefone" />
        <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="savaya-input" aria-label="Instagram" />
        <label className="block">
          <span className="label-mono mb-2 block">Intervalo entre atendimentos (min)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form.buffer_min}
            onChange={(e) => setForm({ ...form, buffer_min: Number(e.target.value) })}
            className="savaya-input"
          />
        </label>

        <p className="label-mono pt-2">[ horário de funcionamento ]</p>
        {DAYS.map(([key, label]) => {
          const value = form.hours[key!];
          return (
            <div key={key} className="flex flex-wrap items-center gap-2">
              <span className="w-16 shrink-0 text-sm text-mist sm:w-20">{label}</span>

              <input
                type="time"
                value={value?.open ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hours: { ...form.hours, [key!]: { open: e.target.value, close: value?.close ?? "18:00" } },
                  })
                }
                className="savaya-input w-[7.5rem] min-w-0 flex-1 py-2 text-sm sm:w-auto sm:flex-none"
                aria-label={`Abertura ${label}`}
              />
              <input
                type="time"
                value={value?.close ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hours: { ...form.hours, [key!]: { open: value?.open ?? "09:00", close: e.target.value } },
                  })
                }
                className="savaya-input w-[7.5rem] min-w-0 flex-1 py-2 text-sm sm:w-auto sm:flex-none"
                aria-label={`Fechamento ${label}`}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, hours: { ...form.hours, [key!]: value ? null : { open: "09:00", close: "18:00" } } })}
                className="font-mono text-[0.6rem] tracking-widest text-mist uppercase hover:text-brass"
              >
                {value ? "fechar" : "abrir"}
              </button>
            </div>
          );
        })}

        <button type="submit" className="btn-brass w-full">salvar</button>
        {saved ? <p className="text-xs text-brass">Configurações salvas.</p> : null}
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await changePin({ data: { pin } });
          setPin("");
        }}
        className="h-fit space-y-4 border border-border bg-graphite p-5"
      >
        <p className="label-mono">[ senha do painel ]</p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="nova senha"
          className="savaya-input"
          minLength={4}
        />
        <button type="submit" className="btn-brass w-full" disabled={pin.length < 4}>
          atualizar senha
        </button>
      </form>
    </div>
  );
}
