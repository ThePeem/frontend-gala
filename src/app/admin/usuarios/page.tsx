// src/app/admin/usuarios/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/utils/AuthContext";

type Usuario = {
  id: string; // UUID
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  verificado: boolean;
  is_staff: boolean;
  foto_perfil?: string | null;
};

export default function AdminUsuariosPage() {
  const { isAuthenticated, loading, axiosInstance } = useAuth();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await axiosInstance.get<Usuario[]>("api/admin/users/");
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la lista de usuarios");
    } finally {
      setFetching(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchUsers();
    }
  }, [loading, isAuthenticated, fetchUsers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      u.username.toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term)
    );
  }, [users, q]);

  const toggleField = async (user: Usuario, field: "verificado" | "is_staff") => {
    try {
      setSaving(user.id);
      let payload: Partial<Pick<Usuario, "verificado" | "is_staff">>;
      if (field === "verificado") {
        payload = { verificado: !user.verificado };
      } else {
        payload = { is_staff: !user.is_staff };
      }
      await axiosInstance.patch(`api/admin/users/${user.id}/`, payload);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...payload } : u));
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el usuario");
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <Header />
      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <button onClick={fetchUsers} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Refrescar</button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 border rounded"
          />
        </div>

        {fetching && <p>Cargando usuarios...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!fetching && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Usuario</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Verificado</th>
                  <th className="p-2 border">Admin</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border text-sm">{u.id}</td>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        {u.foto_perfil ? (
                          <Image src={u.foto_perfil} alt={`Foto de ${u.username}`} width={32} height={32} className="w-8 h-8 rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                        )}
                        <div>@{u.username}</div>
                      </div>
                    </td>
                    <td className="p-2 border">{u.first_name} {u.last_name}</td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={u.verificado}
                        onChange={() => toggleField(u, "verificado")}
                        disabled={saving === u.id}
                      />
                    </td>
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={u.is_staff}
                        onChange={() => toggleField(u, "is_staff")}
                        disabled={saving === u.id}
                      />
                    </td>
                    <td className="p-2 border text-sm">
                      <button
                        className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                        onClick={() => alert('Edición de perfil desde admin: por implementar')}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
