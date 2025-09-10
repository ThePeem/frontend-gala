"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAuth } from "@/utils/AuthContext";

declare global {
  // eslint-disable-next-line no-var
  var google: any;
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gisReady, setGisReady] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

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

  const handleGoogleLogin = useCallback(() => {
    if (!googleClientId) {
      setError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }
    if (!(window as any).google) {
      setError("Google Identity no está listo aún. Inténtalo de nuevo en unos segundos.");
      return;
    }
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (response.credential) {
            const res = await loginWithGoogle(response.credential);
            if (!res.success) {
              setError(res.error?.detail || "Error al iniciar sesión con Google");
            }
          } else {
            setError("No se recibió credencial de Google");
          }
        },
        ux_mode: "popup",
      });
      // Mostrar One Tap o flujo de popup
      window.google.accounts.id.prompt();
    } catch (e) {
      console.error(e);
      setError("No se pudo iniciar el flujo de Google");
    }
  }, [googleClientId, loginWithGoogle]);

  // Renderizar botón oficial de Google cuando el script está listo
  useEffect(() => {
    if (!gisReady || !googleClientId) return;
    if (!(window as any).google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (response.credential) {
            const res = await loginWithGoogle(response.credential);
            if (!res.success) {
              setError(res.error?.detail || "Error al iniciar sesión con Google");
            }
          }
        },
        ux_mode: "popup",
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "signin_with",
          logo_alignment: "left",
        });
      }
    } catch (e) {
      console.error("Error inicializando Google Identity", e);
    }
  }, [gisReady, googleClientId, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6">
      {/* Carga del script de Google Identity Services */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />
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
              <div ref={googleBtnRef} />
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