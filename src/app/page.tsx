// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getResultadosPublicos } from './lib/api';

// Interfaz para el objeto Nominado que viene de la API
interface Nominado {
  id: string; // O el tipo de tu primary key para Nominado (UUIDField en Django)
  premio: string; // O el tipo de primary key del Premio al que está vinculado (UUID)
  nombre: string;
  descripcion: string | null;
  imagen: string | null; // URL de la imagen si la tienes
  usuarios_vinculados_detalles?: any; // Si es un objeto complejo que aún no sabes su forma, usa 'any' o define otra interfaz
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

  // ¡CAMBIO AQUÍ! Ahora son objetos Nominado o null
  ganador_oro: Nominado | null;
  ganador_plata: Nominado | null;
  ganador_bronce: Nominado | null;

  fecha_resultados_publicados: string | null;
}
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

  if (loading) return <p>Cargando resultados de la gala...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Resultados de la Gala Premios Piorn</h1>
      {resultados && resultados.length > 0 ? (
        <div>
          <h2>Premios disponibles:</h2>
          <ul>
            {resultados.map((premio) => (
              <li key={premio.pk} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <h3>{premio.nombre}</h3>
                <p><strong>Descripción:</strong> {premio.descripcion || 'No proporcionada'}</p>
                <p><strong>Estado:</strong> {premio.estado}</p>
                {premio.fecha_entrega && <p><strong>Fecha de Entrega:</strong> {new Date(premio.fecha_entrega).toLocaleDateString()}</p>}

                {/* ¡CAMBIOS AQUÍ! Para mostrar el nombre del ganador, no el objeto completo */}
                {premio.ganador_oro && <p><strong>Ganador Oro:</strong> {premio.ganador_oro.nombre}</p>}
                {premio.ganador_plata && <p><strong>Ganador Plata:</strong> {premio.ganador_plata.nombre}</p>}
                {premio.ganador_bronce && <p><strong>Ganador Bronce:</strong> {premio.ganador_bronce.nombre}</p>}

                {premio.fecha_resultados_publicados && <p><strong>Resultados Publicados:</strong> {new Date(premio.fecha_resultados_publicados).toLocaleString()}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No hay resultados disponibles en la API. Asegúrate de que el backend tiene datos.</p>
      )}
    </main>
  );
}
