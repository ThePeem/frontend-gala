// src/app/votar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
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
  nominados_visible?: Array<{ id: string; nombre: string; descripcion: string | null; imagen: string | null; usuarios_vinculados_detalles?: UsuarioMini[] }>;
}

interface UsuarioMini { id: string; username: string; first_name?: string; last_name?: string; foto_perfil?: string | null; foto_url?: string | null; }
interface NominadoDetalle { id: string; nombre: string; descripcion: string | null; imagen: string | null; usuario_id?: string; usuarios_vinculados_detalles?: UsuarioMini[] }
interface PremioDetalle extends Premio { nominados: NominadoDetalle[]; max_votos_ronda1?: number; }
interface MisVotoR1Item { nominado: { id: string } }
interface MisVotoR2Item { orden: number; nominado: { id: string } }
interface MisVotoPremio { premio: string; ronda_1?: MisVotoR1Item[]; ronda_2?: MisVotoR2Item[] }
interface PremioListado { id: string; nominados_visible?: Array<{ id: string; nombre: string; descripcion: string | null; imagen: string | null; usuarios_vinculados_detalles?: UsuarioMini[] }>; }

export default function VotarIndexPage() {
  const { authToken: token } = useAuth() as { authToken?: string | null };
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<PremioDetalle | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [podium, setPodium] = useState<{ oro?: string; plata?: string; bronce?: string }>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [, setModalSuccess] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  // Selecciones guardadas por premio para confirmar todas juntas
  const [seleccionesGlobales, setSeleccionesGlobales] = useState<Record<string, string[]>>({});
  const [seleccionesR2, setSeleccionesR2] = useState<Record<string, { oro?: string; plata?: string; bronce?: string }>>({});
  const [myNomIds, setMyNomIds] = useState<Set<string>>(new Set());
  const [misVotos, setMisVotos] = useState<MisVotoPremio[] | null>(null);

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

  // Cargar todos mis votos para saber si ya he votado todos los premios abiertos
  useEffect(() => {
    const fetchMisVotos = async () => {
      try {
        const data = await apiFetch<MisVotoPremio[]>(`/api/mis-votos/`, {}, token || undefined);
        setMisVotos(Array.isArray(data) ? data : []);
      } catch {
        setMisVotos([]);
      }
    };
    fetchMisVotos();
  }, [token]);

  const ordered = useMemo(() => premios.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)), [premios]);
  const votingStartEnv = process.env.NEXT_PUBLIC_VOTING_START;
  const votingStart = useMemo(() => votingStartEnv ? new Date(votingStartEnv) : null, [votingStartEnv]);
  const hayAbiertos = ordered.some(p => p.estado === 'votacion_1' || p.estado === 'votacion_2');

  // Resolver URLs de imagen (si vienen relativas del API)
  const API_BASE_IMG = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const toImg = (src?: string | null) => {
    if (!src) return src as null;
    if (/^https?:\/\//i.test(src)) return src;
    if (!API_BASE_IMG) return src; // como fallback, se intentará relativa
    return `${API_BASE_IMG}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const openModal = async (id: string) => {
    setOpenedId(id);
    setDetalle(null);
    // Inicializar con los votos guardados si existen
    const savedVotes = seleccionesGlobales[id] || [];
    setSel([...savedVotes]);
    const savedPodium = seleccionesR2[id] || {};
    setPodium({...savedPodium});
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
        nominados: (base.nominados_visible || []).map(n => ({ id: n.id, nombre: n.nombre, descripcion: n.descripcion, imagen: n.imagen, usuarios_vinculados_detalles: n.usuarios_vinculados_detalles })),
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
              nominados: (match.nominados_visible || []).map(n => ({ id: n.id, nombre: n.nombre, descripcion: n.descripcion, imagen: n.imagen, usuarios_vinculados_detalles: n.usuarios_vinculados_detalles })),
              max_votos_ronda1: 4,
            } as PremioDetalle;
          }
        } catch {}
      }

      if (!detalleLocal) throw new Error('No se pudo cargar el premio');

      setDetalle(detalleLocal);
      // Cargar mis nominaciones para bloquear auto-voto en el modal
      if (token) {
        try {
          const mine = await apiFetch<Array<{ id: string }>>('/api/mis-nominaciones/', {}, token);
          const ids = new Set<string>((mine || []).map(x => x.id));
          setMyNomIds(ids);
        } catch {}
      }
      // Precargar votos previos (si hay sesión por token o cookie)
      try {
        const prev = await apiFetch<MisVotoPremio[]>(`/api/mis-votos/`, {}, token || undefined);
        const vp = Array.isArray(prev) ? prev.find((v) => v.premio === id) : null;
        if (vp) {
          if (detalleLocal.ronda_actual === 1 && Array.isArray(vp.ronda_1)) {
            const savedVotes = vp.ronda_1.map((x) => x.nominado?.id).filter(Boolean) as string[];
            setSel(savedVotes);
            // Update global state with the loaded votes
            setSeleccionesGlobales(prev => ({
              ...prev,
              [id]: savedVotes
            }));
          }
          if (detalleLocal.ronda_actual === 2 && Array.isArray(vp.ronda_2)) {
            const np: { oro?: string; plata?: string; bronce?: string } = {};
            vp.ronda_2.forEach((x) => {
              if (x.orden === 1) np.oro = x.nominado?.id;
              if (x.orden === 2) np.plata = x.nominado?.id;
              if (x.orden === 3) np.bronce = x.nominado?.id;
            });
            setPodium(np);
            // Update global R2 state with the loaded votes
            setSeleccionesR2(prev => ({
              ...prev,
              [id]: { ...np }
            }));
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
    if (myNomIds.has(id)) {
      setModalError('No puedes votarte a ti mismo');
      return;
    }
    const nom = detalle.nominados.find(n => n.id === id);
    if (meId && (nom?.usuario_id === meId || nom?.usuarios_vinculados_detalles?.some(u => u.id === meId))) {
      setModalError('No puedes votarte a ti mismo');
      return;
    }
    setSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < max ? [...prev, id] : prev));
  };

  const assignPodium = (id: string) => {
    // Bloquear auto-voto también en R2
    if (detalle) {
      if (myNomIds.has(id)) {
        setModalError('No puedes votarte a ti mismo');
        return;
      }
      const nom = detalle.nominados.find(n => n.id === id);
      if (meId && (nom?.usuario_id === meId || nom?.usuarios_vinculados_detalles?.some(u => u.id === meId))) {
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
        // Persistir también en el estado global R2
        if (detalle) setSeleccionesR2(prev2 => ({ ...prev2, [detalle.id]: { ...newP } }));
        return newP;
      }
      const free = slots.find(k => !newP[k]);
      if (free) newP[free] = id;
      if (detalle) setSeleccionesR2(prev2 => ({ ...prev2, [detalle.id]: { ...newP } }));
      return newP;
    });
  };
  const clearPodiumSlot = (slot: 'oro'|'plata'|'bronce') => setPodium(prev => {
    const np = { ...prev, [slot]: undefined };
    if (detalle) setSeleccionesR2(prev2 => ({ ...prev2, [detalle.id]: { ...np } }));
    return np;
  });

  // Guardar selección local del premio sin enviar todavía
  const saveSelection = async () => {
    if (!detalle) return;
    setModalError(null);
    setModalSuccess(null);

    // Validar auto-voto y guardar en el estado global
    if (meId) {
      if (detalle.ronda_actual === 1) {
        const hasSelfVote = sel.some(id => {
          const nom = detalle.nominados.find(n => n.id === id);
          return (nom?.usuario_id === meId) || nom?.usuarios_vinculados_detalles?.some(u => u.id === meId);
        });
        if (hasSelfVote) {
          setModalError('No puedes votarte a ti mismo');
          return;
        }
        // Actualizar el estado global con los votos actuales
        setSeleccionesGlobales(prev => ({
          ...prev,
          [detalle.id]: [...sel]
        }));
      } else {
        const podiumNoms = Object.values(podium).filter(Boolean);
        const hasSelfVote = podiumNoms.some(id => {
          const nom = detalle.nominados.find(n => n.id === id);
          return (nom?.usuario_id === meId) || nom?.usuarios_vinculados_detalles?.some(u => u.id === meId);
        });
        if (hasSelfVote) {
          setModalError('No puedes votarte a ti mismo');
          return;
        }
        // Actualizar el estado global R2 con el podio actual
        setSeleccionesR2(prev => ({
          ...prev,
          [detalle.id]: { ...podium }
        }));
      }
    }

    if (detalle.ronda_actual === 1) {
      const max = detalle.max_votos_ronda1 || 4;
      if (sel.length !== max) {
        setModalError(`Debes seleccionar exactamente ${max} nominados`);
        return;
      }
      // Validación explícita anti auto-voto al guardar selección
      if (sel.some(id => myNomIds.has(id))) {
        setModalError('No puedes votarte a ti mismo');
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
    if (!window.confirm('¿Estás seguro de que estos son tus votos? Podrás revisarlos antes de enviar.')) {
      return;
    }
    // Primero limpiamos cualquier error previo
    setError(null);
    setSuccess(null);
    
    try {
      // Validar que todos los premios abiertos cumplan requisitos
      const abiertosR1 = ordered.filter(p => p.estado === 'votacion_1');
      const errores: string[] = [];
      
      abiertosR1.forEach(p => {
        const s = seleccionesGlobales[p.id] || [];
        if (s.length !== 4) {
          errores.push(`Debes votar 4 nominados en "${p.nombre}"`);
        }
        // Anti auto-voto en R1
        if (s.some(id => myNomIds.has(id))) {
          errores.push(`No puedes votarte a ti mismo en "${p.nombre}" (Ronda 1)`);
        }
        // Duplicados en R1
        if (new Set(s).size !== s.length) {
          errores.push(`No puedes repetir nominados en "${p.nombre}" (Ronda 1)`);
        }
      });
      
      const abiertosR2 = ordered.filter(p => p.estado === 'votacion_2' && (Array.isArray(p.nominados_visible) ? p.nominados_visible.length : 0) >= 3);
      abiertosR2.forEach(p => {
        const pod = seleccionesR2[p.id] || {};
        if (!pod.oro || !pod.plata || !pod.bronce) {
          errores.push(`Debes completar el podio en "${p.nombre}"`);
        }
        const ids = [pod.oro, pod.plata, pod.bronce].filter(Boolean) as string[];
        // Distintos en R2
        if (new Set(ids).size !== 3) {
          errores.push(`Oro, Plata y Bronce deben ser distintos en "${p.nombre}"`);
        }
        // Anti auto-voto en R2
        if (ids.some(id => myNomIds.has(id))) {
          errores.push(`No puedes votarte a ti mismo en "${p.nombre}" (Ronda 2)`);
        }
      });
      
      if (errores.length > 0) {
        setError(errores.join('. '));
        // Hacer scroll al principio para ver el mensaje de error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
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
          { premio: p.id, nominado: pod.oro, ronda: 2, orden: 1 },
          { premio: p.id, nominado: pod.plata, ronda: 2, orden: 2 },
          { premio: p.id, nominado: pod.bronce, ronda: 2, orden: 3 },
        ];
        for (const v of votosR2) {
          // debug ligero para diagnosticar posibles 400
          console.log('[submit R2] payload', v);
          await apiFetch('/api/votar/', { method: 'POST', body: JSON.stringify(v) }, token || undefined);
        }
      }
      setError(null);
      setSuccess('¡Tus votos se han enviado correctamente!');
      // refrescar mis votos para fijar el estado de "ya has votado"
      try {
        const data = await apiFetch<MisVotoPremio[]>(`/api/mis-votos/`, {}, token || undefined);
        setMisVotos(Array.isArray(data) ? data : []);
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(mapApiError(err));
      setSuccess(null);
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
    return 'Error desconocido al procesar la solicitud';
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      <Header />
      <main className="flex-grow">
        <section className="py-6 md:py-8">
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="headline text-[clamp(1.8rem,6vw,2.5rem)] mb-2">Votar</h1>
                <p className="text-zinc-400">Selecciona un premio para emitir tus votos.</p>
              </div>
              
              {/* Sección superior: estado de votos o confirmación */}
              {hayAbiertos && (() => {
                // Calcular si YA se ha votado todo lo abierto
                const abiertos = ordered.filter(p => p.estado === 'votacion_1' || p.estado === 'votacion_2');
                const hasAll = abiertos.every(p => {
                  const registro = (misVotos || []).find(v => v.premio === p.id);
                  if (!registro) return false;
                  if (p.estado === 'votacion_1') return Array.isArray(registro.ronda_1) && registro.ronda_1.length === 4;
                  if (p.estado === 'votacion_2') {
                    const finalists = Array.isArray(p.nominados_visible) ? p.nominados_visible.length : 0;
                    if (finalists < 3) return true; // no exige podio si no hay suficientes finalistas
                    return Array.isArray(registro.ronda_2) && registro.ronda_2.length === 3;
                  }
                  return false;
                });

                if (hasAll) {
                  return (
                    <div className="w-full md:w-auto bg-emerald-900/20 border border-emerald-800/60 rounded-xl p-4 shadow-lg">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm">
                          <div className="font-medium text-emerald-300">Ya has votado todos los premios abiertos</div>
                          <div className="text-emerald-200/80 text-xs">Cuando se abra la siguiente ronda podrás volver a votar</div>
                        </div>
                        <Button variant="secondary" onClick={() => window.location.reload()}>Actualizar</Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="w-full md:w-auto bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm">
                        <div className="font-medium text-amber-400">Tus votos</div>
                        <div className="text-zinc-400 text-xs">
                          {ordered.filter(p => p.estado === 'votacion_1').length} premios en Ronda 1 • 
                          {ordered.filter(p => p.estado === 'votacion_2').length} en Ronda 2
                        </div>
                      </div>
                      <Button 
                        onClick={submitAllSelections}
                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all hover:scale-105 w-full sm:w-auto text-center"
                      >
                        <span className="text-lg font-bold">Confirmar todos los votos</span>
                      </Button>
                    </div>
                    {error && (
                      <div className="mt-3 p-2 bg-red-900/50 border border-red-800 text-red-100 rounded text-xs text-center">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="mt-3 p-2 bg-emerald-900/50 border border-emerald-800 text-emerald-100 rounded text-xs text-center">
                        {success}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {loading && <div className="text-zinc-400 py-8 text-center">Cargando premios…</div>}

            {!loading && !error && !hayAbiertos && (
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px]">
                <div className="rounded-2xl bg-zinc-950/70 p-10 text-center">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">Las votaciones aún no están abiertas</h2>
                  <p className="text-sm text-zinc-400 mb-6">Vuelve más tarde o revisa el inicio para la fecha de apertura</p>
                  {votingStart && <Countdown target={votingStart} />}
                </div>
              </div>
            )}
          </div>

          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!loading && ordered.filter(p => p.estado === 'votacion_1' || p.estado === 'votacion_2').map((premio) => {
                const isOpen = true;
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
                  <div key={premio.id} className="relative">
                    <AwardCard
                      premio={like}
                      primaryText="Votar"
                      onPrimaryClick={(p) => openModal(p.id)}
                      primaryDisabled={!isOpen}
                      showEstadoPanel={false}
                    />
                    {(seleccionesGlobales[premio.id]?.length > 0 || seleccionesR2[premio.id]) && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Modal 
            open={!!openedId} 
            onClose={closeModal} 
            title={detalle ? `${detalle.nombre} • ${detalle.ronda_actual === 2 ? 'Final' : 'Ronda 1'}` : (modalError ? 'Votación' : 'Cargando premio…')}
          >
            {modalLoading ? (
              <div className="text-zinc-400 py-6 text-center">Cargando premio…</div>
            ) : detalle ? (
              detalle.ronda_actual === 1 ? (
                <div className="p-1">
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-400 mb-3">
                      Selecciona hasta {detalle.max_votos_ronda1 || 4} nominados
                    </p>
                    <div className="space-y-2">
                      {detalle.nominados.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => toggleNom(n.id)}
                          className={`w-full text-left rounded-lg p-3 ${
                            sel.includes(n.id)
                              ? 'bg-amber-500/10 border border-amber-500/30'
                              : 'hover:bg-zinc-800/50 border border-transparent'
                          }`}
                          aria-pressed={sel.includes(n.id)}
                        >
                          <div className="flex items-center gap-3">
                            {detalle.tipo !== 'indirecto' && (
                              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                {(() => {
                                  const owner = (n.usuarios_vinculados_detalles || [])[0];
                                  const img = toImg(n.imagen || owner?.foto_url || owner?.foto_perfil || null) as string | null;
                                  if (img) {
                                    return (
                                      <Image 
                                        src={img} 
                                        alt={n.nombre} 
                                        width={40} 
                                        height={40} 
                                        className="object-cover w-full h-full" 
                                        unoptimized 
                                      />
                                    );
                                  }
                                  return (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-zinc-400 text-xs">
                                      {n.nombre.charAt(0).toUpperCase()}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-zinc-100 truncate">{n.nombre}</div>
                              {detalle.tipo === 'indirecto' && n.descripcion && (
                                <div className="text-xs text-zinc-400 truncate">{n.descripcion}</div>
                              )}
                            </div>
                            {detalle.tipo === 'indirecto' && (() => {
                              const owner = (n.usuarios_vinculados_detalles || [])[0];
                              const ownerName = owner?.first_name || owner?.username;
                              return ownerName ? (
                                <div className="ml-auto text-xs text-cyan-400 truncate max-w-[40%] text-right">{ownerName}</div>
                              ) : null;
                            })()}
                            {sel.includes(n.id) && (
                              <div className="ml-2 text-amber-500">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
                      <div className="text-sm text-zinc-400">
                        {sel.length} de {detalle.max_votos_ronda1 || 4} seleccionados
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                        <Button 
                          onClick={saveSelection}
                          disabled={sel.length !== (detalle.max_votos_ronda1 || 4)}
                          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white"
                        >
                          Guardar selección
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-1">
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">Asigna Oro, Plata y Bronce entre los finalistas</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {detalle.nominados.slice(0, 5).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => assignPodium(n.id)}
                            className={`w-full text-left rounded-lg p-3 border ${
                              Object.values(podium).includes(n.id)
                                ? 'border-yellow-500/60 bg-yellow-900/20'
                                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                            }`}
                            aria-pressed={Object.values(podium).includes(n.id)}
                          >
                            <div className="flex items-center gap-3">
                              {detalle.tipo !== 'indirecto' && (
                                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                  {(() => {
                                    const owner = (n.usuarios_vinculados_detalles || [])[0];
                                    const img = toImg(n.imagen || owner?.foto_url || owner?.foto_perfil) as string | null;
                                    if (img) {
                                      return (
                                        <Image 
                                          src={img} 
                                          alt={n.nombre} 
                                          width={40} 
                                          height={40} 
                                          className="object-cover w-full h-full" 
                                          unoptimized 
                                        />
                                      );
                                    }
                                    return (
                                      <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-zinc-400 text-xs">
                                        {n.nombre.charAt(0).toUpperCase()}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-zinc-100">{n.nombre}</div>
                                {detalle.tipo === 'indirecto' && n.descripcion && (
                                  <div className="text-xs text-zinc-400 truncate">{n.descripcion}</div>
                                )}
                              </div>
                              {detalle.tipo === 'indirecto' && (() => {
                                const owner = (n.usuarios_vinculados_detalles || [])[0];
                                const ownerName = owner?.first_name || owner?.username;
                                return ownerName ? (
                                  <div className="ml-auto text-xs text-cyan-400 truncate max-w-[40%] text-right">{ownerName}</div>
                                ) : null;
                              })()}
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="rounded-xl border border-yellow-400/30 bg-yellow-900/10 p-4">
                          <h3 className="text-yellow-300 font-medium mb-3">Tu podio</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-yellow-900/30 to-yellow-900/10 border border-yellow-500/30">
                              <div className="h-8 w-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-300 font-bold">1</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-zinc-100 truncate">
                                  {podium.oro ? detalle.nominados.find(n => n.id === podium.oro)?.nombre : '—'}
                                </div>
                              </div>
                              {podium.oro && (
                                <button 
                                  onClick={() => clearPodiumSlot('oro')}
                                  className="text-yellow-300 hover:text-yellow-200"
                                  aria-label="Quitar oro"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-zinc-800/50 to-zinc-800/30 border border-zinc-700/50">
                              <div className="h-8 w-8 rounded-full bg-zinc-700/50 border border-zinc-600/50 flex items-center justify-center text-zinc-300 font-bold">2</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-zinc-100 truncate">
                                  {podium.plata ? detalle.nominados.find(n => n.id === podium.plata)?.nombre : '—'}
                                </div>
                              </div>
                              {podium.plata && (
                                <button 
                                  onClick={() => clearPodiumSlot('plata')}
                                  className="text-zinc-400 hover:text-zinc-200"
                                  aria-label="Quitar plata"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-amber-900/30 to-amber-900/10 border border-amber-700/50">
                              <div className="h-8 w-8 rounded-full bg-amber-700/30 border border-amber-600/50 flex items-center justify-center text-amber-300 font-bold">3</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-zinc-100 truncate">
                                  {podium.bronce ? detalle.nominados.find(n => n.id === podium.bronce)?.nombre : '—'}
                                </div>
                              </div>
                              {podium.bronce && (
                                <button 
                                  onClick={() => clearPodiumSlot('bronce')}
                                  className="text-amber-400 hover:text-amber-200"
                                  aria-label="Quitar bronce"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                          <Button 
                            onClick={saveSelection}
                            disabled={!podium.oro || !podium.plata || !podium.bronce}
                            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white"
                          >
                            Guardar podio
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="p-4" />
            )}
        </Modal>
      {/* Barra informativa en la parte inferior */}
      {hayAbiertos && (
        <div className="sticky bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col items-center gap-2">
            <div className="text-xs text-zinc-500 text-center">Puedes modificar tus votos tantas veces como quieras antes de confirmar</div>
            <Button 
              onClick={submitAllSelections}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold px-6 py-3"
            >
              Confirmar todos los votos
            </Button>
          </div>
        </div>
      )}
        </section>
      </main>
    </div>
  );
}
