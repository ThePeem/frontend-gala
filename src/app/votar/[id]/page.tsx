// src/app/votar/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

interface VotoData {
  premio: string;
  nominado: string;
  ronda: number;
  orden_ronda2?: number;
}

export default function VotarPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const router = useRouter();
  const params = useParams();
  const premioId = params.id as string;

  const [premio, setPremio] = useState<Premio | null>(null);
  const [loadingPremio, setLoadingPremio] = useState(true);
  const [votosSeleccionados, setVotosSeleccionados] = useState<string[]>([]);
  const [ordenRonda2, setOrdenRonda2] = useState<{ [key: string]: number }>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && premioId) {
      fetchPremio();
    }
  }, [isAuthenticated, premioId, axiosInstance]);

  const fetchPremio = async () => {
    try {
      setLoadingPremio(true);
      const response = await axiosInstance.get(`api/premios/`);
      const premioEncontrado = response.data.find((p: Premio) => p.id === premioId);
      if (premioEncontrado) {
        setPremio(premioEncontrado);
      } else {
        setError("Premio no encontrado");
      }
    } catch (err) {
      console.error("Error fetching premio:", err);
      setError("Error al cargar el premio");
    } finally {
      setLoadingPremio(false);
    }
  };

  const handleNominadoClick = (nominadoId: string) => {
    if (premio?.ronda_actual === 1) {
      setVotosSeleccionados((prev) =>
        prev.includes(nominadoId)
          ? prev.filter((id) => id !== nominadoId)
          : prev.length < 5
          ? [...prev, nominadoId]
          : prev
      );
    } else if (premio?.ronda_actual === 2) {
      setVotosSeleccionados([nominadoId]);
    }
  };

  const handleOrdenRonda2 = (nominadoId: string, orden: number) => {
    setOrdenRonda2((prev) => ({
      ...prev,
      [nominadoId]: orden,
    }));
  };

  const enviarVotos = async () => {
    if (!premio || votosSeleccionados.length === 0) return;

    try {
      setEnviando(true);
      setError(null);

      if (premio.ronda_actual === 1) {
        for (const nominadoId of votosSeleccionados) {
          const votoData: VotoData = { premio: premio.id, nominado: nominadoId, ronda: 1 };
          await axiosInstance.post("api/votar/", votoData);
        }
      } else if (premio.ronda_actual === 2) {
        const votoData: VotoData = {
          premio: premio.id,
          nominado: votosSeleccionados[0],
          ronda: 2,
          orden_ronda2: ordenRonda2[votosSeleccionados[0]],
        };
        await axiosInstance.post("api/votar/", votoData);
      }

      setSuccess("¡Votos enviados correctamente!");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      console.error("Error enviando votos:", err);
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || "Error al enviar los votos");
    } finally {
      setEnviando(false);
    }
  };

  if (loading || loadingPremio) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (error && !premio) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!premio) return null;

  const maxVotos = premio.ronda_actual === 1 ? 5 : 1;
  const votosRestantes = maxVotos - votosSeleccionados.length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Votar: {premio.nombre}</h1>

        {/* Información del Premio */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Información del Premio</h2>
          {premio.descripcion && <p className="text-gray-600 mb-4">{premio.descripcion}</p>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Ronda:</strong> {premio.ronda_actual}
            </div>
            <div>
              <strong>Estado:</strong>
              <span
                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  premio.estado === "abierto"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {premio.estado === "abierto" ? "Abierto" : "Cerrado"}
              </span>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-800 mb-2">Instrucciones de Votación</h3>
          {premio.ronda_actual === 1 ? (
            <p className="text-blue-700">
              <strong>Ronda 1:</strong> Selecciona hasta 5 nominados.
            </p>
          ) : (
            <p className="text-blue-700">
              <strong>Ronda 2:</strong> Selecciona 1 nominado y asigna su posición (Oro, Plata, Bronce).
            </p>
          )}
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Contador */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              Votos seleccionados: <strong>{votosSeleccionados.length}</strong> de {maxVotos}
            </span>
            {votosRestantes > 0 && (
              <span className="text-blue-600 font-medium">
                Te quedan {votosRestantes} voto{votosRestantes !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Nominados */}
        <div className="grid gap-4 md:grid-cols-2">
          {premio.nominados.map((nominado) => {
            const estaSeleccionado = votosSeleccionados.includes(nominado.id);
            const orden = ordenRonda2[nominado.id];

            return (
              <div
                key={nominado.id}
                className={`bg-white rounded-lg shadow-md border-2 transition-all cursor-pointer ${
                  estaSeleccionado ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleNominadoClick(nominado.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{nominado.nombre}</h3>
                    {estaSeleccionado && <span className="text-blue-600 font-medium">✓ Seleccionado</span>}
                  </div>

                  {nominado.descripcion && (
                    <p className="text-gray-600 text-sm mb-3">{nominado.descripcion}</p>
                  )}

                  {premio.ronda_actual === 2 && estaSeleccionado && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Posición:</label>
                      <select
                        value={orden || ""}
                        onChange={(e) => handleOrdenRonda2(nominado.id, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Selecciona posición</option>
                        <option value="1">1 - Oro</option>
                        <option value="2">2 - Plata</option>
                        <option value="3">3 - Bronce</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón */}
        <div className="mt-8 text-center">
          <button
            onClick={enviarVotos}
            disabled={
              enviando ||
              votosSeleccionados.length === 0 ||
              (premio.ronda_actual === 2 && !ordenRonda2[votosSeleccionados[0]])
            }
            className={`px-8 py-3 rounded-md text-lg font-medium transition-colors ${
              enviando ||
              votosSeleccionados.length === 0 ||
              (premio.ronda_actual === 2 && !ordenRonda2[votosSeleccionados[0]])
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {enviando ? "Enviando..." : "Enviar Votos"}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
