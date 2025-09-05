'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useRouter } from 'next/navigation';

interface Nominado {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
}

interface Premio {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_entrega: string | null;
  activo: boolean;
  ronda_actual: number;
  estado: string;
  nominados: Nominado[];
  ya_votado_por_usuario: boolean;
}

export default function DashboardPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const router = useRouter();
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loadingPremios, setLoadingPremios] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchPremios = useCallback(async () => {
    try {
      setLoadingPremios(true);
      const response = await axiosInstance.get('api/premios/');
      setPremios(response.data);
    } catch (err) {
      console.error('Error fetching premios:', err);
      setError('Error al cargar los premios disponibles');
    } finally {
      setLoadingPremios(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPremios();
    }
  }, [isAuthenticated, fetchPremios]);

  const handleVotar = (premioId: string) => {
    router.push(`/votar/${premioId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Se redirigirá automáticamente
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
                  <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - Gala Premios Piorn</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/perfil')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Mi Perfil
            </button>
            <button
              onClick={() => router.push('/logout')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Premios Disponibles para Votar
          </h2>
          <p className="text-gray-600">
            Aquí puedes ver todos los premios que están abiertos para votación.
          </p>
        </div>

        {loadingPremios ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">Cargando premios...</div>
          </div>
        ) : premios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No hay premios disponibles para votar en este momento.
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {premios.map((premio) => (
              <div
                key={premio.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{premio.nombre}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      premio.estado === 'abierto' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {premio.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>

                  {premio.descripcion && (
                    <p className="text-gray-600 text-sm mb-4">{premio.descripcion}</p>
                  )}

                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">
                      <strong>Ronda:</strong> {premio.ronda_actual}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <strong>Nominados:</strong> {premio.nominados.length}
                    </div>
                    {premio.fecha_entrega && (
                      <div className="text-sm text-gray-500">
                        <strong>Entrega:</strong> {new Date(premio.fecha_entrega).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {premio.ya_votado_por_usuario ? (
                        <span className="text-green-600 font-medium">✓ Ya votaste</span>
                      ) : (
                        <span className="text-blue-600 font-medium">Pendiente de votar</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleVotar(premio.id)}
                      disabled={premio.estado !== 'abierto' || premio.ya_votado_por_usuario}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        premio.estado === 'abierto' && !premio.ya_votado_por_usuario
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {premio.estado === 'abierto' && !premio.ya_votado_por_usuario
                        ? 'Votar'
                        : premio.ya_votado_por_usuario
                        ? 'Ya votaste'
                        : 'Cerrado'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
