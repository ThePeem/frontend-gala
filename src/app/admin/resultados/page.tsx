// src/app/admin/resultados/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/utils/AuthContext";

type EstadoFase = 'preparacion' | 'votacion_1' | 'votacion_2' | 'finalizado';

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: 'abierto' | 'cerrado';
  ronda_actual: number;
  total_votos: number;
  total_votantes: number;
  porcentaje_participacion: number;
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

  const setEstado = async (p: Premio, estado: "abierto" | "cerrado") => {
    try {
      setSavingId(p.id);
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${p.id}/`, { estado });
      setPremios(prev => prev.map(x => x.id === p.id ? res.data : x));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el estado");
    } finally {
      setSavingId(null);
    }
  };

  const setRonda = async (p: Premio, ronda_actual: number) => {
    try {
      setSavingId(p.id);
      const res = await axiosInstance.patch<Premio>(`api/admin/premios/${p.id}/`, { ronda_actual });
      setPremios(prev => prev.map(x => x.id === p.id ? res.data : x));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la ronda");
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
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Encabezado y estado actual */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Panel de Control de Votaciones</h1>
            <p className="text-gray-600">Gestiona las fases de votación y visualiza los resultados</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchData()} 
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.884.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* Estado actual del sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Estado Actual</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{getNombreFase(faseActual)}</span>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {faseActual.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{getDescripcionFase(faseActual)}</p>
            
            {faseActual === 'votacion_1' || faseActual === 'votacion_2' ? (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Participación:</span>
                  <span className="font-medium">{porcentajeParticipacion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${porcentajeParticipacion}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{totalVotantes} de {totalUsuarios} usuarios han votado</p>
              </div>
            ) : null}
            
            {faseActual === 'finalizado' && resultadosVista && (
              <div className="mt-4 p-3 bg-green-50 text-green-800 text-sm rounded-md">
                <p>✅ Los resultados finales han sido publicados y son visibles para todos los usuarios.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Votación</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Usuarios registrados:</span>
                <span className="font-medium">{totalUsuarios}</span>
              </div>
              {(faseActual === 'votacion_1' || faseActual === 'votacion_2' || faseActual === 'finalizado') && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Han votado:</span>
                  <span className="font-medium">{totalVotantes} ({porcentajeParticipacion}%)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Premios totales:</span>
                <span className="font-medium">{estadisticas?.premios_totales || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Premios abiertos:</span>
                <span className="font-medium text-green-600">{estadisticas?.premios_abiertos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Premios cerrados:</span>
                <span className="font-medium text-red-600">{estadisticas?.premios_cerrados || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
            
            {faseActual !== 'finalizado' && (
              <button
                onClick={() => confirmarAccion(
                  `¿Estás seguro de que deseas avanzar a la ${estadisticas?.proxima_fase ? 'siguiente fase' : 'la fase final'}? Esta acción no se puede deshacer.`,
                  avanzarFase
                )}
                disabled={!puedeAvanzarFase || actualizandoFase}
                className={`w-full mb-3 px-4 py-2 rounded-md text-white font-medium flex items-center justify-center gap-2 ${
                  puedeAvanzarFase 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {actualizandoFase ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    {estadisticas?.proxima_fase 
                      ? `Avanzar a ${getNombreFase(estadisticas.proxima_fase)}` 
                      : 'Finalizar votaciones'}
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={calcularResultados}
              disabled={calculando}
              className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              {calculando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Calcular resultados
                </>
              )}
            </button>
            
            <button
              onClick={() => confirmarAccion(
                '¿Estás seguro de que deseas publicar los resultados? Esta acción hará que los resultados sean visibles para todos los usuarios.',
                publicarResultados
              )}
              disabled={!puedePublicar || publicando}
              className={`w-full px-4 py-2 rounded-md text-white font-medium flex items-center justify-center gap-2 ${
                puedePublicar 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {publicando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publicando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Publicar resultados
                </>
              )}
            </button>
          </div>
        </div>

        {fetching && <p>Cargando premios...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* Lista de premios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Gestión de Premios</h2>
            <p className="text-sm text-gray-600">Controla el estado de votación de cada categoría</p>
          </div>
          
          {fetching ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando premios...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>{error}</p>
              <button 
                onClick={fetchData}
                className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {premios.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay premios disponibles.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premio</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ronda</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participación</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {premios.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                            {p.descripcion && (
                              <div className="text-sm text-gray-500">{p.descripcion}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              p.estado === 'abierto' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {p.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              p.ronda_actual === 1 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              Ronda {p.ronda_actual}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${p.porcentaje_participacion || 0}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {p.total_votos || 0} votos • {p.porcentaje_participacion || 0}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1">
                              <button 
                                onClick={() => setEstado(p, p.estado === 'abierto' ? 'cerrado' : 'abierto')} 
                                disabled={savingId === p.id}
                                className={`px-2 py-1 text-xs rounded ${
                                  p.estado === 'abierto'
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                } ${savingId === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {p.estado === 'abierto' ? 'Cerrar' : 'Abrir'}
                              </button>
                              <button 
                                onClick={() => setRonda(p, p.ronda_actual === 1 ? 2 : 1)} 
                                disabled={savingId === p.id}
                                className={`px-2 py-1 text-xs rounded ${
                                  p.ronda_actual === 1 
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                } ${savingId === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                Ronda {p.ronda_actual === 1 ? 2 : 1}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vista previa de resultados */}
        {resultadosVista && resultadosVista.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Vista previa de resultados</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {resultadosVista[0]?.fecha_resultados_publicados ? 'Publicado' : 'No publicado'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {resultadosVista[0]?.fecha_resultados_publicados 
                  ? `Publicado el ${new Date(resultadosVista[0].fecha_resultados_publicados).toLocaleString()}`
                  : 'Los resultados aún no son públicos'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {resultadosVista.map((r) => (
                <div key={r.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                    <h3 className="text-lg font-semibold">{r.nombre}</h3>
                    {r.descripcion && <p className="text-sm text-blue-100 mt-1">{r.descripcion}</p>}
                    <div className="mt-2 text-xs text-blue-200">
                      {r.total_votos} votos • {r.porcentaje_participacion}% participación
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {r.ganador_oro && (
                      <div className="mb-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">1</div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-800">{r.ganador_oro.nombre}</p>
                            <p className="text-xs text-yellow-600">{r.ganador_oro.votos} votos</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {r.ganador_plata && (
                      <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">2</div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-800">{r.ganador_plata.nombre}</p>
                            <p className="text-xs text-gray-600">{r.ganador_plata.votos} votos</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {r.ganador_bronce && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">3</div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-amber-800">{r.ganador_bronce.nombre}</p>
                            <p className="text-xs text-amber-600">{r.ganador_bronce.votos} votos</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!r.ganador_oro && !r.ganador_plata && !r.ganador_bronce && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Aún no hay resultados disponibles para este premio.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
