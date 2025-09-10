"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import clsx from "clsx";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

interface ToastContextType {
  toasts: Toast[];
  show: (type: ToastType, message: string, timeoutMs?: number) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string, timeoutMs = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    if (timeoutMs > 0) {
      setTimeout(() => remove(id), timeoutMs);
    }
  }, [remove]);

  const value = useMemo(() => ({ toasts, show, remove }), [toasts, show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "min-w-[260px] rounded-xl border px-4 py-2 shadow-lg backdrop-blur",
              t.type === "success" && "bg-emerald-900/40 text-emerald-100 border-emerald-800",
              t.type === "error" && "bg-red-900/40 text-red-100 border-red-800",
              t.type === "info" && "bg-zinc-900/60 text-zinc-100 border-zinc-800"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">{t.message}</span>
              <button className="text-xs text-zinc-300 hover:text-white" onClick={() => remove(t.id)}>Cerrar</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
