// src/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

if (!API_URL) {
  console.error('API_URL is not defined! Check environment variables.');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interfaces para los tipos de datos
interface Nominado {
  id: string;
  premio: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
}

interface Premio {
  pk: string;
  nombre: string;
  descripcion: string | null;
  fecha_entrega: string | null;
  activo: boolean;
  ronda_actual: number;
  estado: string;
  ganador_oro: Nominado | null;
  ganador_plata: Nominado | null;
  ganador_bronce: Nominado | null;
  fecha_resultados_publicados: string | null;
}

interface LoginResponse {
  token: string;
}

export const getResultadosPublicos = async (): Promise<Premio[]> => {
  try {
    const response = await api.get<Premio[]>('api/resultados-publicos/');
    return response.data;
  } catch (error) {
    console.error('Error fetching public results:', error);
    throw error;
  }
};

// Función de ejemplo para iniciar sesión y obtener un token
export const login = async (username: string, password: string): Promise<string> => {
  try {
    const response = await api.post<LoginResponse>('api-token-auth/', { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Función para configurar el token de autenticación para futuras solicitudes
export const setAuthToken = (token: string | null): void => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;