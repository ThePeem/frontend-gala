'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { useAuth } from '../../utils/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/Toast';

interface Nominacion {
  id: string;
  premio: {
    id: string;
    nombre: string;
    estado: string;
    ronda_actual: number;
  };
  fecha_nominacion: string;
  ronda: number;
  es_activo: boolean;
}

function NominationsList({ nominaciones }: { 
  nominaciones: Nominacion[]; 
}) {
  // Agrupar por premio
  const groups = new Map<string, {
    premio_id: string;
    premio_nombre: string;
    premio_estado: string;
    premio_ronda_actual: number;
    nominados: Array<{
      id: string;
      fecha: string;
      ronda: number;
      es_activo: boolean;
    }>;
  }>();

  // Procesar nominaciones
  for (const nominacion of nominaciones) {
    const key = nominacion.premio.id;
    let group = groups.get(key);
    const fechaNominacion = new Date(nominacion.fecha_nominacion);
    const fechaFormateada = isFinite(fechaNominacion.getTime()) ? 
      fechaNominacion.toLocaleDateString() : 'Fecha no disponible';

    if (!group) {
      group = {
        premio_id: nominacion.premio.id,
        premio_nombre: nominacion.premio.nombre,
        premio_estado: nominacion.premio.estado,
        premio_ronda_actual: nominacion.premio.ronda_actual,
        nominados: []
      };
      groups.set(key, group);
    }

    // Agregar la nominación
    group.nominados.push({
      id: nominacion.id,
      fecha: fechaFormateada,
      ronda: nominacion.ronda,
      es_activo: nominacion.es_activo
    });
  }

  // Ordenar los grupos por estado (activos primero) y luego por nombre
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    // Premios activos primero
    if (a.premio_estado === 'votacion_1' || a.premio_estado === 'votacion_2') return -1;
    if (b.premio_estado === 'votacion_1' || b.premio_estado === 'votacion_2') return 1;
    
    // Luego por nombre
    return a.premio_nombre.localeCompare(b.premio_nombre);
  });

  // Función para obtener el texto de la ronda
  const getRondaText = (ronda: number) => {
    return ronda === 1 ? 'Ronda de nominación' : 'Ronda final';
  };

  // Función para obtener el estado del premio
  const getEstadoPremio = (estado: string) => {
    switch(estado) {
      case 'preparacion': return 'En preparación';
      case 'votacion_1': return 'Ronda 1 en curso';
      case 'votacion_2': return 'Ronda 2 en curso';
      case 'finalizado': return 'Finalizado';
      default: return estado;
    }
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'votacion_1': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'votacion_2': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'finalizado': return 'bg-green-500/20 text-green-300 border-green-500/40';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {sortedGroups.map((grupo) => (
        <div 
          key={`${grupo.premio_id}`} 
          className={`border rounded-xl p-4 transition-colors ${
            grupo.premio_estado.includes('votacion') 
              ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' 
              : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60'
          }`}
        >
          <div className="flex justify-between items-start gap-4 mb-3">
            <h3 className="text-lg font-semibold text-amber-300">{grupo.premio_nombre}</h3>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getEstadoColor(grupo.premio_estado)}`}>
              {getEstadoPremio(grupo.premio_estado)}
            </span>
          </div>
          
          <div className="space-y-4">
            {grupo.nominados.length > 0 ? (
              <div className="space-y-2">
                {grupo.nominados.map((nominacion, index) => (
                  <div 
                    key={`${nominacion.id}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      nominacion.es_activo 
                        ? 'bg-amber-500/10 border border-amber-500/20' 
                        : 'bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-200">
                        {getRondaText(nominacion.ronda)}
                      </span>
                      {!nominacion.es_activo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400">
                          Anterior
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${nominacion.es_activo ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {nominacion.fecha}
                      </span>
                      {nominacion.es_activo && (
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-zinc-500 text-sm">
                No hay nominaciones registradas para este premio.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface PerfilStats {
  total_nominaciones: number;
  total_votos_emitidos: number;
  total_votos_recibidos: number;
  oros: number;
  platas: number;
  bronces: number;
  ronda_actual: number;
  estado_actual: 'preparacion' | 'votacion_1' | 'votacion_2' | 'finalizado';
  puede_votar: boolean;
  fecha_limite_votacion?: string;
  premios_activos: number;
  premios_finalizados: number;
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
  const [nominaciones, setNominaciones] = useState<Nominacion[]>([]);
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
      
      // Obtener perfil del usuario, sus nominaciones y estadísticas en paralelo
      const [perfilResponse, nominacionesResponse, statsResponse] = await Promise.all([
        axiosInstance.get('api/mi-perfil/'),
        axiosInstance.get('api/mis-nominaciones/'),
        axiosInstance.get('api/mis-estadisticas/')
      ]);
      
      // Actualizar datos del usuario
      setUsuario(perfilResponse.data);
      
      // Procesar nominaciones
      const nominacionesData = Array.isArray(nominacionesResponse.data) ? nominacionesResponse.data : [];
      
      // Mapear las nominaciones al formato esperado
      interface NominacionAPI {
        id: string;
        premio: {
          id: string;
          nombre: string;
          estado: string;
          ronda_actual: number;
        };
        fecha_nominacion: string;
        ronda: number;
        es_activo: boolean;
      }

      const normalizedNominaciones: Nominacion[] = nominacionesData.map((nominacion: NominacionAPI) => ({
        id: nominacion.id,
        premio: {
          id: nominacion.premio.id,
          nombre: nominacion.premio.nombre,
          estado: nominacion.premio.estado,
          ronda_actual: nominacion.premio.ronda_actual
        },
        fecha_nominacion: nominacion.fecha_nominacion,
        ronda: nominacion.ronda,
        es_activo: nominacion.es_activo
      }));
      
      setNominaciones(normalizedNominaciones);
      
      // Procesar estadísticas
      const statsData = statsResponse.data || {};
      setStats({
        total_nominaciones: statsData.total_nominaciones || 0,
        total_votos_emitidos: statsData.total_votos_emitidos || 0,
        total_votos_recibidos: statsData.total_votos_recibidos || 0,
        oros: statsData.oros || 0,
        platas: statsData.platas || 0,
        bronces: statsData.bronces || 0,
        ronda_actual: statsData.ronda_actual || 1,
        estado_actual: statsData.estado_actual || 'preparacion',
        puede_votar: statsData.puede_votar || false,
        fecha_limite_votacion: statsData.fecha_limite_votacion,
        premios_activos: statsData.premios_activos || 0,
        premios_finalizados: statsData.premios_finalizados || 0
      });
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

  // Fallback: si el onLoad del Script no dispara, intenta detectar el widget tras montar
  useEffect(() => {
    const t = setTimeout(() => {
      const has = Boolean((window as unknown as { cloudinary?: unknown }).cloudinary);
      if (has) setCldReady(true);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const openUpload = () => {
    if (!usuario) return;
    if (!cldReady) {
      alert('El widget de Cloudinary no se ha cargado aún. Reintenta en unos segundos.');
      return;
    }
    if (!cloudName || !uploadPreset) {
      const which = [!cloudName ? 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME' : null, !uploadPreset ? 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET' : null].filter(Boolean).join(' y ');
      alert(`Cloudinary no está configurado (${which}). Asegúrate de definir las variables en Vercel (Production) y volver a desplegar.`);
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
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px] mb-8">
          <div className="rounded-2xl bg-zinc-950/70 p-6">
            <h2 className="headline text-[clamp(1.2rem,2.2vw,1.4rem)] mb-4">MIS NOMINACIONES</h2>
            {nominaciones.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-zinc-200 mb-2">No tienes nominaciones</h3>
                <p className="text-zinc-400 mb-4">
                  Aún no has sido nominado en ninguna categoría.
                </p>
                <button
                  onClick={() => router.push('/premios')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                >
                  Ver premios
                </button>
              </div>
            ) : (
              <NominationsList nominaciones={nominaciones} />
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 via-amber-500/10 to-transparent p-[1px] mb-8">
          <div className="rounded-2xl bg-zinc-950/70 p-6">
            <h2 className="headline text-[clamp(1.2rem,2.2vw,1.4rem)] mb-4">ESTADÍSTICAS</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-2">{stats?.total_nominaciones ?? nominaciones.length}</div>
                <div className="text-zinc-400">Nominaciones</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">{stats?.total_votos_recibidos ?? 0}</div>
                <div className="text-zinc-400">Votos recibidos</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-300">{(stats?.estado_actual === 'finalizado') ? (stats?.oros ?? 0) : 0}</div>
                    <div className="text-xs text-zinc-400">Oros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-300">{(stats?.estado_actual === 'finalizado') ? (stats?.platas ?? 0) : 0}</div>
                    <div className="text-xs text-zinc-400">Platas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-700">{(stats?.estado_actual === 'finalizado') ? (stats?.bronces ?? 0) : 0}</div>
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
