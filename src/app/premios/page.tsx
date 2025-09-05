// src/app/premios/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";

interface Nominado {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
}

interface Premio {
  id: string;
  nombre: string;
  descripcion: string | null;
  ronda_actual: number;
  estado: string;
  nominados: Nominado[];
}

export default function PremiosPage() {
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
        <h1 className="text-2xl font-bold mb-4">Premios</h1>
        {loading && <p>Cargando premios...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2">
            {premios.map((premio) => (
              <div key={premio.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{premio.nombre}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      premio.estado === "abierto" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {premio.estado === "abierto" ? "Abierto" : "Cerrado"}
                    </span>
                    <Link
                      href={`/votar/${premio.id}`}
                      className={`px-3 py-1 rounded text-white ${
                        premio.estado === "abierto" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                      }`}
                      aria-disabled={premio.estado !== "abierto"}
                    >
                      Ir a votar
                    </Link>
                  </div>
                </div>
                {premio.descripcion && (
                  <p className="mt-1 text-gray-600 text-sm">{premio.descripcion}</p>
                )}

                <h3 className="mt-3 font-medium">Nominados</h3>
                {premio.nominados.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin nominados</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {premio.nominados.map((n) => (
                      <li key={n.id} className="border rounded p-2">
                        <div className="font-medium">{n.nombre}</div>
                        {n.descripcion && (
                          <div className="text-sm text-gray-600">{n.descripcion}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
