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
    console.log("DEBUG: useEffect de categorías ejecutado", { token });
    if (token) {
      fetchCategories();
    }
  }, [token]);

  console.log("DEBUG: Renderizando AdminCategoriesPage", { categories, loading, error });
  return (
    <div style={{ background: 'yellow', color: 'black', zIndex: 9999 }}>
      <h1>PRUEBA DE RENDER</h1>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestionar Categorías</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg border-2 border-green-700"
          >
            <PlusCircle size={16} /> Nueva Categoría
          </button>
        </div>
        {error && <div style={{color: 'red', fontWeight: 'bold', fontSize: 24}}>{error}</div>}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && <tr><td colSpan={4} className="text-center py-4">Cargando...</td></tr>}
              {!loading && categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{category.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{category.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-4">
                    <button onClick={() => setCurrentCategory(category)} className="text-blue-600 hover:text-blue-800">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => {/* handleDelete aquí */}} className="text-red-600 hover:text-red-800">
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