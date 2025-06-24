'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, User, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/api';

// Definición del tipo de Usuario, debe coincidir con el backend
interface UserData {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<Partial<UserData>>({});

  useEffect(() => {
    // Pequeño truco para obtener datos del usuario actual sin un hook complejo
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    if(userId && userEmail) {
        setCurrentUser({ id: parseInt(userId), email: userEmail });
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No estás autenticado.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al cargar usuarios');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleStatusChange = async (targetUser: UserData, type: 'is_admin' | 'is_active') => {
    const originalUsers = [...users];
    
    // Optimistic UI update
    const updatedUsers = users.map(u => 
      u.id === targetUser.id ? { ...u, [type]: !targetUser[type] } : u
    );
    setUsers(updatedUsers);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_admin: type === 'is_admin' ? !targetUser.is_admin : targetUser.is_admin,
          is_active: type === 'is_active' ? !targetUser.is_active : targetUser.is_active,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falló la actualización');
      }
    } catch (err: any) {
      setError(err.message);
      setUsers(originalUsers); // Revert on failure
    }
  };

  const handleDelete = async (targetUserId: number) => {
    if (!window.confirm('¿Estás seguro? Esta acción desactivará al usuario y le quitará el rol de administrador.')) {
        return;
    }
    const originalUsers = [...users];
    setUsers(users.filter(u => u.id !== targetUserId));

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Falló la eliminación');
        }
    } catch (err: any) {
        setError(err.message);
        setUsers(originalUsers); // Revert on failure
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Link href="/admin" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">
            Volver al Panel
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <p className="mb-4 text-gray-600">Administra los roles y el estado de los usuarios.</p>

        {loading && <p>Cargando usuarios...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro desde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.nombre || 'N/A'} {user.apellido}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusChange(user, 'is_admin')}
                          disabled={user.id === currentUser.id}
                          className={`flex items-center px-3 py-1 text-sm font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                           <Shield size={14} className="mr-2" /> {user.is_admin ? 'Admin' : 'Usuario'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <button
                           onClick={() => handleStatusChange(user, 'is_active')}
                           disabled={user.id === currentUser.id}
                           className={`flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}>
                           {user.is_active ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} className="text-gray-400" />}
                           <span className={`ml-2 text-sm font-medium ${user.is_active ? 'text-green-700' : 'text-gray-500'}`}>{user.is_active ? 'Activo' : 'Suspendido'}</span>
                         </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                         onClick={() => handleDelete(user.id)}
                         disabled={user.id === currentUser.id}
                         className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron usuarios.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 