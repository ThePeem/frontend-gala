"use client";

import React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
}

export default function Input({
  id,
  label,
  helpText,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className={clsx("w-full", className)}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-200">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          "block w-full rounded-xl border bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner placeholder-zinc-500 focus:outline-none focus:ring-2",
          error
            ? "border-red-700 focus:border-red-500/60 focus:ring-red-500/30"
            : "border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/30"
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-xs text-zinc-500">{helpText}</p>
      ) : null}
    </div>
  );
}
