// src/app/participantes/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

/* ========== NIEVE (canvas) ========== */
function SnowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Flake = { x: number; y: number; r: number; s: number; w: number; a: number; o: number };

    let W = 0,
      H = 0;
    let flakes: Flake[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const MAX_FLAKES_BASE = 140;
    let raf = 0;

    const spawn = (): Flake => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      r: 1.2 + Math.random() * 2.8,
      s: 0.4 + Math.random() * 0.9,
      w: 0.6 + Math.random() * 1.2,
      a: Math.random() * Math.PI * 2,
      o: 0.35 + Math.random() * 0.45,
    });

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(MAX_FLAKES_BASE * (W / 1200 + 0.3));
      if (flakes.length < target) {
        for (let i = flakes.length; i < target; i++) flakes.push(spawn());
      } else {
        flakes = flakes.slice(0, target);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.y += f.s;
        f.a += 0.01 + f.w * 0.015;
        f.x += Math.sin(f.a) * f.w;

        if (f.y - f.r > H) Object.assign(f, spawn(), { y: -10 });
        if (f.x < -10) f.x = W + 10;
        else if (f.x > W + 10) f.x = -10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.o})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255,255,255,0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

/* === Participantes (hasta 18) === */
const NAMES = [
  "Jose","Garcia","Felipe","Catedra","Richi","Alex","Chema","Dani",
  "Alejandra","Sandra","Rocio","Joaquin","Silvia","Gema","Ana","Tomas"
] as const; // Añadir 2 más si se suben los assets (18 total)

type Person = (typeof NAMES)[number];

const people: { name: Person; src: string }[] = (NAMES as readonly string[]).map((n) => ({
  name: n as Person,
  src: `/images/arcane/${n}Arcane.png`,
}));

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ===== Tipos de usuario (desde backend) ===== */
type Usuario = {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  foto_perfil?: string | null;
  foto_url?: string | null;
  descripcion?: string | null;
  verificado?: boolean;
  participante_tag?: string | null; // Campo futuro (backend)
};

export default function ParticipantesPage() {
  const [selected, setSelected] = useState<Person>(people[0]?.name || "Alex");
  const sel = useMemo(() => people.find((p) => p.name === selected) ?? people[0], [selected]);

  const leftCols = chunk(people.slice(0, 8), 4);
  const rightCols = chunk(people.slice(8, 16), 4);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<Usuario[]>("/api/participantes/");
        setUsuarios(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los participantes");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const getPerfil = (name: Person): Usuario | null => {
    // 1) Si backend expone participante_tag, usarlo
    const byTag = usuarios.find(u => (u.participante_tag || "").toLowerCase() === name.toLowerCase());
    if (byTag) return byTag;
    // 2) Fallback heurístico: nombre o username similares
    const byName = usuarios.find(u => (u.first_name || '').toLowerCase() === name.toLowerCase());
    if (byName) return byName;
    const byUser = usuarios.find(u => u.username.toLowerCase() === name.toLowerCase());
    return byUser || null;
  };

  const perfil = getPerfil(selected);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col relative">
      <SnowCanvas />

      <div className="relative z-10">
        <Header />

        {/* Estados de carga/errores mínimos para ESLint */}
        {loading && <div className="px-4 pt-4 text-zinc-400 text-sm">Cargando datos…</div>}
        {error && <div className="px-4 pt-2 text-red-400 text-sm">{error}</div>}

        {/* ====== BLOQUE PRINCIPAL ====== */}
        <section className="border-b border-zinc-800/60">
          <div
            className="hidden lg:grid w-full px-4 py-10 gap-6"
            style={{ gridTemplateColumns: "160px 160px minmax(0,1fr) 160px 160px", alignItems: "center" }}
          >
            {leftCols.map((col, idx) => (
              <RailColumn key={"left-" + idx} people={col} selected={selected} onSelect={setSelected} side="left" />
            ))}

            <div className="relative h-[68vh] min-h-[520px] max-h-[800px]">
              <div className="pointer-events-none absolute inset-0 mx-auto my-auto h-[70%] w-[70%] rounded-full bg-amber-500/12 blur-[100px]" />
              <Image key={sel.name} src={sel.src} alt={sel.name} fill priority className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)]" sizes="(min-width:1024px) 900px, 100vw" unoptimized />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 items-center">
                <span className="headline inline-block rounded-xl bg-amber-400 px-6 py-2 text-zinc-900 shadow-[0_6px_18px_rgba(245,158,11,.35)]">{sel.name}</span>
                <Button variant="secondary" onClick={() => setOpen(true)}>Ver perfil</Button>
              </div>
            </div>

            {rightCols.map((col, idx) => (
              <RailColumn key={"right-" + idx} people={col} selected={selected} onSelect={setSelected} side="right" />
            ))}
          </div>

          {/* Móvil / Tablet */}
          <div className="lg:hidden w-full px-4 py-8">
            <h1 className="headline text-2xl mb-4">Participantes</h1>

            <div className="relative h-[46vh] min-h-[320px] mb-6">
              <div className="pointer-events-none absolute inset-0 mx-auto my-auto h-[70%] w-[80%] rounded-full bg-amber-500/12 blur-[90px]" />
              <Image key={sel.name} src={sel.src} alt={sel.name} fill className="object-contain drop-shadow-[0_22px_48px_rgba(0,0,0,0.6)]" sizes="100vw" unoptimized />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center">
                <span className="headline inline-block rounded-xl bg-amber-400 px-4 py-1.5 text-zinc-900 shadow-[0_6px_18px_rgba(245,158,11,.35)]">{sel.name}</span>
                <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Ver perfil</Button>
              </div>
            </div>

            <MiniGrid people={people} selected={selected} onSelect={setSelected} />
          </div>
        </section>

        <Footer />
      </div>

      {/* Modal Perfil */}
      <Modal open={open} onClose={() => setOpen(false)} title={`Perfil de ${sel.name}`}>
        <div className="grid gap-4 md:grid-cols-[140px_1fr]">
          <div className="relative h-[120px] w-[120px] rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
            {perfil?.foto_perfil || perfil?.foto_url ? (
              <Image src={perfil.foto_perfil || perfil.foto_url || ''} alt={perfil?.username || sel.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-500">Sin foto</div>
            )}
          </div>
          <div>
            <div className="text-zinc-100 text-lg font-semibold">{perfil ? `${perfil.first_name || ''} ${perfil.last_name || ''}`.trim() || `@${perfil.username}` : sel.name}</div>
            <div className="text-zinc-400 text-sm">{perfil ? `@${perfil.username}` : `Perfil pendiente de completar`}</div>
            <div className="mt-3 text-zinc-200 whitespace-pre-wrap">
              {perfil?.descripcion || `Este participante aún no ha completado su perfil. ¡Metete a tu perfil y completalo ya pesao!`}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ===== COMPONENTES ===== */

function RailColumn({
  people,
  selected,
  onSelect,
  side,
}: {
  people: { name: Person; src: string }[];
  selected: Person;
  onSelect: (p: Person) => void;
  side: "left" | "right";
}) {
  return (
    <div className={`flex flex-col ${side === "left" ? "items-end" : "items-start"} gap-4`}>
      {people.map((p) => {
        const active = p.name === selected;
        return (
          <button
            key={p.name}
            onMouseEnter={() => onSelect(p.name)}
            onFocus={() => onSelect(p.name)}
            className={`group relative h-28 w-28 overflow-hidden rounded-xl border transition ${active ? "border-amber-400/80" : "border-zinc-800 hover:border-zinc-700"}`}
            aria-label={p.name}
          >
            <Image src={p.src} alt={p.name} fill className="object-contain p-1.5" sizes="112px" unoptimized />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/35 opacity-0 group-hover:opacity-100 transition" />
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-md px-2 py-0.5 text-xs font-semibold ${active ? "bg-amber-400 text-zinc-900" : "bg-black/50 backdrop-blur text-zinc-200"}`}>
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MiniGrid({
  people,
  selected,
  onSelect,
}: {
  people: { name: Person; src: string }[];
  selected: Person;
  onSelect: (p: Person) => void;
}) {
  return (
    <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
      {people.map((p) => {
        const active = p.name === selected;
        return (
          <button
            key={p.name}
            onMouseEnter={() => onSelect(p.name)}
            onFocus={() => onSelect(p.name)}
            onClick={() => onSelect(p.name)}
            className={`group relative overflow-hidden rounded-2xl border bg-zinc-900/40 transition ${active ? "border-amber-400/70" : "border-zinc-800 hover:border-zinc-700"} h-32`}
          >
            <Image src={p.src} alt={p.name} fill className="object-contain p-2" sizes="160px" unoptimized />
            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-amber-400 text-zinc-900" : "bg-black/50 backdrop-blur text-zinc-200"}`}>
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
