// src/app/participantes/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";

interface Participante {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  foto_perfil?: string | null;
  verificado: boolean;
}

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        const data = await apiFetch<Participante[]>("/api/participantes/");
        setParticipantes(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los participantes");
      } finally {
        setLoading(false);
      }
    };
    fetchParticipantes();
  }, []);

  return (
    <>
      <Header />
      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Participantes</h1>
        {loading && <p>Cargando participantes...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-3">
            {participantes.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {p.foto_perfil ? (
                    <Image src={p.foto_perfil} alt={`Foto de ${p.username}`} width={48} height={48} className="w-12 h-12 rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                      {p.first_name?.[0]?.toUpperCase() || p.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-sm text-gray-600">@{p.username}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.verificado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {p.verificado ? "Verificado" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
