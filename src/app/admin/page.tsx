// src/app/admin/page.tsx
// nada mas
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
      <main className="flex-grow p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Panel de Administración</h1>
        <p className="mb-6 text-zinc-400">Accesos a herramientas de gestión del sistema.</p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Usuarios</h2>
              <p className="text-zinc-400 mb-4">Verificación y gestión de cuentas.</p>
              <Button onClick={() => router.push('/admin/usuarios')}>Ir a Usuarios</Button>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Premios</h2>
              <p className="text-zinc-400 mb-4">Crear/editar premios y sus imágenes.</p>
              <Button onClick={() => router.push('/admin/premios')}>Ir a Premios</Button>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Nominados</h2>
              <p className="text-zinc-400 mb-4">Gestiona nominaciones directas e indirectas.</p>
              <Button onClick={() => router.push('/admin/nominados')}>Ir a Nominados</Button>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Resultados</h2>
              <p className="text-zinc-400 mb-4">Cálculo y publicación de ganadores.</p>
              <Button onClick={() => router.push('/admin/resultados')}>Ir a Resultados</Button>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Sugerencias</h2>
              <p className="text-zinc-400 mb-4">Revisa y gestiona las sugerencias enviadas por usuarios.</p>
              <Button onClick={() => router.push('/admin/sugerencias')}>Ir a Sugerencias</Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
