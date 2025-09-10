"use client";

import React from "react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, actions }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={clsx("relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur")}>        
        <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-amber-400/0 to-amber-500/10" />
        <div className="relative p-4 border-b border-zinc-800/60">
          <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
        </div>
        <div className="relative p-4 text-zinc-200">{children}</div>
        {actions && <div className="relative p-4 border-t border-zinc-800/60 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
