// src/app/votar/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";

interface Premio {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: 'preparacion' | 'votacion_1' | 'votacion_2' | 'finalizado';
  ronda_actual: number;
}

export default function VotarIndexPage() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPremios = async () => {
      try {
        const data = await apiFetch<Premio[]>("/api/premios/");
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Votar</h1>
        <p className="text-gray-700 mb-6">Selecciona un premio para emitir tus votos.</p>

        {loading && <p>Cargando premios...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <ul className="grid gap-4 md:grid-cols-2">
            {premios.map((premio) => (
              <li key={premio.id} className="border rounded-lg p-4 shadow-sm flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{premio.nombre}</h2>
                  {premio.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{premio.descripcion}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-700">Ronda actual: {premio.ronda_actual}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (premio.estado === 'votacion_1' || premio.estado === 'votacion_2') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {(premio.estado === 'votacion_1' || premio.estado === 'votacion_2') ? 'Abierto' : 'Cerrado'}
                  </span>
                  <Link
                    href={`/votar/${premio.id}`}
                    className={`ml-2 px-3 py-2 rounded text-white ${
                      (premio.estado === 'votacion_1' || premio.estado === 'votacion_2') ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    aria-disabled={!(premio.estado === 'votacion_1' || premio.estado === 'votacion_2')}
                  >
                    Ir a votar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && premios.length === 0 && (
          <div className="mt-6 p-4 border rounded bg-yellow-50 text-yellow-800">
            Las votaciones aún no están abiertas. Vuelve más tarde.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
