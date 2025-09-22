"use client";

import Image from "next/image";
import Link from "next/link";

type Sponsor = {
  src: string;
  alt: string;
  href?: string;
  className?: string;
};

const MAIN_SPONSOR: Sponsor = {
  src: "/images/sponsors/CHEMILIN.png",
  alt: "Chemilin",
};

const GRID_SPONSORS: Sponsor[] = [
  { src: "/images/sponsors/ASTRONAUT.png", alt: "Astronaut Coffee" },
  { src: "/images/sponsors/ABIRRAS.png", alt: "Abirras" },
  { src: "/images/sponsors/FUMA.png", alt: "Fuma", className: "scale-[1.1]" },
  { src: "/images/sponsors/NOENTIENDO.png", alt: "Noentiendo", className: "scale-[1.12]" },
  { src: "/images/sponsors/ESPANISRIBS.png", alt: "Espanis Ribs", className: "scale-[1.08]" },
  { src: "/images/sponsors/KARTEWOKO.png", alt: "Kartewoko" },
  // { src: "/images/sponsors/NIKE.png", alt: "Nike Tacón" },
];

const WEB_SPONSOR: Sponsor = {
  src: "/images/sponsors/CHEMIJOBS.png",
  alt: "ChemiJobs",
};

export default function Footer() {
  return (
    <footer className="relative mt-10 text-center text-zinc-200">
      {/* Fondo degradado */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-900/30 via-amber-800/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f12] to-black" />
        <div className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_120px_rgba(0,0,0,0.45)]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="headline text-[clamp(1.2rem,2.6vw,1.8rem)] tracking-wide mb-8">
          PATROCINADORES DEL EVENTO
        </h2>

        {/* Principal */}
        <div className="mb-8 flex items-center justify-center">
          <LogoItem sponsor={MAIN_SPONSOR} priority />
        </div>

        {/* Sponsors en una sola fila (scrollable en móvil si no caben) */}
        <div className="flex flex-nowrap overflow-x-auto gap-8 justify-center items-center py-4 px-2">
          {GRID_SPONSORS.map((s) => (
            <LogoItem key={s.alt} sponsor={s} />
          ))}
        </div>

        {/* Web patrocinada por */}
        <div className="mt-14">
          <p className="headline text-xs tracking-widest text-zinc-400">WEB PATROCINADA POR</p>
          <div className="mt-3 flex justify-center">
            <LogoItem sponsor={WEB_SPONSOR} height={40} />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="mt-10 flex items-center justify-center gap-8">
          <SocialIcon
            label="X"
            href="https://twitter.com/"
            svg={
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path
                  fill="currentColor"
                  d="M18.244 2H21l-6.543 7.48L22 22h-6.807l-4.79-6.248L4.88 22H2l7.003-8.01L2 2h6.93l4.29 5.66L18.244 2Zm-2.389 18h2.112L8.278 4H6.063l9.792 16Z"
                />
              </svg>
            }
          />
          <SocialIcon
            label="IG"
            href="https://instagram.com/"
            svg={
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path
                  fill="currentColor"
                  d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5ZM18 6a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"
                />
              </svg>
            }
          />
          <SocialIcon
            label="GH"
            href="https://github.com/"
            svg={
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path
                  fill="currentColor"
                  d="M12 .5A11.5 11.5 0 0 0 .5 12.13c0 5.16 3.35 9.54 8 11.09.59.1.8-.26.8-.57v-2c-3.26.71-3.95-1.57-3.95-1.57-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.25 1.83 1.25 1.08 1.87 2.83 1.33 3.52 1.02.11-.8.42-1.33.76-1.63-2.6-.3-5.33-1.35-5.33-6.01 0-1.33.47-2.42 1.24-3.28-.12-.3-.54-1.52.12-3.16 0 0 1.01-.33 3.3 1.25a11.4 11.4 0 0 1 6 0c2.28-1.58 3.29-1.25 3.29-1.25.66 1.64.24 2.86.12 3.16.78.86 1.24 1.95 1.24 3.28 0 4.68-2.74 5.71-5.35 6 .43.37.81 1.1.81 2.22v3.29c0 .31.21.68.81.56 4.65-1.55 8-5.93 8-11.09A11.5 11.5 0 0 0 12 .5Z"
                />
              </svg>
            }
          />
        </div>

        <div className="mt-8 text-xs text-zinc-500">
          <p> 2025 GALA PIORN. TODOS LOS DERECHOS RESERVADOS.</p>
          <p className="mt-1">DESARROLLADO POR PIORND EV Y SU COMUNIDAD.</p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Helpers ---------- */

function LogoItem({
  sponsor,
  height = 56,
  priority = false,
}: {
  sponsor: Sponsor;
  height?: number;
  priority?: boolean;
}) {
  const img = (
    <Image
      src={sponsor.src}
      alt={sponsor.alt}
      height={height}
      width={220}
      className={`object-contain drop-shadow ${sponsor.className || ""}`}
      priority={priority}
    />
  );

  if (sponsor.href) {
    return (
      <Link href={sponsor.href} target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition">
        {img}
      </Link>
    );
  }

  return <div className="opacity-90 hover:opacity-100 transition">{img}</div>;
}

function SocialIcon({
  label,
  href,
  svg,
}: {
  label: string;
  href: string;
  svg: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-200 hover:text-white transition shadow-sm"
    >
      {svg}
    </Link>
  );
}