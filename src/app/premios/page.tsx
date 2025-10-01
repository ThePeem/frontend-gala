// src/app/premios/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

type Winner = { year: number | string; name: string };

type UsuarioMini = {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  foto_perfil?: string | null;
  foto_url?: string | null;
};

type Nominado = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  usuarios_vinculados_detalles?: UsuarioMini[];
};

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: "abierto" | "cerrado" | "resultados";
  ronda_actual: number;
  tipo?: "directo" | "indirecto";
  vinculos_requeridos?: number;
  slug?: string | null;
  image_url?: string | null;
  ganadores_historicos?: Winner[] | null;
  nominados_visible?: Nominado[];
};

function AwardCard({ premio, onOpen }: { premio: Premio; onOpen: (p: Premio) => void }) {
  const imgSrc = premio.image_url || (premio.slug ? `/premios/${encodeURIComponent(premio.slug)}.jpg` : '/images/placeholder-premio.jpg');
  const winners = (premio.ganadores_historicos || []).slice(0, 3);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="grid gap-6 p-4 sm:p-6 md:p-8 items-center md:grid-cols-12">
        {/* Imagen */}
        <div className="md:col-span-5">
          <div className="relative aspect-[4/5] bg-zinc-950/40 rounded-xl border border-zinc-800 overflow-hidden">
            <Image src={imgSrc} alt={`Imagen de ${premio.nombre}`} fill sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 480px" className="object-contain p-6" unoptimized />
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_200px_at_50%_-50%,rgba(245,158,11,.18),transparent_60%)]" />
          </div>
        </div>

        {/* Texto */}
        <div className="md:col-span-7">
          <h2 className="headline text-[clamp(1.4rem,3.4vw,2.2rem)] mb-2">{premio.nombre}</h2>
          {premio.descripcion && <p className="text-zinc-400 mb-4">{premio.descripcion}</p>}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mb-4">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="headline text-base m-0">Últimos ganadores</h3>
              <span className={`text-xs px-2 py-1 rounded-full border ${premio.estado === 'abierto' ? 'bg-green-900/30 text-green-300 border-green-700/40' : premio.estado === 'cerrado' ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-amber-900/30 text-amber-300 border-amber-700/40'}`}>{premio.estado}</span>
            </div>
            <ul className="divide-y divide-zinc-800">
              {winners.length === 0 ? (
                <li className="px-4 py-3 text-zinc-500">Premio nuevo</li>
              ) : (
                winners.map((w, i) => (
                  <li key={`${premio.id}-${w.year}-${i}`} className="flex items-center justify-between px-4 py-3">
                    <span className="text-zinc-300">{w.name}</span>
                    <span className="text-zinc-500 tabular-nums">{w.year}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <Button onClick={() => onOpen(premio)}>Ver nominados</Button>
        </div>
      </div>
    </article>
  );
}

function NominadosModal({ premio, onClose }: { premio: Premio | null; onClose: () => void }) {
  if (!premio) return null;
  const tipo = premio.tipo || 'directo';
  const vr = premio.vinculos_requeridos ?? 1;
  const lista = premio.nominados_visible || [];

  return (
    <Modal open={!!premio} onClose={onClose} title={`Nominados • ${premio.nombre}`}>
      {lista.length === 0 ? (
        <div className="text-zinc-400">Sin nominados disponibles.</div>
      ) : tipo === 'indirecto' ? (
        <ul className="space-y-2">
          {lista.map(n => (
            <li key={n.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
              <div className="text-zinc-100 font-medium">{n.nombre}</div>
              {n.descripcion && <div className="text-sm text-zinc-400">{n.descripcion}</div>}
            </li>
          ))}
        </ul>
      ) : vr === 2 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map(n => (
            <div key={n.id} className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/50">
              <div className="grid grid-cols-2 gap-2">
                {(n.usuarios_vinculados_detalles || []).slice(0,2).map((u, idx) => (
                  <div key={`${n.id}-${u.id}-${idx}`} className="flex items-center gap-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800">
                      {u.foto_url || u.foto_perfil ? (
                        <Image src={u.foto_url || u.foto_perfil || ''} alt={u.username} fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <div className="text-zinc-200 text-sm truncate">{u.first_name || u.username}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 place-items-center">
          {lista.map(n => {
            const u = (n.usuarios_vinculados_detalles || [])[0];
            const img = u?.foto_url || u?.foto_perfil || '';
            return (
              <div key={n.id} className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950/50 text-center flex flex-col items-center">
                <div className="mx-auto relative h-36 w-36 rounded-full overflow-hidden bg-zinc-800 shadow-inner">
                  {img ? (
                  <Image src={img} alt={u?.username || n.nombre} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-500 text-2xl">—</div>
                  )}
                </div>
                <div className="mt-2 text-zinc-300 text-xs truncate" title={n.nombre}>{n.nombre}</div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function PremiosPage() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<Premio | null>(null);

  useEffect(() => {
    const fetchPremios = async () => {
      try {
        const data = await apiFetch<Premio[]>("/api/premios-todos/");
        setPremios(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los premios");
      } finally {
        setLoading(false);
      }
    };
    fetchPremios();
  }, []);

  const ordered = useMemo(() => premios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)), [premios]);

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      <Header />

      <main className="flex-1 relative z-10">
        <section className="relative overflow-hidden border-b border-zinc-800" style={{ background:
          "radial-gradient(1100px 420px at 50% -8%, rgba(245,158,11,.16), transparent 60%), radial-gradient(800px 260px at 80% -4%, rgba(251,191,36,.12), transparent 60%)" }}>
          <div className="max-w-6xl mx-auto text-center px-4 py-12 md:py-20">
            <h1 className="headline text-[clamp(1.8rem,6vw,3rem)]">Premios PIORN 2025</h1>
            <p className="text-zinc-400">Descubre las categorías y consulta los últimos ganadores.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <a href="/sugerencias" className="headline inline-block px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold hover:from-yellow-300 hover:to-amber-500">
                Se aceptan sugerencias de premios nuevos
              </a>
            </div>
            <div className="mt-2 text-zinc-500 text-sm">No es la lista definitiva: se aceptan nuevas ideas.</div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="max-w-6xl mx-auto px-4 space-y-6 md:space-y-8">
            {loading && <div className="text-zinc-400">Cargando premios…</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && ordered.map((premio) => (
              <AwardCard key={premio.id} premio={premio} onOpen={setOpened} />
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <NominadosModal premio={opened} onClose={() => setOpened(null)} />
    </div>
  );
}
