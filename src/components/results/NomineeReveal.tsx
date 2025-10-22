"use client";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

export type Nominee = { id: string | number; nombre: string; imagen?: string };

export default function NomineeReveal({ nominees, onFinishedElimination }: {
  nominees: Nominee[];
  onFinishedElimination?: () => void;
}) {
  const [queue, setQueue] = useState<Nominee[]>([]);
  const [left, setLeft] = useState<Nominee[]>(nominees);

  useEffect(() => {
    setQueue(nominees.slice(0, nominees.length - 1)); // dejar 1 para ganador
    setLeft(nominees);
  }, [nominees]);

  const eliminateNext = () => {
    if (queue.length === 0) {
      onFinishedElimination?.();
      return;
    }
    const nxt = queue[0];
    setTimeout(() => {
      setLeft((prev) => prev.filter(n => n.id !== nxt.id));
      setQueue((prev) => prev.slice(1));
      // Si antes de eliminar quedaban 2 (queue.length === 1), tras eliminar queda 1 => mostrar ganador automáticamente
      if (queue.length === 1) {
        onFinishedElimination?.();
      }
    }, 700);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AnimatePresence>
          {left.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, delay: 0.05 * idx }}
              className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="aspect-square rounded-md bg-zinc-800/60 flex items-center justify-center text-zinc-300 text-sm">
                {n.imagen ? (
                  <Image src={n.imagen} alt={n.nombre} width={300} height={300} className="w-full h-full object-cover" />
                ) : n.nombre[0]}
              </div>
              <div className="mt-2 text-center text-sm text-zinc-200 font-medium truncate">{n.nombre}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex justify-center">
        <button onClick={eliminateNext} className="px-4 py-2 rounded bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700">
          Eliminar siguiente
        </button>
      </div>
    </div>
  );
}
