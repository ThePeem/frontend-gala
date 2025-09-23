'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(64);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const measure = () => {
      const el = headerRef.current;
      if (el) setHeaderH(el.offsetHeight);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    onScroll();
    measure();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const NavLink = ({ href, children, locked }: { href: string; children: React.ReactNode; locked?: boolean }) => (
    <Link href={locked ? '#' : href} onClick={() => setOpen(false)} className={`headline px-2 py-1 rounded ${locked ? 'text-zinc-400 cursor-not-allowed' : 'text-zinc-300 hover:text-amber-400 hover:bg-white/5'} `}>
      {children}{locked ? ' 🔒' : ''}
    </Link>
  );

  return (
    <>
    <header ref={headerRef} className={`piorn-header fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-zinc-900/60 backdrop-blur border-b border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,.35)]' : 'bg-transparent'}`}>
      <div className="piorn-header__inner max-w-6xl mx-auto px-4 py-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Left nav */}
        <nav className={`nav nav--left hidden md:flex items-center gap-3 justify-center`}>
          <NavLink href="/participantes">Participantes</NavLink>
          <NavLink href="/premios">Premios</NavLink>
          <NavLink href="/resultados">Resultados</NavLink>
          <div className="md:hidden"><NavLink href="/login">Iniciar sesión</NavLink></div>
        </nav>

        {/* Brand center */}
        <div className="brand justify-self-center overflow-visible">
          <Link href="/" title="Home" onClick={() => setOpen(false)} className="inline-flex">
            <Image
              src="/logo.png"
              alt="PIORN"
              width={220}
              height={90}
              className="brand__img h-28 md:h-32 w-auto drop-shadow-[0_10px_26px_rgba(245,158,11,.40)] -mb-2"
              priority
            />
          </Link>
        </div>

        {/* Right nav */}
        <nav className={`nav nav--right hidden md:flex items-center gap-3 justify-center`}>
          <NavLink href="/soporte">Soporte</NavLink>
          <NavLink href="/votar" locked={!isAuthenticated}>Votar</NavLink>
          <NavLink href={isAuthenticated ? '/perfil' : '/login'}>{isAuthenticated ? 'Mi Perfil' : 'Iniciar sesión'}</NavLink>
          {isAuthenticated && (
            <button onClick={() => { logout(); setOpen(false); }} className="headline btn btn--gold px-3 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500">
              Logout
            </button>
          )}
        </nav>

        {/* Hamburger */}
        <button
          className="md:hidden justify-self-end border border-zinc-700 text-zinc-300 px-2 py-1 rounded text-[1.1rem] leading-none"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          onClick={() => setOpen(v => !v)}
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Mobile drawer panel */}
      <aside
        id="mobile-drawer"
        className={`md:hidden fixed top-0 right-0 h-screen w-[82vw] max-w-[360px] transform transition-transform duration-300 ease-out
        bg-gradient-to-b from-pink-600/90 to-violet-500/90 border-l border-white/20 shadow-[-22px_0_60px_rgba(0,0,0,.55)]
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="flex flex-col h-full p-4 gap-3">
          <div className="flex items-center justify-between">
            <span className="headline text-white/90 tracking-widest">Menú</span>
            <button
              className="border border-white/30 text-white/90 px-2 py-1 rounded"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >✕</button>
          </div>

          <nav className="mt-2 flex flex-col gap-2 headline">
            <Link href="/participantes" onClick={() => setOpen(false)} className="text-white font-extrabold tracking-widest px-3 py-2 rounded border border-transparent hover:border-white/30 hover:bg-white/10">Participantes</Link>
            <Link href="/premios" onClick={() => setOpen(false)} className="text-white font-extrabold tracking-widest px-3 py-2 rounded border border-transparent hover:border-white/30 hover:bg-white/10">Premios</Link>
            <Link href="/resultados" onClick={() => setOpen(false)} className="text-white font-extrabold tracking-widest px-3 py-2 rounded border border-transparent hover:border-white/30 hover:bg-white/10">Resultados</Link>
            <Link href="/soporte" onClick={() => setOpen(false)} className="text-white font-extrabold tracking-widest px-3 py-2 rounded border border-transparent hover:border-white/30 hover:bg-white/10">Soporte</Link>
            <Link href={isAuthenticated ? '/votar' : '#'} onClick={(e) => { if (!isAuthenticated) { e.preventDefault(); } setOpen(false); }} className={`font-extrabold tracking-widest px-3 py-2 rounded border ${isAuthenticated ? 'text-white border-transparent hover:border-white/30 hover:bg-white/10' : 'text-white/70 border-white/20 cursor-not-allowed'}`}>Votar{!isAuthenticated ? ' 🔒' : ''}</Link>
            <Link href={isAuthenticated ? '/perfil' : '/login'} onClick={() => setOpen(false)} className="text-white font-extrabold tracking-widest px-3 py-2 rounded border border-transparent hover:border-white/30 hover:bg-white/10">{isAuthenticated ? 'Mi Perfil' : 'Iniciar sesión'}</Link>
          </nav>

          {isAuthenticated && (
            <div className="mt-auto">
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full headline px-3 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500"
              >Logout</button>
            </div>
          )}
        </div>
      </aside>
    </header>
    {/* Spacer to offset fixed header height */}
    <div aria-hidden style={{ height: headerH }} />
    </>
  );
}
