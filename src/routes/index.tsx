import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { getPublicData } from "@/lib/booking.functions";
import {
  BookingFlow,
  type PublicBarber,
  type PublicService,
} from "@/components/savaya/BookingFlow";
import {
  BracketWord,
  FrameCorners,
  Logo,
  Reveal,
  SectionLabel,
} from "@/components/savaya/primitives";
import { BUSINESS, formatDuration, formatPrice, whatsappLink } from "@/lib/business";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero.jpg";
import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import g4 from "@/assets/g4.jpg";

const TITLE = "Savaya Barbearia — Barbearia premium na Asa Sul, Brasília";
const DESCRIPTION =
  "Corte, barba e cuidado com precisão de alfaiate na CLS 315, Asa Sul. Agende seu horário online em menos de um minuto. Nota 5,0 no Google.";

export const Route = createFileRoute("/")({
  loader: () => getPublicData(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const NAV = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#galeria", label: "Galeria" },
  { href: "#avaliacoes", label: "Avaliações" },
  { href: "#localizacao", label: "Localização" },
];

function Landing() {
  const data = Route.useLoaderData();
  const services = data.services as PublicService[];
  const barbers = data.barbers as PublicBarber[];

  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselect, setPreselect] = useState<string | null>(null);

  function openBooking(serviceId?: string) {
    setPreselect(serviceId ?? null);
    setBookingOpen(true);
  }

  const categories = services.reduce<Record<string, PublicService[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: BUSINESS.name,
    image: heroImg,
    telephone: BUSINESS.phoneDisplay,
    url: "https://savaya.lovable.app/",
    address: {
      "@type": "PostalAddress",
      streetAddress: "CLS 315, Bloco B, Loja 29",
      addressLocality: "Brasília",
      addressRegion: "DF",
      postalCode: "70384-520",
      addressCountry: "BR",
    },
    sameAs: [BUSINESS.instagramUrl],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: String(BUSINESS.reviewCount),
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-ink text-bone">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader onBook={() => openBooking()} />

      {/* HERO */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden pt-24">
        <img
          src={heroImg}
          alt="Salão da Savaya Barbearia com cadeira de barbeiro e luz quente"
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" aria-hidden />

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
          <Reveal>
            <p className="label-mono mb-6 flex items-center gap-2">
              <Star className="h-3 w-3 fill-brass text-brass" />
              {BUSINESS.rating} · {BUSINESS.reviewCount} avaliações no Google
            </p>
          </Reveal>

          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.92] font-black">
            O corte que te{" "}
            <BracketWord className="text-brass italic">emoldura</BracketWord>
            <span className="text-brass">.</span>
          </h1>

          <Reveal delay={120}>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mist">
              Barbearia de alto padrão na Asa Sul. Hora marcada respeitada, ambiente silencioso e
              acabamento feito no detalhe.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="btn-brass" onClick={() => openBooking()}>
                agendar horário
              </button>
              <a href="#servicos" className="btn-ghost">
                ver serviços
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-border py-4">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {["Corte", "Barba", "Sobrancelha", "Barboterapia", "Hidratação", "Acabamento", "Grisalhos"].map(
                (item) => (
                  <span key={item} className="label-mono px-6 whitespace-nowrap">
                    {item} <span className="text-brass">·</span>
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 01 SOBRE */}
      <Section id="sobre" index="01" label="Essência">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">
              Barbearia não é pressa.
              <br />
              <span className="text-brass italic">É precisão.</span>
            </h2>
          </Reveal>
          <Reveal delay={120} className="space-y-5 text-[15px] leading-relaxed text-mist">
            <p>
              Cada horário na Savaya é um bloco reservado só para você. Nada de fila, nada de
              espera em pé, nada de "chega aí que a gente encaixa".
            </p>
            <p>
              Trabalhamos com tempo definido por serviço, ambiente controlado e um padrão de
              acabamento que se repete toda vez que você senta na cadeira.
            </p>
            <p className="text-bone">Você entra, resolve, sai melhor do que chegou.</p>
          </Reveal>
        </div>
      </Section>

      {/* 02 SERVIÇOS */}
      <Section id="servicos" index="02" label="Serviços" alt>
        <Reveal>
          <h2 className="mb-10 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">
            Escolha o serviço.
            <br />
            <span className="text-brass italic">Nós cuidamos do resto.</span>
          </h2>
        </Reveal>

        <div className="space-y-12">
          {Object.entries(categories).map(([category, list]) => (
            <div key={category}>
              <p className="label-mono mb-4">[ {category} ]</p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s, i) => (
                  <Reveal as="li" key={s.id} delay={i * 60}>
                    <article className="frame-corners group h-full border border-border bg-graphite p-6 transition-colors hover:border-brass/50">
                      <FrameCorners />
                      <h3 className="font-display text-xl text-bone">{s.name}</h3>
                      <p className="label-mono mt-2">{formatDuration(s.duration_min)}</p>
                      <p className="mt-5 font-mono text-sm text-brass">
                        [ {s.price_cents != null ? formatPrice(s.price_cents) : "sob consulta"} ]
                      </p>
                      <button
                        type="button"
                        onClick={() => openBooking(s.id)}
                        className="mt-6 font-mono text-[0.7rem] tracking-[0.18em] text-mist uppercase transition-colors hover:text-brass"
                      >
                        agendar este serviço →
                      </button>
                    </article>
                  </Reveal>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 03 COMO FUNCIONA */}
      <Section id="como-funciona" index="03" label="Como funciona">
        <Reveal>
          <h2 className="mb-10 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">
            Quatro toques e <span className="text-brass italic">pronto</span>.
          </h2>
        </Reveal>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Escolha os serviços", "Some corte, barba e o que mais quiser. O tempo é calculado sozinho."],
            ["Escolha o profissional", "Ou deixe sem preferência e pegue o primeiro livre."],
            ["Escolha o horário", "Só aparece o que está realmente disponível."],
            ["Confirme na hora", "Nome e WhatsApp. Sem conta, sem senha, sem e-mail."],
          ].map(([title, text], i) => (
            <Reveal as="li" key={title} delay={i * 80}>
              <p className="label-mono text-brass">[ 0{i + 1} ]</p>
              <h3 className="mt-3 font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{text}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={200}>
          <button type="button" className="btn-brass mt-10" onClick={() => openBooking()}>
            agendar horário
          </button>
        </Reveal>
      </Section>

      {/* 04 GALERIA */}
      <Section id="galeria" index="04" label="Galeria" alt>
        <Reveal>
          <h2 className="mb-10 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">
            O ambiente <span className="text-brass italic">e o detalhe</span>.
          </h2>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { src: g1, alt: "Barbeiro finalizando um corte com tesoura", span: "lg:row-span-2" },
            { src: g4, alt: "Estação de espelho com luminária de latão", span: "" },
            { src: g2, alt: "Ferramentas de barbearia sobre superfície escura", span: "" },
            { src: heroImg, alt: "Cadeira de barbeiro no salão da Savaya", span: "sm:col-span-2" },
          ].map((img, i) => (
            <Reveal key={i} delay={i * 70} className={cn("frame-corners group", img.span)}>
              <div className="relative h-full overflow-hidden">
                <FrameCorners />
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full min-h-[220px] w-full object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 05 AVALIAÇÕES */}
      <Section id="avaliacoes" index="05" label="Avaliações">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">
              5,0 no Google.
              <br />
              <span className="text-brass italic">139 vezes.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <a href={BUSINESS.reviewUrl} target="_blank" rel="noreferrer" className="btn-ghost">
              avaliar no google
            </a>
          </Reveal>
        </div>

        <ul className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            ["Marcei pelo site em um minuto e fui atendido na hora exata. Isso vale ouro.", "Cliente Savaya"],
            ["Acabamento impecável e o ambiente é tranquilo. Saio de lá inteiro.", "Cliente Savaya"],
            ["Levo minha barba lá há meses. Nunca variou o padrão.", "Cliente Savaya"],
          ].map(([quote, author], i) => (
            <Reveal as="li" key={i} delay={i * 80}>
              <figure className="h-full border border-border bg-graphite p-6">
                <div className="flex gap-1" aria-label="5 estrelas">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3 w-3 fill-brass text-brass" />
                  ))}
                </div>
                <blockquote className="mt-4 text-[15px] leading-relaxed text-bone">
                  “{quote}”
                </blockquote>
                <figcaption className="label-mono mt-4">{author}</figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* 06 LOCALIZAÇÃO */}
      <Section id="localizacao" index="06" label="Localização e horário" alt>
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal className="space-y-8">
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">
              Asa Sul, <span className="text-brass italic">CLS 315</span>.
            </h2>
            <ul className="space-y-5 text-[15px]">
              <li className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-brass" />
                <span className="text-mist">{BUSINESS.address}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-brass" />
                <span className="text-mist">
                  {BUSINESS.hoursText.map((h) => (
                    <span key={h} className="block">
                      {h}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0 text-brass" />
                <a href={`tel:+${BUSINESS.phoneRaw}`} className="text-mist hover:text-brass">
                  {BUSINESS.phoneDisplay}
                </a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <a href={BUSINESS.mapsUrl} target="_blank" rel="noreferrer" className="btn-brass">
                como chegar
              </a>
              <a
                href={whatsappLink("Olá! Vim pelo site da Savaya.")}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                <MessageCircle className="h-4 w-4" /> whatsapp
              </a>
            </div>
          </Reveal>

          <Reveal delay={120} className="frame-corners">
            <FrameCorners />
            <iframe
              title="Mapa da Savaya Barbearia"
              src={BUSINESS.mapsEmbed}
              loading="lazy"
              className="h-[340px] w-full border border-border grayscale md:h-full"
            />
          </Reveal>
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="border-t border-border px-5 py-24 text-center sm:px-8">
        <Reveal>
          <p className="label-mono mb-6 inline-flex items-center gap-2">
            <Star className="h-3 w-3 fill-brass text-brass" /> {BUSINESS.rating} ·{" "}
            {BUSINESS.reviewCount} avaliações no Google
          </p>
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[1]">
            Sua próxima <span className="text-brass italic">cadeira</span> está livre.
          </h2>
          <button type="button" className="btn-brass mt-8" onClick={() => openBooking()}>
            agendar horário
          </button>
        </Reveal>
      </section>

      <SiteFooter />

      <BookingFlow
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        services={services}
        barbers={barbers}
        preselect={preselect}
      />
    </div>
  );
}

function Section({
  id,
  index,
  label,
  alt,
  children,
}: {
  id: string;
  index: string;
  label: string;
  alt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("border-t border-border px-5 py-20 sm:px-8 sm:py-28", alt && "bg-graphite/30")}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <SectionLabel index={index}>{label}</SectionLabel>
        </div>
        {children}
      </div>
    </section>
  );
}

function SiteHeader({ onBook }: { onBook: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const current = NAV.map((n) => document.querySelector(n.href))
        .filter(Boolean)
        .find((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return r.top <= 120 && r.bottom > 120;
        });
      setActive(current ? `#${(current as HTMLElement).id}` : "");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-border bg-ink/92 backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" aria-label="Savaya Barbearia — início" className="flex items-center">
          <Logo className="h-11" />
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 font-mono text-[0.7rem] tracking-[0.16em] uppercase transition-colors",
                active === item.href ? "text-brass" : "text-mist hover:text-bone",
              )}
            >
              {active === item.href ? <span className="text-brass">[</span> : null}
              {item.label}
              {active === item.href ? <span className="text-brass">]</span> : null}
            </a>
          ))}
        </nav>

        <button type="button" onClick={onBook} className="btn-brass h-11 px-4 text-[0.65rem]">
          agendar
        </button>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-graphite/40 px-5 py-14 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo className="h-12" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">{BUSINESS.address}</p>
          <a
            href={`tel:+${BUSINESS.phoneRaw}`}
            className="mt-3 block font-mono text-sm text-brass"
          >
            {BUSINESS.phoneDisplay}
          </a>
          <a
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-mist hover:text-brass"
          >
            <Instagram className="h-4 w-4" /> {BUSINESS.instagramHandle}
          </a>
        </div>

        <div>
          <p className="label-mono mb-4">[ Horário ]</p>
          <ul className="space-y-2 text-sm text-mist">
            {BUSINESS.hoursText.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-mono mb-4">[ Navegar ]</p>
          <ul className="space-y-2 text-sm text-mist">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-brass">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="hairline mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-3 pt-6">
        <p className="label-mono">© {new Date().getFullYear()} Savaya Barbearia</p>
        <Link to="/admin" className="label-mono hover:text-brass">
          painel
        </Link>
      </div>
    </footer>
  );
}
