// src/app/resultados/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useResultsPhase } from "@/hooks/useResultsPhase";
import Countdown from "@/components/results/Countdown";
import ResultCard from "@/components/results/ResultCard";
import WinnerDisplay from "@/components/results/WinnerDisplay";

type Nominee = { id: number; nombre: string; imagen?: string };
type PremioMock = {
  id: number;
  titulo: string;
  descripcion?: string;
  imagen?: string;
  nominados: Nominee[];
  ganador: Nominee;
};

const premiosMock: PremioMock[] = [
  {
    id: 1,
    titulo: "Premio al Personaje del Año",
    descripcion: "Reconoce al participante más influyente del año",
    imagen: "/trophy-1.png",
    nominados: [
      { id: 1, nombre: "Nominado 1", imagen: "/n1.png" },
      { id: 2, nombre: "Nominado 2", imagen: "/n2.png" },
      { id: 3, nombre: "Nominado 3", imagen: "/n3.png" },
      { id: 4, nombre: "Nominado 4", imagen: "/n4.png" },
    ],
    ganador: { id: 3, nombre: "Nominado 3", imagen: "/n3.png" },
  },
  {
    id: 2,
    titulo: "Momento Épico del Año",
    descripcion: "El instante más recordado",
    imagen: "/trophy-2.png",
    nominados: [
      { id: 1, nombre: "Momento 1", imagen: "/m1.png" },
      { id: 2, nombre: "Momento 2", imagen: "/m2.png" },
      { id: 3, nombre: "Momento 3", imagen: "/m3.png" },
      { id: 4, nombre: "Momento 4", imagen: "/m4.png" },
    ],
    ganador: { id: 1, nombre: "Momento 1", imagen: "/m1.png" },
  },
];

export default function ResultadosPage() {
  const fechaGala = new Date("2025-12-31T23:59:59"); // provisional
  const { phase } = useResultsPhase(fechaGala);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      <Header />
      <main className="flex-grow p-6 max-w-6xl mx-auto">
        <h1 className="headline text-[clamp(1.4rem,2.6vw,1.8rem)] mb-6">RESULTADOS</h1>

        {phase === 'PRE_GALA' && (
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px]">
            <div className="rounded-2xl bg-zinc-950/70 p-10 text-center">
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Los resultados estarán disponibles el día de la gala</h2>
              <p className="text-sm text-zinc-400 mb-6">Acompáñanos en la ceremonia para descubrir a los ganadores</p>
              <Countdown target={fechaGala} />
            </div>
          </div>
        )}

        {phase === 'LIVE' && (
          <div className="grid gap-8 grid-cols-1">
            {premiosMock.map((p) => (
              <ResultCard
                key={p.id}
                titulo={p.titulo}
                descripcion={p.descripcion}
                imagen={p.imagen}
                nominados={p.nominados}
                ganador={p.ganador}
              />
            ))}
          </div>
        )}

        {phase === 'POST_GALA' && (
          <div className="grid gap-8 md:grid-cols-2">
            {premiosMock.map((p) => (
              <div key={p.id} className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-yellow-200">{p.titulo}</h3>
                  {p.descripcion && <p className="text-sm text-yellow-300/70">{p.descripcion}</p>}
                </div>
                <WinnerDisplay nombre={p.ganador.nombre} imagen={p.ganador.imagen} />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
