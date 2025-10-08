// src/app/premios/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import SnowCanvas from "@/components/ui/SnowCanvas";

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
  ganadores?: Array<{ id: string }>;
  nominados_visible?: Nominado[];
};

// Función para obtener el texto del estado
const getEstadoText = (estado: string, ronda: number) => {
  if (estado === 'resultados') return 'Resultados publicados';
  if (estado === 'cerrado') return 'Votación cerrada';
  return `Ronda ${ronda} - Votación abierta`;
};

// Función para obtener los estilos del estado
const getEstadoStyles = (estado: string) => {
  switch (estado) {
    case 'abierto':
      return 'bg-green-900/30 text-green-300 border-green-700/40';
    case 'cerrado':
      return 'bg-zinc-800/70 text-zinc-300 border-zinc-700';
    case 'resultados':
      return 'bg-amber-900/30 text-amber-300 border-amber-700/40';
    default:
      return 'bg-zinc-800/70 text-zinc-300 border-zinc-700';
  }
};

// Función para obtener el botón según el estado
const getButtonText = (estado: string, ronda: number) => {
  if (estado === 'resultados') return 'Ver ganador';
  if (ronda === 2) return 'Ver finalistas';
  return 'Ver nominados';
};

function AwardCard({ premio, onOpen }: { premio: Premio; onOpen: (p: Premio) => void }) {
  const imgSrc = premio.image_url || (premio.slug ? `/premios/${encodeURIComponent(premio.slug)}.jpg` : '/images/placeholder-premio.jpg');
  const winners = Array.isArray(premio.ganadores_historicos) ? premio.ganadores_historicos.slice(0, 3) : [];
  const estadoText = getEstadoText(premio.estado, premio.ronda_actual);
  const estadoStyles = getEstadoStyles(premio.estado);
  const buttonText = getButtonText(premio.estado, premio.ronda_actual);
  const isResultados = premio.estado === 'resultados';
  const isCerrado = premio.estado === 'cerrado';
  const hasHistoricWinners = Array.isArray(premio.ganadores_historicos) && premio.ganadores_historicos.length > 0;

  return (
    <article className={`relative overflow-hidden rounded-2xl border ${
      isResultados 
        ? 'border-amber-800/50 bg-gradient-to-br from-amber-900/10 to-amber-900/5' 
        : isCerrado 
          ? 'border-zinc-800/70 bg-zinc-900/30' 
          : 'border-zinc-800 bg-zinc-900/40'
    }`}>
      {/* Badge de estado en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`text-xs px-3 py-1 rounded-full border ${estadoStyles} backdrop-blur-sm`}>
          {estadoText}
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 md:p-8 items-center md:grid-cols-12">
        {/* Imagen */}
        <div className="md:col-span-5">
          <div className={`relative aspect-[4/5] rounded-xl border overflow-hidden ${
            isResultados 
              ? 'border-amber-800/50 bg-gradient-to-br from-amber-900/10 to-amber-900/5' 
              : 'border-zinc-800 bg-zinc-950/40'
          }`}>
            <Image 
              src={imgSrc} 
              alt={`Imagen de ${premio.nombre}`} 
              fill 
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 480px" 
              className={`object-contain p-6 transition-transform duration-300 ${
                isResultados ? 'hover:scale-105' : ''
              }`} 
              unoptimized 
            />
            {isResultados && (
              <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_200px_at_50%_-50%,rgba(245,158,11,.15),transparent_70%)]" />
            )}
            {!isResultados && (
              <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_200px_at_50%_-50%,rgba(245,158,11,.1),transparent_70%)]" />
            )}
          </div>
        </div>

        {/* Texto */}
        <div className="md:col-span-7">
          <h2 className="headline text-[clamp(1.4rem,3.4vw,2.2rem)] mb-2">
            {isResultados && (
              <span className="inline-block mr-2 text-amber-400">🏆</span>
            )}
            {premio.nombre}
          </h2>
          
          {premio.descripcion && (
            <p className="text-zinc-400 mb-4">{premio.descripcion}</p>
          )}

          <div className={`rounded-xl border mb-4 ${
            isResultados 
              ? 'border-amber-800/50 bg-amber-900/10' 
              : 'border-zinc-800 bg-zinc-900/40'
          }`}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{
              borderColor: isResultados ? 'rgba(251, 191, 36, 0.15)' : 'rgba(39, 39, 42, 0.8)'
            }}>
              <h3 className="headline text-base m-0">
                {isResultados ? 'Ganador actual' : 'Últimos ganadores'}
              </h3>
              {!isResultados && (
                <div className="text-xs text-zinc-500">
                  Ronda {premio.ronda_actual}
                </div>
              )}
            </div>
            <ul className="divide-y" style={{
              borderColor: isResultados ? 'rgba(251, 191, 36, 0.15)' : 'rgba(39, 39, 42, 0.8)'
            }}>
              {winners.length === 0 ? (
                <li className="px-4 py-3 text-zinc-500">
                  {isResultados ? 'No hay ganador aún' : 'Premio nuevo'}
                </li>
              ) : (
                winners.map((w, i) => (
                  <li 
                    key={`${premio.id}-${w.year}-${i}`} 
                    className={`flex items-center justify-between px-4 py-3 ${
                      i === 0 && isResultados ? 'bg-amber-900/20' : ''
                    }`}
                  >
                    <span className={i === 0 && isResultados ? 'text-amber-300 font-medium' : 'text-zinc-300'}>
                      {w.name}
                    </span>
                    <span className={i === 0 && isResultados ? 'text-amber-400 font-medium' : 'text-zinc-500 tabular-nums'}>
                      {w.year}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => onOpen(premio)}
              variant={isResultados ? 'primary' : 'secondary'}
              className={`${isResultados ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
            >
              {buttonText}
            </Button>
            
            {isResultados && hasHistoricWinners && (
              <Button 
                variant="ghost"
                onClick={() => onOpen(premio)}
                className="border-amber-600/50 text-amber-400 hover:bg-amber-900/30"
              >
                Ver histórico
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function NominadosModal({ premio, onClose }: { premio: Premio | null; onClose: () => void }) {
  if (!premio) return null;
  
  const tipo = premio.tipo || 'directo';
  const vr = premio.vinculos_requeridos ?? 1;
  
  // Mover las variables que se usan en useMemo dentro del hook
  const { lista, ganadores, hayGanadores, esRonda2, esResultados } = useMemo(() => {
    const lista = Array.isArray(premio.nominados_visible) ? premio.nominados_visible : [];
    const ganadores = Array.isArray(premio.ganadores) ? premio.ganadores : [];
    return {
      lista,
      ganadores,
      hayGanadores: ganadores.length > 0,
      esRonda2: premio.ronda_actual === 2,
      esResultados: premio.estado === 'resultados'
    };
  }, [premio.nominados_visible, premio.ganadores, premio.ronda_actual, premio.estado]);

  // Determinar qué mostrar según el estado y la ronda
  const mostrarLista = useMemo(() => {
    // Si hay ganadores definidos, mostrar solo los ganadores
    if (esResultados && hayGanadores) {
      return lista.filter(n => ganadores.some(g => 'id' in g && g.id === n.id));
    } 
    // En ronda 2, mostrar solo los 4 primeros (más votados de ronda 1)
    else if (esRonda2) {
      return lista.slice(0, 4);
    }
    // En otros casos, mostrar todos los nominados
    return lista;
  }, [lista, esResultados, esRonda2, hayGanadores, ganadores]);

  // Estilo del contenedor basado en la fase
  const containerClass = `w-full max-w-[800px] mx-auto p-2 sm:p-4 ${
    premio.estado === 'resultados' ? 'bg-gradient-to-br from-amber-900/20 to-transparent p-6 rounded-xl' : ''
  }`;

  // Título del modal según el estado
  const getModalTitle = () => {
    if (premio.estado === 'resultados') return `Ganador • ${premio.nombre}`;
    if (premio.ronda_actual === 2) return `Finalistas • ${premio.nombre}`;
    return `Nominados • ${premio.nombre}`;
  };

  return (
    <Modal 
      open={!!premio} 
      onClose={onClose} 
      title={getModalTitle()}
    >
      {mostrarLista.length === 0 ? (
        <div className="text-zinc-400 text-center py-8">No hay nominados disponibles.</div>
      ) : premio.estado === 'resultados' ? (
        // Vista de ganador
        <div className="text-center py-4">
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-amber-400 shadow-lg">
            {mostrarLista[0]?.imagen ? (
              <Image 
                src={mostrarLista[0].imagen} 
                alt={mostrarLista[0].nombre} 
                fill 
                className="object-cover"
                unoptimized 
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-amber-900/50 text-5xl">🏆</div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mb-2">{mostrarLista[0].nombre}</h3>
          {mostrarLista[0].descripcion && (
            <p className="text-zinc-300 max-w-md mx-auto">{mostrarLista[0].descripcion}</p>
          )}
          <div className="mt-6 pt-6 border-t border-amber-900/50">
            <h4 className="text-lg font-semibold text-amber-300 mb-3">¡Felicidades!</h4>
            <p className="text-zinc-400 text-sm">Ganador de la edición {new Date().getFullYear()}</p>
          </div>
        </div>
      ) : tipo === 'indirecto' ? (
        <ul className="space-y-2">
          {mostrarLista.map((n, index) => (
            <li 
              key={n.id} 
              className={`border rounded-lg p-3 ${
                premio.ronda_actual === 2 
                  ? 'bg-gradient-to-r from-amber-900/30 to-amber-900/10 border-amber-800/50' 
                  : 'bg-zinc-950/50 border-zinc-800'
              }`}
            >
              {premio.ronda_actual === 2 && (
                <div className="text-amber-400 font-bold text-sm mb-1">Finalista #{index + 1}</div>
              )}
              <div className="text-zinc-100 font-medium">{n.nombre}</div>
              {n.descripcion && <div className="text-sm text-zinc-400 mt-1">{n.descripcion}</div>}
            </li>
          ))}
        </ul>
      ) : vr === 2 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {mostrarLista.map((n, index) => (
            <div 
              key={n.id} 
              className={`relative border rounded-xl p-3 ${
                premio.ronda_actual === 2 
                  ? 'bg-gradient-to-br from-amber-900/20 to-amber-900/5 border-amber-800/50' 
                  : 'bg-zinc-950/50 border-zinc-800'
              }`}
            >
              {premio.ronda_actual === 2 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-zinc-900 font-bold flex items-center justify-center text-sm z-10">
                  {index + 1}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(n.usuarios_vinculados_detalles || []).slice(0,2).map((u, idx) => (
                  <div key={`${n.id}-${u.id}-${idx}`} className="flex items-center gap-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800">
                      {u.foto_url || u.foto_perfil ? (
                        <Image 
                          src={u.foto_url || u.foto_perfil || ''} 
                          alt={u.username} 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
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
        <div className={containerClass}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
            {mostrarLista.map((n, index) => {
              const u = (n.usuarios_vinculados_detalles || [])[0];
              const img = u?.foto_url || u?.foto_perfil || '';
              const esFinalista = premio.ronda_actual === 2;
              
              return (
                <div 
                  key={n.id} 
                  className={`relative overflow-hidden rounded-lg transition-all ${
                    esFinalista ? 'transform hover:scale-105' : ''
                  }`}
                >
                  {esFinalista && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-zinc-900 font-bold flex items-center justify-center text-sm z-10">
                      {index + 1}
                    </div>
                  )}
                  <div className={`h-full border rounded-lg flex flex-col items-center p-2 sm:p-3 ${
                    esFinalista 
                      ? 'bg-gradient-to-br from-amber-900/20 to-amber-900/5 border-amber-700/50 hover:border-amber-500/70' 
                      : 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800/70'
                  }`}>
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-full overflow-hidden bg-zinc-800 shadow-inner">
                      {img ? (
                        <Image 
                          src={img} 
                          alt={u?.username || n.nombre} 
                          fill 
                          className="object-cover transition-transform" 
                          sizes="(max-width: 640px) 4rem, 5rem"
                          unoptimized 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-500 text-2xl">—</div>
                      )}
                    </div>
                    <div 
                      className="mt-2 text-center text-zinc-300 text-xs sm:text-sm font-medium leading-tight line-clamp-2 w-full px-1 break-words" 
                      title={n.nombre}
                    >
                      {n.nombre}
                    </div>
                    {esFinalista && (
                      <div className="mt-1 text-amber-400 text-xs">Finalista</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
      <SnowCanvas />
      <Header />

      <main className="flex-1 relative z-10">
        <section className="relative overflow-hidden border-b border-zinc-800" style={{ background:
          "radial-gradient(1100px 420px at 50% -8%, rgba(245,158,11,.16), transparent 60%), radial-gradient(800px 260px at 80% -4%, rgba(251,191,36,.12), transparent 60%)" }}>
          <div className="max-w-6xl mx-auto text-center px-4 py-12 md:py-20">
            <h1 className="headline text-[clamp(1.8rem,6vw,3rem)]">Premios PIORN 2025</h1>
            <p className="text-zinc-400">Descubre las categorías y consulta los últimos ganadores.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <a href="/soporte" className="headline inline-block px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold hover:from-yellow-300 hover:to-amber-500">
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
