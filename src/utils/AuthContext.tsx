// src/utils/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';

// Interfaces para los datos de usuario
interface UserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password2: string;
  foto_perfil?: File;
}

interface ApiError {
  detail?: string;
  code?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  token: string;
}

interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

// 1. Definir la interfaz para el contexto de autenticación
interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: ApiError }>;
  register: (userData: UserData) => Promise<{ success: boolean; error?: ApiError }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: ApiError }>;
  logout: () => void;
  axiosInstance: AxiosInstance;
  API_BASE_URL: string;
}

// 2. Crear el contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 4. Proveedor del contexto de autenticación
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      if (authToken) {
        config.headers.Authorization = `Token ${authToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (error.response && error.response.status === 401) {
        console.error("Token inválido o expirado. Cerrando sesión...");
        logout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await axiosInstance.post<LoginResponse>('api-token-auth/', { username, password });
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      setIsAuthenticated(true);
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const axiosError = error as AxiosError<ApiError>;
      const errorData = axiosError.response?.data || { detail: 'Error de conexión' };
      return { success: false, error: errorData };
    }
  }, [router, axiosInstance]);

  const register = useCallback(async (userData: UserData) => {
    try {
      const response = await axiosInstance.post<RegisterResponse>('api/auth/register/', userData);
      console.log('Registro exitoso:', response.data);
      router.push('/login');
      return { success: true };
    } catch (error) {
      console.error('Registro fallido:', error);
      const axiosError = error as AxiosError<ApiError>;
      const errorData = axiosError.response?.data || { detail: 'Error de conexión' };
      return { success: false, error: errorData };
    }
  }, [router, axiosInstance]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    try {
      const response = await axiosInstance.post<{ token: string }>('api/auth/google/', { id_token: idToken });
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      setIsAuthenticated(true);
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Google login failed:', error);
      const axiosError = error as AxiosError<ApiError>;
      const errorData = axiosError.response?.data || { detail: 'Error de conexión' };
      return { success: false, error: errorData };
    }
  }, [router, axiosInstance]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setIsAuthenticated(false);
    router.push('/');
  }, [router]);

  const contextValue: AuthContextType = {
    authToken,
    isAuthenticated,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    axiosInstance,
    API_BASE_URL,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
