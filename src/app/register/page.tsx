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
type RegisterPayload = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  password2: string;
};

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
    const payload: RegisterPayload = {
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password,
      password2,
    };
    const res = await register(payload);
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
    const gg: GoogleGlobal | undefined = (window as unknown as { google?: GoogleGlobal })
      .google;
    if (!gg) return;
    try {
      gg.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
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
        gg.accounts.id.renderButton(googleBtnRef.current, {
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
        <Card className="p-6">
          <header className="relative">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50">Registro de Usuario</h2>
            <p className="mt-1 text-center text-sm text-zinc-400">Crea tu cuenta para votar en los premios</p>
          </header>

          <form className="relative mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input id="first-name" label="Nombre" placeholder="Nombre" value={firstName} onChange={(e)=>setFirstName(e.target.value)} disabled={submitting} />
              <Input id="last-name" label="Apellido" placeholder="Apellido" value={lastName} onChange={(e)=>setLastName(e.target.value)} disabled={submitting} />
            </div>

            <Input id="username" label="Usuario" placeholder="Nombre de usuario" value={username} onChange={(e)=>setUsername(e.target.value)} disabled={submitting} />

            <Input id="email" label="Email" type="email" placeholder="Correo electrónico" value={email} onChange={(e)=>setEmail(e.target.value)} disabled={submitting} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input id="password" label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={submitting} />
              <Input id="password2" label="Confirmar Contraseña" type="password" placeholder="••••••••" value={password2} onChange={(e)=>setPassword2(e.target.value)} disabled={submitting} />
            </div>

            {error && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">{error}</div>}
            {success && <div className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-lg px-3 py-2">{success}</div>}

            <Button type="submit" disabled={submitting} loading={submitting} className="w-full">Registrarse</Button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-xs uppercase tracking-wider text-zinc-500">o regístrate con</span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            <div className="flex justify-center"><div ref={googleBtnRef} /></div>

            <p className="relative mt-6 text-center text-sm text-zinc-400">
              ¿Ya tienes cuenta?
              <a href="/login" className="ml-1 font-medium text-amber-400 underline-offset-4 hover:text-amber-300 hover:underline">Inicia sesión aquí</a>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}