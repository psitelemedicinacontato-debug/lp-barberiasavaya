import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/savaya-logo.png.asset.json";

export function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.disconnect();
          } else if (!once) setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return { ref, visible };
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "p" | "h2";
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}

/** Rótulo editorial emoldurado por colchetes que abrem ao entrar na tela. */
export function SectionLabel({ index, children }: { index?: string; children: ReactNode }) {
  const { ref, visible } = useInView<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      data-visible={visible}
      className="bracket-frame label-mono text-[0.7rem] text-mist"
    >
      <span className="text-brass">{index}</span>
      {index ? <span className="text-mist/60">·</span> : null}
      <span>{children}</span>
    </span>
  );
}

/** Palavra literalmente emoldurada por colchetes. */
export function BracketWord({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView<HTMLSpanElement>();
  return (
    <span ref={ref} data-visible={visible} className={cn("bracket-frame", className)}>
      {children}
    </span>
  );
}

export function FrameCorners() {
  return (
    <>
      <span className="corner -top-1 -left-1 border-t border-l" aria-hidden />
      <span className="corner -top-1 -right-1 border-t border-r" aria-hidden />
      <span className="corner -bottom-1 -left-1 border-b border-l" aria-hidden />
      <span className="corner -bottom-1 -right-1 border-b border-r" aria-hidden />
    </>
  );
}

export function Logo({ className, invert = true }: { className?: string; invert?: boolean }) {
  return (
    <img
      src={logo.url}
      alt="Savaya Barbearia"
      width={120}
      height={120}
      className={cn("h-10 w-auto", invert && "invert mix-blend-screen", className)}
    />
  );
}
