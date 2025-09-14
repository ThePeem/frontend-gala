// src/app/admin/nominados/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

type Premio = { id: string; nombre: string };
type UsuarioDet = { id: string; username: string; first_name?: string; last_name?: string; foto_url?: string | null; foto_perfil?: string | null };
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
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { show } = useToast();
  const [managePremioId, setManagePremioId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<UsuarioDet[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const MAX_POR_PREMIO = participants.length || 0; // límite dinámico = usuarios verificados
  const [manageTab, setManageTab] = useState<"directos" | "indirectos">("directos");
  const [newIndirectText, setNewIndirectText] = useState("");
  const [newIndirectLinkedUser, setNewIndirectLinkedUser] = useState<string>("");

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
      setPremios(premRes.data.map((p: Premio) => ({ id: (p as any).id, nombre: (p as any).nombre })));
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
      show("success", "Nominado creado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo crear el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const actualizarNominado = async (n: Nominado, updates: UpdateNominadoPayload) => {
    try {
      setSavingId(n.id);
      const res = await axiosInstance.patch<Nominado>(`api/admin/nominados/${n.id}/`, updates);
      setNominados(prev => prev.map(x => x.id === n.id ? res.data : x));
      show("success", "Nominado actualizado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo actualizar el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const eliminarNominado = async (id: string) => {
    try {
      setSavingId(id);
      await axiosInstance.delete(`api/admin/nominados/${id}/`);
      setNominados(prev => prev.filter(n => n.id !== id));
      show("success", "Nominado eliminado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo eliminar el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return premios;
    return premios.filter(p => p.nombre.toLowerCase().includes(term));
  }, [premios, q]);

  const nominadosPorPremio = useMemo(() => {
    const map: Record<string, Nominado[]> = {};
    for (const n of nominados) {
      (map[n.premio] ||= []).push(n);
    }
    return map;
  }, [nominados]);

  const openManageModal = async (premioId: string) => {
    setManagePremioId(premioId);
    try {
      setParticipantsLoading(true);
      const res = await axiosInstance.get<UsuarioDet[]>("api/participantes/");
      setParticipants(res.data);
      setManageTab("directos");
      // Preseleccionar usuarios ya vinculados a este premio (derivado de nominados existentes)
      const nominadosPremio = nominadosPorPremio[premioId] || [];
      const currentIds = new Set<string>();
      nominadosPremio.forEach(n => n.usuarios_vinculados_detalles?.forEach(u => currentIds.add(u.id)));
      setSelectedUserIds(Array.from(currentIds));
      setNewIndirectText("");
      setNewIndirectLinkedUser("");
    } catch (e) {
      console.error(e);
      show("error", "No se pudieron cargar participantes verificados");
    } finally {
      setParticipantsLoading(false);
    }
  };

  const toggleUserSelect = (uid: string) => {
    setSelectedUserIds(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  };

  const saveManageUsers = async () => {
    if (!managePremioId) return;
    const premioId = managePremioId;
    const nominadosPremio = nominadosPorPremio[premioId] || [];

    // IDs actuales vinculados
    const currentIds = new Set<string>();
    nominadosPremio.forEach(n => n.usuarios_vinculados_detalles?.forEach(u => currentIds.add(u.id)));
    const nextIds = new Set(selectedUserIds);

    // Validación máximo
    if (MAX_POR_PREMIO > 0 && nextIds.size > MAX_POR_PREMIO) {
      show("error", `Máximo ${MAX_POR_PREMIO} nominados por premio`);
      return;
    }

    const toAdd = [...nextIds].filter(id => !currentIds.has(id));
    const toRemove = [...currentIds].filter(id => !nextIds.has(id));

    try {
      setSavingId("bulk");
      // Añadir: crear Nominado por usuario faltante (nombre = username)
      for (const addId of toAdd) {
        const user = participants.find(u => u.id === addId);
        const nombre = user ? (user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : user.username) : "Usuario";
        const payload: CreateNominadoPayload = { premio: premioId, nombre, descripcion: null, usuarios_vinculados: [addId] };
        await axiosInstance.post<Nominado>("api/admin/nominados/", payload);
      }

      // Quitar: si el nominado tiene ese usuario; si solo tiene ese, eliminar; si tiene más, patch sin ese id
      for (const remId of toRemove) {
        const targets = nominadosPremio.filter(n => n.usuarios_vinculados_detalles?.some(u => u.id === remId));
        for (const n of targets) {
          const others = (n.usuarios_vinculados_detalles || []).filter(u => u.id !== remId).map(u => u.id);
          if (others.length === 0) {
            await axiosInstance.delete(`api/admin/nominados/${n.id}/`);
          } else {
            await axiosInstance.patch(`api/admin/nominados/${n.id}/`, { usuarios_vinculados: others });
          }
        }
      }

      // Refresh y cerrar
      await fetchAll();
      setManagePremioId(null);
      show("success", "Nominados actualizados");
    } catch (e) {
      console.error(e);
      show("error", "No se pudieron guardar los cambios");
    } finally {
      setSavingId(null);
    }
  };

  // Helpers para gestión de nominados indirectos dentro del modal
  const currentPremioNominados = (managePremioId ? (nominadosPorPremio[managePremioId] || []) : []);
  const addIndirect = async () => {
    if (!managePremioId || !newIndirectText.trim()) return;
    try {
      setSavingId("indirect_add");
      const payload: CreateNominadoPayload = {
        premio: managePremioId,
        nombre: newIndirectText.trim(),
        descripcion: null,
        usuarios_vinculados: newIndirectLinkedUser ? [newIndirectLinkedUser] : undefined,
      };
      await axiosInstance.post<Nominado>("api/admin/nominados/", payload);
      await fetchAll();
      setNewIndirectText("");
      setNewIndirectLinkedUser("");
      show("success", "Nominado añadido");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo añadir el nominado");
    } finally {
      setSavingId(null);
    }
  };

  const patchIndirect = async (n: Nominado, fields: Partial<Nominado> & { usuarios_vinculados?: string[] }) => {
    try {
      setSavingId(n.id);
      await axiosInstance.patch(`api/admin/nominados/${n.id}/`, fields);
      await fetchAll();
      show("success", "Nominado actualizado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo actualizar el nominado");
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
          <h1 className="text-2xl font-bold text-zinc-100">Administración de Nominados</h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => window.location.assign('/admin')}>Admin Hub</Button>
            <Button variant="secondary" onClick={fetchAll}>Refrescar</Button>
          </div>
        </div>

        <Card>
          <div className="relative p-4">
            <div className="mb-4 w-full md:w-1/2">
              <Input placeholder="Buscar premio por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            {error && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2 mb-3">{error}</div>}

            <Table
              headers={["Premio", "Nominados", "Acciones"]}
              loading={fetching}
              emptyMessage={!fetching && filtered.length === 0 ? "Sin premios" : undefined}
            >
              {filtered.map((p) => {
                const count = (nominadosPorPremio[p.id] || []).length;
                return (
                  <tr key={p.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                    <td className="px-4 py-2 border-b border-zinc-800 text-zinc-100">{p.nombre}</td>
                    <td className="px-4 py-2 border-b border-zinc-800 text-zinc-300">{count} / {MAX_POR_PREMIO}</td>
                    <td className="px-4 py-2 border-b border-zinc-800">
                      <Button size="sm" onClick={() => openManageModal(p.id)}>Gestionar nominados</Button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
        </Card>
      </main>
      <Footer />

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Confirmar eliminación">
        <p>¿Seguro que deseas eliminar este nominado? Esta acción no se puede deshacer.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { if (confirmId) eliminarNominado(confirmId); setConfirmId(null); }}>Eliminar</Button>
        </div>
      </Modal>

      {/* Modal de gestión por premio (Directos: usuarios verificados) */}
      <Modal open={!!managePremioId} onClose={() => setManagePremioId(null)} title={"Gestionar nominados"}>
        {managePremioId && (
          <div>
            <div className="flex gap-2 mb-3">
              <Button variant={manageTab === 'directos' ? 'secondary' : 'ghost'} size="sm" onClick={() => setManageTab('directos')}>Directos</Button>
              <Button variant={manageTab === 'indirectos' ? 'secondary' : 'ghost'} size="sm" onClick={() => setManageTab('indirectos')}>Indirectos</Button>
            </div>

            {manageTab === 'directos' && (
              <div>
                <div className="mb-3 text-sm text-zinc-300">Selecciona usuarios verificados para el premio.</div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-zinc-400">Seleccionados: {selectedUserIds.length} / {MAX_POR_PREMIO}</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds([])}>Quitar todos</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds(participants.slice(0, MAX_POR_PREMIO).map(u => u.id))} disabled={participants.length === 0}>Seleccionar primeros</Button>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto rounded border border-zinc-800">
                  {participantsLoading ? (
                    <div className="p-4 text-zinc-400">Cargando usuarios...</div>
                  ) : participants.length === 0 ? (
                    <div className="p-4 text-zinc-400">No hay usuarios verificados disponibles</div>
                  ) : (
                    <ul className="divide-y divide-zinc-800">
                      {participants.map(u => {
                        const avatar = u.foto_url || u.foto_perfil || "";
                        const name = (u.first_name || u.last_name) ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : `@${u.username}`;
                        const checked = selectedUserIds.includes(u.id);
                        return (
                          <li key={u.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900/40 cursor-pointer" onClick={() => toggleUserSelect(u.id)}>
                            <input type="checkbox" checked={checked} onChange={() => toggleUserSelect(u.id)} className="accent-amber-500" />
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                              {avatar ? (
                                <Image src={avatar} alt={u.username} width={28} height={28} className="w-7 h-7 object-cover" unoptimized />
                              ) : (
                                <span className="text-xs text-zinc-300">{u.username[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-zinc-100 text-sm">{name}</div>
                              <div className="text-zinc-500 text-xs">@{u.username}</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setManagePremioId(null)}>Cancelar</Button>
                  <Button onClick={saveManageUsers} disabled={savingId === "bulk"}>Guardar</Button>
                </div>
              </div>
            )}

            {manageTab === 'indirectos' && (
              <div>
                <div className="mb-3 text-sm text-zinc-300">Añade frases/objetos y vincula opcionalmente a un usuario verificado.</div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
                  <Input className="md:col-span-4" placeholder="Texto del nominado" value={newIndirectText} onChange={(e) => setNewIndirectText(e.target.value)} />
                  <Select className="md:col-span-2" value={newIndirectLinkedUser} onChange={(e) => setNewIndirectLinkedUser(e.target.value)} options={[{label:'Sin usuario', value:''}, ...participants.map(u => ({label: (u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : `@${u.username}`, value: u.id}))]} />
                  <div className="md:col-span-6 flex justify-end">
                    <Button onClick={addIndirect} disabled={!newIndirectText.trim() || savingId === 'indirect_add'}>Añadir</Button>
                  </div>
                </div>

                <div className="max-h-80 overflow-auto rounded border border-zinc-800">
                  <Table headers={["Texto", "Usuario vinculado", "Acciones"]} loading={false}>
                    {currentPremioNominados.map(n => {
                      // Tomamos sólo el primer usuario vinculado para edición rápida en modo indirecto
                      const linked = n.usuarios_vinculados_detalles && n.usuarios_vinculados_detalles[0]?.id || "";
                      return (
                        <tr key={n.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                          <td className="px-4 py-2 border-b border-zinc-800">
                            <Input value={n.nombre} onChange={(e) => setNominados(prev => prev.map(x => x.id === n.id ? { ...x, nombre: e.target.value } : x))} />
                          </td>
                          <td className="px-4 py-2 border-b border-zinc-800 w-60">
                            <Select
                              value={linked}
                              onChange={(e) => setNominados(prev => prev.map(x => x.id === n.id ? { ...x, usuarios_vinculados_detalles: e.target.value ? [{ id: e.target.value, username: participants.find(p => p.id === e.target.value)?.username || '' }] as any : [] } : x))}
                              options={[{label:'Sin usuario', value:''}, ...participants.map(u => ({label: (u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : `@${u.username}`, value: u.id}))]}
                            />
                          </td>
                          <td className="px-4 py-2 border-b border-zinc-800">
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={savingId === n.id}
                                onClick={() => patchIndirect(n, {
                                  nombre: n.nombre,
                                  usuarios_vinculados: (n.usuarios_vinculados_detalles && n.usuarios_vinculados_detalles[0]?.id) ? [n.usuarios_vinculados_detalles[0].id] : []
                                })}
                              >
                                Guardar
                              </Button>
                              <Button variant="danger" size="sm" disabled={savingId === n.id} onClick={() => eliminarNominado(n.id)}>Eliminar</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Table>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setManagePremioId(null)}>Cerrar</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
