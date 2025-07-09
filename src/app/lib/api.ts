// src/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000' // Para desarrollo local, cuando tu backend local esté corriendo
  : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://galapremiospiorn.onrender.com/'; // Para producción y fallback

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

export const getResultadosPublicos = async () => {
  try {
    const response = await api.get('api/resultados-publicos/'); // Path sigue sin la primera barra
    return response.data;
  } catch (error) {
    console.error('Error fetching public results:', error);
    throw error;
  }
};

// Función de ejemplo para iniciar sesión y obtener un token
export const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/api/api-token-auth/', { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Función para configurar el token de autenticación para futuras solicitudes
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;