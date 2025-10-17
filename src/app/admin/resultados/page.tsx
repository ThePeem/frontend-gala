// src/app/admin/resultados/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/utils/AuthContext";

type EstadoFase = 'preparacion' | 'votacion_1' | 'votacion_2' | 'finalizado';

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: 'preparacion' | 'votacion_1' | 'votacion_2' | 'finalizado';
  ronda_actual: number;
  total_votos?: number;
  total_votantes?: number;
  porcentaje_participacion?: number;
};

type ResultadoPublico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  ganador_oro: { id: string; nombre: string; votos: number } | null;
  ganador_plata: { id: string; nombre: string; votos: number } | null;
  ganador_bronce: { id: string; nombre: string; votos: number } | null;
  fecha_resultados_publicados: string | null;
  total_votos: number;
  total_votantes: number;
  porcentaje_participacion: number;
};

type EstadisticasGlobales = {
  total_usuarios: number;
  total_votantes: number;
  porcentaje_participacion: number;
  premios_totales: number;
  premios_abiertos: number;
  premios_cerrados: number;
  fase_actual: EstadoFase;
  proxima_fase: EstadoFase | null;
  puede_avanzar_fase: boolean;
  puede_publicar_resultados: boolean;
};

export default function AdminResultadosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resultadosVista, setResultadosVista] = useState<ResultadoPublico[] | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [reseteando, setReseteando] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGlobales | null>(null);
  const [actualizandoFase, setActualizandoFase] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState<(() => Promise<void>) | null>(null);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      
      // Obtener datos en paralelo
      const [premiosRes, estadisticasRes] = await Promise.all([
        axiosInstance.get<Premio[]>("api/admin/premios/"),
        axiosInstance.get<EstadisticasGlobales>("api/admin/estadisticas/"),
      ]);
      
      setPremios(premiosRes.data);
      setEstadisticas(estadisticasRes.data);
      
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los datos");
    } finally {
      setFetching(false);
    }
  }, [axiosInstance]);

  // Actualizar datos periódicamente
  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [loading, isAuthenticated, fetchData]);
  
  // Función para confirmar acciones importantes
  const confirmarAccion = (mensaje: string, accion: () => Promise<void>) => {
    setMensajeConfirmacion(mensaje);
    setAccionConfirmar(() => accion);
    setMostrarConfirmacion(true);
  };

  const resetGala = async () => {
    try {
      setReseteando(true);
      setError(null);
      await axiosInstance.post("api/admin/reset-gala/");
      setResultadosVista(null);
      await fetchData();
    } catch (e) {
      console.error(e);
      setError("No se pudo reiniciar la gala");
    } finally {
      setReseteando(false);
      setMostrarConfirmacion(false);
    }
  };
  
  // Avanzar a la siguiente fase
  const avanzarFase = async () => {
    try {
      setActualizandoFase(true);
      await axiosInstance.post("api/admin/avanzar-fase/");
      await fetchData(); // Actualizar datos después de cambiar la fase
    } catch (e) {
      console.error(e);
      setError("No se pudo avanzar de fase");
    } finally {
      setActualizandoFase(false);
      setMostrarConfirmacion(false);
    }
  };
  
  // Obtener el nombre de la fase
  const getNombreFase = (fase: EstadoFase) => {
    switch (fase) {
      case 'preparacion':
        return 'Preparación';
      case 'votacion_1':
        return 'Ronda 1 de Votación';
      case 'votacion_2':
        return 'Ronda Final';
      case 'finalizado':
        return 'Finalizado';
      default:
        return fase;
    }
  };
  
  // Obtener la descripción de la fase
  const getDescripcionFase = (fase: EstadoFase) => {
    switch (fase) {
      case 'preparacion':
        return 'Configuración inicial del sistema. Los usuarios pueden registrarse y completar sus perfiles.';
      case 'votacion_1':
        return 'Primera ronda de votación. Los usuarios pueden votar por sus nominados favoritos en cada categoría.';
      case 'votacion_2':
        return 'Ronda final. Los usuarios pueden votar por los finalistas de cada categoría.';
      case 'finalizado':
        return 'Las votaciones han finalizado. Los resultados están disponibles para su revisión.';
      default:
        return '';
    }
  };

  // Cambiar estado del premio usando endpoint dedicado
  const cambiarEstadoPremio = async (p: Premio, nuevo_estado: Premio['estado']) => {
    try {
      setSavingId(p.id);
      await axiosInstance.post(`api/admin/cambiar-estado-premio/${p.id}/`, { nuevo_estado });
      await fetchData();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado del premio");
    } finally {
      setSavingId(null);
    }
  };

  const calcularResultados = async () => {
    try {
      setCalculando(true);
      setError(null);
      const res = await axiosInstance.get<ResultadoPublico[]>("api/resultados/");
      // Nota: GET /api/resultados/ devuelve la estructura de resultados calculados
      setResultadosVista(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron calcular los resultados (revisa permisos o datos)");
    } finally {
      setCalculando(false);
    }
  };

  const publicarResultados = async () => {
    try {
      setPublicando(true);
      setError(null);
      await axiosInstance.post("api/resultados/");
      await calcularResultados();
    } catch (e) {
      console.error(e);
      setError("No se pudieron publicar los resultados");
    } finally {
      setPublicando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (!isAuthenticated) return (
    <div className="p-6 max-w-4xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Acceso no autorizado</h2>
      <p className="mb-4">Debes iniciar sesión como administrador para acceder a esta sección.</p>
      <button 
        onClick={() => window.location.href = '/login'}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Iniciar sesión
      </button>
    </div>
  );
  
  // Estado actual del sistema
  const faseActual = estadisticas?.fase_actual || 'preparacion';
  const puedeAvanzarFase = estadisticas?.puede_avanzar_fase || false;
  const puedePublicar = estadisticas?.puede_publicar_resultados || false;
  const totalUsuarios = estadisticas?.total_usuarios || 0;
  const totalVotantes = estadisticas?.total_votantes || 0;
  const porcentajeParticipacion = estadisticas?.porcentaje_participacion || 0;

  return (
    <>
      <Header />
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Panel de Control de Votaciones</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => window.location.assign('/admin')}>Admin Hub</Button>
            <Button variant="secondary" onClick={fetchData}>Refrescar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">Estado Actual</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-50">{getNombreFase(faseActual)}</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300">{faseActual.toUpperCase().replace('_',' ')}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{getDescripcionFase(faseActual)}</p>
              {(faseActual === 'votacion_1' || faseActual === 'votacion_2') && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-zinc-400 mb-1">
                    <span>Participación:</span>
                    <span className="font-medium text-zinc-200">{porcentajeParticipacion}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${porcentajeParticipacion}%` }} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{totalVotantes} de {totalUsuarios} usuarios han votado</p>
                </div>
              )}
              {faseActual === 'finalizado' && resultadosVista && (
                <div className="mt-4 p-3 bg-green-900/20 text-green-300 text-sm rounded-md border border-green-800/40">
                  <p>Los resultados finales han sido publicados y son visibles para todos los usuarios.</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Resumen de Votación</h3>
              <div className="space-y-3 text-zinc-300">
                <div className="flex justify-between"><span>Usuarios registrados:</span><span className="font-medium">{totalUsuarios}</span></div>
                {(faseActual === 'votacion_1' || faseActual === 'votacion_2' || faseActual === 'finalizado') && (
                  <div className="flex justify-between"><span>Han votado:</span><span className="font-medium">{totalVotantes} ({porcentajeParticipacion}%)</span></div>
                )}
                <div className="flex justify-between"><span>Premios totales:</span><span className="font-medium">{estadisticas?.premios_totales || 0}</span></div>
                <div className="flex justify-between"><span>Premios abiertos:</span><span className="font-medium text-green-400">{estadisticas?.premios_abiertos || 0}</span></div>
                <div className="flex justify-between"><span>Premios finalizados:</span><span className="font-medium text-amber-300">{estadisticas?.premios_cerrados || 0}</span></div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Acciones</h3>
              {faseActual !== 'finalizado' && (
                <Button
                  onClick={() => confirmarAccion(`¿Avanzar a la siguiente fase?`, avanzarFase)}
                  disabled={!puedeAvanzarFase || actualizandoFase}
                >
                  {actualizandoFase ? 'Procesando...' : (estadisticas?.proxima_fase ? `Avanzar a ${getNombreFase(estadisticas.proxima_fase)}` : 'Finalizar votaciones')}
                </Button>
              )}
              <div className="mt-3">
                <Button variant="secondary" onClick={calcularResultados} disabled={calculando}>
                  {calculando ? 'Calculando...' : 'Calcular resultados'}
                </Button>
              </div>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  onClick={() => confirmarAccion('¿Publicar resultados de todos los premios?', publicarResultados)}
                  disabled={!puedePublicar || publicando}
                >
                  {publicando ? 'Publicando...' : 'Publicar resultados'}
                </Button>
              </div>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  onClick={() => confirmarAccion('Esto borrará TODOS los votos y reiniciará las fases a preparación. ¿Confirmas reiniciar la gala?', resetGala)}
                  disabled={reseteando}
                  className="border-red-600/40 text-red-300 hover:text-red-200 hover:border-red-500/50"
                >
                  {reseteando ? 'Reiniciando…' : 'Reiniciar gala (borrar votos)'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mb-8">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-100">Gestión de Premios</h2>
              <div className="text-sm text-zinc-400">Control de estado por premio</div>
            </div>
            {fetching ? (
              <div className="p-6 text-center text-zinc-400">Cargando premios...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-400">
                <p>{error}</p>
                <Button variant="secondary" onClick={fetchData} className="mt-2">Reintentar</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase text-zinc-400">
                      <th className="px-4 py-2">Premio</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2">Ronda</th>
                      <th className="px-4 py-2">Participación</th>
                      <th className="px-4 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premios.map((p) => (
                      <tr key={p.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                        <td className="px-4 py-2 align-top">
                          <div className="text-sm font-medium text-zinc-100">{p.nombre}</div>
                          {p.descripcion && <div className="text-sm text-zinc-400">{p.descripcion}</div>}
                        </td>
                        <td className="px-4 py-2 align-top">
                          <span className="px-2 py-1 text-xs rounded-full border border-zinc-700 text-zinc-300">
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2 align-top">
                          <span className="px-2 py-1 text-xs rounded-full border border-zinc-700 text-zinc-300">Ronda {p.ronda_actual}</span>
                        </td>
                        <td className="px-4 py-2 align-top">
                          <div className="w-40 bg-zinc-800 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${p.porcentaje_participacion || 0}%` }} />
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">{p.total_votos || 0} votos • {p.porcentaje_participacion || 0}%</div>
                        </td>
                        <td className="px-4 py-2 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <select
                              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1"
                              value={p.estado}
                              onChange={(e) => cambiarEstadoPremio(p, e.target.value as Premio['estado'])}
                              disabled={savingId === p.id}
                            >
                              <option value="preparacion">Preparación</option>
                              <option value="votacion_1">Votación R1</option>
                              <option value="votacion_2">Votación R2</option>
                              <option value="finalizado">Finalizado</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {resultadosVista && resultadosVista.length > 0 && (
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-100">Vista previa de resultados</h2>
                <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                  {resultadosVista[0]?.fecha_resultados_publicados ? 'Publicado' : 'No publicado'}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                {resultadosVista[0]?.fecha_resultados_publicados 
                  ? `Publicado el ${new Date(resultadosVista[0].fecha_resultados_publicados).toLocaleString()}`
                  : 'Los resultados aún no son públicos'}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {resultadosVista.map((r) => {
                  const items = [
                    r.ganador_oro ? { pos: 1, nombre: r.ganador_oro.nombre, valor: r.ganador_oro.votos } : null,
                    r.ganador_plata ? { pos: 2, nombre: r.ganador_plata.nombre, valor: r.ganador_plata.votos } : null,
                    r.ganador_bronce ? { pos: 3, nombre: r.ganador_bronce.nombre, valor: r.ganador_bronce.votos } : null,
                  ].filter(Boolean) as Array<{ pos: number; nombre: string; valor: number }>;
                  const etiquetaValor = (valor: number) => (faseActual === 'votacion_2' || faseActual === 'finalizado') ? `${valor} pts` : `${valor} votos`;
                  return (
                    <div key={r.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                        <h3 className="text-lg font-semibold">{r.nombre}</h3>
                        {r.descripcion && <p className="text-sm text-blue-100 mt-1">{r.descripcion}</p>}
                      </div>
                      <div className="p-4">
                        {items.length > 0 ? (
                          <ul className="space-y-2">
                            {items.slice(0, 5).map((it) => (
                              <li key={`${r.id}-${it.pos}`} className="flex items-center gap-3 p-2 rounded border border-zinc-800 bg-zinc-900/40">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  it.pos === 1 ? 'bg-yellow-500' : it.pos === 2 ? 'bg-zinc-400' : 'bg-amber-600'
                                }`}>{it.pos}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-zinc-100 truncate">{it.nombre}</p>
                                </div>
                                <div className="text-xs text-zinc-400 whitespace-nowrap">{etiquetaValor(it.valor)}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-4 text-zinc-500 text-sm">Aún no hay resultados disponibles para este premio.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </main>
      {/* Modal de confirmación */}
      {mostrarConfirmacion && accionConfirmar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar acción</h3>
            <p className="text-gray-600 mb-6">{mensajeConfirmacion}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  accionConfirmar();
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}
