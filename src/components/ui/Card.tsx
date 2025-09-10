"use client";

import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Card({ className, header, footer, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-2xl backdrop-blur",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-amber-400/0 to-amber-500/10" />
      {header && <div className="relative p-4 border-b border-zinc-800/60">{header}</div>}
      <div className="relative p-4">{children}</div>
      {footer && <div className="relative p-4 border-t border-zinc-800/60">{footer}</div>}
    </div>
  );
}
