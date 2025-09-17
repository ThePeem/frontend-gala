'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { useAuth } from '../../utils/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/Toast';

interface Voto {
  id: string;
  premio_nombre: string;
  nominado_nombre: string;
  fecha_voto: string;
  ronda: number;
  orden_ronda2?: number;
}

function NominationsList({ votos, showR2 }: { votos: Voto[]; showR2: boolean }) {
  // Agrupar por premio
  const groups = new Map<string, { premio: string; nominados: string[]; hasR1: boolean; hasR2: boolean; fecha?: string }>();
  for (const v of votos) {
    const key = v.premio_nombre;
    const entry = groups.get(key);
    const d = new Date(v.fecha_voto);
    const fecha = isFinite(d.getTime()) ? d.toLocaleDateString() : undefined;
    const ronda = Number(v.ronda);
    if (!entry) {
      groups.set(key, {
        premio: v.premio_nombre,
        nominados: [v.nominado_nombre],
        hasR1: ronda === 1,
        hasR2: ronda === 2,
        fecha,
      });
    } else {
      if (!entry.nominados.includes(v.nominado_nombre)) entry.nominados.push(v.nominado_nombre);
      entry.hasR1 = entry.hasR1 || ronda === 1;
      entry.hasR2 = entry.hasR2 || ronda === 2;
      entry.fecha = fecha || entry.fecha; // conservar la última válida
    }
  }

  const items = Array.from(groups.values());

  return (
    <div className="space-y-3">
      {items.map((g) => (
        <div key={`${g.premio || 'premio'}::${g.nominados.join(',')}::${g.hasR1?'r1':''}${g.hasR2?'r2':''}`} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/60 hover:bg-zinc-900/70 transition-colors">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="headline text-[1rem] text-amber-300 mb-1">{g.premio || '(Sin título)'}</h3>
              <p className="text-zinc-400 text-sm mb-2">
                Nominado: <strong className="text-zinc-200">{g.nominados.join(', ')}</strong>
              </p>
              <div className="flex gap-4 text-sm text-zinc-500">
                <span>Fecha: {g.fecha ?? '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${g.hasR1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>Ronda 1</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${showR2 && g.hasR2 ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>Ronda 2</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface PerfilStats {
  total_nominaciones: number;
  total_votos_recibidos: number;
  oros: number;
  platas: number;
  bronces: number;
  fase?: {
    mostrar_medallas?: boolean;
    mostrar_ronda2?: boolean;
  };
}

interface Usuario {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  foto_perfil?: string;
  foto_url?: string | null;
  descripcion?: string | null;
  verificado: boolean;
}

export default function PerfilPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [votos, setVotos] = useState<Voto[]>([]);
  const [stats, setStats] = useState<PerfilStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cldReady, setCldReady] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchUserData = useCallback(async () => {
    try {
      setLoadingData(true);
      
      // Obtener perfil del usuario
      const [perfilResponse, votosResponse] = await Promise.all([
        axiosInstance.get('api/mi-perfil/'),
        axiosInstance.get('api/mis-nominaciones/')
      ]);
      
      setUsuario(perfilResponse.data);
      // Normalizar estructura de nominaciones por si el backend varía las claves (evitar any)
      const raw: unknown[] = Array.isArray(votosResponse.data) ? votosResponse.data : [];
      const normalized: Voto[] = raw.map((it) => {
        const o = it as Record<string, unknown>;
        const pick = (...keys: string[]) => {
          for (const k of keys) {
            const v = o[k];
            if (v !== undefined && v !== null && String(v).length > 0) return v as string | number;
          }
          return undefined;
        };
        const id = (pick('id', 'pk') ?? Math.random().toString(36).slice(2)).toString();
        const premio_nombre = (pick('premio_nombre', 'premio', 'premio_titulo', 'premioNombre', 'premio_name') ?? '').toString();
        const nominado_nombre = (pick('nominado_nombre', 'nominado', 'usuario', 'username', 'nombre') ?? '').toString();
        const fecha_voto = (pick('fecha_voto', 'fecha', 'created_at', 'fechaCreacion') ?? '').toString();
        const ronda = Number(pick('ronda', 'ronda_votacion', 'fase', 'round') ?? 0);
        const orden_ronda2_raw = pick('orden_ronda2');
        const orden_ronda2 = orden_ronda2_raw !== undefined ? Number(orden_ronda2_raw) : undefined;
        return { id, premio_nombre, nominado_nombre, fecha_voto, ronda, orden_ronda2 } as Voto;
      });
      setVotos(normalized);

      // Estadísticas opcionales (si endpoint existe)
      try {
        const statsResponse = await axiosInstance.get('api/mis-estadisticas/');
        setStats(statsResponse.data as PerfilStats);
      } catch {
        // Fallback: computamos lo básico
        setStats({
          total_nominaciones: Array.isArray(votosResponse.data) ? votosResponse.data.length : 0,
          total_votos_recibidos: 0,
          oros: 0,
          platas: 0,
          bronces: 0,
          fase: { mostrar_medallas: false, mostrar_ronda2: false },
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Error al cargar la información del usuario');
    } finally {
      setLoadingData(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);

  // Eliminamos botones propios de logout / dashboard; se gestiona desde el Header

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

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

  const openUpload = () => {
    if (!usuario) return;
    if (!cldReady || !cloudName || !uploadPreset) {
      alert('Cloudinary no está configurado. Añade NEXT_PUBLIC_CLOUDINARY_* en .env.local');
      return;
    }
    const cld = (window as unknown as { cloudinary?: CloudinaryGlobal }).cloudinary;
    if (!cld) return;
    const widget = cld.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        folder: 'perfiles',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      async (_error, result) => {
        if (result?.event === 'success' && result.info?.secure_url) {
          const url = result.info.secure_url;
          try {
            setSaving(true);
            await axiosInstance.patch('api/mi-perfil/', { foto_url: url });
            setUsuario((prev) => (prev ? { ...prev, foto_url: url } : prev));
          } catch (e) {
            console.error(e);
            alert('No se pudo guardar la foto');
          } finally {
            setSaving(false);
          }
        }
      }
    );
    widget.open();
  };

  const saveProfile = async () => {
    if (!usuario) return;
    try {
      setSaving(true);
      await axiosInstance.patch('api/mi-perfil/', {
        first_name: usuario.first_name,
        last_name: usuario.last_name,
        descripcion: usuario.descripcion || '',
      });
      alert('Perfil actualizado');
    } catch (e) {
      console.error(e);
      alert('No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b] px-4">
        <div className="max-w-2xl w-full border border-red-500/30 bg-red-950/20 text-red-200 rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      <Script src="https://widget.cloudinary.com/v2.0/global/all.js" strategy="afterInteractive" onLoad={() => setCldReady(true)} />
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
        <h1 className="headline text-[clamp(1.4rem,2.6vw,1.8rem)] mb-6">MI PERFIL</h1>

        {/* Información del Usuario */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px] mb-8">
          <div className="rounded-2xl bg-zinc-950/70 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Foto de Perfil */}
            <div className="text-center">
              {usuario.foto_url || usuario.foto_perfil ? (
                <Image
                  src={usuario.foto_url || usuario.foto_perfil!}
                  alt="Foto de perfil"
                  width={160}
                  height={160}
                  className="w-40 h-40 rounded-full mx-auto mb-4 object-cover border-4 border-zinc-800"
                  unoptimized
                />
              ) : (
                <div className="w-40 h-40 rounded-full mx-auto mb-4 bg-zinc-800 flex items-center justify-center">
                  <span className="text-4xl text-zinc-400">
                    {usuario.first_name?.[0]?.toUpperCase() || usuario.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <button onClick={openUpload} disabled={saving} className="headline px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500 disabled:opacity-60">
                {saving ? 'Subiendo...' : 'Cambiar Foto'}
              </button>
            </div>

            {/* Datos del Usuario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Usuario</label>
                <p className="text-zinc-200 font-medium">{usuario.username}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
                  <input
                    className="w-full rounded border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    value={usuario.first_name}
                    onChange={(e) => setUsuario((prev) => (prev ? { ...prev, first_name: e.target.value } : prev))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Apellidos</label>
                  <input
                    className="w-full rounded border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    value={usuario.last_name}
                    onChange={(e) => setUsuario((prev) => (prev ? { ...prev, last_name: e.target.value } : prev))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <p className="text-zinc-200">{usuario.email}</p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Estado de Verificación</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  usuario.verificado
                    ? 'bg-green-900/30 text-green-300 border border-green-700/40'
                    : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/40'
                }`}>
                  {usuario.verificado ? 'Verificado' : 'Pendiente de verificación'}
                </span>
              </div>
            </div>
          </div>

          {/* Descripción + Guardar */}
          <div className="mt-6 grid gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
              <textarea
                className="w-full rounded border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2 min-h-28 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                placeholder="Cuéntanos algo sobre ti..."
                value={usuario.descripcion || ''}
                onChange={(e) => setUsuario((prev) => (prev ? { ...prev, descripcion: e.target.value } : prev))}
              />
            </div>
            <div>
              <button onClick={async () => { await saveProfile(); show('success', 'Perfil actualizado'); }} disabled={saving} className="headline px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500 disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* Mis nominaciones */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px]">
          <div className="rounded-2xl bg-zinc-950/70 p-6">
          <h2 className="headline text-[clamp(1.2rem,2.2vw,1.4rem)] mb-4">MIS NOMINACIONES</h2>
          {votos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-zinc-400 text-lg mb-4">
                No tienes nominaciones actualmente
              </div>
              <button
                onClick={() => router.push('/votar')}
                className="headline px-4 py-2 rounded border border-amber-400 text-amber-400 hover:bg-amber-400/10"
              >
                Ir a votar
              </button>
            </div>
          ) : (
            <NominationsList votos={votos} showR2={stats?.fase?.mostrar_ronda2 ?? false} />
          )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px] mt-8">
          <div className="rounded-2xl bg-zinc-950/70 p-6">
            <h2 className="headline text-[clamp(1.2rem,2.2vw,1.4rem)] mb-4">ESTADÍSTICAS</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-2">{stats?.total_nominaciones ?? votos.length}</div>
                <div className="text-zinc-400">Nominaciones</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">{stats?.total_votos_recibidos ?? 0}</div>
                <div className="text-zinc-400">Votos recibidos</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-300">{(stats?.fase?.mostrar_medallas ?? false) ? (stats?.oros ?? 0) : 0}</div>
                    <div className="text-xs text-zinc-400">Oros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-300">{(stats?.fase?.mostrar_medallas ?? false) ? (stats?.platas ?? 0) : 0}</div>
                    <div className="text-xs text-zinc-400">Platas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-700">{(stats?.fase?.mostrar_medallas ?? false) ? (stats?.bronces ?? 0) : 0}</div>
                    <div className="text-xs text-zinc-400">Bronces</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
