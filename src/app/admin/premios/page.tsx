// src/app/admin/premios/page.tsx
"use client";

import { useEffect, useState } from "react";
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

export default function AdminPremiosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Formulario creación
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<"abierto" | "cerrado">("cerrado");
  const [nuevaRonda, setNuevaRonda] = useState(1);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchPremios();
    }
  }, [loading, isAuthenticated]);

  const fetchPremios = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await axiosInstance.get<Premio[]>("api/admin/premios/");
      setPremios(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la lista de premios");
    } finally {
      setFetching(false);
    }
  };

  const crearPremio = async () => {
    try {
      setSavingId("new");
      const payload = {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion || null,
        estado: nuevoEstado,
        ronda_actual: nuevaRonda,
      };
      const res = await axiosInstance.post<Premio>("api/admin/premios/", payload);
      setPremios((p) => [res.data, ...p]);
      setNuevoNombre("");
      setNuevaDescripcion("");
      setNuevoEstado("cerrado");
      setNuevaRonda(1);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el premio");
    } finally {
      setSavingId(null);
    }
  };

  const actualizarPremio = async (id: string, cambios: Partial<Premio>) => {
    try {
      setSavingId(id);
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${id}/`, cambios);
      setPremios((prev) => prev.map((pr) => (pr.id === id ? res.data : pr)));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el premio");
    } finally {
      setSavingId(null);
    }
  };

  const eliminarPremio = async (id: string) => {
    if (!confirm("¿Eliminar este premio?")) return;
    try {
      setSavingId(id);
      await axiosInstance.delete(`api/admin/premios/${id}/`);
      setPremios((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el premio");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!isAuthenticated) return <p className="p-6">Debes iniciar sesión para ver esta página.</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Administración de Premios</h1>
          <button onClick={fetchPremios} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Refrescar</button>
        </div>

        {/* Crear nuevo premio */}
        <div className="border rounded p-4 mb-6">
          <h2 className="font-semibold mb-3">Crear nuevo premio</h2>
          <div className="grid md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
            <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Descripción (opcional)" value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} />
            <select className="border rounded px-3 py-2" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as any)}>
              <option value="cerrado">Cerrado</option>
              <option value="abierto">Abierto</option>
            </select>
            <input type="number" min={1} max={2} className="border rounded px-3 py-2" placeholder="Ronda" value={nuevaRonda} onChange={(e) => setNuevaRonda(parseInt(e.target.value || "1", 10))} />
            <div>
              <button disabled={!nuevoNombre || savingId === "new"} onClick={crearPremio} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Crear</button>
            </div>
          </div>
        </div>

        {fetching && <p>Cargando premios...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!fetching && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Ronda</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {premios.map((p) => (
                  <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border text-xs break-all">{p.id}</td>
                    <td className="p-2 border">
                      <input className="border rounded px-2 py-1 w-full" value={p.nombre} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, nombre: e.target.value } : pr))} />
                    </td>
                    <td className="p-2 border">
                      <input className="border rounded px-2 py-1 w-full" value={p.descripcion || ""} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, descripcion: e.target.value } : pr))} />
                    </td>
                    <td className="p-2 border">
                      <select className="border rounded px-2 py-1" value={p.estado} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: e.target.value as any } : pr))}>
                        <option value="cerrado">Cerrado</option>
                        <option value="abierto">Abierto</option>
                      </select>
                    </td>
                    <td className="p-2 border w-24">
                      <input type="number" min={1} max={2} className="border rounded px-2 py-1 w-full" value={p.ronda_actual} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, ronda_actual: parseInt(e.target.value || "1", 10) } : pr))} />
                    </td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button disabled={savingId === p.id} onClick={() => actualizarPremio(p.id, { nombre: p.nombre, descripcion: p.descripcion, estado: p.estado, ronda_actual: p.ronda_actual })} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Guardar</button>
                        <button disabled={savingId === p.id} onClick={() => eliminarPremio(p.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
