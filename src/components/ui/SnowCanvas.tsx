"use client";
import { useEffect, useRef } from "react";

export default function SnowCanvas() {
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
