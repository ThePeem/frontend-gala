'use client';

import { useEffect, useState } from 'react';
import { getResultadosPublicos, PremioPublico } from '../lib/api';
import Layout from '../components/Layout'; // 👈 import del Layout

// Interfaz para el objeto Nominado que viene de la API
interface Nominado {
  id: string;
  premio: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
}

type Premio = PremioPublico;

export default function HomePage() {
  const [resultados, setResultados] = useState<Premio[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getResultadosPublicos();
        setResultados(data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError('Error al cargar los resultados de la API.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <Layout>
      {loading && <p>Cargando resultados de la gala...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Resultados de la Gala Premios Piorn</h1>
          {resultados && resultados.length > 0 ? (
            <div>
              <h2>Premios disponibles:</h2>
              <ul>
                {resultados.map((premio) => (
                  <li
                    key={premio.id}
                    style={{
                      marginBottom: '20px',
                      border: '1px solid #ccc',
                      padding: '10px',
                      borderRadius: '5px'
                    }}
                  >
                    <h3>{premio.nombre}</h3>
                    <p><strong>Descripción:</strong> {premio.descripcion || 'No proporcionada'}</p>
                    <p><strong>Estado:</strong> {premio.estado}</p>
                    {premio.fecha_entrega && (
                      <p><strong>Fecha de Entrega:</strong> {new Date(premio.fecha_entrega).toLocaleDateString()}</p>
                    )}

                    {premio.ganador_oro && <p><strong>Ganador Oro:</strong> {premio.ganador_oro.nombre}</p>}
                    {premio.ganador_plata && <p><strong>Ganador Plata:</strong> {premio.ganador_plata.nombre}</p>}
                    {premio.ganador_bronce && <p><strong>Ganador Bronce:</strong> {premio.ganador_bronce.nombre}</p>}

                    {premio.fecha_resultados_publicados && (
                      <p>
                        <strong>Resultados Publicados:</strong>{' '}
                        {new Date(premio.fecha_resultados_publicados).toLocaleString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No hay resultados disponibles en la API. Asegúrate de que el backend tiene datos.</p>
          )}
        </main>
      )}
    </Layout>
  );
}
