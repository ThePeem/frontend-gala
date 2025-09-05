'use client';

import Link from 'next/link';
import { useAuth } from '../utils/AuthContext';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-gray-100 border-b p-4">
      <nav className="max-w-5xl mx-auto flex justify-between items-center">
        {/* Logo o nombre de la gala */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          Gala PIORN
        </Link>

        {/* Menú de navegación */}
        <div className="flex gap-4">
          <Link href="/premios">Premios</Link>
          <Link href="/participantes">Participantes</Link>
          {isAuthenticated && <Link href="/votar">Votar</Link>}
          {isAuthenticated && <Link href="/perfil">Mi Perfil</Link>}
        </div>

        {/* Botones de acción (login / logout) */}
        <div>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
