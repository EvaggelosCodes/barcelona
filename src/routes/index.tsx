import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-barcelona.jpg";
import beachImg from "@/assets/beach.jpg";
import gothicImg from "@/assets/gothic.jpg";
import rooftopImg from "@/assets/rooftop.jpg";
import clubImg from "@/assets/club.jpg";
import tapasImg from "@/assets/tapas.jpg";
import sidequestImg from "@/assets/sidequest.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Βαρκελώνη: 2 Οκτωβρίου — Mission Control" },
      {
        name: "description",
        content:
          "4 παιδιά. Μία πόλη. Μηδέν φυσιολογικές νύχτες. Επίσημο briefing για το ταξίδι στη Βαρκελώνη, 2 Οκτωβρίου 2026.",
      },
      { property: "og:title", content: "Η ΒΑΡΚΕΛΩΝΗ ΔΕΝ ΕΙΝΑΙ ΕΤΟΙΜΗ" },
      {
        property: "og:description",
        content: "Η 2 Οκτωβρίου δεν είναι ημερομηνία. Είναι προειδοποίηση.",
      },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: BarcelonaPage,
});

const TRIP_DATE = new Date("2026-10-02T08:00:00+02:00").getTime();

/* ─────────────────────────── hooks ─────────────────────────── */

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useCountdown(target: number) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(target);
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    mounted,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Reveal-on-scroll for any element tagged `.reveal-on-scroll`. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal-on-scroll");
    if (prefersReducedMotion()) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Lightweight rAF parallax for [data-speed] elements. */
function useParallax() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-speed]"));
    if (!els.length) return;
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      for (const el of els) {
        const speed = parseFloat(el.dataset.speed || "0");
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) * speed;
        el.style.setProperty("--py", `${offset.toFixed(1)}px`);
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

function useCountUp(target: number, run: boolean, dur = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, dur]);
  return val;
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

/* ─────────────────────────── page ─────────────────────────── */

function BarcelonaPage() {
  useReveal();
  useParallax();
  return (
    <main className="grain relative min-h-screen overflow-hidden bg-background text-foreground">
      <ScrollProgress />
      <AmbientGlow />
      <Nav />
      <Hero />
      <Marquee />
      <Squad />
      <MissionMap />
      <Prophecy />
      <Budget />
      <NightSimulator />
      <Evidence />
      <Rules />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      el.style.setProperty("--progress", String(max > 0 ? h.scrollTop / max : 0));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" aria-hidden>
      <div
        ref={ref}
        className="scroll-progress h-full w-full bg-[linear-gradient(90deg,var(--gold),var(--neon),var(--blood))]"
      />
    </div>
  );
}

function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute -top-40 -left-40 size-[600px] rounded-full bg-[oklch(0.72_0.3_350/0.18)] blur-3xl animate-float-slow" />
      <div className="absolute top-1/3 -right-40 size-[600px] rounded-full bg-[oklch(0.55_0.24_25/0.15)] blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-[500px] rounded-full bg-[oklch(0.83_0.16_85/0.08)] blur-3xl" />
    </div>
  );
}

/* ─────────────────────────── nav ─────────────────────────── */

const NAV_LINKS = [
  { id: "squad", label: "ΟΜΑΔΑ" },
  { id: "map", label: "ΧΑΡΤΗΣ" },
  { id: "budget", label: "BUDGET" },
  { id: "evidence", label: "ΑΡΧΕΙΟ" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(NAV_LINKS.map((l) => l.id));
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled ? "glass border-b border-border/40" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-[var(--neon)] shadow-neon animate-pulse-neon" />
          <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
            ΑΠΟΣΤΟΛΗ // BCN—02.10.26
          </span>
        </a>
        <nav className="hidden items-center gap-8 font-mono text-xs tracking-widest text-muted-foreground md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={cn(
                "relative py-1 transition-colors hover:text-foreground",
                active === l.id && "text-foreground",
              )}
            >
              {l.label}
              <span
                className={cn(
                  "absolute -bottom-0.5 left-0 h-px bg-[var(--neon)] transition-all duration-300",
                  active === l.id ? "w-full" : "w-0",
                )}
              />
            </a>
          ))}
        </nav>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
          aria-expanded={open}
        >
          <span
            className={cn(
              "h-px w-6 bg-foreground transition-transform",
              open && "translate-y-[7px] rotate-45",
            )}
          />
          <span className={cn("h-px w-6 bg-foreground transition-opacity", open && "opacity-0")} />
          <span
            className={cn(
              "h-px w-6 bg-foreground transition-transform",
              open && "-translate-y-[7px] -rotate-45",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "overflow-hidden border-t border-border/40 transition-[max-height] duration-500 md:hidden",
          open ? "max-h-72 glass" : "max-h-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-6 py-4 font-mono text-sm tracking-widest text-muted-foreground">
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ─────────────────────────── kinetic type ─────────────────────────── */

function Lines({
  lines,
  base = 0,
  step = 90,
}: {
  lines: { text: string; className?: string }[];
  base?: number;
  step?: number;
}) {
  return (
    <>
      {lines.map((ln, i) => (
        <span key={i} className="line-mask">
          <span
            className={cn("line-inner", ln.className)}
            style={{ "--rise-delay": `${base + i * step}ms` } as React.CSSProperties}
          >
            {ln.text}
          </span>
        </span>
      ))}
    </>
  );
}

/* ─────────────────────────── hero ─────────────────────────── */

function Hero() {
  const { days, hours, minutes, seconds, mounted } = useCountdown(TRIP_DATE);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <section id="top" className="relative z-10 min-h-[100svh] w-full">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div data-speed="-0.12" className="parallax absolute inset-[-10%]">
          <img
            src={heroImg}
            alt="Ορίζοντας Βαρκελώνης στο ηλιοβασίλεμα με σιλουέτα Σαγράδα Φαμίλια"
            width={1920}
            height={1280}
            className="size-full object-cover opacity-55"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.08_0.04_265/0.45)_0%,oklch(0.08_0.04_265/0.72)_55%,oklch(0.12_0.03_270)_100%)]" />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-6 pt-32 pb-20">
        <div className={cn(lit && "line-rise-in")}>
          <div className="mb-7 inline-flex items-center gap-3 glass rounded-full px-4 py-2">
            <span className="size-1.5 rounded-full bg-[var(--blood)] animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              ΑΠΟΡΡΗΤΟ · 4 ΠΡΑΚΤΟΡΕΣ · 2 ΟΚΤΩΒΡΙΟΥ 2026
            </span>
          </div>

          <h1 className="text-mega text-[clamp(3.2rem,12vw,11rem)]">
            <Lines
              lines={[
                { text: "BARCELONA", className: "text-gradient-sunset" },
                { text: "ΔΕΝ ΕΙΝΑΙ", className: "text-foreground/95" },
                { text: "ΕΤΟΙΜΗ", className: "text-foreground/95" },
              ]}
              step={110}
            />
          </h1>

          <p className="mt-8 max-w-2xl text-xl text-muted-foreground md:text-2xl">
            <span className="line-mask">
              <span
                className="line-inner"
                style={{ "--rise-delay": "440ms" } as React.CSSProperties}
              >
                4 παιδιά. Μία πόλη. Μηδέν φυσιολογικές νύχτες.
              </span>
            </span>
          </p>

          <HeroAgents />
        </div>

        <div
          className="mt-12 grid max-w-3xl grid-cols-4 gap-2 sm:gap-4"
          style={{ animation: lit ? undefined : "none" }}
        >
          {[
            { label: "ΜΕΡΕΣ", value: days },
            { label: "ΩΡΕΣ", value: hours },
            { label: "ΛΕΠΤΑ", value: minutes },
            { label: "ΔΕΥΤ.", value: seconds },
          ].map((u, i) => (
            <div
              key={u.label}
              className={cn(
                "glass-strong shadow-elegant relative overflow-hidden rounded-xl p-3 text-center transition-all duration-700 sm:p-6",
                lit ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              )}
              style={{ transitionDelay: `${600 + i * 90}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-px animate-scan bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
              <div className="text-mega text-4xl tabular-nums text-foreground sm:text-6xl md:text-7xl">
                {mounted ? String(u.value).padStart(2, "0") : "--"}
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.3em] text-muted-foreground sm:text-xs">
                {u.label}
              </div>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "mt-12 flex flex-wrap items-center gap-4 transition-all duration-700",
            lit ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: "980ms" }}
        >
          <a
            href="#squad"
            className="group relative inline-flex items-center gap-3 rounded-full bg-[var(--neon)] px-8 py-4 font-mono text-sm tracking-[0.2em] text-primary-foreground shadow-neon transition-transform hover:scale-[1.02]"
          >
            ΜΠΕΣ ΣΤΗΝ ΑΠΟΣΤΟΛΗ
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
          <div className="font-mono text-xs tracking-wider text-muted-foreground">
            T-MINUS · ΑΝΑΧΩΡΗΣΗ ΚΛΕΙΔΩΜΕΝΗ
          </div>
        </div>
      </div>

      <a
        href="#squad"
        aria-label="Κύλιση προς τα κάτω"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-muted-foreground md:flex"
      >
        SCROLL
        <span className="relative h-10 w-px overflow-hidden bg-border">
          <span className="absolute inset-x-0 top-0 h-4 animate-[scan_2s_linear_infinite] bg-[var(--neon)]" />
        </span>
      </a>
    </section>
  );
}

function HeroAgents() {
  return (
    <div className="mt-9 flex items-center gap-4">
      <div className="flex -space-x-3">
        {SQUAD.map((p) => (
          <div
            key={p.id}
            className="size-11 overflow-hidden rounded-full ring-2 ring-background"
            style={{ boxShadow: `0 0 0 1px ${p.accent}` }}
            title={p.name}
          >
            <Portrait id={p.id} name={p.name} accent={p.accent} className="size-full" small />
          </div>
        ))}
      </div>
      <div className="font-mono text-[10px] leading-tight tracking-[0.2em] text-muted-foreground">
        EVAG · ΣΤΑΥΡΟΣ
        <br />
        ΣΤΕΦΑΝΟΣ · ΓΙΩΡΓΟΣ
      </div>
    </div>
  );
}

/* ─────────────────────────── marquee ─────────────────────────── */

function Marquee() {
  const words = [
    "ΑΠΟΣΤΟΛΗ ΕΝΕΡΓΗ",
    "BOYS TRIP LOADING",
    "MALAKOFATSA MODE",
    "WORTH IT",
    "ROOFTOP CONFIRMED",
    "BARCELONETA INCOMING",
    "ΜΗΔΕΝ ΦΥΣΙΟΛΟΓΙΚΕΣ ΝΥΧΤΕΣ",
    "IOS DANCE VOL.2",
    "ΥΔΡΟ-ΠΟΛΕΜΟΣ",
  ];
  const items = [...words, ...words];
  return (
    <div className="relative z-10 space-y-2 overflow-hidden border-y border-border/40 bg-[oklch(0.08_0.04_265/0.6)] py-6">
      <div className="marquee-row flex w-max animate-marquee gap-12 text-mega text-3xl md:text-5xl">
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap text-foreground/25">
            {w}
            <span className="text-[var(--neon)]">✦</span>
          </span>
        ))}
      </div>
      <div className="marquee-row flex w-max animate-marquee-rev gap-12 text-mega text-3xl text-foreground/10 md:text-5xl">
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap">
            {w}
            <span className="text-[var(--gold)]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── squad ─────────────────────────── */

type Player = {
  id: string;
  name: string;
  role: string;
  tone: string;
  lines: string[];
  abilities: string[];
  stats: { label: string; value: number }[];
  accent: string;
};

const SQUAD: Player[] = [
  {
    id: "evag",
    name: "EVAG",
    role: "MISSION CONTROL",
    tone: "Εγκέφαλος · Αρχιτέκτονας του Hype · Διαχειριστής Χάους",
    accent: "var(--gold)",
    lines: [
      "Αυτός που χτίζει το hype πριν καν η πόλη καταλάβει τι έρχεται.",
      "Mission control, διαχειριστής της ενέργειας του ταξιδιού και επίσημος ιστορικός του χάους.",
      "Μετατρέπει ένα κανονικό ταξίδι στη Βαρκελώνη σε legendary ιδιωτικό documentary.",
    ],
    abilities: ["Hype Engineering", "Damage Control", "Nightlife Strategy", "Memory Archiving"],
    stats: [
      { label: "Όραμα", value: 100 },
      { label: "Οργάνωση", value: 86 },
      { label: "Ανοχή στο Χάος", value: 92 },
      { label: "Main Character Energy", value: 99 },
    ],
  },
  {
    id: "stavros",
    name: "STAVROS",
    role: "CHAOTIC LEGEND",
    tone: "Διπλωματικός ειδικός σε σπαστά Ισπανικά",
    accent: "var(--neon)",
    lines: [
      "Θα πει ασυναρτησίες σε κάθε Ισπανίδα σαν να πρόκειται για διπλωματική αποστολή.",
      "Όταν εκνευρίζεται, ενεργοποιεί τον υδρο-πόλεμο: πετάει εξάδες με νερά στην παρέα.",
      "Αναμένεται να αποκαλύψει τη δεύτερη legendary χορευτική κίνηση που ετοιμάζει κρυφά από την Ίο εδώ και 2 χρόνια.",
      "Πρόβλεψη: θα φιλήσει 8 κοπέλες και θα είναι πολύ κουρασμένος για να συνεχίσει οτιδήποτε άλλο.",
      "Δηλωμένο budget: €800. Πραγματικό αποτέλεσμα: €2.000. Τελική δήλωση: «Worth it.»",
    ],
    abilities: [
      "Hydration Rage",
      "Ios Dance Move Vol. 2",
      "Financial Delusion",
      "8/8 Φιλιά · 0/8 Follow-through",
    ],
    stats: [
      { label: "Χάος", value: 99 },
      { label: "Έλεγχος Budget", value: 12 },
      { label: "Dance Mystery", value: 100 },
      { label: "Ακρίβεια Ισπανικών", value: 3 },
    ],
  },
  {
    id: "stefanos",
    name: "STEFANOS",
    role: "BEACH-DANCE MENACE",
    tone: "Καλλιτεχνικός · Έτοιμος για tango · Βιολογικός κίνδυνος",
    accent: "var(--azure)",
    lines: [
      "Θα χορεύει ασταμάτητα ισπανικά τραγούδια, ακόμα και μέσα στο μπάνιο.",
      "Θα πάθει σχεδόν εγκεφαλικό όταν δει την Barceloneta.",
      "Θα ξεκλειδώσει ξαφνικά επαγγελματικού επιπέδου tango και παραδοσιακούς ισπανικούς χορούς.",
      "Θα φωτογραφίζει και το πιο ασήμαντο αντικείμενο κάθε 6 δευτερόλεπτα.",
      "Θα καταστρέψει τα δωμάτια του διαμερίσματος με καταστροφικές πορδές.",
    ],
    abilities: [
      "Bathroom Flamenco",
      "Barceloneta Overload",
      "Sudden Tango Mastery",
      "6-Second Photography Reflex",
      "Apartment Gas Attack",
    ],
    stats: [
      { label: "Χορευτική Ενέργεια", value: 98 },
      { label: "Συχνότητα Φωτό", value: 100 },
      { label: "Σταθερότητα στην Παραλία", value: 8 },
      { label: "Ασφάλεια Δωματίου", value: 0 },
    ],
  },
  {
    id: "giorgos",
    name: "GIORGOS",
    role: "ΠΙΣΤΟΣ ΦΙΛΟΣΟΦΟΣ",
    tone: "Πιστός γκόμενος · Stand-up comedian της νύχτας",
    accent: "var(--blood)",
    lines: [
      "Παρά τη σχέση 4 ετών, γίνεται stand-up comedian κάθε φορά που ξεκινάει νύχτα.",
      "Κάθε αλληλεπίδραση με κοπέλα ενεργοποιεί τη legendary malakofatsa έκφραση.",
      "Θα επιχειρήσει 20 pulls, όχι για να τα ολοκληρώσει, αλλά for the love of the game.",
      "Κάθε 2 λεπτά τσεκάρει το κινητό και ψιθυρίζει cringe γλυκόλογα στην κοπέλα του.",
    ],
    abilities: [
      "Malakofatsa Mode",
      "Stand-up Flirt Comedy",
      "Loyal but Present",
      "Love-of-the-Game Pulls",
    ],
    stats: [
      { label: "Πίστη", value: 100 },
      { label: "Cringe Τηλέφωνα", value: 95 },
      { label: "Συμμετοχή στο Παιχνίδι", value: 87 },
      { label: "Ποσοστό Ολοκλήρωσης", value: 4 },
    ],
  },
];

function Portrait({
  id,
  name,
  accent,
  className,
  small = false,
}: {
  id: string;
  name: string;
  accent: string;
  className?: string;
  small?: boolean;
}) {
  const [err, setErr] = useState(false);
  const initials = name.slice(0, 2);
  if (err) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{
          background: `radial-gradient(circle at 50% 30%, color-mix(in oklab, ${accent} 60%, transparent), transparent 70%), linear-gradient(160deg, oklch(0.22 0.05 270), oklch(0.1 0.03 265))`,
        }}
        aria-label={name}
      >
        <span
          className={cn("text-mega opacity-90", small ? "text-base" : "text-[18vw] md:text-[8vw]")}
          style={{ color: accent }}
        >
          {initials}
        </span>
      </div>
    );
  }
  return (
    <img
      src={`/squad/${id}.jpg`}
      alt={`Πορτρέτο πράκτορα: ${name}`}
      onError={() => setErr(true)}
      loading={small ? "eager" : "lazy"}
      className={cn("object-cover", className)}
    />
  );
}

function Squad() {
  return (
    <section id="squad" className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionHeader
        kicker="ΦΑΚΕΛΟΣ · 04 ΠΡΑΚΤΟΡΕΣ"
        title="Η ΟΜΑΔΑ"
        subtitle="Διάβασέ τα προσεκτικά. Τα προφίλ είναι νομικά δεσμευτικά για όλη τη διάρκεια του ταξιδιού."
      />
      <div className="mt-16 space-y-24 md:space-y-32 md:mt-24">
        {SQUAD.map((p, i) => (
          <AgentRow key={p.id} player={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function AgentRow({ player, index }: { player: Player; index: number }) {
  const even = index % 2 === 0;
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="reveal-on-scroll grid items-center gap-8 md:grid-cols-12 md:gap-12">
      {/* Photo */}
      <div className={cn("md:col-span-5", even ? "md:order-1" : "md:order-2")}>
        <div className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-elegant">
          <div data-speed="0.05" className="parallax absolute inset-[-10%]">
            <Portrait
              id={player.id}
              name={player.name}
              accent={player.accent}
              className="size-full duotone scale-105 transition-all duration-700 group-hover:scale-110 group-hover:[filter:grayscale(0)_contrast(1.02)]"
            />
          </div>
          <div
            className="absolute inset-0 mix-blend-color opacity-60 transition-opacity duration-700 group-hover:opacity-0"
            style={{ background: `linear-gradient(150deg, ${player.accent}, transparent 75%)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.04_265)] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
            <div
              className="text-mega text-7xl leading-none md:text-8xl"
              style={{ color: player.accent }}
            >
              0{index + 1}
            </div>
            <div className="text-right font-mono text-[10px] tracking-[0.3em] text-foreground/70">
              <div>ΚΑΤΑΣΤΑΣΗ</div>
              <div className="mt-1 flex items-center justify-end gap-1.5 text-foreground">
                <span
                  className="size-1.5 animate-pulse rounded-full"
                  style={{ background: player.accent }}
                />
                ΕΤΟΙΜΟΣ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dossier */}
      <div className={cn("md:col-span-7", even ? "md:order-2" : "md:order-1")}>
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          ΠΡΑΚΤΟΡΑΣ · 0{index + 1}
        </div>
        <h3 className="text-mega mt-2 text-6xl leading-none md:text-7xl lg:text-8xl">
          {player.name}
        </h3>
        <div className="mt-3 font-mono text-xs tracking-[0.2em]" style={{ color: player.accent }}>
          {player.role}
        </div>
        <p className="mt-4 text-sm italic text-muted-foreground">{player.tone}</p>

        <div className="mt-6 space-y-2.5">
          {player.lines.map((l, i) => (
            <div key={i} className="flex gap-3 text-sm leading-relaxed md:text-base">
              <span
                className="mt-2 size-1 shrink-0 rounded-full"
                style={{ background: player.accent }}
              />
              <span className="text-foreground/85">{l}</span>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <div className="mb-3 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
            ΕΙΔΙΚΕΣ ΙΚΑΝΟΤΗΤΕΣ
          </div>
          <div className="flex flex-wrap gap-2">
            {player.abilities.map((a) => (
              <span
                key={a}
                className="rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide transition-colors"
                style={{
                  borderColor: `color-mix(in oklab, ${player.accent} 40%, transparent)`,
                  color: player.accent,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4">
          {player.stats.map((s, si) => (
            <div key={s.label}>
              <div className="flex justify-between font-mono text-[11px] tracking-wider text-muted-foreground">
                <span>{s.label}</span>
                <span className="text-foreground">{s.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[oklch(1_0_0/0.06)]">
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-out"
                  style={{
                    width: seen ? `${s.value}%` : "0%",
                    transitionDelay: `${si * 120}ms`,
                    background: `linear-gradient(90deg, ${player.accent}, color-mix(in oklab, ${player.accent} 40%, white))`,
                    boxShadow: `0 0 12px ${player.accent}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="reveal-on-scroll max-w-3xl">
      <div className="font-mono text-[11px] tracking-[0.35em] text-[var(--neon)]">{kicker}</div>
      <h2 className="text-mega mt-4 text-5xl text-gradient-sunset md:text-7xl">
        <Lines lines={[{ text: title }]} />
      </h2>
      {subtitle && <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/* ─────────────────────────── mission map ─────────────────────────── */

const MISSIONS = [
  {
    name: "Barceloneta Beach",
    obj: "Επιβίωσε από τη συναισθηματική κατάρρευση του Στέφανου.",
    risk: 4,
    img: beachImg,
  },
  {
    name: "Gothic Quarter",
    obj: "Χάσου επίτηδες. Φωτογράφισε κάθε πόρτα.",
    risk: 2,
    img: gothicImg,
  },
  {
    name: "Rooftop Bars",
    obj: "Παρίστανε ότι αυτό είναι luxury lifestyle documentary.",
    risk: 3,
    img: rooftopImg,
  },
  {
    name: "Nightclubs",
    obj: "Γίνε μάρτυρας του Stavros Dance Move Vol. 2.",
    risk: 5,
    img: clubImg,
  },
  {
    name: "Tapas & Νυχτερινό Φαγητό",
    obj: "Παράγγειλε άλλο ένα πιάτο. Μετά άλλο ένα.",
    risk: 2,
    img: tapasImg,
  },
  {
    name: "Τυχαία Side Quests",
    obj: "Στόχος διαμερίσματος: απόφυγε τον βιολογικό πόλεμο του Στέφανου.",
    risk: 5,
    img: sidequestImg,
  },
];

function MissionMap() {
  return (
    <section id="map" className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionHeader
        kicker="ΕΠΙΧΕΙΡΗΣΕΙΣ · ΖΩΝΕΣ ΣΤΟΧΟΥ"
        title="ΧΑΡΤΗΣ ΑΠΟΣΤΟΛΗΣ"
        subtitle="Έξι επιβεβαιωμένες τοποθεσίες. Κάθε μία με τον δικό της στόχο και βαθμό κινδύνου."
      />
      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MISSIONS.map((m, i) => (
          <article
            key={m.name}
            className="reveal-on-scroll group relative h-80 overflow-hidden rounded-2xl shadow-elegant"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div data-speed="0.04" className="parallax absolute inset-[-8%]">
              <img
                src={m.img}
                alt={m.name}
                loading="lazy"
                width={1280}
                height={1280}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.04_265)] via-[oklch(0.08_0.04_265/0.5)] to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-6">
              <div className="flex items-start justify-between">
                <div className="font-mono text-[10px] tracking-[0.3em] text-foreground/70">
                  ΖΩΝΗ · 0{i + 1}
                </div>
                <RiskBadge level={m.risk} />
              </div>
              <div>
                <h3 className="text-mega text-3xl text-foreground">{m.name}</h3>
                <p className="mt-2 text-sm text-foreground/80">{m.obj}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskBadge({ level }: { level: number }) {
  const labels = ["", "ΗΠΙΟΣ", "ΑΥΞΗΜΕΝΟΣ", "ΥΨΗΛΟΣ", "ΣΟΒΑΡΟΣ", "ΚΡΙΣΙΜΟΣ"];
  const color = level >= 4 ? "var(--blood)" : level >= 3 ? "var(--neon)" : "var(--gold)";
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] backdrop-blur-md"
      style={{ borderColor: color, color, background: "oklch(0 0 0 / 0.4)" }}
    >
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-0.5 rounded-full"
            style={{ background: i < level ? color : "oklch(1 0 0 / 0.15)" }}
          />
        ))}
      </span>
      {labels[level]}
    </div>
  );
}

/* ─────────────────────────── prophecy ─────────────────────────── */

const PROPHECIES = [
  "Ο Σταύρος θα πει κάτι παράνομο σε σπαστά Ισπανικά.",
  "Ο Γιώργος θα ανοίξει WhatsApp στη μέση της κουβέντας.",
  "Ο Στέφανος θα φωτογραφίσει μια τυχαία καρέκλα σαν να είναι το Λούβρο.",
  "Ο Evag θα πει «αυτό είναι content» τουλάχιστον 14 φορές.",
  "Κάποιος θα ξοδέψει €70 και θα το πει «μικρή νύχτα».",
  "Η παρέα θα χρειαστεί νερό, φαγητό και συναισθηματική ανασυγκρότηση μέχρι τις 5 π.μ.",
  "Ο Σταύρος θα επιχειρήσει αγκαλιά που θα καταλήξει σε λαβή πάλης.",
  "Ο Γιώργος θα γελάσει, και αμέσως μετά θα κάνει FaceTime σπίτι.",
  "Ο Στέφανος θα χορέψει με σερβιτόρο χωρίς λόγο.",
  "Ο Evag θα ανακηρύξει τη νύχτα «ιστορική» πριν τα μεσάνυχτα.",
  "Κάποιος θα πει «ένα ποτό». Οκτώ ποτά μετά, η άρνηση συνεχίζεται.",
  "Tango θα ξεκλειδωθεί στο πιο ακατάλληλο μέρος.",
];

function Prophecy() {
  const [text, setText] = useState("Πάτα το κουμπί. Παρέλαβε τη μοίρα σου.");
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const rollRef = useRef<number | null>(null);
  const lastRef = useRef<number>(-1);

  const pick = () => {
    let idx = Math.floor(Math.random() * PROPHECIES.length);
    if (PROPHECIES.length > 1) {
      while (idx === lastRef.current) idx = Math.floor(Math.random() * PROPHECIES.length);
    }
    lastRef.current = idx;
    return PROPHECIES[idx];
  };

  const generate = () => {
    if (rolling) return;
    setRolling(true);
    setRevealed(false);
    if (prefersReducedMotion()) {
      setText(pick());
      setRolling(false);
      setRevealed(true);
      return;
    }
    let count = 0;
    const tick = () => {
      setText(PROPHECIES[Math.floor(Math.random() * PROPHECIES.length)]);
      count++;
      if (count < 12) {
        rollRef.current = window.setTimeout(tick, 60 + count * 8);
      } else {
        setText(pick());
        setRolling(false);
        setRevealed(true);
      }
    };
    tick();
  };

  const share = async () => {
    const payload = `🔮 Προφητεία Βαρκελώνης: «${text}»`;
    try {
      if (navigator.share) {
        await navigator.share({ text: payload });
      } else {
        await navigator.clipboard.writeText(payload);
        toast.success("Αντιγράφηκε στο πρόχειρο", { description: "Ρίξ' το στο group chat." });
      }
    } catch {
      /* user cancelled — ignore */
    }
  };

  useEffect(
    () => () => {
      if (rollRef.current) clearTimeout(rollRef.current);
    },
    [],
  );

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionHeader
        kicker="ΜΑΝΤΕΙΟ · ΚΡΥΠΤΟΓΡΑΦΗΜΕΝΗ ΠΡΟΒΛΕΨΗ"
        title="PROPHECY GENERATOR"
        subtitle="Το μέλλον είναι ήδη γραμμένο. Απλά δεν ξέρουμε ποια σειρά."
      />
      <div className="reveal-on-scroll relative mt-14 overflow-hidden rounded-3xl glass-strong shadow-elegant p-10 text-center md:p-16">
        <div className="absolute inset-x-0 top-0 h-px animate-scan bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          ΕΙΣΕΡΧΟΜΕΝΗ ΜΕΤΑΔΟΣΗ
        </div>
        <p
          className={cn(
            "text-mega mt-6 min-h-[5rem] text-3xl leading-[1.05] text-foreground transition-opacity md:text-5xl",
            rolling && "animate-flicker",
          )}
        >
          «{text}»
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={generate}
            className="inline-flex items-center gap-3 rounded-full border border-[var(--neon)] px-8 py-4 font-mono text-sm tracking-[0.2em] text-[var(--neon)] transition-all hover:bg-[var(--neon)] hover:text-primary-foreground hover:shadow-neon"
          >
            {rolling ? "ΑΠΟΚΩΔΙΚΟΠΟΙΗΣΗ..." : "ΓΕΝΝΗΣΕ ΠΡΟΦΗΤΕΙΑ"}
          </button>
          {revealed && !rolling && (
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-4 font-mono text-xs tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              ΚΟΙΝΟΠΟΙΗΣΗ ↗
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── budget ─────────────────────────── */

const BUDGET_ITEMS = [
  { label: "Αεροπορικά", expected: 250, actual: 310 },
  { label: "Ξενοδοχείο", expected: 400, actual: 520 },
  { label: "Φαγητό", expected: 200, actual: 380 },
  { label: "Clubs", expected: 300, actual: 740 },
  { label: "Τυχαίες Κακές Αποφάσεις", expected: 50, actual: 420 },
  { label: "Stavros Tax", expected: 800, actual: 2000, hero: true },
];

function Budget() {
  const [ref, armed] = useInView<HTMLDivElement>(0.3);
  const totalExpected = BUDGET_ITEMS.reduce((s, b) => s + b.expected, 0);
  const totalActual = BUDGET_ITEMS.reduce((s, b) => s + b.actual, 0);
  const animatedTotal = useCountUp(totalActual, armed, 1600);
  const max = Math.max(...BUDGET_ITEMS.map((b) => b.actual));

  return (
    <section id="budget" className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36" ref={ref}>
      <SectionHeader
        kicker="ΕΓΚΛΗΜΑΤΟΛΟΓΙΚΗ ΛΟΓΙΣΤΙΚΗ"
        title="BUDGET REALITY CHECK"
        subtitle="Τι είπαμε. Τι πραγματικά έγινε. Δεν δεχόμαστε ερωτήσεις."
      />

      <div className="reveal-on-scroll mt-14 grid gap-4 sm:grid-cols-3">
        <div className="glass-strong rounded-2xl p-6">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
            ΠΡΟΫΠΟΛΟΓΙΣΜΟΣ
          </div>
          <div className="text-mega mt-2 text-4xl text-muted-foreground">
            €{totalExpected.toLocaleString("el-GR")}
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-6 ring-1 ring-[var(--blood)]/40">
          <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--blood)]">
            ΠΡΑΓΜΑΤΙΚΗ ΖΗΜΙΑ
          </div>
          <div className="text-mega mt-2 text-4xl tabular-nums text-foreground">
            €{animatedTotal.toLocaleString("el-GR")}
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-6 ring-1 ring-[var(--gold)]/40">
          <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--gold)]">ΥΠΕΡΒΑΣΗ</div>
          <div className="text-mega mt-2 text-4xl text-[var(--gold)]">
            +{Math.round(((totalActual - totalExpected) / totalExpected) * 100)}%
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {BUDGET_ITEMS.map((item, i) => {
          const expectedW = armed ? (item.expected / max) * 100 : 0;
          const actualW = armed ? (item.actual / max) * 100 : 0;
          const overrun = Math.round(((item.actual - item.expected) / item.expected) * 100);
          return (
            <div
              key={item.label}
              className={cn(
                "reveal-on-scroll rounded-2xl glass p-5 md:p-7",
                item.hero && "ring-1 ring-[var(--neon)] shadow-neon",
              )}
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h4
                  className={cn(
                    "text-mega text-2xl md:text-3xl",
                    item.hero ? "text-[var(--neon)]" : "text-foreground",
                  )}
                >
                  {item.label}
                </h4>
                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-muted-foreground">ΠΡΟΒΛΕΨΗ €{item.expected}</span>
                  <span className="text-[var(--blood)]">ΠΡΑΓΜΑΤΙΚΟ €{item.actual}</span>
                  <span className="text-[var(--gold)]">+{overrun}%</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-[oklch(1_0_0/0.05)]">
                  <div
                    className="h-full rounded-full bg-muted-foreground/60 transition-[width] duration-1000 ease-out"
                    style={{ width: `${expectedW}%`, transitionDelay: `${i * 100}ms` }}
                  />
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[oklch(1_0_0/0.05)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
                    style={{
                      width: `${actualW}%`,
                      transitionDelay: `${i * 100 + 200}ms`,
                      background: item.hero
                        ? "linear-gradient(90deg, var(--neon), var(--blood))"
                        : "linear-gradient(90deg, var(--blood), var(--gold))",
                      boxShadow: item.hero ? "0 0 20px var(--neon)" : "none",
                    }}
                  />
                </div>
              </div>
              {item.hero && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[oklch(0_0_0/0.4)] px-3 py-1 font-mono text-xs tracking-wider text-[var(--gold)]">
                  ΤΕΛΙΚΗ ΔΗΛΩΣΗ: «Worth it.»
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────── night simulator ─────────────────────────── */

const TIMELINE = [
  { t: "22:00", text: "Όλοι λένε ότι απόψε θα είναι chill." },
  { t: "23:30", text: "Πρώτη κακή οικονομική απόφαση." },
  { t: "01:00", text: "Ο Σταύρος αρχίζει να μιλά διεθνείς ασυναρτησίες." },
  { t: "02:15", text: "Ο Γιώργος γίνεται comedian." },
  { t: "03:00", text: "Ο Στέφανος ξεκλειδώνει tango." },
  { t: "04:30", text: "Κάποιος λέει «άλλο ένα μέρος»." },
  { t: "06:00", text: "Κανείς δεν ξέρει πώς φτάσαμε εδώ." },
];

function NightSimulator() {
  const [step, setStep] = useState(-1);
  const timers = useRef<number[]>([]);
  const clearAll = useCallback(() => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  }, []);

  const start = () => {
    clearAll();
    setStep(0);
    const delay = prefersReducedMotion() ? 120 : 900;
    TIMELINE.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStep(i), i * delay));
    });
  };
  const reset = () => {
    clearAll();
    setStep(-1);
  };

  useEffect(() => () => clearAll(), [clearAll]);

  const running = step >= 0;
  const done = step >= TIMELINE.length - 1;
  const chaos = step < 0 ? 0 : Math.round(((step + 1) / TIMELINE.length) * 100);

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionHeader
        kicker="ΠΡΟΣΟΜΟΙΩΣΗ · LIVE FEED"
        title="NIGHT OUT SIMULATOR"
        subtitle="Πάτα start. Δες μια κανονική βραδιά να καταρρέει σε slow motion."
      />
      <div className="reveal-on-scroll mt-14 rounded-3xl glass-strong shadow-elegant p-8 md:p-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
            ΚΑΤΑΣΤΑΣΗ: {step < 0 ? "STANDBY" : done ? "ΔΙΑΛΥΣΗ" : "ΚΛΙΜΑΚΩΣΗ"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={start}
              className="rounded-full bg-[var(--neon)] px-6 py-2.5 font-mono text-xs tracking-[0.2em] text-primary-foreground shadow-neon transition-transform hover:scale-[1.03]"
            >
              {running ? "ΞΑΝΑ" : "ΞΕΚΙΝΑ ΤΗ ΝΥΧΤΑ"}
            </button>
            {running && (
              <button
                onClick={reset}
                className="rounded-full border border-border px-6 py-2.5 font-mono text-xs tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                RESET
              </button>
            )}
          </div>
        </div>

        {/* Chaos meter */}
        <div className="mb-8">
          <div className="flex justify-between font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
            <span>CHAOS METER</span>
            <span className="text-foreground tabular-nums">{chaos}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[oklch(1_0_0/0.06)]">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${chaos}%`,
                background: "linear-gradient(90deg, var(--gold), var(--neon), var(--blood))",
                boxShadow: chaos > 60 ? "0 0 16px var(--blood)" : "none",
              }}
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-[52px] top-0 w-px bg-border md:left-[72px]" />
          <div className="space-y-5">
            {TIMELINE.map((e, i) => {
              const active = step >= i;
              return (
                <div
                  key={e.t}
                  className={cn(
                    "flex items-center gap-6 transition-all duration-500",
                    active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-25",
                  )}
                >
                  <div className="w-[40px] text-right font-mono text-sm tabular-nums text-muted-foreground md:w-[60px]">
                    {e.t}
                  </div>
                  <div
                    className={cn(
                      "relative z-10 size-4 shrink-0 rounded-full border-2 transition-all",
                      active
                        ? "border-[var(--neon)] bg-[var(--neon)] shadow-neon"
                        : "border-border bg-background",
                    )}
                  />
                  <div
                    className={cn(
                      "text-base md:text-xl",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {e.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── evidence ─────────────────────────── */

const EVIDENCE = [
  { label: "Στοιχεία Παραλίας", img: beachImg },
  { label: "Στοιχεία Club", img: clubImg },
  { label: "Οικονομική Ζημιά", img: tapasImg },
  { label: "Εγκλήματα Διαμερίσματος", img: sidequestImg },
  { label: "Ανεξήγητες Στιγμές", img: rooftopImg },
  { label: "Ψίθυροι Gothic Quarter", img: gothicImg },
];

function Evidence() {
  return (
    <section id="evidence" className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionHeader
        kicker="ΑΡΧΕΙΟ · ΑΠΟΡΡΗΤΟ ΥΛΙΚΟ"
        title="EVIDENCE LOCKER"
        subtitle="Οι φωτογραφίες θα ανέβουν μετά την αποστολή. Πιθανώς με λογοκρισία."
      />
      <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {EVIDENCE.map((e, i) => (
          <div
            key={e.label}
            className="reveal-on-scroll group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-elegant"
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <img
              src={e.img}
              alt={e.label}
              loading="lazy"
              width={1280}
              height={1280}
              className="absolute inset-0 size-full object-cover opacity-50 blur-sm grayscale transition-all duration-500 group-hover:scale-105 group-hover:opacity-90 group-hover:blur-0 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.04_265)] to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-[var(--neon)]">
                <span className="size-1.5 animate-pulse rounded-full bg-[var(--neon)]" />
                ΑΠΟΡΡΗΤΟ
              </div>
              <div>
                <div className="text-mega text-2xl">{e.label}</div>
                <div className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                  ΕΚΚΡΕΜΕΙ UPLOAD · ΜΕΤΑ ΤΙΣ 02.10.26
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── rules ─────────────────────────── */

const RULES = [
  "Καμία βαρετή νύχτα.",
  "Καμία πρόωρη δικαιολογία.",
  "Δεν παριστάνουμε ότι τα €40 ήταν «τίποτα».",
  "Όλες οι legendary στιγμές πρέπει να καταγράφονται.",
  "Αν κάποιος πει «ένα ποτό», λέει ψέματα.",
  "Οι συναισθηματικές αντιδράσεις στην Barceloneta επιτρέπονται.",
  "Το group chat αποφασίζει την ιστορία.",
];

function Rules() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionHeader kicker="ΔΟΓΜΑ · ΜΗ ΔΙΑΠΡΑΓΜΑΤΕΥΣΙΜΟ" title="ΚΑΝΟΝΕΣ ΤΟΥ ΤΑΞΙΔΙΟΥ" />
      <div className="mt-14 grid gap-3 md:grid-cols-2">
        {RULES.map((r, i) => (
          <div
            key={r}
            className="reveal-on-scroll flex items-center gap-5 rounded-xl glass-strong shadow-elegant px-6 py-5 transition-transform hover:translate-x-1"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className="text-mega w-14 text-4xl tabular-nums text-[var(--neon)]">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="text-lg text-foreground md:text-xl">{r}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── final cta ─────────────────────────── */

function FinalCTA() {
  const { days, mounted } = useCountdown(TRIP_DATE);
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-32 md:py-40">
      <div className="reveal-on-scroll relative overflow-hidden rounded-3xl glass-strong shadow-elegant p-10 text-center md:p-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.3 350 / 0.6), transparent 60%), radial-gradient(ellipse at 50% 100%, oklch(0.55 0.24 25 / 0.5), transparent 60%)",
          }}
        />
        <div className="font-mono text-[11px] tracking-[0.4em] text-[var(--gold)]">
          T-MINUS {mounted ? days : "--"} ΜΕΡΕΣ
        </div>
        <h2 className="text-mega mt-6 text-[clamp(2.4rem,8vw,7rem)] text-gradient-sunset">
          <Lines
            lines={[
              { text: "Η 2 ΟΚΤΩΒΡΙΟΥ ΔΕΝ ΕΙΝΑΙ ΗΜΕΡΟΜΗΝΙΑ." },
              { text: "ΕΙΝΑΙ ΠΡΟΕΙΔΟΠΟΙΗΣΗ.", className: "text-foreground/95" },
            ]}
          />
        </h2>

        <div className="mt-8 flex justify-center gap-3">
          {SQUAD.map((p) => (
            <div
              key={p.id}
              className="size-12 overflow-hidden rounded-full ring-2 ring-background md:size-14"
              style={{ boxShadow: `0 0 0 1px ${p.accent}` }}
              title={p.name}
            >
              <Portrait
                id={p.id}
                name={p.name}
                accent={p.accent}
                className="size-full duotone"
                small
              />
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-xl mx-auto text-muted-foreground">
          Evag. Σταύρος. Γιώργος. Στέφανος. Η πόλη έχει ειδοποιηθεί.
        </p>
        <a
          href="#top"
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-[var(--neon)] px-10 py-5 font-mono text-sm tracking-[0.25em] text-primary-foreground shadow-neon animate-pulse-neon transition-transform hover:scale-[1.02]"
        >
          BARCELONA LOADING
          <span className="flex gap-1">
            <span
              className="size-1 animate-pulse rounded-full bg-current"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="size-1 animate-pulse rounded-full bg-current"
              style={{ animationDelay: "200ms" }}
            />
            <span
              className="size-1 animate-pulse rounded-full bg-current"
              style={{ animationDelay: "400ms" }}
            />
          </span>
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/40 py-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
        <div>© ΑΠΟΣΤΟΛΗ BCN · ΑΠΟΡΡΗΤΟ · 04 ΠΡΑΚΤΟΡΕΣ</div>
        <div>WORTH IT · ΠΑΝΤΑ</div>
      </div>
    </footer>
  );
}
