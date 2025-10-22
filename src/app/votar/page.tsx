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
}

interface UsuarioMini { id: string; username: string; first_name?: string; last_name?: string; foto_perfil?: string | null; foto_url?: string | null; }
interface NominadoDetalle { id: string; nombre: string; descripcion: string | null; imagen: string | null; usuarios_vinculados_detalles?: UsuarioMini[] }
interface PremioDetalle extends Premio { nominados: NominadoDetalle[]; max_votos_ronda1?: number; tipo?: 'individual' | 'grupal'; }

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

  useEffect(() => {
    const fetchPremios = async () => {
      try {
        const data = await apiFetch<Premio[]>("/api/premios/");
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
      const data = await apiFetch<PremioDetalle>(`/api/premios/${id}/`, {}, token || undefined);
      setDetalle(data);
      // Precargar votos previos
      if (token) {
        try {
          const prev = await apiFetch<any>(`/api/mis-votos/`, {}, token);
          const vp = Array.isArray(prev) ? prev.find((v: any) => v.premio === id) : null;
          if (vp) {
            if (data.ronda_actual === 1 && Array.isArray(vp.ronda_1)) {
              setSel(vp.ronda_1.map((x: any) => x.nominado?.id).filter(Boolean));
            }
            if (data.ronda_actual === 2 && Array.isArray(vp.ronda_2)) {
              const np: { oro?: string; plata?: string; bronce?: string } = {};
              vp.ronda_2.forEach((x: any) => {
                if (x.orden === 1) np.oro = x.nominado?.id;
                if (x.orden === 2) np.plata = x.nominado?.id;
                if (x.orden === 3) np.bronce = x.nominado?.id;
              });
              setPodium(np);
            }
          }
        } catch (e) {
          // Silencioso: si falla, no bloquea el modal
          console.warn('No se pudieron cargar votos previos');
        }
      }
    } catch (e) {
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
    setSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < max ? [...prev, id] : prev));
  };

  const assignPodium = (id: string) => {
    // ciclo oro -> plata -> bronce -> quitar
    setPodium(prev => {
      const slots: Array<keyof typeof prev> = ['oro','plata','bronce'];
      // si ya está en algún slot, quítalo
      const newP = { ...prev } as { [k in 'oro'|'plata'|'bronce']?: string };
      for (const k of slots) if (newP[k] === id) newP[k] = undefined;
      // pon en el primer slot libre
      const free = slots.find(k => !newP[k]);
      if (free) newP[free] = id;
      return newP;
    });
  };

  const submitVotes = async () => {
    if (!detalle) return;
    setSending(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      const votos: Array<{ premio: string; nominado: string; ronda: number; orden_ronda2?: number }> = [];
      if (detalle.ronda_actual === 1) {
        sel.forEach(id => votos.push({ premio: detalle.id, nominado: id, ronda: 1 }));
      } else {
        if (podium.oro) votos.push({ premio: detalle.id, nominado: podium.oro, ronda: 2, orden_ronda2: 1 });
        if (podium.plata) votos.push({ premio: detalle.id, nominado: podium.plata, ronda: 2, orden_ronda2: 2 });
        if (podium.bronce) votos.push({ premio: detalle.id, nominado: podium.bronce, ronda: 2, orden_ronda2: 3 });
      }
      if (votos.length === 0) {
        setModalError('Selecciona al menos un nominado');
        setSending(false);
        return;
      }
      await apiFetch('/api/votar/', { method: 'POST', body: JSON.stringify(votos) }, token || undefined);
      setModalSuccess('¡Voto registrado!');
    } catch (e: any) {
      setModalError(e?.message || 'Error al enviar el voto');
    } finally {
      setSending(false);
    }
  };

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
      <Modal open={!!openedId} onClose={closeModal} title={detalle ? `${detalle.nombre} • ${detalle.ronda_actual === 2 ? 'Final' : 'Ronda 1'}` : 'Cargando premio…'}>
        {modalLoading && <div className="text-zinc-400 py-6">Cargando premio…</div>}
        {!modalLoading && detalle && (
          <div className="space-y-4">
            {modalError && <div className="text-red-400 text-sm">{modalError}</div>}
            {modalSuccess && <div className="text-green-400 text-sm">{modalSuccess}</div>}

            {!token && (
              <div className="rounded border border-blue-400/30 bg-blue-900/20 text-blue-200 text-sm p-3">
                Debes iniciar sesión para votar. <Link href="/login" className="underline">Ir a iniciar sesión</Link>
              </div>
            )}

            {detalle.ronda_actual === 1 ? (
              <div>
                <div className="text-xs text-zinc-400 mb-2">Selecciona hasta {detalle.max_votos_ronda1 || 4}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detalle.nominados.map(n => (
                    <button
                      key={n.id}
                      onClick={() => toggleNom(n.id)}
                      className={`text-left rounded-lg border p-3 ${sel.includes(n.id) ? 'border-amber-500/60 bg-amber-900/20' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                      aria-pressed={sel.includes(n.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800">
                          {n.imagen ? <Image src={n.imagen} alt={n.nombre} fill className="object-cover" unoptimized /> : null}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-zinc-100 truncate">{n.nombre}</div>
                          {n.descripcion && <div className="text-xs text-zinc-400 truncate">{n.descripcion}</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-zinc-400 mb-2">Asigna Oro, Plata y Bronce</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    {detalle.nominados.map(n => (
                      <button
                        key={n.id}
                        onClick={() => assignPodium(n.id)}
                        className={`w-full text-left rounded-lg border p-3 ${Object.values(podium).includes(n.id) ? 'border-yellow-500/60 bg-yellow-900/20' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                        aria-pressed={Object.values(podium).includes(n.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-zinc-800">
                            {n.imagen ? <Image src={n.imagen} alt={n.nombre} fill className="object-cover" unoptimized /> : null}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-zinc-100 truncate">{n.nombre}</div>
                            {n.descripcion && <div className="text-xs text-zinc-400 truncate">{n.descripcion}</div>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-yellow-400/40 p-3">
                      <div className="text-yellow-300 text-sm font-semibold mb-2">Podio</div>
                      <div className="space-y-2 text-sm">
                        <div>🥇 Oro: <span className="text-zinc-200">{detalle.nominados.find(n => n.id === podium.oro)?.nombre || '—'}</span></div>
                        <div>🥈 Plata: <span className="text-zinc-200">{detalle.nominados.find(n => n.id === podium.plata)?.nombre || '—'}</span></div>
                        <div>🥉 Bronce: <span className="text-zinc-200">{detalle.nominados.find(n => n.id === podium.bronce)?.nombre || '—'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
              <Button onClick={submitVotes} disabled={sending || !token}>
                {sending ? 'Enviando…' : 'Confirmar voto'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
