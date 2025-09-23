// src/app/soporte/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function SoportePage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const { show } = useToast();
  const [tipo, setTipo] = useState<"premio" | "nominado" | "otro">("otro");
  const [contenido, setContenido] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = contenido.trim();
    if (!body) { show("error", "Escribe tu sugerencia"); return; }
    try {
      setSending(true);
      await axiosInstance.post("api/sugerencias/", { tipo, contenido: body });
      setContenido("");
      setTipo("otro");
      show("success", "Gracias, hemos recibido tu sugerencia");
    } catch (err) {
      console.error(err);
      show("error", "No se pudo enviar la sugerencia");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="p-6">Cargando...</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow p-6 max-w-3xl mx-auto">
          <Card>
            <div className="p-5">
              <h1 className="text-2xl font-bold text-zinc-100 mb-3">Soporte</h1>
              <p className="text-zinc-300 mb-4">Debes iniciar sesión o registrarte para poder enviar sugerencias.</p>
              <div className="flex gap-3">
                <Link href="/login" className="px-4 py-2 rounded bg-amber-500 text-zinc-900 font-semibold">Iniciar sesión</Link>
                <Link href="/register" className="px-4 py-2 rounded border border-zinc-700 text-zinc-200">Registrarse</Link>
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Soporte y Sugerencias</h1>
        <p className="text-zinc-400 mb-4">Cuéntanos tu idea, reporte o mejora para la Gala.</p>

        <Card>
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Tipo</label>
              <Select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as typeof tipo)}
                options={[
                  { label: "Otro", value: "otro" },
                  { label: "Premio", value: "premio" },
                  { label: "Nominado", value: "nominado" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Contenido</label>
              <textarea
                rows={6}
                placeholder="Escribe tu sugerencia con el máximo detalle posible..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                className="block w-full rounded-xl border bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:outline-none focus:ring-2 border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={sending}>Enviar</Button>
            </div>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
