// src/lib/api.ts
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// Une base + endpoint asegurando una sola barra
function joinUrl(base: string, endpoint: string) {
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${e}`;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  authToken?: string | null
): Promise<T> {
  const url = joinUrl(API_BASE, endpoint);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(authToken ? { Authorization: `Token ${authToken}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  // Respuestas sin contenido
  if (res.status === 204) return null as T;

  // Manejo de error con detalle legible
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status} ${res.statusText} → ${text || "Sin detalles"}`);
  }

  // Puede ser JSON o vacío
  const txt = await res.text();
  return (txt ? JSON.parse(txt) : (null as T));
}

// Tipos alineados con el backend (ResultadosPremioSerializer devuelve 'id')
export interface NominadoPublico {
  id: string;
  premio?: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo?: boolean;
}

export interface PremioPublico {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_entrega: string | null;
  activo?: boolean;
  ronda_actual?: number;
  estado?: string;
  ganador_oro: NominadoPublico | null;
  ganador_plata: NominadoPublico | null;
  ganador_bronce: NominadoPublico | null;
  fecha_resultados_publicados: string | null;
}

// Obtener resultados públicos (no requiere autenticación)
export async function getResultadosPublicos(): Promise<PremioPublico[]> {
  return apiFetch<PremioPublico[]>("/api/resultados-publicos/");
}
