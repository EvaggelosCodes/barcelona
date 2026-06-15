import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import {
  CircleDollarSign,
  Dice5,
  Landmark,
  Martini,
  Plane,
  Sparkles,
  ShieldAlert,
  Users,
} from "lucide-react";
import barcelonaPanorama from "@/assets/barcelona-route-panorama.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "BCN · 02.10.26 — Mission Dossier" }] }),
  component: V1,
});

/* ─────────────────────────── data ─────────────────────────── */

const SCROLL_VH = 540;
const TRIP_DATE = new Date("2026-10-02T08:00:00+02:00").getTime();

const CHAPTERS = [
  {
    n: "00",
    place: "Mission Control",
    camera: { travel: 0, y: 10, scale: 1.04, rotate: -0.2 },
  },
  {
    n: "01",
    place: "The Squad",
    camera: { travel: 0.3, y: 2, scale: 1.08, rotate: 0.12 },
  },
  {
    n: "02",
    place: "Target Zones",
    camera: { travel: 0.62, y: -6, scale: 1.12, rotate: -0.12 },
  },
  {
    n: "03",
    place: "Night Systems",
    camera: { travel: 0.96, y: -12, scale: 1.16, rotate: 0.08 },
  },
] as const;

const CREW = [
  {
    id: "evag",
    name: "EVAG",
    role: "Mission Control",
    signature: "Hype Architect",
    stat: "99",
    statLabel: "hype",
    move: "Λέει «αυτό είναι content» τουλάχιστον 14 φορές τη νύχτα.",
    accent: "#ffd16f",
  },
  {
    id: "stavros",
    name: "STAVROS",
    role: "Chaotic Legend",
    signature: "Financial Delusion",
    stat: "€2000",
    statLabel: "stavros tax",
    move: "Διεθνής διπλωματία σε σπαστά Ισπανικά, ακριβώς στις 01:00.",
    accent: "#ff5f8e",
  },
  {
    id: "giorgos",
    name: "GIORGOS",
    role: "Loyal Comedian",
    signature: "Love-of-Game Pulls",
    stat: "20",
    statLabel: "pulls",
    move: "Ανοίγει WhatsApp στη μέση κάθε σοβαρής στιγμής.",
    accent: "#ff8a4a",
  },
  {
    id: "stefanos",
    name: "STEFANOS",
    role: "Beach-Dance Menace",
    signature: "Tango Unlock",
    stat: "98",
    statLabel: "tango",
    move: "Ξεκλειδώνει tango στο πιο ακατάλληλο σημείο της πόλης.",
    accent: "#66d9ff",
  },
] as const;

const ZONES = [
  { name: "Barceloneta", objective: "Stefanos emotional overload", risk: 4 },
  { name: "Gothic Quarter", objective: "Χαθείτε επίτηδες στα σοκάκια", risk: 2 },
  { name: "Rooftop Bars", objective: "Κάντε ότι είστε luxury documentary", risk: 3 },
  { name: "Nightclubs", objective: "Stavros Dance Move Vol. 2", risk: 5 },
  { name: "Tapas", objective: "Άλλο ένα πιάτο. Και άλλο ένα.", risk: 2 },
  { name: "Side Quests", objective: "Αποφυγή βιολογικού πολέμου στο Airbnb", risk: 5 },
] as const;

const PROPHECIES = [
  "Ο Stavros θα πει κάτι παράνομο σε σπαστά Ισπανικά.",
  "Ο Giorgos θα ανοίξει WhatsApp στη μέση της κουβέντας.",
  "Ο Stefanos θα φωτογραφίσει μια καρέκλα σαν να είναι το Λούβρο.",
  "Ο Evag θα πει «αυτό είναι content» τουλάχιστον 14 φορές.",
  "Κάποιος θα πει «ένα ποτό». Οκτώ ποτά μετά, η άρνηση συνεχίζεται.",
  "Tango θα ξεκλειδωθεί στο πιο ακατάλληλο μέρος.",
] as const;

const BUDGET = [
  { label: "Flights", expected: 250, actual: 310 },
  { label: "Hotel", expected: 400, actual: 520 },
  { label: "Food", expected: 200, actual: 380 },
  { label: "Clubs", expected: 300, actual: 740 },
  { label: "Stavros Tax", expected: 800, actual: 2000 },
] as const;

const NIGHT = [
  { t: "22:00", text: "Όλοι λένε ότι απόψε θα είναι chill." },
  { t: "23:30", text: "Πρώτη κακή οικονομική απόφαση." },
  { t: "01:00", text: "Ο Stavros αρχίζει διεθνή διπλωματία." },
  { t: "02:15", text: "Ο Giorgos γίνεται comedian." },
  { t: "03:00", text: "Ο Stefanos ξεκλειδώνει tango." },
  { t: "04:30", text: "Κάποιος λέει «άλλο ένα μέρος»." },
  { t: "06:00", text: "Κανείς δεν ξέρει πώς φτάσαμε εδώ." },
] as const;

/* ─────────────────────────── utils ─────────────────────────── */

function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}
function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}
/** map a sub-range of global progress to 0..1 */
function band(p: number, start: number, end: number) {
  return clamp((p - start) / (end - start));
}

/* ─────────────────────────── hooks ─────────────────────────── */

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const h = () => setR(m.matches);
    m.addEventListener?.("change", h);
    return () => m.removeEventListener?.("change", h);
  }, []);
  return r;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(window.scrollY / max) : 0;
      ref.current = p;
      setProgress(p);
      raf = 0;
    };
    const req = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return [progress, ref] as const;
}

function useMouseRef(reduced: boolean) {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return;
    const h = (e: PointerEvent) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", h);
    return () => window.removeEventListener("pointermove", h);
  }, [reduced]);
  return ref;
}

function useCountdown(target: number) {
  const [now, setNow] = useState(target);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function useCountUp(target: number, run: boolean, reduced: boolean, dur = 1500) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, reduced, dur]);
  return v;
}

function getActiveIndex(p: number) {
  return Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length + 0.16));
}
function getCamera(p: number) {
  const raw = p * (CHAPTERS.length - 1);
  const i = Math.min(CHAPTERS.length - 2, Math.floor(raw));
  const local = easeInOut(clamp(raw - i));
  const a = CHAPTERS[i].camera;
  const b = CHAPTERS[i + 1].camera;
  return {
    travel: mix(a.travel, b.travel, local),
    y: mix(a.y, b.y, local),
    scale: mix(a.scale, b.scale, local),
    rotate: mix(a.rotate, b.rotate, local),
  };
}

/* ─────────────────────── WebGL centerpiece ─────────────────────── */

function MissionCore({
  progressRef,
  mouseRef,
  reduced,
}: {
  progressRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = grp.current;
    if (!g) return;
    const p = progressRef.current ?? 0;
    // prominent in the hero, recedes after, returns for the closer
    const hero = 1 - band(p, 0.0, 0.15);
    const end = band(p, 0.9, 1) * 0.85;
    const presence = Math.max(hero, end);
    const target = 0.04 + presence * 0.82;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, target, 0.15));
    if (!reduced) g.rotation.y += dt * 0.22;
    g.rotation.z += dt * 0.03;
    const mx = mouseRef.current?.x ?? 0;
    const my = mouseRef.current?.y ?? 0;
    // float to the right of the headline in the hero; center for the closer
    const biasX = hero * 2.1;
    g.position.x = THREE.MathUtils.lerp(g.position.x, mx * 0.5 + biasX, 0.06);
    g.position.y = THREE.MathUtils.lerp(g.position.y, my * 0.4 + (1 - presence) * 0.8, 0.06);
  });
  return (
    <group ref={grp}>
      <mesh>
        <icosahedronGeometry args={[1.5, 24]} />
        <MeshDistortMaterial
          color="#ff4f93"
          metalness={1}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.16}
          envMapIntensity={1.45}
          distort={reduced ? 0.16 : 0.42}
          speed={reduced ? 0 : 1.6}
        />
      </mesh>
    </group>
  );
}

function CoreCanvas({
  progressRef,
  mouseRef,
  reduced,
}: {
  progressRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
}) {
  return (
    <Canvas
      className="!pointer-events-none"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <MissionCore progressRef={progressRef} mouseRef={mouseRef} reduced={reduced} />
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 4, 4]}
          scale={[10, 10, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={3}
          position={[-6, 2, 2]}
          scale={[3, 10, 1]}
          color="#ff5f8e"
        />
        <Lightformer
          form="circle"
          intensity={2.6}
          position={[6, -2, 3]}
          scale={[5, 5, 1]}
          color="#66d9ff"
        />
        <Lightformer
          form="ring"
          intensity={2}
          position={[3, 4, -3]}
          scale={[5, 5, 1]}
          color="#ffd16f"
        />
      </Environment>
    </Canvas>
  );
}

/* ─────────────────────── cinematic backdrop ─────────────────────── */

function CityFilm({ progress }: { progress: number }) {
  const camera = useMemo(() => getCamera(progress), [progress]);
  const active = CHAPTERS[getActiveIndex(progress)];
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050510]">
      <div
        className="absolute left-0 top-0 h-[100dvh] w-[190vw] will-change-transform"
        style={{
          transform: `translate3d(${-camera.travel * vw * 0.9}px, ${camera.y}px, 0) scale(${camera.scale}) rotate(${camera.rotate}deg)`,
          transformOrigin: "0% 52%",
          transition: "transform 110ms linear",
        }}
      >
        <img
          alt=""
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
          src={barcelonaPanorama}
        />
      </div>
      {/* legibility + atmosphere */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,16,0.92)_0%,rgba(5,5,16,0.66)_30%,rgba(5,5,16,0.18)_56%,rgba(5,5,16,0.4)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050510] to-transparent" />
      <div
        className="absolute inset-0 mix-blend-screen transition-[background] duration-700"
        style={{
          background: `radial-gradient(circle at 72% 36%, ${active.camera ? "rgba(255,196,100,0.14)" : "transparent"}, transparent 30%), radial-gradient(circle at 16% 66%, rgba(102,217,255,0.12), transparent 32%)`,
        }}
      />
    </div>
  );
}

/* ─────────────────────────── portrait ─────────────────────────── */

function Portrait({
  id,
  name,
  accent,
  className,
}: {
  id: string;
  name: string;
  accent: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div
        className={className}
        style={{
          background: `radial-gradient(circle at 50% 28%, color-mix(in oklab, ${accent} 55%, transparent), transparent 70%), linear-gradient(165deg, #1a1430, #0a0818)`,
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <span
            className="font-black"
            style={{ color: accent, fontSize: "clamp(3rem,7vw,6rem)", letterSpacing: "-0.04em" }}
          >
            {name.slice(0, 2)}
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      alt={`Agent ${name}`}
      src={`/squad/${id}.jpg`}
      onError={() => setErr(true)}
      loading="lazy"
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}

/* ─────────────────────────── stages ─────────────────────────── */

function HeroStage({ reduced }: { reduced: boolean }) {
  const c = useCountdown(TRIP_DATE);
  const tiles = [
    { label: "days", value: c.days },
    { label: "hrs", value: c.hours },
    { label: "min", value: c.minutes },
    { label: "sec", value: c.seconds },
  ];
  return (
    <section className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-16">
      <div
        className={reduced ? "" : "animate-[v1-in_640ms_cubic-bezier(.16,1,.3,1)_both]"}
        style={{ maxWidth: "min(94vw, 880px)" }}
      >
        <div className="mb-5 flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.36em] text-white/55">
          <Plane size={14} className="text-[#66d9ff]" />
          Stop 00 / Mission Control
        </div>
        <h1 className="font-black uppercase leading-[0.82] tracking-[-0.045em] text-[#fff7e6] text-[clamp(3.4rem,11vw,11rem)]">
          <span className="block">Η Βαρκελώνη</span>
          <span className="block text-[#ff5f8e]">δεν είναι</span>
          <span className="block">έτοιμη</span>
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg leading-8 text-white/72 md:text-xl">
          4 παιδιά. Μία πόλη. Μηδέν φυσιολογικές νύχτες. Το briefing ανοίγει από τη θάλασσα και
          αρχίζει να μετράει αντίστροφα.
        </p>
        <div className="mt-9 flex flex-wrap gap-2.5">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="min-w-[4.6rem] border border-white/14 bg-white/[0.04] px-4 py-3 backdrop-blur-md"
            >
              <div className="font-black tabular-nums leading-none tracking-[-0.04em] text-[#fff7e6] text-[clamp(1.9rem,3.4vw,3rem)]">
                {String(t.value).padStart(2, "0")}
              </div>
              <div className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/42">
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CrewStage({ reduced }: { reduced: boolean }) {
  return (
    <section className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-center px-4 pt-24 sm:px-8 md:px-12 lg:px-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.36em] text-white/55">
            <Users size={14} className="text-[#ffd16f]" />
            Stop 01 / The Squad
          </div>
          <h2 className="mt-3 font-black uppercase leading-[0.85] tracking-[-0.04em] text-[#fff7e6] text-[clamp(2.4rem,6vw,5rem)]">
            Τέσσερις πράκτορες
          </h2>
        </div>
        <div className="hidden font-mono text-[0.6rem] uppercase tracking-[0.24em] text-white/40 md:block">
          hover για dossier
        </div>
      </div>
      <div className="pointer-events-auto grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {CREW.map((agent, i) => (
          <CrewCard key={agent.id} agent={agent} index={i} reduced={reduced} />
        ))}
      </div>
    </section>
  );
}

function CrewCard({
  agent,
  index,
  reduced,
}: {
  agent: (typeof CREW)[number];
  index: number;
  reduced: boolean;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, on: false });
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -y * 9, ry: x * 11, on: true });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0, on: false });
  return (
    <article
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={
        "group relative aspect-[3/4.4] overflow-hidden border border-white/12 bg-[#0a0818] " +
        (reduced ? "" : "animate-[v1-card_640ms_cubic-bezier(.16,1,.3,1)_both]")
      }
      style={
        {
          "--accent": agent.accent,
          animationDelay: `${index * 90}ms`,
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: "transform 220ms cubic-bezier(.16,1,.3,1), box-shadow 300ms",
          boxShadow: tilt.on
            ? `0 30px 80px -30px ${agent.accent}99, 0 0 0 1px ${agent.accent}55 inset`
            : "0 20px 60px -40px rgba(0,0,0,.8)",
        } as CSSProperties
      }
    >
      <Portrait
        id={agent.id}
        name={agent.name}
        accent={agent.accent}
        className="absolute inset-0 h-full w-full grayscale-[0.65] transition-all duration-500 group-hover:scale-[1.05] group-hover:grayscale-0"
      />
      {/* accent wash + darken for legibility */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-60 transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: `linear-gradient(180deg, transparent 30%, ${agent.accent})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,16,0.1)_28%,rgba(5,5,16,0.86))]" />

      {/* specimen number */}
      <div className="absolute right-3 top-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/55">
        0{index + 1}
      </div>

      {/* signature stat — big */}
      <div className="absolute left-3 top-3">
        <div
          className="font-black leading-none tracking-[-0.04em]"
          style={{ color: agent.accent, fontSize: "clamp(1.5rem,2.6vw,2.4rem)" }}
        >
          {agent.stat}
        </div>
        <div className="font-mono text-[0.5rem] uppercase tracking-[0.22em] text-white/55">
          {agent.statLabel}
        </div>
      </div>

      {/* identity */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="font-black uppercase leading-none tracking-[-0.03em] text-[#fff7e6] text-[clamp(1.3rem,2.4vw,2rem)]">
          {agent.name}
        </div>
        <div
          className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.2em]"
          style={{ color: agent.accent }}
        >
          {agent.role}
        </div>
        {/* signature move — revealed on hover */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="mt-2 border-t border-white/14 pt-2 text-[0.78rem] leading-5 text-white/82">
              <span className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-white/45">
                signature move
              </span>
              <br />
              {agent.move}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function MapStage({ reduced }: { reduced: boolean }) {
  return (
    <section className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-center px-4 pt-24 sm:px-8 md:px-12 lg:px-16">
      <div className="mb-6">
        <div className="flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.36em] text-white/55">
          <Landmark size={14} className="text-[#ffb05a]" />
          Stop 02 / Target Zones
        </div>
        <h2 className="mt-3 font-black uppercase leading-[0.85] tracking-[-0.04em] text-[#fff7e6] text-[clamp(2.4rem,6vw,5rem)]">
          Οι ζώνες οπλίζονται
        </h2>
      </div>
      <div className="grid max-w-[68rem] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ZONES.map((z, i) => (
          <div
            key={z.name}
            className={
              "border border-white/12 bg-[#0a0818]/70 p-4 backdrop-blur-md " +
              (reduced ? "" : "animate-[v1-card_560ms_cubic-bezier(.16,1,.3,1)_both]")
            }
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/38">
                  zone {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 font-black uppercase tracking-[-0.02em] text-[#fff7e6]">
                  {z.name}
                </div>
              </div>
              <RiskMeter value={z.risk} />
            </div>
            <p className="mt-2 text-sm leading-5 text-white/60">{z.objective}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RiskMeter({ value }: { value: number }) {
  const color =
    value >= 5 ? "#ff5f8e" : value >= 4 ? "#ff8a4a" : value >= 3 ? "#ffd16f" : "#66d9ff";
  return (
    <div className="flex shrink-0 flex-col items-end">
      <div className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-white/34">risk</div>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-6 w-1"
            style={{
              background: i < value ? color : "rgba(255,255,255,.12)",
              boxShadow: i < value ? `0 0 12px ${color}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NightStage({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [prophecy, setProphecy] = useState(0);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);

  const totals = BUDGET.reduce(
    (a, b) => ({ expected: a.expected + b.expected, actual: a.actual + b.actual }),
    { expected: 0, actual: 0 },
  );
  const animActual = useCountUp(totals.actual, active, reduced);
  const overrun = Math.round(((totals.actual - totals.expected) / totals.expected) * 100);
  const chaos = step < 0 ? 0 : Math.round(((step + 1) / NIGHT.length) * 100);

  useEffect(() => {
    if (!running) return;
    if (step >= NIGHT.length - 1) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(
      () => setStep((s) => Math.min(s + 1, NIGHT.length - 1)),
      reduced ? 150 : 720,
    );
    return () => window.clearTimeout(id);
  }, [step, running, reduced]);

  const spin = () =>
    setProphecy(
      (v) => (v + 1 + Math.floor(Math.random() * (PROPHECIES.length - 1))) % PROPHECIES.length,
    );
  const run = () => {
    setStep(0);
    setRunning(true);
  };

  return (
    <section className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-center px-4 pt-24 sm:px-8 md:px-12 lg:px-16">
      <div className="mb-6">
        <div className="flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.36em] text-white/55">
          <Martini size={14} className="text-[#ff5f8e]" />
          Stop 03 / Night Systems
        </div>
        <h2 className="mt-3 font-black uppercase leading-[0.85] tracking-[-0.04em] text-[#fff7e6] text-[clamp(2.4rem,6vw,5rem)]">
          Chaos simulator
        </h2>
      </div>

      <div className="pointer-events-auto grid max-w-[72rem] gap-3 lg:grid-cols-3">
        {/* prophecy */}
        <div className="border border-white/12 bg-[#0a0818]/70 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-white/45">
              <Dice5 size={14} className="text-[#ff5f8e]" /> prophecy
            </span>
            <button
              type="button"
              onClick={spin}
              className="border border-[#ff5f8e] px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#ff5f8e] transition hover:bg-[#ff5f8e] hover:text-[#050510]"
            >
              spin
            </button>
          </div>
          <p className="text-balance text-lg font-semibold leading-7 text-[#fff7e6]">
            “{PROPHECIES[prophecy]}”
          </p>
        </div>

        {/* budget */}
        <div className="border border-white/12 bg-[#0a0818]/70 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-white/45">
            <CircleDollarSign size={14} className="text-[#ffd16f]" /> budget reality
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Cell label="expected" value={`€${totals.expected}`} muted />
            <Cell label="actual" value={`€${animActual}`} accent="#ff5f8e" />
            <Cell label="overrun" value={`+${overrun}%`} accent="#ffd16f" />
          </div>
        </div>

        {/* simulator */}
        <div className="border border-white/12 bg-[#0a0818]/70 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-white/45">
              <ShieldAlert size={14} className="text-[#66d9ff]" /> night sim
            </span>
            <button
              type="button"
              onClick={run}
              className="border border-white/16 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-white/70 transition hover:border-[#66d9ff] hover:text-[#66d9ff]"
            >
              {running ? "running" : step >= 0 ? "rerun" : "start"}
            </button>
          </div>
          <div className="mb-3 h-1 overflow-hidden bg-white/10">
            <div
              className="h-full transition-[width] duration-500"
              style={{
                width: `${chaos}%`,
                background: chaos > 60 ? "#ff5f8e" : "#66d9ff",
                boxShadow: chaos > 60 ? "0 0 16px #ff5f8e" : "0 0 12px #66d9ff",
              }}
            />
          </div>
          <div className="space-y-1.5">
            {NIGHT.slice(0, 4).map((e, i) => (
              <div
                key={e.t}
                className="grid grid-cols-[3rem_1fr] gap-2 text-sm transition-opacity"
                style={{ opacity: step >= i ? 1 : 0.32 }}
              >
                <span className="font-mono text-[0.62rem] text-white/40">{e.t}</span>
                <span className="text-white/72">{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: string;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.035] p-3">
      <div className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-white/34">
        {label}
      </div>
      <div
        className="mt-1.5 font-black tabular-nums leading-none tracking-[-0.04em] text-lg"
        style={{ color: muted ? "rgba(255,255,255,.5)" : (accent ?? "#fff7e6") }}
      >
        {value}
      </div>
    </div>
  );
}

/** End-of-scroll closer that fades in as you reach the bottom. */
function Closer({ progress }: { progress: number }) {
  const o = band(progress, 0.95, 1);
  if (o <= 0.001) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[36] flex flex-col items-center justify-center bg-[#050510]/70 backdrop-blur-sm"
      style={{ opacity: o }}
    >
      <div className="flex items-center gap-2">
        {CREW.map((a) => (
          <span
            key={a.id}
            className="grid size-9 place-items-center border border-white/15 font-black text-xs text-[#050510]"
            style={{ background: a.accent }}
          >
            {a.name.slice(0, 2)}
          </span>
        ))}
      </div>
      <div className="mt-7 font-black uppercase leading-none tracking-[-0.05em] text-[#fff7e6] text-[clamp(3rem,12vw,11rem)]">
        02 · 10 · 26
      </div>
      <div className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.5em] text-[#ff5f8e]">
        Worth it
      </div>
    </div>
  );
}

/* ─────────────────────────── chrome ─────────────────────────── */

function TopBar({ activeIndex }: { activeIndex: number }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between p-5 font-mono text-[0.64rem] uppercase tracking-[0.32em] text-white/76 md:p-8">
      <div>
        <div className="text-white">BCN // 02.10.26</div>
        <div className="mt-2 hidden text-white/38 md:block">Mission Dossier</div>
      </div>
      <div className="text-right text-white/52">
        <span className="text-white">{CHAPTERS[activeIndex].n}</span> / 03
      </div>
    </header>
  );
}

function RouteRail({ activeIndex, progress }: { activeIndex: number; progress: number }) {
  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-6 z-40 mx-auto hidden w-[min(58rem,86vw)] md:block">
      <div className="mb-3 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.24em] text-white/48">
        <span>Barcelona route</span>
        <span>{String(Math.round(progress * 100)).padStart(2, "0")}%</span>
      </div>
      <div className="relative h-px bg-white/16">
        <div
          className="absolute inset-y-0 left-0 bg-[#fff0bd]"
          style={{ width: `${progress * 100}%`, boxShadow: "0 0 18px rgba(255,196,95,.5)" }}
        />
        {CHAPTERS.map((ch, i) => {
          const left = `${(i / (CHAPTERS.length - 1)) * 100}%`;
          const on = i === activeIndex;
          return (
            <div
              key={ch.n}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left }}
            >
              <div
                className="size-2.5 border border-[#fff0bd]"
                style={{
                  background: on ? "#ffd16f" : "#050510",
                  boxShadow: on ? "0 0 18px #ffd16f" : "none",
                }}
              />
              <div className="mt-3 -translate-x-1/2 whitespace-nowrap font-mono text-[0.55rem] uppercase tracking-[0.16em] text-white/46">
                {ch.place}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

function V1() {
  const reduced = useReduced();
  const [progress, progressRef] = useScrollProgress();
  const mouseRef = useMouseRef(reduced);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeIndex = getActiveIndex(progress);

  return (
    <main
      className="v1-root relative bg-[#050510] text-[#fff7e6]"
      style={{ minHeight: `${SCROLL_VH}vh` }}
    >
      <style>{`
        .v1-root { scrollbar-color: rgba(255,255,255,.22) transparent; }
        @keyframes v1-in {
          from { opacity: 0; transform: translate3d(0, 30px, 0); filter: blur(10px); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
        }
        @keyframes v1-card {
          from { opacity: 0; transform: translate3d(0, 26px, 0) scale(.98); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes v1-glow {
          0%,100% { opacity: .5; transform: scale(1); }
          50%     { opacity: .85; transform: scale(1.06); }
        }
      `}</style>

      {/* cinematic city backdrop */}
      <CityFilm progress={progress} />

      {/* hero atmosphere glow — only meaningful in act 0, sits behind the 3D core */}
      <div
        className="pointer-events-none fixed inset-0 z-[5] flex items-center justify-center"
        style={{ opacity: 1 - band(progress, 0.0, 0.18) }}
        aria-hidden
      >
        <div
          className={
            "h-[60vmin] w-[60vmin] rounded-full blur-[80px] " +
            (reduced ? "" : "animate-[v1-glow_6s_ease-in-out_infinite]")
          }
          style={{ background: "radial-gradient(circle, rgba(255,79,147,0.5), transparent 70%)" }}
        />
      </div>

      {/* WebGL centerpiece (transparent, floats over the city) */}
      <div className="fixed inset-0 z-10" aria-hidden>
        {mounted && <CoreCanvas progressRef={progressRef} mouseRef={mouseRef} reduced={reduced} />}
      </div>

      {/* film grain + vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-20 mix-blend-overlay"
        style={{
          opacity: 0.05,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
        aria-hidden
      />

      {/* active stage */}
      <div key={activeIndex}>
        {activeIndex === 0 && <HeroStage reduced={reduced} />}
        {activeIndex === 1 && <CrewStage reduced={reduced} />}
        {activeIndex === 2 && <MapStage reduced={reduced} />}
        {activeIndex === 3 && <NightStage active reduced={reduced} />}
      </div>

      <Closer progress={progress} />
      <TopBar activeIndex={activeIndex} />
      <RouteRail activeIndex={activeIndex} progress={progress} />
    </main>
  );
}
