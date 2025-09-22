"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/components/ui/Toast";

type Track = { cover: string; title: string; subtitle: string; audio: string };

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function CountdownBanner() {
  const [text, setText] = useState("Cargando...");
  useEffect(() => {
    const fallback = "2025-12-01T00:00:00";
    const fromEnv = process.env.NEXT_PUBLIC_COUNTDOWN_TARGET;
    const target = new Date(fromEnv || fallback);
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setText("¡Ya se abrieron las votaciones!"); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setText(`${d}d ${h}h ${m}m ${s}s para que se abran las votaciones...`);
    };
    const id = setInterval(update, 1000);
    update();
    return () => clearInterval(id);
  }, []);
  return (
    <div className="headline text-center font-extrabold tracking-widest py-2 px-4 text-zinc-900 bg-gradient-to-r from-cyan-500 via-yellow-300 to-orange-500 text-sm md:text-base relative z-10">
      {text}
    </div>
  );
}

// Efecto de nieve en canvas
function SnowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    type Flake = { x: number; y: number; r: number; s: number; w: number; a: number; o: number };

    let W = 0;
    let H = 0;
    let flakes: Flake[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const MAX_FLAKES_BASE = 140;
    let raf = 0;

    const spawn = (): Flake => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      r: 1.2 + Math.random() * 2.8,
      s: 0.4 + Math.random() * 0.9,
      w: 0.6 + Math.random() * 1.2,
      a: Math.random() * Math.PI * 2,
      o: 0.35 + Math.random() * 0.45,
    });

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(MAX_FLAKES_BASE * (W / 1200 + 0.3));
      if (flakes.length < target) {
        for (let i = flakes.length; i < target; i++) flakes.push(spawn());
      } else {
        flakes = flakes.slice(0, target);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.y += f.s;
        f.a += 0.01 + f.w * 0.015;
        f.x += Math.sin(f.a) * f.w;

        if (f.y - f.r > H) Object.assign(f, spawn(), { y: -10 });
        if (f.x < -10) f.x = W + 10; else if (f.x > W + 10) f.x = -10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.o})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(255,255,255,0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

function TrackCard({ t, index, playingIdx, setPlayingIdx }: { t: Track; index: number; playingIdx: number | null; setPlayingIdx: (n: number | null) => void; }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const isPlaying = playingIdx === index;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      setCurrent(el.currentTime);
      if (el.duration) setProgress(el.currentTime / el.duration);
    };
    const onLoaded = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onDuration = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onLoadedData = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onCanPlay = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onEnded = () => { setPlayingIdx(null); };
    const onError = () => { setErr('No se pudo cargar el audio'); setPlayingIdx(null); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('durationchange', onDuration);
    el.addEventListener('loadeddata', onLoadedData);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('durationchange', onDuration);
      el.removeEventListener('loadeddata', onLoadedData);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [setPlayingIdx]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      // asegúrate de tener duración cargada cuando empieza
      if (isFinite(el.duration) && duration === 0) setDuration(el.duration);
      void el.play().catch(() => {/* ignore */});
    } else {
      el.pause();
    }
  }, [isPlaying, duration]);

  const toggle = () => {
    if (isPlaying) {
      setPlayingIdx(null);
    } else {
      setPlayingIdx(index);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  };

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="relative aspect-square bg-zinc-900 group">
        <Image src={t.cover} alt={`${t.title} cover`} fill className="object-cover" unoptimized />
        <button
          onClick={toggle}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full flex items-center justify-center bg-amber-400/90 text-zinc-900 shadow-lg transition-transform group-hover:scale-105"
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>
      <div className="p-4">
        <h3 className="headline m-0 mb-1 text-base">{t.title}</h3>
        <p className="text-zinc-400 text-sm m-0">{t.subtitle}</p>
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded cursor-pointer overflow-hidden" onClick={seek}>
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="text-xs tabular-nums text-zinc-400 w-[70px] text-right">
              {formatTime(current)} / {formatTime(duration)}
            </div>
          </div>
          {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
        </div>
        <audio ref={audioRef} src={t.audio} preload="auto" />
      </div>
    </article>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    // Activa animaciones de entrada una vez montado
    const t = setTimeout(() => setMounted(true), 0);
    return () => { clearTimeout(t); };
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

  // Discografía (coloca las carátulas en /public/images/discografia y los mp3 en /public/audio)
  const tracks = [
    { cover: "/images/discografia/tema1.jpg", title: "LA NOCHE DE DAVID", subtitle: "Piorn ft. Paulo Larbolan", audio: "/audio/tema1.mp3" },
    { cover: "/images/discografia/tema2.jpg", title: "SOMOS PIORN", subtitle: "Piorn ft. Zarra Lawson", audio: "/audio/tema2.mp3" },
    { cover: "/images/discografia/tema3.jpg", title: "UNA CALVA BRILLANTE", subtitle: "Piorn ft. El ginxo", audio: "/audio/tema3.mp3" },
  ];

  // Reproductor: mantener una sola pista sonando
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0b] via-[#111214] to-[#0a0a0b]">
      {/* Fondo nieve */}
      <SnowCanvas />

      <Header />

      {/* Countdown banner */}
      <CountdownBanner />

      <main className="flex-1 relative z-10">
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
                  onClick={() => show('success', 'Próximamente')}
                  className={`news-card border-2 border-transparent rounded-xl overflow-hidden transition-all duration-500 ease-out hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40 hover:-translate-y-1 cursor-pointer ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
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
                  onClick={() => show('success', 'Próximamente')}
                  key={w.title}
                  className={`bg-zinc-900/50 border-2 border-transparent rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40 hover:-translate-y-1 cursor-pointer ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
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

        {/* Discografía PIORN */}
        <section className="py-12 pt-6">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="headline text-[clamp(1.25rem,2.2vw,1.6rem)]">DISCOGRAFÍA PIORN</h2>
            <p className="text-zinc-500">Escucha los últimos temazos del grupo</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
              {tracks.map((t, i) => (
                <TrackCard key={t.title} t={t} index={i} playingIdx={playingIdx} setPlayingIdx={setPlayingIdx} />
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

