// src/app/admin/nominados/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Premio = { id: string; nombre: string };
type UsuarioDet = { id: string; username: string };
type Nominado = {
  id: string;
  premio: string; // id
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  usuarios_vinculados_detalles?: UsuarioDet[];
};

type CreateNominadoPayload = {
  premio: string;
  nombre: string;
  descripcion: string | null;
  usuarios_vinculados?: string[];
};

type UpdateNominadoPayload = Partial<Pick<Nominado, "premio" | "nombre" | "descripcion">> & {
  usuarios_vinculados?: string[];
};

export default function AdminNominadosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [nominados, setNominados] = useState<Nominado[]>([]);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Formulario creación
  const [nuevoPremio, setNuevoPremio] = useState<string>("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [usuariosCsv, setUsuariosCsv] = useState(""); // ids separados por coma

  const fetchAll = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const [nomRes, premRes] = await Promise.all([
        axiosInstance.get<Nominado[]>("api/admin/nominados/"),
        axiosInstance.get<Premio[]>("api/admin/premios/"),
      ]);
      setNominados(nomRes.data);
      setPremios(premRes.data.map((p: Premio) => ({ id: p.id, nombre: p.nombre })));
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar nominados/premios");
    } finally {
      setFetching(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchAll();
    }
  }, [loading, isAuthenticated, fetchAll]);

  const crearNominado = async () => {
    if (!nuevoPremio || !nuevoNombre) return;
    try {
      setSavingId("new");
      const payload: CreateNominadoPayload = {
        premio: nuevoPremio,
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion || null,
      };
      const ids = usuariosCsv.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length) payload.usuarios_vinculados = ids;
      const res = await axiosInstance.post<Nominado>("api/admin/nominados/", payload);
      setNominados(prev => [res.data, ...prev]);
      setNuevoPremio("");
      setNuevoNombre("");
      setNuevaDescripcion("");
      setUsuariosCsv("");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const actualizarNominado = async (n: Nominado, updates: UpdateNominadoPayload) => {
    try {
      setSavingId(n.id);
      const res = await axiosInstance.patch<Nominado>(`api/admin/nominados/${n.id}/`, updates);
      setNominados(prev => prev.map(x => x.id === n.id ? res.data : x));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const eliminarNominado = async (id: string) => {
    if (!confirm("¿Eliminar este nominado?")) return;
    try {
      setSavingId(id);
      await axiosInstance.delete(`api/admin/nominados/${id}/`);
      setNominados(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return nominados;
    return nominados.filter(n => n.nombre.toLowerCase().includes(term));
  }, [nominados, q]);

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!isAuthenticated) return <p className="p-6">Debes iniciar sesión para ver esta página.</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Administración de Nominados</h1>
          <button onClick={fetchAll} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Refrescar</button>
        </div>

        {/* Crear nuevo nominado */}
        <div className="border rounded p-4 mb-6">
          <h2 className="font-semibold mb-3">Crear nuevo nominado</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <select className="border rounded px-3 py-2" value={nuevoPremio} onChange={(e) => setNuevoPremio(e.target.value)}>
              <option value="">Selecciona un premio</option>
              {premios.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input className="border rounded px-3 py-2" placeholder="Nombre del nominado" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
            <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Descripción (opcional)" value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="IDs de usuarios (coma)" value={usuariosCsv} onChange={(e) => setUsuariosCsv(e.target.value)} />
            <div>
              <button disabled={!nuevoPremio || !nuevoNombre || savingId === "new"} onClick={crearNominado} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Crear</button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input className="border rounded px-3 py-2 w-full md:w-1/2" placeholder="Buscar nominados por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {fetching && <p>Cargando nominados...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!fetching && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Premio</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border">Usuarios vinculados</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border text-xs break-all">{n.id}</td>
                    <td className="p-2 border">
                      <select className="border rounded px-2 py-1" value={n.premio} onChange={(e) => setNominados(prev => prev.map(x => x.id === n.id ? { ...x, premio: e.target.value } : x))}>
                        {premios.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 border">
                      <input className="border rounded px-2 py-1 w-full" value={n.nombre} onChange={(e) => setNominados(prev => prev.map(x => x.id === n.id ? { ...x, nombre: e.target.value } : x))} />
                    </td>
                    <td className="p-2 border">
                      <input className="border rounded px-2 py-1 w-full" value={n.descripcion || ""} onChange={(e) => setNominados(prev => prev.map(x => x.id === n.id ? { ...x, descripcion: e.target.value } : x))} />
                    </td>
                    <td className="p-2 border text-sm">
                      {n.usuarios_vinculados_detalles && n.usuarios_vinculados_detalles.length > 0 ? (
                        <div className="space-y-1">
                          {n.usuarios_vinculados_detalles.map(u => (
                            <div key={u.id}>@{u.username}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">Sin usuarios</span>
                      )}
                    </td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button disabled={savingId === n.id} onClick={() => actualizarNominado(n, { premio: n.premio, nombre: n.nombre, descripcion: n.descripcion || null })} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Guardar</button>
                        <button disabled={savingId === n.id} onClick={() => eliminarNominado(n.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">Eliminar</button>
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
