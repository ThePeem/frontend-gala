"use client";

import { useState } from "react";
import { useAuth } from "@/utils/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    setError(null);
    const res = await login(username, password);
    if (!res.success) {
      setError(res.error?.detail || "Credenciales inválidas. Por favor, inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6">
      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-amber-400/0 to-amber-500/10"></div>

          <header className="relative">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">Iniciar Sesión</h2>
            <p className="mt-1 text-center text-sm text-zinc-400">Entra para votar en los premios</p>
          </header>

          <form className="relative mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-zinc-200">
                Usuario
              </label>
              <input
                type="text"
                id="username"
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="Introduzca su nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-200">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !username || !password}
              className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg transition duration-300 ease-out hover:from-amber-400 hover:to-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="relative mt-4">
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-xs uppercase tracking-wider text-zinc-500">O puedes Iniciar sesión con</span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                title="Próximamente: Google Sign-In"
                disabled
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.602 31.742 29.268 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.367 1.054 7.327 2.773l5.657-5.657C33.441 6.053 28.973 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.74 16.41 19.03 13 24 13c2.803 0 5.367 1.054 7.327 2.773l5.657-5.657C33.441 6.053 28.973 4 24 4c-7.9 0-14.646 4.564-17.694 10.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.977 13.409-5.192l-6.191-5.238C29.268 35 24.935 36.742 20 36.742c-5.22 0-9.64-3.018-11.642-7.389l-6.616 5.1C5.689 39.35 14.229 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.616 3.742-5.95 7-11.303 7-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.367 1.054 7.327 2.773l5.657-5.657C33.441 6.053 28.973 4 24 4c-7.9 0-14.646 4.564-17.694 10.691z"/>
                </svg>
                Google
              </button>
            </div>
          </div>

          <p className="relative mt-6 text-center text-sm text-zinc-400">
            ¿No tienes cuenta?
            <a href="/register" className="ml-1 font-medium text-amber-400 underline-offset-4 hover:text-amber-300 hover:underline">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}