"use client";

export default function WinnerDisplay({ nombre, imagen }: { nombre: string; imagen?: string }) {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,215,0,0.15),transparent_60%)] pointer-events-none" />
      <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-5 text-center backdrop-blur-sm">
        <div className="aspect-square rounded-xl bg-yellow-400/10 border border-yellow-500/40 flex items-center justify-center">
          {imagen ? (
            <img src={imagen} alt={nombre} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-6xl text-yellow-300 font-extrabold">★</span>
          )}
        </div>
        <div className="mt-4 text-yellow-200 text-xl font-bold tracking-wide">{nombre}</div>
        <div className="mt-1 text-yellow-400 text-xs uppercase">Ganador</div>
      </div>
    </div>
  );
}
