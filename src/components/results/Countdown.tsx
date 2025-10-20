"use client";
import { useEffect, useState } from 'react';

export default function Countdown({ target }: { target: Date }) {
  const [remaining, setRemaining] = useState<number>(target.getTime() - Date.now());

  useEffect(() => {
    const i = setInterval(() => setRemaining(target.getTime() - Date.now()), 1000);
    return () => clearInterval(i);
  }, [target]);

  if (remaining <= 0) return null;

  const total = Math.max(0, remaining);
  const days = Math.floor(total / (1000*60*60*24));
  const hours = Math.floor((total % (1000*60*60*24)) / (1000*60*60));
  const minutes = Math.floor((total % (1000*60*60)) / (1000*60));
  const seconds = Math.floor((total % (1000*60)) / 1000);

  return (
    <div className="text-center space-y-2">
      <div className="text-3xl font-bold tracking-wide text-amber-300">{days}d {hours}h {minutes}m {seconds}s</div>
      <div className="text-sm text-zinc-400">Cuenta atrás para la gala</div>
    </div>
  );
}
