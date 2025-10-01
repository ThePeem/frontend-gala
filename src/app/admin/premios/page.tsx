// src/app/admin/premios/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Script from 'next/script';

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
  vinculos_requeridos?: number;
  ganadores_historicos?: { year: number | string; name: string }[] | null;
};

// Eliminados tipos de Cloudinary: no usamos el widget en esta vista

export default function AdminPremiosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { show } = useToast();
  const [failedImgs, setFailedImgs] = useState<Set<string>>(new Set());
  const [cldReady, setCldReady] = useState(false);

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
      // Sanitizar payload
      const safe: (Partial<Premio> & Record<string, unknown>) = { ...cambios } as Partial<Premio> & Record<string, unknown>;
      if (safe.nombre !== undefined) safe.nombre = String(safe.nombre).trim();
      if (safe.descripcion !== undefined) safe.descripcion = safe.descripcion === null ? null : String(safe.descripcion);
      if (safe.slug !== undefined) {
        const s = (safe.slug ?? '').toString().trim();
        safe.slug = s.length ? s : null; // enviar null en lugar de cadena vacía
      }
      if (safe.ronda_actual !== undefined) {
        let r = Number(safe.ronda_actual);
        if (!Number.isFinite(r)) r = 1;
        r = Math.max(1, Math.min(2, r));
        safe.ronda_actual = r;
      }
      if (safe.vinculos_requeridos !== undefined) {
        let v = Number(safe.vinculos_requeridos);
        if (!Number.isFinite(v)) v = 1;
        v = Math.max(1, Math.min(5, v));
        safe.vinculos_requeridos = v;
      }
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${id}/`, safe);
      setPremios((prev) => prev.map((pr) => (pr.id === id ? res.data : pr)));
      show("success", "Premio actualizado");
    } catch (err: unknown) {
      console.error(err);
      // Extraer mensaje del backend si está disponible
      let data: unknown = undefined;
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { data?: unknown } }).response;
        data = resp?.data;
      }
      if (data) {
        const details = typeof data === 'string' ? data : JSON.stringify(data);
        show("error", `Error al actualizar: ${details.substring(0, 300)}`);
      } else {
        show("error", "No se pudo actualizar el premio");
      }
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
      {/* Widget Cloudinary */}
      <Script src="https://widget.cloudinary.com/v2.0/global/all.js" strategy="afterInteractive" onLoad={() => setCldReady(true)} />
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
              headers={["Foto", "Nombre", "Tipo", "Descripción", "Estado", "Vínculos req.", "Ronda", "Histórico (3)", "Imagen (URL)", "Acciones"]}
              loading={fetching}
              emptyMessage={!fetching && filtered.length === 0 ? "Sin premios" : undefined}
              tableClassName="min-w-[1400px] xl:min-w-[1600px]"
            >
              {filtered.map((p) => (
                <tr key={p.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                  {/* Foto */}
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                      <Image
                        src={
                          failedImgs.has(p.id)
                            ? '/images/placeholder-premio.jpg'
                            : (p.image_url || (p.slug ? `/premios/${encodeURIComponent(p.slug)}.jpg` : `/premios/${p.id}.jpg`))
                        }
                        alt={`Imagen de ${p.nombre}`}
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover"
                        unoptimized
                        onError={() => setFailedImgs(prev => new Set(prev).add(p.id))}
                      />
                    </div>
                  </td>
                  {/* Nombre */}
                  <td className="px-4 py-2 border-b border-zinc-800 align-top min-w-[280px]">
                    <textarea
                      rows={2}
                      title={p.nombre}
                      placeholder="Nombre del premio"
                      value={p.nombre}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, nombre: e.target.value } : pr))}
                      className="block w-full rounded-xl border bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:outline-none focus:ring-2 border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/30 whitespace-pre-wrap break-words"
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
                  <td className="px-4 py-2 border-b border-zinc-800 align-top w-[420px]">
                    <textarea
                      rows={4}
                      placeholder="Descripción del premio"
                      value={p.descripcion || ""}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, descripcion: e.target.value } : pr))}
                      className="block w-full rounded-xl border bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:outline-none focus:ring-2 border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/30 whitespace-pre-wrap break-words"
                    />
                  </td>
                  {/* Estado */}
                  <td className="px-4 py-2 border-b border-zinc-800 align-top w-40 min-w-[10rem]">
                    <Select
                      value={p.estado}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: e.target.value as "abierto" | "cerrado" } : pr))}
                      options={[{label:"Cerrado", value:"cerrado"},{label:"Abierto", value:"abierto"}]}
                    />
                  </td>
                  {/* Vínculos requeridos */}
                  <td className="px-4 py-2 border-b border-zinc-800 w-32">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={p.vinculos_requeridos ?? 1}
                      onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, vinculos_requeridos: parseInt(e.target.value || '1', 10) } : pr))}
                    />
                  </td>
                  {/* Ronda */}
                  <td className="px-4 py-2 border-b border-zinc-800 w-28">
                    <Input type="number" min={1} max={2} value={p.ronda_actual} onChange={(e) => setPremios(prev => prev.map(pr => pr.id === p.id ? { ...pr, ronda_actual: parseInt(e.target.value || "1", 10) } : pr))} />
                  </td>
                  {/* Histórico de ganadores (hasta 3) */}
                  <td className="px-4 py-2 border-b border-zinc-800 align-top w-[420px]">
                    {Array.from({ length: 3 }).map((_, i) => {
                      const list = p.ganadores_historicos ?? [];
                      const item = list[i] || { year: '', name: '' };
                      return (
                        <div key={`${p.id}-hist-${i}`} className="flex gap-2 mb-2 items-center">
                          <Input
                            placeholder="Año"
                            value={String(item.year ?? '')}
                            className="w-24 shrink-0"
                            onChange={(e) => setPremios(prev => prev.map(pr => {
                              if (pr.id !== p.id) return pr;
                              const arr = [...(pr.ganadores_historicos ?? [])];
                              const next = { ...(arr[i] || { year: '', name: '' }), year: e.target.value };
                              arr[i] = next;
                              return { ...pr, ganadores_historicos: arr };
                            }))}
                          />
                          <Input
                            className="flex-1 min-w-0"
                            placeholder="Nombre"
                            value={String(item.name ?? '')}
                            onChange={(e) => setPremios(prev => prev.map(pr => {
                              if (pr.id !== p.id) return pr;
                              const arr = [...(pr.ganadores_historicos ?? [])];
                              const next = { ...(arr[i] || { year: '', name: '' }), name: e.target.value };
                              arr[i] = next;
                              return { ...pr, ganadores_historicos: arr };
                            }))}
                          />
                        </div>
                      );
                    })}
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
                        disabled={savingId === p.id || !cldReady}
                        onClick={async () => {
                          if (!cldReady) { show('error', 'Cloudinary no está listo'); return; }
                          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
                          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
                          if (!cloudName || !uploadPreset) {
                            show('error', 'Configura NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
                            return;
                          }
                          type CloudinaryGlobal = {
                            createUploadWidget: (
                              options: {
                                cloudName: string;
                                uploadPreset: string;
                                sources?: string[];
                                multiple?: boolean;
                                folder?: string;
                                clientAllowedFormats?: string[];
                              },
                              callback: (error: unknown, result: { event: string; info?: { secure_url?: string } }) => void
                            ) => { open: () => void };
                          };
                          const cld = (window as unknown as { cloudinary?: CloudinaryGlobal }).cloudinary;
                          if (!cld) { show('error', 'No se pudo inicializar Cloudinary'); return; }
                          const widget = cld.createUploadWidget(
                            {
                              cloudName,
                              uploadPreset,
                              sources: ['local', 'url', 'camera'],
                              multiple: false,
                              folder: 'premios',
                              clientAllowedFormats: ['jpg','jpeg','png','webp'],
                            },
                            async (_error, result) => {
                              if (result?.event === 'success' && result.info?.secure_url) {
                                const url = result.info.secure_url;
                                try {
                                  setSavingId(p.id);
                                  const res = await axiosInstance.patch<Premio>(`api/admin/premios/${p.id}/`, { image_url: url });
                                  setPremios(prev => prev.map(pr => pr.id === p.id ? res.data : pr));
                                  show('success', 'Imagen actualizada');
                                } catch (err) {
                                  console.error(err);
                                  show('error', 'No se pudo guardar la imagen');
                                } finally {
                                  setSavingId(null);
                                }
                              }
                            }
                          );
                          widget.open();
                        }}
                      >
                        Subir imagen
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={savingId === p.id}
                        onClick={() => actualizarPremio(p.id, {
                          nombre: p.nombre,
                          tipo: (p.tipo || "directo"),
                          descripcion: p.descripcion,
                          estado: p.estado,
                          vinculos_requeridos: p.vinculos_requeridos ?? 1,
                          ronda_actual: p.ronda_actual,
                          slug: p.slug || undefined,
                          image_url: p.image_url || undefined,
                          ganadores_historicos: (p.ganadores_historicos || [])
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
