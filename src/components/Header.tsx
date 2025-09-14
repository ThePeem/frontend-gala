'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NavLink = ({ href, children, locked }: { href: string; children: React.ReactNode; locked?: boolean }) => (
    <Link href={locked ? '#' : href} onClick={() => setOpen(false)} className={`headline px-2 py-1 rounded ${locked ? 'text-zinc-400 cursor-not-allowed' : 'text-zinc-300 hover:text-amber-400 hover:bg-white/5'} `}>
      {children}{locked ? ' 🔒' : ''}
    </Link>
  );

  return (
    <header className={`piorn-header sticky top-0 z-50 transition-all ${scrolled ? 'bg-zinc-900/60 backdrop-blur border-b border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,.35)]' : 'bg-transparent'}`}>
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
          <NavLink href="/sugerencias">Sugerencias</NavLink>
          <NavLink href="/votar" locked={!isAuthenticated}>Votar</NavLink>
          <NavLink href={isAuthenticated ? '/perfil' : '/login'}>{isAuthenticated ? 'Mi Perfil' : 'Iniciar sesión'}</NavLink>
          {isAuthenticated && (
            <button onClick={() => { logout(); setOpen(false); }} className="headline btn btn--gold px-3 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500">
              Logout
            </button>
          )}
        </nav>

        {/* Hamburger */}
        <button className="md:hidden justify-self-end border border-zinc-700 text-zinc-300 px-2 py-1 rounded" onClick={() => setOpen(v => !v)}>☰</button>
      </div>

      {/* Mobile nav */}
      <div className={`${open ? 'flex' : 'hidden'} md:hidden flex-col items-center gap-2 px-4 pb-3 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur`}>
        <NavLink href="/participantes">Participantes</NavLink>
        <NavLink href="/premios">Premios</NavLink>
        <NavLink href="/resultados">Resultados</NavLink>
        <NavLink href="/sugerencias">Sugerencias</NavLink>
        <NavLink href="/votar" locked={!isAuthenticated}>Votar</NavLink>
        <NavLink href={isAuthenticated ? '/perfil' : '/login'}>{isAuthenticated ? 'Mi Perfil' : 'Iniciar sesión'}</NavLink>
        {isAuthenticated && (
          <button onClick={() => { logout(); setOpen(false); }} className="headline btn btn--gold px-3 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-900 font-extrabold shadow-[0_6px_18px_rgba(245,158,11,.35)] hover:from-yellow-300 hover:to-amber-500 w-full max-w-xs">
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
