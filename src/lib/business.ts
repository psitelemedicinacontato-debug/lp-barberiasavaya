export const BUSINESS = {
  name: "Savaya Barbearia",
  address: "CLS 315, Bloco B, Loja 29 — Asa Sul, Brasília - DF, 70384-520",
  phoneDisplay: "(61) 99974-6529",
  phoneRaw: "5561999746529",
  instagramHandle: "@barbeariasavaya",
  instagramUrl: "https://www.instagram.com/barbeariasavaya/",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=CLS+315+Bloco+B+Loja+29+Asa+Sul+Brasilia+DF",
  mapsEmbed:
    "https://www.google.com/maps?q=CLS%20315%20Bloco%20B%20Loja%2029%20Asa%20Sul%20Bras%C3%ADlia%20DF&output=embed",
  reviewUrl: "https://search.google.com/local/writereview?placeid=savaya",
  rating: "5,0",
  reviewCount: 139,
  hoursText: ["Segunda a sexta · 9h às 20h", "Sábado · 9h às 18h", "Domingo · fechado"],
} as const;

export const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "sob consulta";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${BUSINESS.phoneRaw}?text=${encodeURIComponent(message)}`;
}

/** Data no formato yyyy-mm-dd para o fuso de Brasília. */
export function todayISO(): string {
  const now = new Date();
  const brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brasilia.toISOString().slice(0, 10);
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

export function addDaysISO(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateLong(iso: string): string {
  return isoToDate(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}
