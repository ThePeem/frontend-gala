// src/app/votar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";
import Button from "@/components/ui/Button";
import Countdown from "@/components/results/Countdown";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/utils/AuthContext";
import AwardCard, { PremioLike } from "@/components/awards/AwardCard";

interface Premio {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: 'preparacion' | 'votacion_1' | 'votacion_2' | 'finalizado';
  ronda_actual: number;
  slug?: string | null;
  image_url?: string | null;
  tipo?: 'directo' | 'indirecto';
  nominados_visible?: Array<{ id: string; nombre: string; descripcion: string | null; imagen: string | null }>;
}

interface UsuarioMini { id: string; username: string; first_name?: string; last_name?: string; foto_perfil?: string | null; foto_url?: string | null; }
interface NominadoDetalle { id: string; nombre: string; descripcion: string | null; imagen: string | null; usuarios_vinculados_detalles?: UsuarioMini[] }
interface PremioDetalle extends Premio { nominados: NominadoDetalle[]; max_votos_ronda1?: number; }
interface MisVotoR1Item { nominado: { id: string } }
interface MisVotoR2Item { orden: number; nominado: { id: string } }
interface MisVotoPremio { premio: string; ronda_1?: MisVotoR1Item[]; ronda_2?: MisVotoR2Item[] }
interface PremioListado { id: string; nominados_visible?: Array<{ id: string; nombre: string; descripcion: string | null; imagen: string | null }>; }

export default function VotarIndexPage() {
  const { token } = useAuth() as { token?: string | null };
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<PremioDetalle | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [podium, setPodium] = useState<{ oro?: string; plata?: string; bronce?: string }>({});
  const [sending, setSending] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  // Selecciones guardadas por premio para confirmar todas juntas
  const [seleccionesGlobales, setSeleccionesGlobales] = useState<Record<string, string[]>>({});
  const [seleccionesR2, setSeleccionesR2] = useState<Record<string, { oro?: string; plata?: string; bronce?: string }>>({});

  useEffect(() => {
    const fetchPremios = async () => {
      try {
        const data = await apiFetch<Premio[]>("/api/premios-todos/");
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

  // Cargar identidad del usuario para bloquear auto-voto
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      try {
        const me = await apiFetch<{ id: string }>("/api/mi-perfil/", {}, token);
        if (me?.id) setMeId(me.id);
      } catch {}
    };
    fetchMe();
  }, [token]);

  const ordered = useMemo(() => premios.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)), [premios]);
  const votingStartEnv = process.env.NEXT_PUBLIC_VOTING_START;
  const votingStart = useMemo(() => votingStartEnv ? new Date(votingStartEnv) : null, [votingStartEnv]);
  const hayAbiertos = ordered.some(p => p.estado === 'votacion_1' || p.estado === 'votacion_2');

  const openModal = async (id: string) => {
    setOpenedId(id);
    setDetalle(null);
    setSel([]);
    setPodium({});
    setModalError(null);
    setModalSuccess(null);
    setModalLoading(true);
    try {
      // 1) Construir detalle desde el listado ya cargado (tiene nominados_visible)
      const base = premios.find(p => p.id === id);
      let detalleLocal: PremioDetalle | null = base ? {
        id: base.id,
        nombre: base.nombre,
        descripcion: base.descripcion,
        estado: base.estado,
        ronda_actual: base.ronda_actual,
        slug: base.slug,
        image_url: base.image_url,
        tipo: base.tipo,
        nominados: (base.nominados_visible || []).map(n => ({ id: n.id, nombre: n.nombre, descripcion: n.descripcion, imagen: n.imagen })),
        max_votos_ronda1: 4,
      } : null;

      // 2) Si hay token, intentar enriquecer con el detalle privado (puede incluir campos extra)
      if (token) {
        try {
          const dataPriv = await apiFetch<PremioDetalle>(`/api/premios/${id}/`, {}, token);
          // Si devuelve nominados, usa los del privado. Si no, conserva los visibles del listado
          if (dataPriv) {
            detalleLocal = {
              ...dataPriv,
              nominados: (dataPriv.nominados && dataPriv.nominados.length > 0)
                ? dataPriv.nominados
                : (detalleLocal?.nominados || []),
            };
          }
        } catch {
          // si falla, continuamos con los datos del listado
        }
      }

      // 3) Si aún no tenemos detalleLocal (no estaba en el listado), pedirlo al listado público
      if (!detalleLocal) {
        try {
          const listado = await apiFetch<PremioListado[]>(`/api/premios-todos/`);
          const match = Array.isArray(listado) ? listado.find(p => p.id === id) : undefined;
          if (match) {
            detalleLocal = {
              id: match.id,
              nombre: base?.nombre || 'Premio',
              descripcion: base?.descripcion || null,
              estado: base?.estado || 'preparacion',
              ronda_actual: base?.ronda_actual || 1,
              nominados: (match.nominados_visible || []).map(n => ({ id: n.id, nombre: n.nombre, descripcion: n.descripcion, imagen: n.imagen })),
              max_votos_ronda1: 4,
            } as PremioDetalle;
          }
        } catch {}
      }

      if (!detalleLocal) throw new Error('No se pudo cargar el premio');

      setDetalle(detalleLocal);
      // Precargar votos previos (si hay sesión por token o cookie)
      try {
        const prev = await apiFetch<MisVotoPremio[]>(`/api/mis-votos/`, {}, token || undefined);
        const vp = Array.isArray(prev) ? prev.find((v) => v.premio === id) : null;
        if (vp) {
            if (detalleLocal.ronda_actual === 1 && Array.isArray(vp.ronda_1)) {
              setSel(vp.ronda_1.map((x) => x.nominado?.id).filter(Boolean));
            }
            if (detalleLocal.ronda_actual === 2 && Array.isArray(vp.ronda_2)) {
              const np: { oro?: string; plata?: string; bronce?: string } = {};
              vp.ronda_2.forEach((x) => {
                if (x.orden === 1) np.oro = x.nominado?.id;
                if (x.orden === 2) np.plata = x.nominado?.id;
                if (x.orden === 3) np.bronce = x.nominado?.id;
              });
              setPodium(np);
            }
          }
      } catch {
        // Silencioso: si falla, no bloquea el modal
        console.warn('No se pudieron cargar votos previos');
      }
    } catch {
      setModalError('No se pudo cargar el premio');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setOpenedId(null);
  };

  const toggleNom = (id: string) => {
    if (!detalle) return;
    const max = detalle.max_votos_ronda1 || 4;
    // Bloquear auto-voto si el nominado está vinculado al usuario
    const nom = detalle.nominados.find(n => n.id === id);
    if (meId && nom?.usuarios_vinculados_detalles?.some(u => u.id === meId)) {
      setModalError('No puedes votarte a ti mismo');
      return;
    }
    setSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < max ? [...prev, id] : prev));
  };

  const assignPodium = (id: string) => {
    // Bloquear auto-voto también en R2
    if (detalle) {
      const nom = detalle.nominados.find(n => n.id === id);
      if (meId && nom?.usuarios_vinculados_detalles?.some(u => u.id === meId)) {
        setModalError('No puedes votarte a ti mismo');
        return;
      }
    }
    // Toggle: si ya está seleccionado en algún slot, quitarlo. Si no, asignar al primer slot libre
    setPodium(prev => {
      const slots: Array<keyof typeof prev> = ['oro','plata','bronce'];
      const newP = { ...prev } as { [k in 'oro'|'plata'|'bronce']?: string };
      const inSlot = slots.find(k => newP[k] === id);
      if (inSlot) {
        newP[inSlot] = undefined;
        return newP;
      }
      const free = slots.find(k => !newP[k]);
      if (free) newP[free] = id;
      return newP;
    });
  };
  const clearPodiumSlot = (slot: 'oro'|'plata'|'bronce') => setPodium(prev => ({ ...prev, [slot]: undefined }));

  // Guardar selección local del premio sin enviar todavía
  const saveSelection = async () => {
    if (!detalle) return;
    setModalError(null);
    setModalSuccess(null);
    if (detalle.ronda_actual === 1) {
      const max = detalle.max_votos_ronda1 || 4;
      if (sel.length !== max) {
        setModalError(`Debes seleccionar exactamente ${max} nominados`);
        return;
      }
      setSeleccionesGlobales(prev => ({ ...prev, [detalle.id]: sel.slice() }));
      setModalSuccess('Selección guardada');
      setTimeout(() => setOpenedId(null), 500);
    } else {
      // Guardar R2 (oro, plata, bronce) localmente; confirmar global al final
      if (!podium.oro || !podium.plata || !podium.bronce) {
        setModalError('Selecciona Oro, Plata y Bronce');
        return;
      }
      setSeleccionesR2(prev => ({ ...prev, [detalle.id]: { ...podium } }));
      setModalSuccess('Selección de podio guardada');
      setTimeout(() => setOpenedId(null), 500);
    }
  };

  // Enviar todas las selecciones guardadas (R1 y R2)
  const submitAllSelections = async () => {
    try {
      // Validar que todos los premios abiertos cumplan requisitos
      const abiertosR1 = ordered.filter(p => p.estado === 'votacion_1');
      for (const p of abiertosR1) {
        const s = seleccionesGlobales[p.id] || [];
        if (s.length !== 4) {
          setError(`Debes votar 4 nominados en "${p.nombre}"`);
          return;
        }
      }
      const abiertosR2 = ordered.filter(p => p.estado === 'votacion_2');
      for (const p of abiertosR2) {
        const pod = seleccionesR2[p.id] || {};
        if (!pod.oro || !pod.plata || !pod.bronce) {
          setError(`Debes completar el podio en "${p.nombre}"`);
          return;
        }
      }

      // Enviar R1
      for (const p of abiertosR1) {
        const s = seleccionesGlobales[p.id];
        for (const nomId of s) {
          await apiFetch('/api/votar/', { method: 'POST', body: JSON.stringify({ premio: p.id, nominado: nomId, ronda: 1 }) }, token || undefined);
        }
      }
      // Enviar R2
      for (const p of abiertosR2) {
        const pod = seleccionesR2[p.id]!;
        const votosR2 = [
          { premio: p.id, nominado: pod.oro, ronda: 2, orden_ronda2: 1 },
          { premio: p.id, nominado: pod.plata, ronda: 2, orden_ronda2: 2 },
          { premio: p.id, nominado: pod.bronce, ronda: 2, orden_ronda2: 3 },
        ];
        for (const v of votosR2) {
          await apiFetch('/api/votar/', { method: 'POST', body: JSON.stringify(v) }, token || undefined);
        }
      }
      setError(null);
      alert('¡Votos enviados!');
    } catch (err: unknown) {
      setError(mapApiError(err));
    }
  };

  // Mapear errores a mensajes concisos
  function mapApiError(err: unknown): string {
    if (err instanceof Error) {
      const m = err.message;
      const idx = m.indexOf('→');
      if (idx !== -1) {
        const json = m.slice(idx + 1).trim();
        try {
          const obj = JSON.parse(json);
          if (obj?.detail) {
            // Map algunos códigos a mensajes más cortos
            const shortMap: Record<string, string> = {
              self_vote_forbidden: 'No puedes votarte a ti mismo',
              already_voted_nominado_r1: 'Ya has votado por este premio',
              already_voted_nominado_r2: 'Ya has votado por este premio',
              max_votes_r1_reached: 'Ya has usado tus 4 votos',
              max_votes_r2_reached: 'Ya has usado tus 3 votos',
              position_already_used: 'Esa posición ya está usada',
              missing_order_r2: 'Falta seleccionar el podio',
            };
            if (obj.code && shortMap[obj.code]) return shortMap[obj.code];
            // fallback al detail en claro
            if (typeof obj.detail === 'string') return obj.detail;
          }
        } catch {}
      }
      return 'Error al enviar el voto';
    }
    return 'Error al enviar el voto';
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      <Header />
      <main className="flex-grow">
        <section className="py-10 md:py-12">
          <div className="max-w-6xl mx-auto px-4 space-y-6 md:space-y-8">
            <h1 className="headline text-[clamp(1.8rem,6vw,3rem)]">Votar</h1>
            <p className="text-zinc-400">Selecciona un premio para emitir tus votos.</p>

            {loading && <div className="text-zinc-400">Cargando premios…</div>}
            {error && <div className="text-red-400">{error}</div>}

            {!loading && !error && !hayAbiertos && (
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px]">
                <div className="rounded-2xl bg-zinc-950/70 p-10 text-center">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">Las votaciones aún no están abiertas</h2>
                  <p className="text-sm text-zinc-400 mb-6">Vuelve más tarde o revisa el inicio para la fecha de apertura</p>
                  {votingStart && <Countdown target={votingStart} />}
                </div>
              </div>
            )}

            {!loading && !error && ordered.map((premio) => {
              const isOpen = (premio.estado === 'votacion_1' || premio.estado === 'votacion_2');
              const like: PremioLike = {
                id: premio.id,
                nombre: premio.nombre,
                descripcion: premio.descripcion,
                estado: premio.estado,
                ronda_actual: premio.ronda_actual,
                slug: premio.slug ?? null,
                image_url: premio.image_url ?? null,
              };
              return (
                <AwardCard
                  key={premio.id}
                  premio={like}
                  primaryText="Votar"
                  onPrimaryClick={(p) => isOpen ? openModal(p.id) : undefined}
                  primaryDisabled={!isOpen}
                />
              );
            })}
          </div>
        </section>
      </main>
      <Footer />

      {/* Modal de votación */}
      <Modal open={!!openedId} onClose={closeModal} title={detalle ? `${detalle.nombre} • ${detalle.ronda_actual === 2 ? 'Final' : 'Ronda 1'}` : (modalError ? 'Votación' : 'Cargando premio…')}>
        {modalLoading && <div className="text-zinc-400 py-6">Cargando premio…</div>}
        {!modalLoading && detalle && (
          <div className="space-y-4">
            {modalError && <div className="text-red-400 text-sm">{modalError}</div>}
            {modalSuccess && <div className="text-green-400 text-sm">{modalSuccess}</div>}

            {/* Mensajes de error se muestran arriba; no bloquear por falta de token ya que puede haber sesión por cookie */}

            {detalle.ronda_actual === 1 ? (
              <div>
                <div className="text-xs text-zinc-400 mb-2">Selecciona exactamente {detalle.max_votos_ronda1 || 4}</div>
                {detalle.nominados.length === 0 ? (
                  <div className="text-zinc-400 text-sm">No hay nominados disponibles para este premio.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detalle.nominados.map(n => (
                    <button
                      key={n.id}
                      onClick={() => toggleNom(n.id)}
                      className={`text-left rounded-lg border p-3 ${sel.includes(n.id) ? 'border-amber-500/60 bg-amber-900/20' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'} ${meId && n.usuarios_vinculados_detalles?.some(u => u.id === meId) ? 'opacity-50 pointer-events-none' : ''}`}
                      aria-pressed={sel.includes(n.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800">
                          {(() => {
                            const owner = (n.usuarios_vinculados_detalles || [])[0];
                            const img = n.imagen || owner?.foto_url || owner?.foto_perfil || '';
                            return img ? <Image src={img} alt={n.nombre} fill className="object-cover" unoptimized /> : null;
                          })()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-zinc-100 truncate">{n.nombre}</div>
                          {detalle.tipo === 'indirecto' && n.descripcion && <div className="text-xs text-zinc-400 truncate">{n.descripcion}</div>}
                          {detalle.tipo === 'indirecto' && (() => {
                            const owner = (n.usuarios_vinculados_detalles || [])[0];
                            const ownerName = owner?.first_name || owner?.username;
                            return ownerName ? <div className="text-[11px] text-cyan-300">de {ownerName}</div> : null;
                          })()}
                        </div>
                      </div>
                    </button>
                  ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-xs text-zinc-400 mb-2">Asigna Oro, Plata y Bronce entre los finalistas</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    {detalle.nominados.slice(0,5).map(n => (
                      <button
                        key={n.id}
                        onClick={() => assignPodium(n.id)}
                        className={`w-full text-left rounded-lg border p-3 ${Object.values(podium).includes(n.id) ? 'border-yellow-500/60 bg-yellow-900/20' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                        aria-pressed={Object.values(podium).includes(n.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800">
                            {(() => {
                              const owner = (n.usuarios_vinculados_detalles || [])[0];
                              const img = n.imagen || owner?.foto_url || owner?.foto_perfil || '';
                              return img ? <Image src={img} alt={n.nombre} fill className="object-cover" unoptimized /> : null;
                            })()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-zinc-100 truncate">{n.nombre}</div>
                            {detalle.tipo === 'indirecto' && n.descripcion && <div className="text-xs text-zinc-400 truncate">{n.descripcion}</div>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-yellow-400/40 p-3">
                      <div className="text-yellow-300 text-sm font-semibold mb-2">Podio</div>
                      <div className="space-y-2 text-sm">
                        <div>🥇 Oro: <span className="text-zinc-200">{detalle.nominados.find(n => n.id === podium.oro)?.nombre || '—'}</span> {podium.oro && (<button className="ml-2 text-xs text-red-300 underline" onClick={() => clearPodiumSlot('oro')}>Quitar</button>)}</div>
                        <div>🥈 Plata: <span className="text-zinc-200">{detalle.nominados.find(n => n.id === podium.plata)?.nombre || '—'}</span> {podium.plata && (<button className="ml-2 text-xs text-red-300 underline" onClick={() => clearPodiumSlot('plata')}>Quitar</button>)}</div>
                        <div>🥉 Bronce: <span className="text-zinc-200">{detalle.nominados.find(n => n.id === podium.bronce)?.nombre || '—'}</span> {podium.bronce && (<button className="ml-2 text-xs text-red-300 underline" onClick={() => clearPodiumSlot('bronce')}>Quitar</button>)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button onClick={saveSelection} disabled={sending}>
                {sending ? 'Guardando…' : (detalle.ronda_actual === 1 ? 'Guardar selección' : 'Confirmar voto')}
              </Button>
            </div>
          </div>
        )}
        {!modalLoading && !detalle && (
          <div className="space-y-3">
            {modalError && (
              <div className="rounded border border-red-400/30 bg-red-900/20 text-red-200 text-sm p-3">{modalError}</div>
            )}
            {!token && (
              <div className="rounded border border-blue-400/30 bg-blue-900/20 text-blue-200 text-sm p-3">
                Debes iniciar sesión para votar. <Link href="/login" className="underline">Ir a iniciar sesión</Link>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Barra final para confirmar todos (R1) */}
      {hayAbiertos && (
        <div className="sticky bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="text-sm text-zinc-400 w-full">
              Ronda 1: selecciona 4 nominados en cada premio. Ronda 2: completa el podio (Oro, Plata, Bronce). Luego pulsa confirmar para enviar todos los votos.
            </div>
            <div className="shrink-0">
              <Button onClick={submitAllSelections}>
                Confirmar todos los votos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
