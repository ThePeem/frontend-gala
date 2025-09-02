// src/components/RegisterForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useRouter } from 'next/navigation';

const RegisterForm: React.FC = () => {
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState(''); // Correcto: estado para password2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  
  // Inicializa Google Identity Services para registro rápido
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      type GoogleAccountsId = {
        initialize: (opts: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
        renderButton: (element: HTMLElement | null, options: { theme: 'outline' | 'filled_blue' | 'filled_black'; size: 'large' | 'medium' | 'small'; text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'; shape?: 'rectangular' | 'pill' | 'circle' | 'square' }) => void;
      };
      type GoogleSDK = { accounts: { id: GoogleAccountsId } };
      const googleObj = (window as unknown as { google?: GoogleSDK }).google;
      if (googleObj) {
        googleObj.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              await loginWithGoogle(response.credential);
            }
          },
        });
        googleObj.accounts.id.renderButton(
          document.getElementById('googleRegisterDiv'),
          { theme: 'outline', size: 'large', text: 'signup_with', shape: 'rectangular' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [loginWithGoogle]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    // Validación frontend: asegúrate de usar 'password2' aquí también
    if (!username || !email || !password || !password2 || !firstName || !lastName) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    // Validación frontend: compara 'password' con 'password2'
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // ***** ¡LA LÍNEA CRÍTICA ES ESTA! *****
      // Asegúrate de que el objeto que pasas a 'register' contenga 'password2'
      const result = await register({
        username,
        email,
        password,
        // ¡AÑADE ESTA LÍNEA!
        password2: password2, // <-- ¡AHORA SÍ SE ENVÍA AL BACKEND!
        first_name: firstName,
        last_name: lastName
      });

      if (result.success) {
        router.push('/login');
      } else {
        if (result.error && typeof result.error === 'object') {
          const errorMessages = Object.values(result.error).flat().join(' ');
          setError(errorMessages || 'Error en el registro. Por favor, inténtalo de nuevo.');
        } else if (result.error && typeof result.error === 'string') {
          setError(result.error);
        } else {
          setError('Error desconocido durante el registro. Inténtalo de nuevo.');
        }
      }
    } catch (err) {
      console.error('Error inesperado durante el registro:', err);
      setError('Ha ocurrido un error inesperado. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* ... (todos tus inputs, que ya están bien configurados con sus respectivos estados) */}
        <div>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Usuario:</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label htmlFor="first-name" style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
          <input type="text" id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label htmlFor="last-name" style={{ display: 'block', marginBottom: '5px' }}>Apellido:</label>
          <input type="text" id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div>
          <label htmlFor="password2" style={{ display: 'block', marginBottom: '5px' }}>Confirmar Contraseña:</label>
          <input type="password" id="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      {/* Botón Google */}
      <div id="googleRegisterDiv" style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }} />
    </div>
  );
};

export default RegisterForm;