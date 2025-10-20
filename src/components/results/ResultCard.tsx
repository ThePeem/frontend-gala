"use client";
import { useState } from 'react';
import Image from 'next/image';
import NomineeReveal, { Nominee } from './NomineeReveal';
import WinnerDisplay from './WinnerDisplay';

export default function ResultCard({
  titulo,
  descripcion,
  imagen,
  nominados,
  ganador,
}: {
  titulo: string;
  descripcion?: string;
  imagen?: string;
  nominados: Nominee[];
  ganador: Nominee;
}) {
  const [showNoms, setShowNoms] = useState(false);
  const [showWinner, setShowWinner] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-xl">
            {imagen ? <Image src={imagen} alt={titulo} width={56} height={56} className="h-full w-full object-cover rounded-lg" /> : '🏆'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{titulo}</h3>
            {descripcion && <p className="text-sm text-zinc-400">{descripcion}</p>}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {!showNoms && !showWinner && (
          <div className="flex gap-2">
            <button onClick={() => setShowNoms(true)} className="px-4 py-2 rounded bg-amber-500 text-zinc-900 font-semibold hover:bg-amber-400">Revelar nominados</button>
            <button onClick={() => { setShowNoms(true); setShowWinner(true); }} className="px-4 py-2 rounded bg-yellow-500/20 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-500/30">Mostrar ganador</button>
          </div>
        )}

        {showNoms && !showWinner && (
          <NomineeReveal nominees={nominados} onFinishedElimination={() => setShowWinner(true)} />
        )}

        {showWinner && (
          <WinnerDisplay nombre={ganador.nombre} imagen={ganador.imagen} />
        )}
      </div>
    </div>
  );
}
