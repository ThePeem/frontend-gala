"use client";

import React from "react";
import clsx from "clsx";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  emptyMessage?: string;
  loading?: boolean;
}

export default function Table({ headers, children, className, emptyMessage = "Sin datos", loading = false, ...props }: TableProps) {
  return (
    <div className={clsx("w-full overflow-x-auto border border-zinc-800 rounded-xl", className)}>
      <table className="w-full border-collapse min-w-[600px]" {...props}>
        <thead>
          <tr className="bg-zinc-950/60 text-left text-sm text-zinc-300">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 border-b border-zinc-800 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm text-zinc-200">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-center text-zinc-400">Cargando...</td>
            </tr>
          ) : React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-center text-zinc-500">{emptyMessage}</td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
