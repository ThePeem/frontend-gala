// src/app/resultados/page.tsx
"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getResultadosPublicos, PremioPublico } from "@/lib/api";

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<PremioPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getResultadosPublicos();
        setResultados(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los resultados públicos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Resultados</h1>
        {loading && <p>Cargando resultados...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <ul className="space-y-4">
            {resultados.map((premio) => (
              <li key={premio.id} className="border rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold">{premio.nombre}</h2>
                {premio.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">{premio.descripcion}</p>
                )}
                <div className="mt-3 text-sm">
                  {premio.ganador_oro && (
                    <div><strong>Ganador Oro:</strong> {premio.ganador_oro.nombre}</div>
                  )}
                  {premio.ganador_plata && (
                    <div><strong>Ganador Plata:</strong> {premio.ganador_plata.nombre}</div>
                  )}
                  {premio.ganador_bronce && (
                    <div><strong>Ganador Bronce:</strong> {premio.ganador_bronce.nombre}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
