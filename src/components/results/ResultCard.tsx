"use client";
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
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
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 overflow-hidden max-w-3xl mx-auto shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="p-6 md:p-8 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-2xl">
            {imagen ? <Image src={imagen} alt={titulo} width={64} height={64} className="h-full w-full object-cover rounded-lg" /> : '🏆'}
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold text-zinc-100">{titulo}</h3>
            {descripcion && <p className="text-sm md:text-base text-zinc-400">{descripcion}</p>}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {!showNoms && !showWinner && (
          <div className="flex gap-3">
            <button onClick={() => setShowNoms(true)} className="px-4 py-2 rounded bg-amber-500 text-zinc-900 font-semibold hover:bg-amber-400">Revelar nominados</button>
            <button onClick={() => { setShowNoms(true); setShowWinner(true); }} className="px-4 py-2 rounded bg-yellow-500/20 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-500/30">Mostrar ganador</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showNoms && !showWinner && (
            <motion.div
              key="noms"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <NomineeReveal nominees={nominados} onFinishedElimination={() => setShowWinner(true)} />
            </motion.div>
          )}

          {showWinner && (
            <motion.div
              key="winner"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45 }}
            >
              <WinnerDisplay nombre={ganador.nombre} imagen={ganador.imagen} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
