// src/components/LoginForm.tsx
"use client"; // Importante: Marca este componente como Client Component en Next.js App Router

import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext'; // Importa el hook useAuth
import Link from 'next/link'; // Para un enlace a la página de registro

const LoginForm: React.FC = () => {
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Estado para mensajes de error
  const [loading, setLoading] = useState(false); // Estado para indicar que la petición está en curso

  const { login, loginWithGoogle } = useAuth(); // Obtiene la función de login del contexto de autenticación

  // Inicializa Google Identity Services y renderiza el botón
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore
      if (window.google) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              await loginWithGoogle(response.credential);
            }
          },
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv'),
          { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [loginWithGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario

    setError(null); // Resetea cualquier error previo

    // Validación básica en el frontend
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true); // Activa el estado de carga

    try {
      const result = await login(username, password);

      if (result.success) {
        // Redirección manejada dentro de AuthContext.js (router.push('/dashboard'))
        // No necesitas hacer nada más aquí en caso de éxito
        console.log('Login exitoso!');
      } else {
        // Mostrar errores específicos del backend
        if (result.error && typeof result.error === 'object' && result.error.detail) {
          setError(result.error.detail); // Si el backend devuelve { detail: "..." }
        } else if (result.error && typeof result.error === 'string') {
          setError(result.error); // Mensaje de error general
        } else {
          setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
        }
      }
    } catch (err) {
      console.error('Error inesperado durante el login:', err);
      setError('Ha ocurrido un error inesperado. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false); // Desactiva el estado de carga
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          padding: '10px 15px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Iniciando Sesión...' : 'Entrar'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        ¿No tienes cuenta? <Link href="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Regístrate aquí</Link>
      </p>
      <div id="googleSignInDiv" style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }} />
    </div>
  );
};

export default LoginForm;