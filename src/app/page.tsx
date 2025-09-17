"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [countdownText, setCountdownText] = useState("Cargando...");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Activa animaciones de entrada una vez montado
    const t = setTimeout(() => setMounted(true), 0);

    // Fecha del countdown configurable por env
    const fallback = "2025-12-01T00:00:00";
    const fromEnv = process.env.NEXT_PUBLIC_COUNTDOWN_TARGET;
    const target = new Date(fromEnv || fallback);
    const updateCountdown = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdownText("¡Ya se abrieron las votaciones!");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdownText(`${days}d ${hours}h ${minutes}m ${seconds}s para que se abran las votaciones...`);
    };
    const id = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => { clearInterval(id); clearTimeout(t); };
  }, []);

  const news = [
    { src: "/images/categoria-risotas.jpg", title: "CENA NAVIDEÑA 2024", alt: "CENA NAVIDEÑA 2024" },
    { src: "/images/categoria-momento.jpg", title: "FELIPE SALE DE CASA", alt: "FELIPE SALE DE CASA" },
    { src: "/images/categoria-leyenda.jpg", title: "VIDEOMEME 2024", alt: "VIDEOMEME 2024" },
  ];

  const winners = [
    { src: "/images/imagen-de-catedra.jpg", title: "TELENOVELA 2022", badge: "Cátedra, Rocío y Ana", alt: "IMAGEN DE CÁTEDRA,ANA Y ROCIO" },
    { src: "/images/amigo1.jpg", title: "Pareja del Año 2024", badge: "Alejandra y Jose", alt: "IMAGEN DE ALEJANDRA Y JOSE" },
    { src: "/images/amigo2.jpg", title: "Dictadora del Año 2024", badge: "Silvia", alt: "IMAGEN DE SILVIA" },
    { src: "/images/amigo3.jpg", title: "TULA MÁS GRANDE 2021", badge: "Gema", alt: "IMAGEN DE GEMA" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      <Header />

      {/* Countdown banner */}
      <div className="headline text-center font-extrabold tracking-widest py-2 px-4 text-zinc-900 bg-gradient-to-r from-cyan-500 via-yellow-300 to-orange-500 text-sm md:text-base">
        {countdownText}
      </div>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-zinc-800" style={{
          background: "radial-gradient(1100px 420px at 50% -8%, rgba(245,158,11,.16), transparent 60%), radial-gradient(800px 260px at 80% -4%, rgba(251,191,36,.12), transparent 60%)",
        }}>
          <div className="max-w-6xl mx-auto text-center px-4 py-12 md:py-20">
            <h1 className={`headline text-[clamp(1.8rem,6vw,3rem)] sm:text-[clamp(2rem,5vw,3.2rem)] transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>GALA DE PREMIOS PIORN 2025</h1>
            <p className={`text-zinc-400 transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>Bienvenidos a la 5º edición de la Gala de Premios de PIORN</p>
            <div className={`flex gap-3 justify-center flex-wrap mt-4 transition-all duration-700 ease-out delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <a href="/premios" className="headline inline-flex items-center justify-center px-3 py-2 md:px-4 rounded-lg font-extrabold bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500">Ver Premios</a>
              <a href="/participantes" className="headline inline-flex items-center justify-center px-3 py-2 md:px-4 rounded-lg font-extrabold border border-amber-400 text-amber-400 hover:bg-amber-400/10">Participantes</a>
            </div>
          </div>
        </section>

        {/* Noticias */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="headline text-[clamp(1.25rem,2.2vw,1.6rem)]">NOTICIAS</h2>
            <p className="text-zinc-500">Aquí podrás ver antiguas ediciones y noticias del grupo</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
              {news.map((n, i) => (
                <article
                  key={n.title}
                  className={`news-card border-2 border-transparent rounded-xl overflow-hidden transition-all duration-500 ease-out hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: `${100 + i * 80}ms` }}
                >
                  <div className="relative aspect-[16/9] bg-zinc-900">
                    <Image src={n.src} alt={n.alt} fill className="object-cover transition-transform duration-500 ease-out hover:scale-[1.02]" unoptimized />
                  </div>
                  <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-900/90 px-4 py-3 text-left">
                    <h3 className="headline text-base">{n.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Ganadores de otras ediciones */}
        <section className="py-12 pt-6">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="headline text-[clamp(1.25rem,2.2vw,1.6rem)]">GANADORES DE OTRAS EDICIONES</h2>
            <p className="text-zinc-500">Estos son los premiados de anteriores ediciones</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
              {winners.map((w, i) => (
                <article
                  key={w.title}
                  className={`bg-zinc-900/50 border-2 border-transparent rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: `${100 + i * 80}ms` }}
                >
                  <div className="relative aspect-[16/9] bg-zinc-900">
                    <Image src={w.src} alt={w.alt} fill className="object-cover transition-transform duration-500 ease-out hover:scale-[1.02]" unoptimized />
                  </div>
                  <div className="p-4">
                    <h3 className="headline m-0 mb-1">{w.title}</h3>
                    <span className="inline-block text-sm px-2 py-0.5 border border-zinc-700 text-zinc-300 rounded">{w.badge}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-12 pt-6">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="headline text-[clamp(1.25rem,2.2vw,1.6rem)]">¿Cómo funciona?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h3 className="headline">1. Te registras</h3>
                <p className="text-zinc-500">Crea tu cuenta para poder votar (un voto por categoría).</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h3 className="headline">2. Nomina & Vota</h3>
                <p className="text-zinc-500">Explora categorías, revisa nominados y emite tu voto.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h3 className="headline">3. ¡Resultados!</h3>
                <p className="text-zinc-500">Sigue el ranking en tiempo real y celebra a los ganadores.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="my-6 md:my-10 p-5 text-center rounded-2xl border border-zinc-800 bg-gradient-to-b from-amber-400/10 to-amber-400/5">
            <h3 className="headline mb-1">¿Preparado para votar?</h3>
            <p className="text-zinc-500">Inicia sesión para participar en las votaciones.</p>
            <div className="mt-3">
              <a href="/login" className="headline inline-flex items-center justify-center px-4 py-2 rounded-lg font-extrabold bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500">Iniciar sesión</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

