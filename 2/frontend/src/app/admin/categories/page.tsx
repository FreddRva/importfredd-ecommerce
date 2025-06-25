'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PlusCircle, Edit, Trash2, Tag, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      console.log("DEBUG: Haciendo fetch de categorías");
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("DEBUG: Respuesta de categorías", data);
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las categorías.');
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error("DEBUG: Error en fetch de categorías", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-32 pb-16">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center sm:text-left">Gestionar Categorías</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-lg border-2 border-green-400 hover:border-blue-600 transition-all duration-200 text-lg"
          >
            <PlusCircle size={20} /> Nueva Categoría
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-base mb-4 font-semibold text-center">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && <tr><td colSpan={4} className="text-center py-6 text-lg font-semibold text-gray-400">Cargando...</td></tr>}
              {!loading && categories.map((category) => (
                <tr key={category.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">{category.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{category.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                    <button onClick={() => setCurrentCategory(category)} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors" title="Editar">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => {/* handleDelete aquí */}} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal y lógica adicional aquí */}
      </div>
    </div>
  );
}

// ... el resto del código original queda comentado o eliminado temporalmente para esta prueba ... 