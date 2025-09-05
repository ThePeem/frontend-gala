'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../utils/AuthContext';
import { useRouter } from 'next/navigation';

interface Voto {
  id: string;
  premio_nombre: string;
  nominado_nombre: string;
  fecha_voto: string;
  ronda: number;
  orden_ronda2?: number;
}

interface Usuario {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  foto_perfil?: string;
  verificado: boolean;
}

export default function PerfilPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const router = useRouter();
  
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [votos, setVotos] = useState<Voto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setVotos(votosResponse.data);
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

  const handleLogout = () => {
    // El logout se maneja en AuthContext
    router.push('/login');
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Información del Usuario */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Información Personal</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Foto de Perfil */}
            <div className="text-center">
              {usuario.foto_perfil ? (
                <Image
                  src={usuario.foto_perfil}
                  alt="Foto de perfil"
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200"
                  unoptimized
                />
              ) : (
                <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-500">
                    {usuario.first_name?.[0]?.toUpperCase() || usuario.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Cambiar Foto
              </button>
            </div>

            {/* Datos del Usuario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <p className="text-gray-900 font-medium">{usuario.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <p className="text-gray-900">{usuario.first_name} {usuario.last_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{usuario.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Verificación</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  usuario.verificado 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {usuario.verificado ? 'Verificado' : 'Pendiente de verificación'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mis nominaciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis nominaciones</h2>
          
          {votos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-4">
                No tienes nominaciones actualmente
              </div>
              <button
                onClick={() => router.push('/votar')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Ir a votar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {votos.map((voto) => (
                <div
                  key={voto.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {voto.premio_nombre}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        Nominado: <strong>{voto.nominado_nombre}</strong>
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Ronda: {voto.ronda}</span>
                        {voto.orden_ronda2 && (
                          <span>Posición: {voto.orden_ronda2}</span>
                        )}
                        <span>
                          Fecha: {new Date(voto.fecha_voto).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        voto.ronda === 1 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        Ronda {voto.ronda}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Estadísticas</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {votos.length}
              </div>
              <div className="text-gray-600">Total de Votos</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {votos.filter(v => v.ronda === 1).length}
              </div>
              <div className="text-gray-600">Votos Ronda 1</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {votos.filter(v => v.ronda === 2).length}
              </div>
              <div className="text-gray-600">Votos Ronda 2</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
