// src/app/admin/premios/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/utils/AuthContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: "abierto" | "cerrado";
  ronda_actual: number;
  slug?: string | null;
  image_url?: string | null;
  tipo?: "directo" | "indirecto";
};

// Eliminados tipos de Cloudinary: no usamos el widget en esta vista

export default function AdminPremiosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { show } = useToast();

  // Formulario creación
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<"abierto" | "cerrado">("cerrado");
  const [nuevaRonda, setNuevaRonda] = useState(1);
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // const [cldReady, setCldReady] = useState(false); // no usado

  const fetchPremios = useCallback(async () => {
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
  }, [axiosInstance]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchPremios();
    }
  }, [loading, isAuthenticated, fetchPremios]);

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
      show("success", "Premio creado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo crear el premio");
    } finally {
      setSavingId(null);
    }
  };

  const actualizarPremio = async (id: string, cambios: Partial<Premio>) => {
    try {
      setSavingId(id);
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${id}/`, cambios);
      setPremios((prev) => prev.map((pr) => (pr.id === id ? res.data : pr)));
      show("success", "Premio actualizado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo actualizar el premio");
    } finally {
      setSavingId(null);
    }
  };

  const eliminarPremio = async (id: string) => {
    try {
      setSavingId(id);
      await axiosInstance.delete(`api/admin/premios/${id}/`);
      setPremios((prev) => prev.filter((p) => p.id !== id));
      show("success", "Premio eliminado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo eliminar el premio");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return premios;
    return premios.filter((p) =>
      p.nombre.toLowerCase().includes(term) ||
      (p.descripcion || "").toLowerCase().includes(term) ||
      p.estado.toLowerCase().includes(term)
    );
  }, [premios, q]);

  // Eliminado openUpload (no usado). Si se desea reintroducir la subida vía widget, llamar a esta función desde un botón por fila.

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!isAuthenticated) return <p className="p-6">Debes iniciar sesión para ver esta página.</p>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Script de Cloudinary eliminado: no se usa el widget en esta tabla */}
      <Header />
      <main className="flex-grow p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Administración de Premios</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => window.location.assign('/admin')}>Admin Hub</Button>
            <Button variant="secondary" onClick={fetchPremios}>Refrescar</Button>
          </div>
        </div>

        {/* Crear nuevo premio */}
        <Card className="mb-6">
          <div className="relative p-4">
            <h2 className="font-semibold text-zinc-100 mb-3">Crear nuevo premio</h2>
            <div className="grid md:grid-cols-4 gap-3">
              <Input placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
              <Input placeholder="Descripción (opcional)" value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} className="md:col-span-2" />
              <Select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as "abierto" | "cerrado")} options={[{label:"Cerrado", value:"cerrado"},{label:"Abierto", value:"abierto"}]} />
              <Input type="number" min={1} max={2} placeholder="Ronda" value={nuevaRonda} onChange={(e) => setNuevaRonda(parseInt(e.target.value || "1", 10))} />
              <div>
                <Button onClick={crearPremio} disabled={!nuevoNombre || savingId === "new"}>Crear</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="relative p-4">
            <div className="mb-4">
              <div className="w-full md:w-1/2">
                <Input id="search-premios" placeholder="Buscar por nombre, descripción o estado" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2 mb-3">{error}</div>}


            <Table
              headers={["Foto", "Slug", "Nombre", "Tipo", "Descripción", "Estado", "Ronda", "Imagen (URL)", "Acciones"]}
              loading={fetching}
              emptyMessage={!fetching && filtered.length === 0 ? "Sin premios" : undefined}
            >
              {filtered.map((p) => (
                <tr key={p.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                  {/* Foto */}
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                      <Image
                        src={p.image_url || (p.slug ? `/premios/${p.slug}.jpg` : `/premios/${p.id}.jpg`)}
                        alt={`Imagen de ${p.nombre}`}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover"
                        unoptimized
                      />
                    </div>
                  </td>
                  {/* Slug */}
                  <td className="px-4 py-2 border-b border-zinc-800 w-48">
                    <Input
                      placeholder="slug-estable"
                      value={p.slug || ""}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, slug: e.target.value } : pr))}
                    />
                  </td>
                  {/* Nombre */}
                  <td className="px-4 py-2 border-b border-zinc-800 max-w-[220px]">
                    <Input
                      title={p.nombre}
                      className="truncate max-w-[220px]"
                      value={p.nombre}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, nombre: e.target.value } : pr))}
                    />
                  </td>
                  {/* Tipo */}
                  <td className="px-4 py-2 border-b border-zinc-800 w-40">
                    <Select
                      value={p.tipo || "directo"}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, tipo: e.target.value as "directo" | "indirecto" } : pr))}
                      options={[{label:"Directo", value:"directo"}, {label:"Indirecto", value:"indirecto"}]}
                    />
                  </td>
                  {/* Descripción */}
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <Input value={p.descripcion || ""} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, descripcion: e.target.value } : pr))} />
                  </td>
                  {/* Estado */}
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <Select value={p.estado} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: e.target.value as "abierto" | "cerrado" } : pr))} options={[{label:"Cerrado", value:"cerrado"},{label:"Abierto", value:"abierto"}]} />
                  </td>
                  {/* Ronda */}
                  <td className="px-4 py-2 border-b border-zinc-800 w-28">
                    <Input type="number" min={1} max={2} value={p.ronda_actual} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, ronda_actual: parseInt(e.target.value || "1", 10) } : pr))} />
                  </td>
                  {/* Imagen URL */}
                  <td className="px-4 py-2 border-b border-zinc-800 w-[260px]">
                    <Input
                      placeholder="https://... (Cloudinary/S3)"
                      value={p.image_url || ""}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, image_url: e.target.value } : pr))}
                    />
                  </td>
                  {/* Acciones */}
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={savingId === p.id}
                        onClick={() => actualizarPremio(p.id, {
                          nombre: p.nombre,
                          tipo: (p.tipo || "directo"),
                          descripcion: p.descripcion,
                          estado: p.estado,
                          ronda_actual: p.ronda_actual,
                          slug: p.slug || undefined,
                          image_url: p.image_url || undefined,
                        })}
                      >
                        Guardar
                      </Button>
                      <Button variant="danger" size="sm" disabled={savingId === p.id} onClick={() => setConfirmId(p.id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      </main>
      <Footer />

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Confirmar eliminación">
        <p>¿Seguro que deseas eliminar este premio? Esta acción no se puede deshacer.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { if (confirmId) eliminarPremio(confirmId); setConfirmId(null); }}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
