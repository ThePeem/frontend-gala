// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

type Perfil = { is_staff: boolean };

export default function AdminPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      const checkAdmin = async () => {
        try {
          const res = await axiosInstance.get<Perfil>('api/mi-perfil/');
          setIsAdmin(!!res.data.is_staff);
          if (!res.data.is_staff) router.push('/');
        } catch (e) {
          console.error(e);
          setError('No se pudo verificar el rol de administrador');
        }
      };
      checkAdmin();
    }
  }, [isAuthenticated, loading, axiosInstance, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>
        <p className="mb-6 text-gray-700">
          Aquí estará el acceso a las herramientas de gestión del sistema: usuarios, nominaciones, premios y resultados.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="p-4 border rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
            <button
              onClick={() => router.push('/admin/usuarios')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ir a Usuarios
            </button>
          </div>

          <div className="p-4 border rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Premios</h2>
            <button
              onClick={() => router.push('/admin/premios')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ir a Premios
            </button>
          </div>

          <div className="p-4 border rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Nominados</h2>
            <button
              onClick={() => router.push('/admin/nominados')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ir a Nominados
            </button>
          </div>

          <div className="p-4 border rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Resultados</h2>
            <button
              onClick={() => router.push('/admin/resultados')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ir a Resultados
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
