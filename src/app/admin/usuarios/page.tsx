// src/app/admin/usuarios/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/utils/AuthContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Checkbox from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";

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
  const { show } = useToast();

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
      show("success", "Usuario actualizado");
    } catch (e) {
      console.error(e);
      show("error", "No se pudo actualizar el usuario");
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <Header />
      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-zinc-100">Gestión de Usuarios</h1>
            <Button variant="secondary" onClick={fetchUsers}>Refrescar</Button>
          </div>
          <Card>
            <div className="relative p-4">
              <div className="mb-4">
                <div className="w-full md:w-1/2">
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, usuario o email"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2 mb-3">{error}</div>}

              <Table
                headers={["ID", "Usuario", "Nombre", "Email", "Verificado", "Admin", "Acciones"]}
                loading={fetching}
                emptyMessage={filtered.length === 0 && !fetching ? "Sin usuarios" : undefined}
              >
                {filtered.map((u) => (
                  <tr key={u.id} className="odd:bg-zinc-950/30 even:bg-zinc-900/30">
                    <td className="px-4 py-2 border-b border-zinc-800 text-xs text-zinc-400">{u.id}</td>
                    <td className="px-4 py-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        {u.foto_perfil ? (
                          <Image src={u.foto_perfil} alt={`Foto de ${u.username}`} width={32} height={32} className="w-8 h-8 rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800" />
                        )}
                        <div className="text-zinc-200">@{u.username}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b border-zinc-800 text-zinc-200">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-2 border-b border-zinc-800 text-zinc-200">{u.email}</td>
                    <td className="px-4 py-2 border-b border-zinc-800 text-center">
                      <Checkbox
                        id={`verificado-${u.id}`}
                        checked={u.verificado}
                        onChange={() => toggleField(u, "verificado")}
                        disabled={saving === u.id}
                        label=""
                      />
                    </td>
                    <td className="px-4 py-2 border-b border-zinc-800 text-center">
                      <Checkbox
                        id={`isstaff-${u.id}`}
                        checked={u.is_staff}
                        onChange={() => toggleField(u, "is_staff")}
                        disabled={saving === u.id}
                        label=""
                      />
                    </td>
                    <td className="px-4 py-2 border-b border-zinc-800 text-sm">
                      <Button variant="ghost" size="sm" onClick={() => show("info", "Edición por implementar")}>Editar</Button>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
