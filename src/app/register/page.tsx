"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAuth } from "@/utils/AuthContext";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [gisReady, setGisReady] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!firstName || !lastName || !username || !email || !password || !password2) {
      setError("Todos los campos son obligatorios");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    const res = await register({
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password,
      password2,
    } as any);
    if (!res.success) {
      const detail = (res.error?.detail as string) || "No se pudo completar el registro";
      setError(detail);
      setSubmitting(false);
    } else {
      setSuccess("Registro completado. Te estamos redirigiendo al login...");
      // El AuthContext ya redirige al login tras éxito
    }
  };

  // Inicializar y renderizar botón de Google (opcional)
  useEffect(() => {
    if (!gisReady || !googleClientId) return;
    if (!(window as any).google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (response.credential) {
            const r = await loginWithGoogle(response.credential);
            if (!r.success) {
              setError(r.error?.detail || "Error al registrarte con Google");
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
          text: "signup_with",
          logo_alignment: "left",
        });
      }
    } catch (e) {
      console.error("Error inicializando Google Identity", e);
    }
  }, [gisReady, googleClientId, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6">
      {/* Script Google Identity */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />

      <div className="relative w-full max-w-xl">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-amber-400/0 to-amber-500/10"></div>

          <header className="relative">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">Registro de Usuario</h2>
            <p className="mt-1 text-center text-sm text-zinc-400">Crea tu cuenta para votar en los premios</p>
          </header>

          <form className="relative mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="mb-1 block text-sm font-medium text-zinc-200">Nombre</label>
                <input id="first-name" type="text" className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Nombre" value={firstName} onChange={(e)=>setFirstName(e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label htmlFor="last-name" className="mb-1 block text-sm font-medium text-zinc-200">Apellido</label>
                <input id="last-name" type="text" className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Apellido" value={lastName} onChange={(e)=>setLastName(e.target.value)} disabled={submitting} />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-zinc-200">Usuario</label>
              <input id="username" type="text" className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Nombre de usuario" value={username} onChange={(e)=>setUsername(e.target.value)} disabled={submitting} />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-200">Email</label>
              <input id="email" type="email" className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Correo electrónico" value={email} onChange={(e)=>setEmail(e.target.value)} disabled={submitting} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-200">Contraseña</label>
                <input id="password" type="password" className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label htmlFor="password2" className="mb-1 block text-sm font-medium text-zinc-200">Confirmar Contraseña</label>
                <input id="password2" type="password" className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="••••••••" value={password2} onChange={(e)=>setPassword2(e.target.value)} disabled={submitting} />
              </div>
            </div>

            {error && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">{error}</div>}
            {success && <div className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-lg px-3 py-2">{success}</div>}

            <button type="submit" disabled={submitting} className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg transition duration-300 ease-out hover:from-amber-400 hover:to-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-60">
              {submitting ? "Registrando..." : "Registrarse"}
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-xs uppercase tracking-wider text-zinc-500">o regístrate con</span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            <div className="flex justify-center">
              <div ref={googleBtnRef} />
            </div>

            <p className="relative mt-6 text-center text-sm text-zinc-400">
              ¿Ya tienes cuenta?
              <a href="/login" className="ml-1 font-medium text-amber-400 underline-offset-4 hover:text-amber-300 hover:underline">
                Inicia sesión aquí
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}