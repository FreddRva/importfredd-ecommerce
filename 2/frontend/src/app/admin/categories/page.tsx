'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PlusCircle, Edit, Trash2, Tag, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
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
  const [showDeleted, setShowDeleted] = useState(false);

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

  // --- NUEVO: Funciones CRUD de categoría ---
  // Abrir modal para nueva categoría
  const openNewCategoryModal = () => {
    setCurrentCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setIsModalOpen(true);
    setError('');
  };

  // Abrir modal para editar
  const openEditCategoryModal = (category: Category) => {
    setCurrentCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setIsModalOpen(true);
    setError('');
  };

  // Guardar (crear o editar)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError('');
    try {
      const isEdit = !!currentCategory;
      const url = isEdit
        ? `${API_BASE_URL}/admin/categories/${currentCategory!.id}`
        : `${API_BASE_URL}/admin/categories`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la categoría');
      setIsModalOpen(false);
      setCurrentCategory(null);
      setCategoryName('');
      setCategoryDescription('');
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la categoría "${category.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar la categoría');
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- FIN CRUD ---

  // Filtrar categorías según el toggle
  const visibleCategories = showDeleted ? categories : categories.filter(cat => cat.is_active !== false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-32 pb-16">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center sm:text-left">Gestionar Categorías</h1>
          <button
            onClick={openNewCategoryModal}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-lg border-2 border-green-400 hover:border-blue-600 transition-all duration-200 text-lg"
          >
            <PlusCircle size={20} /> Nueva Categoría
          </button>
        </div>
        {/* Toggle para mostrar eliminadas (opcional, futuro) */}
        {/*
        <div className="mb-4 flex justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showDeleted} onChange={() => setShowDeleted(v => !v)} />
            <span className="text-sm text-gray-600">Mostrar eliminadas</span>
          </label>
        </div>
        */}
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
              {!loading && visibleCategories.map((category) => (
                <tr key={category.id} className={`hover:bg-blue-50 transition-colors ${category.is_active === false ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">{category.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{category.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                    <button onClick={() => openEditCategoryModal(category)} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors" title="Editar" disabled={category.is_active === false}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteCategory(category)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors" title="Eliminar" disabled={category.is_active === false}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal para agregar/editar categoría */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                title="Cerrar"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
                {currentCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <form onSubmit={handleSaveCategory} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Nombre</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Descripción</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
                    value={categoryDescription}
                    onChange={e => setCategoryDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-bold py-3 rounded-xl shadow-lg text-lg transition-all duration-200"
                >
                  {currentCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 