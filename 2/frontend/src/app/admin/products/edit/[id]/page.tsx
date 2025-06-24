'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  stock: number;
  image_url: string;
  dimensions: string; // Used for 3D model URL
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<Partial<Product>>({ image_url: '', dimensions: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [newModel, setNewModel] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error(err);
      }
    };
    Promise.all([fetchProduct(), fetchCategories()]).finally(() => setLoading(false));
  }, [id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleModelChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewModel(file);
    setModelName(file ? file.name : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !product.name || !product.price || !product.stock || !product.category_id) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description || '');
      formData.append('price', String(product.price));
      formData.append('stock', String(product.stock));
      formData.append('category_id', String(product.category_id));
      formData.append('is_active', String(product.is_active || false));
      if (newImage) formData.append('image', newImage);
      if (newModel) formData.append('model3d', newModel);

      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Error actualizando producto");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="p-8">Cargando producto...</p>;
  if (error && !product.id) return <p className="p-8 text-red-500">Error: {error}</p>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Editar Producto</h1>
        <button onClick={() => router.back()} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
          <input type="text" id="name" name="name" value={product.name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea id="description" name="description" rows={4} value={product.description || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" id="price" name="price" step="0.01" value={product.price || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required min="0" />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" id="stock" name="stock" value={product.stock || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required min="0" />
          </div>
        </div>

        <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Categoría</label>
            <select id="category_id" name="category_id" value={product.category_id || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                <option value="">Selecciona una categoría</option>
                {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
            </select>
        </div>

        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Producto Activo</span>
            <label htmlFor="is_active" className="relative inline-flex items-center cursor-pointer">
                <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="sr-only peer"
                checked={product.is_active || false}
                onChange={(e) => setProduct(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex-shrink-0">
              <span className="text-xs text-gray-500">Actual</span>
              {imagePreview ? <img src={imagePreview} alt="Nueva" className="h-20 w-20 mt-1 rounded-md object-cover" /> : (product.image_url && <img src={`${API_BASE_URL}${product.image_url}`} alt="Actual" className="h-20 w-20 mt-1 rounded-md object-cover" />)}
            </div>
            <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 border border-gray-300 px-4 py-2 self-center">
              <span><UploadCloud size={16} className="inline-block mr-2"/>Cambiar Imagen</span>
              <input id="image-upload" name="image" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
            </label>
          </div>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700">Modelo 3D (.glb)</label>
            <div className="mt-2 flex items-center gap-4">
                <div className="w-full">
                    <span className="text-xs text-gray-500">Archivo</span>
                    <div className="text-sm text-gray-800 mt-1">
                      {modelName ? <span className="font-semibold text-indigo-600">{modelName}</span> : (product.dimensions ? product.dimensions.split('/').pop() : 'Ninguno')}
                    </div>
                </div>
                <label htmlFor="model-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 border border-gray-300 px-4 py-2 whitespace-nowrap self-center">
                    <span><UploadCloud size={16} className="inline-block mr-2"/>Cambiar Modelo</span>
                    <input id="model-upload" name="model3d" type="file" className="sr-only" onChange={handleModelChange} accept=".glb" />
                </label>
            </div>
        </div>

        {error && <p className="text-red-500 text-sm py-2">{error}</p>}

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            <Save size={16} /> Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
} 