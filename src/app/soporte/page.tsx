// src/app/soporte/page.tsx
"use client";

import { useAuth } from "@/utils/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SoportePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="p-6">Cargando...</p>;
  }

  if (!isAuthenticated) {
    return <p className="p-6">Debes iniciar sesión para ver esta página.</p>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow p-6">
        <h1 className="text-2xl font-bold mb-4">Soporte</h1>
        <p>Página de soporte: contacto y ayuda para los usuarios.</p>
      </main>

      <Footer />
    </div>
  );
}
