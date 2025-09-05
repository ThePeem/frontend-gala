// src/app/admin/resultados/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/utils/AuthContext";

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: "abierto" | "cerrado";
  ronda_actual: number;
};

type ResultadoPublico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  ganador_oro: { id: string; nombre: string } | null;
  ganador_plata: { id: string; nombre: string } | null;
  ganador_bronce: { id: string; nombre: string } | null;
  fecha_resultados_publicados: string | null;
};

export default function AdminResultadosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resultadosVista, setResultadosVista] = useState<ResultadoPublico[] | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const fetchPremios = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await axiosInstance.get<Premio[]>("api/admin/premios/");
      setPremios(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los premios");
    } finally {
      setFetching(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchPremios();
    }
  }, [loading, isAuthenticated, fetchPremios]);

  const setEstado = async (p: Premio, estado: "abierto" | "cerrado") => {
    try {
      setSavingId(p.id);
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${p.id}/`, { estado });
      setPremios(prev => prev.map(x => x.id === p.id ? res.data : x));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el estado");
    } finally {
      setSavingId(null);
    }
  };

  const setRonda = async (p: Premio, ronda_actual: number) => {
    try {
      setSavingId(p.id);
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${p.id}/`, { ronda_actual });
      setPremios(prev => prev.map(x => x.id === p.id ? res.data : x));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la ronda");
    } finally {
      setSavingId(null);
    }
  };

  const calcularResultados = async () => {
    try {
      setCalculando(true);
      setError(null);
      const res = await axiosInstance.get<ResultadoPublico[]>("api/resultados/");
      // Nota: GET /api/resultados/ devuelve la estructura de resultados calculados
      setResultadosVista(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron calcular los resultados (revisa permisos o datos)");
    } finally {
      setCalculando(false);
    }
  };

  const publicarResultados = async () => {
    try {
      setPublicando(true);
      setError(null);
      await axiosInstance.post("api/resultados/");
      await calcularResultados();
    } catch (e) {
      console.error(e);
      setError("No se pudieron publicar los resultados");
    } finally {
      setPublicando(false);
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!isAuthenticated) return <p className="p-6">Debes iniciar sesión para ver esta página.</p>;

  return (
    <>
      <Header />
      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gestión de Resultados</h1>
          <button onClick={fetchPremios} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Refrescar</button>
        </div>

        {/* Controles globales */}
        <div className="border rounded p-4 mb-6 flex items-center gap-3">
          <button onClick={calcularResultados} disabled={calculando} className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50">
            {calculando ? "Calculando..." : "Calcular resultados (vista previa)"}
          </button>
          <button onClick={publicarResultados} disabled={publicando} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
            {publicando ? "Publicando..." : "Publicar resultados"}
          </button>
        </div>

        {fetching && <p>Cargando premios...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* Gestión por premio */}
        {!fetching && !error && (
          <div className="grid gap-4 md:grid-cols-2">
            {premios.map((p) => (
              <div key={p.id} className="border rounded p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{p.nombre}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.estado === 'abierto' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.estado}</span>
                </div>
                {p.descripcion && <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button disabled={savingId === p.id} onClick={() => setEstado(p, 'abierto')} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50">Abrir votación</button>
                  <button disabled={savingId === p.id} onClick={() => setEstado(p, 'cerrado')} className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50">Cerrar votación</button>
                  <button disabled={savingId === p.id} onClick={() => setRonda(p, 1)} className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50">Ronda 1</button>
                  <button disabled={savingId === p.id} onClick={() => setRonda(p, 2)} className="px-3 py-1 bg-orange-600 text-white rounded disabled:opacity-50">Ronda 2</button>
                </div>
                <div className="mt-1 text-sm text-gray-700">Ronda actual: {p.ronda_actual}</div>
              </div>
            ))}
          </div>
        )}

        {/* Vista previa de resultados */}
        {resultadosVista && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Vista previa de resultados</h2>
            <ul className="space-y-3">
              {resultadosVista.map(r => (
                <li key={r.id} className="border rounded p-3">
                  <div className="font-medium">{r.nombre}</div>
                  <div className="text-sm mt-1">
                    {r.ganador_oro && (<div><strong>Oro:</strong> {r.ganador_oro.nombre}</div>)}
                    {r.ganador_plata && (<div><strong>Plata:</strong> {r.ganador_plata.nombre}</div>)}
                    {r.ganador_bronce && (<div><strong>Bronce:</strong> {r.ganador_bronce.nombre}</div>)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
