// src/app/votar/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Tipos de ítems para el drag and drop
const ITEM_TYPES = {
  NOMINADO: 'nominado',
};

interface Usuario {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  foto_perfil: string | null;
  foto_url: string | null;
}

interface Nominado {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
  usuario_id?: string;
  usuarios_vinculados_detalles?: Usuario[];
}

interface Premio {
  id: string;
  nombre: string;
  descripcion: string | null;
  ronda_actual: number;
  estado: string;
  nominados: Nominado[];
  max_votos_ronda1?: number;
  max_votos_ronda2?: number;
  tipo?: 'individual' | 'grupal';
  fecha_inicio_ronda1?: string;
  fecha_fin_ronda1?: string;
  fecha_inicio_ronda2?: string;
  fecha_fin_ronda2?: string;
}

interface VotoData {
  premio: string;
  nominado: string;
  ronda: number;
  orden_ronda2?: number;
}

type OrdenPodium = 'oro' | 'plata' | 'bronce';

const POSICIONES_PODIO: OrdenPodium[] = ['oro', 'plata', 'bronce'];

// Estilos para las posiciones del podio
const ESTILOS_PODIO = {
  oro: {
    bg: 'bg-gradient-to-b from-yellow-100 to-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    icon: '🥇',
    label: 'Oro',
  },
  plata: {
    bg: 'bg-gradient-to-b from-gray-100 to-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: '🥈',
    label: 'Plata',
  },
  bronce: {
    bg: 'bg-gradient-to-b from-amber-100 to-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: '🥉',
    label: 'Bronce',
  },
  default: {
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: '',
    label: 'Sin posición',
  },
};

// Componente para los elementos arrastrables
interface NominadoItemProps {
  nominado: Nominado;
  estaSeleccionado: boolean;
  onClick: () => void;
  onDrop: (id: string, posicion: OrdenPodium) => void;
  posicion?: OrdenPodium;
  esRonda2: boolean;
  esGrupal: boolean;
}

const NominadoItem = ({ 
  nominado, 
  estaSeleccionado, 
  onClick, 
  onDrop, 
  posicion,
  esRonda2,
  esGrupal 
}: NominadoItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPES.NOMINADO,
    item: { id: nominado.id },
    canDrag: esRonda2,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPES.NOMINADO,
    drop: (item: { id: string }) => {
      if (posicion) {
        onDrop(item.id, posicion);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const estilo = posicion ? ESTILOS_PODIO[posicion] : ESTILOS_PODIO.default;
  const estiloBase = `p-4 rounded-lg border-2 transition-all duration-200 ${estilo.border} ${estaSeleccionado ? 'ring-2 ring-blue-500' : ''} ${
    isOver ? 'scale-105' : ''
  } ${isDragging ? 'opacity-50' : 'opacity-100'}`;

  return (
    <div
      ref={ref}
      className={`${estiloBase} ${estilo.bg} ${esRonda2 ? 'cursor-move' : 'cursor-pointer'}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        {esRonda2 && posicion && (
          <span className="text-2xl mr-2" role="img" aria-label={estilo.label}>
            {estilo.icon}
          </span>
        )}
        <div className="flex-1">
          <h3 className={`font-medium ${estilo.text}`}>{nominado.nombre}</h3>
          {nominado.descripcion && (
            <p className="text-sm text-gray-500 mt-1">{nominado.descripcion}</p>
          )}
          {esGrupal && nominado.usuarios_vinculados_detalles && (
            <div className="mt-2 flex flex-wrap gap-2">
              {nominado.usuarios_vinculados_detalles.map(usuario => (
                <span 
                  key={usuario.id} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {usuario.first_name || usuario.username}
                </span>
              ))}
            </div>
          )}
        </div>
        {!esRonda2 && (
          <div className={`ml-2 w-5 h-5 rounded-full border-2 ${estaSeleccionado ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
            {estaSeleccionado && (
              <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Tipos para el DropTargetRef
interface DropTargetRef {
  (element: HTMLElement | null): void;
  drop?: () => { id: string };
  type?: string;
}

// Componente para las zonas de destino del podio
const PodiumSlot: React.FC<{ 
  posicion: OrdenPodium;
  children: React.ReactNode;
  onDrop: (id: string) => void;
}> = ({ 
  posicion, 
  children, 
  onDrop 
}) => {
  const [{ isOver }, dropRef] = useDrop<{ id: string }, void, { isOver: boolean }>({
    accept: ITEM_TYPES.NOMINADO,
    drop: (item) => onDrop(item.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Asegurar el tipado correcto para el ref
  const drop = dropRef as unknown as DropTargetRef;
  const estilo = ESTILOS_PODIO[posicion];
  
  return (
    <div 
      ref={drop}
      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
        isOver ? 'scale-105' : ''
      } ${estilo.bg} ${estilo.border} min-h-24 flex items-center justify-center`}
    >
      {children || (
        <div className="text-center">
          <div className="text-2xl">{estilo.icon}</div>
          <div className="text-sm font-medium mt-1">{estilo.label}</div>
        </div>
      )}
    </div>
  );
};

// Componente para manejar el backend correcto según el dispositivo
const DndContainer = ({ children }: { children: React.ReactNode }) => {
  if (isMobile) {
    return <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>{children}</DndProvider>;
  }
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
};

export default function VotarPage() {
  // Usar el hook useAuth con tipos seguros
  interface AuthContextType {
    isAuthenticated?: boolean;
    loading?: boolean;
    user?: { id: string } | null;
    axiosInstance?: {
      get: (url: string) => Promise<{ data: unknown }>;
      post: (url: string, data?: unknown) => Promise<{ data: unknown }>;
    };
    token?: string | null;
  }

  const auth = useAuth() as AuthContextType;
  
  const isAuthenticated = auth?.isAuthenticated || false;
  const loading = auth?.loading || false;
  const user = auth?.user || null;
  const token = auth?.token || null;
  // Remove unused axiosInstance since we're using fetch
  const router = useRouter();
  const params = useParams();
  const premioId = params.id as string;

  const [premio, setPremio] = useState<Premio | null>(null);
  const [loadingPremio, setLoadingPremio] = useState(true);
  const [votosSeleccionados, setVotosSeleccionados] = useState<string[]>([]);
  const [podium, setPodium] = useState<{ [key in OrdenPodium]?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [yaVoto, setYaVoto] = useState(false);
  const [estadoPremio, setEstadoPremio] = useState<string>('cargando...');

  const maxVotos = premio?.ronda_actual === 1 ? (premio.max_votos_ronda1 || 5) : 1;
  // Eliminamos la variable no utilizada
  // const votosRestantes = maxVotos - votosSeleccionados.length;
  const esRonda2 = premio?.ronda_actual === 2;
  const esGrupal = premio?.tipo === 'grupal';

  // Cargar votos previos del usuario
  const cargarVotosPrevios = useCallback(async (ronda: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mis-votos/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const votosPremio = data.find((v: { premio: string }) => v.premio === premioId);
        
        if (votosPremio) {
          if (ronda === 1 && votosPremio.ronda_1) {
            setVotosSeleccionados(votosPremio.ronda_1.map((v: { nominado: { id: string } }) => v.nominado.id));
          } else if (ronda === 2 && votosPremio.ronda_2) {
            const nuevoPodium: { [key in OrdenPodium]?: string } = {};
            votosPremio.ronda_2.forEach((voto: { orden: number; nominado: { id: string } }) => {
              if (voto.orden === 1) nuevoPodium.oro = voto.nominado.id;
              else if (voto.orden === 2) nuevoPodium.plata = voto.nominado.id;
              else if (voto.orden === 3) nuevoPodium.bronce = voto.nominado.id;
            });
            setPodium(nuevoPodium);
            setVotosSeleccionados(Object.values(nuevoPodium));
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar votos previos:', err);
    }
  }, [token, premioId]);

  // Verificar estado del voto
  const verificarEstadoVoto = useCallback(async () => {
    if (!premioId || !token) return null;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verificar-voto/${premioId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setYaVoto(data.ya_voto);
        setEstadoPremio(data.estado_premio || 'Desconocido');
        
        // Si ya votó, cargar sus votos para mostrarlos
        if (data.ya_voto) {
          await cargarVotosPrevios(data.ronda_actual);
        }
        
        return data;
      }
    } catch (err) {
      console.error('Error al verificar estado del voto:', err);
    }
    return null;
  }, [premioId, token, cargarVotosPrevios]);

  // Cargar datos del premio
  const fetchPremio = useCallback(async () => {
    if (!token) {
      // Evita quedar en estado de carga infinito si no hay token todavía
      setLoadingPremio(false);
      return;
    }

    try {
      setLoadingPremio(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/premios/${premioId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPremio(data);
        
        // Verificar estado del voto
        await verificarEstadoVoto();
      } else {
        throw new Error('Error al cargar el premio');
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error al cargar los datos del premio");
    } finally {
      setLoadingPremio(false);
    }
  }, [token, premioId, verificarEstadoVoto]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated && premioId) {
      fetchPremio();
    }
  }, [isAuthenticated, loading, router, premioId, fetchPremio]);

  // Manejar selección de nominados (Ronda 1)
  const handleNominadoClick = useCallback((nominadoId: string) => {
    if (!premio) return;

    // Evitar auto-voto
    if (user?.id && premio.nominados.find(n => n.id === nominadoId)?.usuario_id === user.id) {
      setError("No puedes votarte a ti mismo");
      return;
    }

    if (esRonda2) {
      // En ronda 2, solo se puede seleccionar un nominado
      setVotosSeleccionados(prev => 
        prev.includes(nominadoId) ? [] : [nominadoId]
      );
    } else {
      // En ronda 1, se pueden seleccionar varios
      setVotosSeleccionados(prev => {
        if (prev.includes(nominadoId)) {
          return prev.filter(id => id !== nominadoId);
        } else if (prev.length < maxVotos) {
          return [...prev, nominadoId];
        }
        return prev;
      });
    }
  }, [premio, user?.id, esRonda2, maxVotos]);

  // Manejar arrastrar y soltar en el podio (Ronda 2)
  const handleDropOnPodium = useCallback((id: string, posicion: OrdenPodium) => {
    if (yaVoto) return;

    setPodium(prevPodium => {
      const newPodium = { ...prevPodium };
      
      // Quitar de otras posiciones si ya estaba
      (Object.keys(newPodium) as OrdenPodium[]).forEach(key => {
        if (newPodium[key] === id) {
          delete newPodium[key];
        }
      });
      
      // Asignar a la nueva posición
      newPodium[posicion] = id;
      
      // Actualizar votos seleccionados
      setVotosSeleccionados(Object.values(newPodium).filter(Boolean) as string[]);
      
      return newPodium;
    });
  }, [yaVoto]);

  // Obtener el nombre de un nominado por su ID
  const getNombreNominado = useCallback((id: string) => {
    return premio?.nominados.find(n => n.id === id)?.nombre || 'Desconocido';
  }, [premio?.nominados]);

  // Enviar votos
  const enviarVotos = async () => {
    if (!premio) return;
    
    // Validar según la ronda
    if (premio.ronda_actual === 1 && votosSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un nominado");
      return;
    } else if (premio.ronda_actual === 2 && Object.values(podium).filter(Boolean).length === 0) {
      setError("Debes asignar al menos una posición en el podio");
      return;
    }

    setEnviando(true);
    setError(null);
    setSuccess(null);

    try {
      const votos: VotoData[] = [];
      
      // Preparar votos según la ronda
      if (premio.ronda_actual === 1) {
        // Ronda 1: votos múltiples sin orden
        votosSeleccionados.forEach(nominadoId => {
          votos.push({
            premio: premio.id,
            nominado: nominadoId,
            ronda: 1,
          });
        });
      } else {
        // Ronda 2: votos con orden en el podio
        if (podium.oro) {
          votos.push({
            premio: premio.id,
            nominado: podium.oro,
            ronda: 2,
            orden_ronda2: 1,
          });
        }
        if (podium.plata) {
          votos.push({
            premio: premio.id,
            nominado: podium.plata,
            ronda: 2,
            orden_ronda2: 2,
          });
        }
        if (podium.bronce) {
          votos.push({
            premio: premio.id,
            nominado: podium.bronce,
            ronda: 2,
            orden_ronda2: 3,
          });
        }
      }

      // Enviar votos
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/votar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(votos),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar los votos');
      }

      // Éxito
      setYaVoto(true);
      setSuccess('¡Tu voto ha sido registrado correctamente!');
      
      // Actualizar estado local
      if (premio.ronda_actual === 2) {
        // Si es la ronda 2, marcar como finalizado
        setEstadoPremio('finalizado');
      } else {
        // Si es la ronda 1, actualizar el estado para reflejar el voto
        setEstadoPremio('votacion_1');
      }
      
    } catch (err) {
      console.error('Error al enviar votos:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar tu voto');
    } finally {
      setEnviando(false);
    }
  };

  // Si está cargando
  if (loading || loadingPremio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando premio...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Si hay un error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/premios')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a la lista de premios
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Si el premio no está en estado de votación
  if (premio && !premio.estado.startsWith('votacion_')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{premio.nombre}</h1>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {premio.estado === 'preparacion' 
                      ? 'Este premio aún no está disponible para votar.'
                      : premio.estado === 'finalizado'
                      ? 'Las votaciones para este premio han finalizado.'
                      : 'Las votaciones no están disponibles en este momento.'}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              El estado actual es: <span className="font-semibold">{estadoPremio}</span>
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/premios')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver a la lista de premios
              </button>
              {premio.estado === 'finalizado' && (
                <button
                  onClick={() => router.push(`/resultados/${premio.id}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ver resultados
                </button>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Si el usuario ya votó en esta ronda
  if (yaVoto && premio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">¡Gracias por tu voto!</h1>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Ya has emitido tu voto en la {premio.ronda_actual === 1 ? 'primera' : 'segunda'} ronda de votación para este premio.
                  </p>
                </div>
              </div>
            </div>
            
            {premio.ronda_actual === 2 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tu podio:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {POSICIONES_PODIO.map(pos => {
                    const nominadoId = podium[pos];
                    if (!nominadoId) return null;
                    
                    return (
                      <div 
                        key={pos}
                        className={`p-4 rounded-lg border-2 ${ESTILOS_PODIO[pos].bg} ${ESTILOS_PODIO[pos].border} ${ESTILOS_PODIO[pos].text}`}
                      >
                        <div className="text-2xl">{ESTILOS_PODIO[pos].icon}</div>
                        <div className="font-medium">{ESTILOS_PODIO[pos].label}</div>
                        <div className="text-sm mt-1">{getNombreNominado(nominadoId)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              Estado actual: <span className="font-semibold">{estadoPremio}</span>
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => router.push('/premios')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver más premios
              </button>
              <button
                onClick={() => router.push('/perfil')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Ver mi perfil
              </button>
              {premio.ronda_actual === 2 && (
                <button
                  onClick={() => router.push(`/resultados/${premio.id}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ver resultados
                </button>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Si no hay premio cargado
  if (!premio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-12">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 inline-block">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">No se pudo cargar la información del premio.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/premios')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a la lista de premios
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Renderizar el formulario de votación
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Encabezado */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{premio.nombre}</h1>
                {premio.descripcion && (
                  <p className="text-gray-600">{premio.descripcion}</p>
                )}
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ml-2">
                {estadoPremio}
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-500">
              Ronda {premio.ronda_actual} de 2 • {premio.nominados.length} nominados • 
              {premio.ronda_actual === 1 ? ' Selecciona hasta 5 nominados' : ' Asigna oro, plata y bronce'}
            </div>
            
            {premio.ronda_actual === 1 ? (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                <p>Selecciona hasta 5 nominados para la primera ronda.</p>
                <p className="text-xs text-gray-500 mt-1">Los más votados pasarán a la ronda final.</p>
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-600 bg-amber-50 p-2 rounded">
                <p>Asigna oro, plata y bronce a los finalistas.</p>
                <p className="text-xs text-gray-500 mt-1">El oro suma 3 puntos, la plata 2 y el bronce 1.</p>
              </div>
            )}
            
            {success && (
              <div className="mt-3 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <DndContainer>
            <div className="space-y-6">
              {/* Sección del podio (solo en ronda 2) */}
              {premio.ronda_actual === 2 && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Arrastra los nominados al podio</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {POSICIONES_PODIO.map(posicion => {
                      const nominadoId = podium[posicion];
                      const nominado = premio.nominados.find(n => n.id === nominadoId);
                      
                      return (
                        <PodiumSlot 
                          key={posicion} 
                          posicion={posicion}
                          onDrop={(id) => handleDropOnPodium(id, posicion)}
                        >
                          {nominado && (
                            <div className="text-center">
                              <div className="text-2xl">{ESTILOS_PODIO[posicion].icon}</div>
                              <div className="font-medium">{nominado.nombre}</div>
                              {esGrupal && nominado.usuarios_vinculados_detalles && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {nominado.usuarios_vinculados_detalles.map(u => u.first_name || u.username).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </PodiumSlot>
                      );
                    })}
                  </div>
                  
                  <div className="text-sm text-gray-500 flex items-center justify-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Arrastra los nominados a las posiciones del podio
                  </div>
                </div>
              )}

              {/* Lista de nominados */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {premio.ronda_actual === 1 ? 'Selecciona hasta 5 nominados' : 'Finalistas'}
                  </h2>
                  {premio.ronda_actual === 1 && (
                    <span className="text-sm text-gray-500">
                      {votosSeleccionados.length} de {maxVotos} seleccionados
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  {premio.nominados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay nominados disponibles para este premio.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {premio.nominados.map(nominado => {
                        const estaSeleccionado = votosSeleccionados.includes(nominado.id);
                        const posicion = Object.entries(podium).find(([, id]) => id === nominado.id)?.[0] as OrdenPodium | undefined;
                        
                        return (
                          <NominadoItem
                            key={nominado.id}
                            nominado={nominado}
                            estaSeleccionado={estaSeleccionado}
                            onClick={() => handleNominadoClick(nominado.id)}
                            onDrop={handleDropOnPodium}
                            posicion={posicion}
                            esRonda2={esRonda2}
                            esGrupal={esGrupal}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de envío */}
              <div className="flex justify-end">
                <button
                  onClick={enviarVotos}
                  disabled={enviando || (esRonda2 ? Object.values(podium).filter(Boolean).length === 0 : votosSeleccionados.length === 0)}
                  className={`px-6 py-2 rounded-lg text-white font-medium ${
                    enviando || (esRonda2 ? Object.values(podium).filter(Boolean).length === 0 : votosSeleccionados.length === 0)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  {enviando ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    `Votar${esRonda2 ? ' en el podio' : ''}`
                  )}
                </button>
              </div>
            </div>
          </DndContainer>
        </div>
      </main>
      <Footer />
    </div>
  );
}
