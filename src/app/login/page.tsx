"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAuth } from "@/utils/AuthContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type GoogleCredentialResponse = { credential?: string };
type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
  prompt: () => void;
};
type GoogleGlobal = { accounts: { id: GoogleAccountsId } };

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

  // Renderizar botón oficial de Google cuando el script está listo
  useEffect(() => {
    if (!gisReady || !googleClientId) return;
    const gg: GoogleGlobal | undefined = (window as unknown as { google?: GoogleGlobal })
      .google;
    if (!gg) return;
    try {
      gg.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
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
        gg.accounts.id.renderButton(googleBtnRef.current, {
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
        <Card className="p-6">
          <header className="relative">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">Iniciar Sesión</h2>
            <p className="mt-1 text-center text-sm text-zinc-400">Entra para votar en los premios</p>
          </header>

          <form className="relative mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              id="username"
              label="Usuario"
              placeholder="Introduzca su nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={submitting}
            />

            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">{error}</div>
            )}

            <Button type="submit" disabled={submitting || !username || !password} loading={submitting} className="w-full">
              Entrar
            </Button>
          </form>

          <div className="relative mt-4">
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-xs uppercase tracking-wider text-zinc-500">O puedes Iniciar sesión con</span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            <div className="flex justify-center"><div ref={googleBtnRef} /></div>
          </div>

          <p className="relative mt-6 text-center text-sm text-zinc-400">
            ¿No tienes cuenta?
            <a href="/register" className="ml-1 font-medium text-amber-400 underline-offset-4 hover:text-amber-300 hover:underline">
              Regístrate aquí
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}