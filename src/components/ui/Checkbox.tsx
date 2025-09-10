"use client";

import React from "react";
import clsx from "clsx";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Checkbox({ id, label, className, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={clsx("inline-flex items-center gap-2 select-none", className)}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/40 focus:outline-none"
        {...props}
      />
      {label && <span className="text-sm text-zinc-200">{label}</span>}
    </label>
  );
}
