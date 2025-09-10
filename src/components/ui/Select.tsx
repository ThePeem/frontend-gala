"use client";

import React from "react";
import clsx from "clsx";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helpText?: string;
  error?: string;
  options?: SelectOption[];
}

export default function Select({ id, label, helpText, error, options = [], className, children, ...props }: SelectProps) {
  return (
    <div className={clsx("w-full", className)}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-200">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          "block w-full rounded-xl bg-zinc-950/60 px-3 py-2 text-zinc-100 shadow-inner focus:outline-none focus:ring-2",
          error
            ? "border border-red-700 focus:border-red-500/60 focus:ring-red-500/30"
            : "border border-zinc-800 focus:border-amber-500/60 focus:ring-amber-500/30"
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-xs text-zinc-500">{helpText}</p>
      ) : null}
    </div>
  );
}
