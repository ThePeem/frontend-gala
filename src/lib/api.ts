// src/lib/api.ts
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const isProd = process.env.NODE_ENV === 'production';

// Une base + endpoint asegurando una sola barra
function joinUrl(base: string, endpoint: string) {
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${e}`;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  authToken?: string | null
): Promise<T> {
  const url = joinUrl(API_BASE, endpoint);
  
  if (!isProd) {
    console.log(`[apiFetch] Making request to: ${url}`);
    console.log(`[apiFetch] Using API_BASE: ${API_BASE}`);
  }

  // Intenta recuperar token del almacenamiento del navegador si no se proporciona explícitamente
  let tokenToUse = authToken ?? null;
  try {
    if (!tokenToUse && typeof window !== 'undefined') {
      tokenToUse = (localStorage.getItem('authToken') || localStorage.getItem('token')) as string | null;
    }
  } catch {
    // Ignorar si localStorage no está disponible
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(tokenToUse ? { Authorization: `Token ${tokenToUse}` } : {}),
  };

  try {
    const res = await fetch(url, { 
      ...options, 
      headers,
      credentials: 'include' // Asegura que las cookies se envíen con la petición
    });
    
    if (!isProd) {
      console.log(`[apiFetch] Response status: ${res.status} ${res.statusText}`);
    }
    
    // Leer cuerpo una única vez para evitar "body stream already read"
    const raw = res.status === 204 ? '' : await res.text();

    if (!res.ok) {
      let errorDetails = raw;
      try {
        errorDetails = raw ? JSON.stringify(JSON.parse(raw)) : '';
      } catch {
        // mantener raw tal cual si no es JSON
      }
      const error = new Error(`Error ${res.status} ${res.statusText}${errorDetails ? ' → ' + errorDetails : ''}`);
      if (!isProd) {
        console.error('[apiFetch] API Error:', error);
      }
      throw error;
    }

    // Procesar la respuesta exitosa
    const data = (raw ? JSON.parse(raw) : null) as T;
    if (!isProd) {
      console.log('[apiFetch] Response data:', data);
    }
    return data;
  } catch (error) {
    if (!isProd) {
      console.error('[apiFetch] Request failed:', error);
    }
    throw error;
  }
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
