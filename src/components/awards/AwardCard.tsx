// src/components/awards/AwardCard.tsx
"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";

export type Winner = { year: number | string; name: string };

export type PremioLike = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string; // admite: 'abierto' | 'cerrado' | 'resultados' | 'votacion_1' | 'votacion_2' | 'preparacion' | 'finalizado'
  ronda_actual: number;
  tipo?: "directo" | "indirecto";
  vinculos_requeridos?: number;
  slug?: string | null;
  image_url?: string | null;
  ganadores_historicos?: Winner[] | null;
  ganadores?: Array<{ id: string }>;
};

export interface AwardCardProps {
  premio: PremioLike;
  primaryText: string; // texto del botón principal
  onPrimaryClick: (p: PremioLike) => void;
  primaryDisabled?: boolean;
  showHistoricSecondary?: boolean;
  onSecondaryClick?: (p: PremioLike) => void;
  showEstadoPanel?: boolean; // permite ocultar el panel interior de estado/ganador
}

function getEstadoTextFlexible(estado: string, ronda: number) {
  const open = estado === "abierto" || estado === "votacion_1" || estado === "votacion_2";
  if (estado === "resultados") return "Resultados publicados";
  if (open) return `Ronda ${ronda} - Votación abierta`;
  return "Votación cerrada";
}

function getEstadoStylesFlexible(estado: string) {
  const open = estado === "abierto" || estado === "votacion_1" || estado === "votacion_2";
  switch (true) {
    case estado === "resultados":
      return "bg-amber-900/30 text-amber-300 border-amber-700/40";
    case open:
      return "bg-green-900/30 text-green-300 border-green-700/40";
    default:
      return "bg-zinc-800/70 text-zinc-300 border-zinc-700";
  }
}

export default function AwardCard({ premio, primaryText, onPrimaryClick, primaryDisabled, showHistoricSecondary, onSecondaryClick, showEstadoPanel = true }: AwardCardProps) {
  const isResultados = premio.estado === 'resultados';
  const open = premio.estado === 'abierto' || premio.estado === 'votacion_1' || premio.estado === 'votacion_2';
  const estadoText = getEstadoTextFlexible(premio.estado, premio.ronda_actual);
  const estadoStyles = getEstadoStylesFlexible(premio.estado);
  const winners = Array.isArray(premio.ganadores_historicos) ? premio.ganadores_historicos.slice(0, 3) : [];
  const hasHistoricWinners = Array.isArray(premio.ganadores_historicos) && premio.ganadores_historicos.length > 0;

  const imgSrc = premio.image_url || (premio.slug ? `/premios/${encodeURIComponent(premio.slug)}.jpg` : '/images/placeholder-premio.jpg');

  return (
    <article className={`relative overflow-hidden rounded-2xl border ${
      isResultados ? 'border-amber-800/50 bg-gradient-to-br from-amber-900/10 to-amber-900/5' : open ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-800/70 bg-zinc-900/30'
    }`}>
      <div className="absolute top-4 right-4 z-10">
        <div className={`text-xs px-3 py-1 rounded-full border ${estadoStyles} backdrop-blur-sm`}>
          {estadoText}
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 md:p-8 items-center md:grid-cols-12">
        <div className="md:col-span-5">
          <div className={`relative aspect-[4/5] rounded-xl border overflow-hidden ${
            isResultados ? 'border-amber-800/50 bg-gradient-to-br from-amber-900/10 to-amber-900/5' : 'border-zinc-800 bg-zinc-950/40'
          }`}>
            <Image 
              src={imgSrc} 
              alt={`Imagen de ${premio.nombre}`} 
              fill 
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 480px" 
              className={`object-contain p-6 transition-transform duration-300 ${isResultados ? 'hover:scale-105' : ''}`} 
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

          {showEstadoPanel && (
          <div className={`rounded-xl border mb-4 ${
            isResultados ? 'border-amber-800/50 bg-amber-900/10' : 'border-zinc-800 bg-zinc-900/40'
          }`}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{
              borderColor: isResultados ? 'rgba(251, 191, 36, 0.15)' : 'rgba(39, 39, 42, 0.8)'
            }}>
              <h3 className="headline text-base m-0">
                {isResultados ? 'Ganador actual' : 'Estado'}
              </h3>
              {!isResultados && (
                <div className="text-xs text-zinc-500">
                  Ronda {premio.ronda_actual}
                </div>
              )}
            </div>
            <div className="px-4 py-3">
              {isResultados ? (
                <ul className="divide-y" style={{ borderColor: 'rgba(251, 191, 36, 0.15)' }}>
                  {winners.length === 0 ? (
                    <li className="py-2 text-zinc-500">No hay ganador aún</li>
                  ) : (
                    winners.map((w, i) => (
                      <li key={`${premio.id}-${w.year}-${i}`} className={`flex items-center justify-between py-2 ${i === 0 ? 'bg-amber-900/20' : ''}`}>
                        <span className={i === 0 ? 'text-amber-300 font-medium' : 'text-zinc-300'}>{w.name}</span>
                        <span className={i === 0 ? 'text-amber-400 font-medium' : 'text-zinc-500 tabular-nums'}>{w.year}</span>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <div className="text-zinc-300 text-sm">{getEstadoTextFlexible(premio.estado, premio.ronda_actual)}</div>
              )}
            </div>
          </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => onPrimaryClick(premio)}
              variant={isResultados ? 'primary' : 'secondary'}
              className={`${isResultados ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
              disabled={primaryDisabled}
            >
              {primaryText}
            </Button>

            {isResultados && showHistoricSecondary && hasHistoricWinners && onSecondaryClick && (
              <Button 
                variant="ghost"
                onClick={() => onSecondaryClick(premio)}
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
