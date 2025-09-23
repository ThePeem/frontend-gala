// src/app/admin/sugerencias/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/utils/AuthContext";
import { useToast } from "@/components/ui/Toast";

 type Sugerencia = {
  id: string;
  tipo: "premio" | "nominado" | "otro";
  contenido: string;
  usuario_username: string;
  fecha_sugerencia: string;
  revisada: boolean;
  notas_admin: string | null;
};

export default function AdminSugerenciasPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const { show } = useToast();
  const [items, setItems] = useState<Sugerencia[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sugerencia | null>(null);

  const load = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await axiosInstance.get<Sugerencia[]>("api/admin/sugerencias/");
      setItems(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las sugerencias");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      load();
    }
  }, [loading, isAuthenticated]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(i =>
      i.usuario_username.toLowerCase().includes(t) ||
      i.tipo.toLowerCase().includes(t) ||
      i.contenido.toLowerCase().includes(t) ||
      (i.notas_admin || "").toLowerCase().includes(t)
    );
  }, [items, q]);

  const save = async (id: string, patch: Partial<Sugerencia>) => {
    try {
      setSavingId(id);
      const res = await axiosInstance.patch<Sugerencia>(`api/admin/sugerencias/${id}/`, patch);
      setItems(prev => prev.map(i => i.id === id ? res.data : i));
      show("success", "Sugerencia actualizada");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo actualizar");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar sugerencia?")) return;
    try {
      setSavingId(id);
      await axiosInstance.delete(`api/admin/sugerencias/${id}/`);
      setItems(prev => prev.filter(i => i.id !== id));
      show("success", "Sugerencia eliminada");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo eliminar");
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
          <h1 className="text-2xl font-bold text-zinc-100">Administración de Sugerencias</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load}>Refrescar</Button>
            <Button variant="ghost" onClick={() => window.location.assign('/admin')}>Admin Hub</Button>
          </div>
        </div>

        <Card>
          <div className="relative p-4">
            <div className="mb-4 w-full md:w-1/2">
              <Input placeholder="Buscar por usuario, tipo, contenido o nota" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2 mb-3">{error}</div>}

            <Table
              headers={["Fecha", "Usuario", "Tipo", "Contenido", "Revisada", "Notas", "Acciones"]}
              loading={fetching}
              emptyMessage={!fetching && filtered.length === 0 ? "Sin sugerencias" : undefined}
              tableClassName="min-w-[1200px]"
            >
              {filtered.map(s => (
                <tr key={s.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                  <td className="px-4 py-2 border-b border-zinc-800 text-zinc-400 whitespace-nowrap">{new Date(s.fecha_sugerencia).toLocaleString()}</td>
                  <td className="px-4 py-2 border-b border-zinc-800 text-zinc-100">@{s.usuario_username}</td>
                  <td className="px-4 py-2 border-b border-zinc-800 text-zinc-100 capitalize">{s.tipo}</td>
                  <td className="px-4 py-2 border-b border-zinc-800 text-zinc-200 max-w-[440px]">
                    <button className="text-amber-400 hover:underline" onClick={() => setSelected(s)}>Ver</button>
                    <div className="text-zinc-400 line-clamp-2">{s.contenido}</div>
                  </td>
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <label className="inline-flex items-center gap-2 text-zinc-200">
                      <input type="checkbox" className="accent-amber-500" checked={s.revisada} onChange={(e) => save(s.id, { revisada: e.target.checked })} />
                      {s.revisada ? 'Sí' : 'No'}
                    </label>
                  </td>
                  <td className="px-4 py-2 border-b border-zinc-800 w-[320px]">
                    <textarea
                      rows={2}
                      placeholder="Notas del admin"
                      value={s.notas_admin || ""}
                      onChange={(e) => setItems(prev => prev.map(x => x.id === s.id ? { ...x, notas_admin: e.target.value } : x))}
                      onBlur={(e) => save(s.id, { notas_admin: e.target.value })}
                      className="block w-full rounded-xl border bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:outline-none focus:ring-2 border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/30"
                    />
                  </td>
                  <td className="px-4 py-2 border-b border-zinc-800">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" disabled={savingId === s.id} onClick={() => save(s.id, { revisada: !s.revisada })}>
                        Marcar {s.revisada ? 'no revisada' : 'revisada'}
                      </Button>
                      <Button size="sm" variant="danger" disabled={savingId === s.id} onClick={() => remove(s.id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      </main>

      <Footer />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de sugerencia">
        {selected && (
          <div className="space-y-3">
            <div className="text-sm text-zinc-400">{new Date(selected.fecha_sugerencia).toLocaleString()} · @{selected.usuario_username} · {selected.tipo}</div>
            <pre className="whitespace-pre-wrap text-zinc-100 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">{selected.contenido}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
