"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { PlusCircle, Edit, Trash2, UploadCloud, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  stock: number;
  image_url: string;
  dimensions: string; // Dimensiones físicas (ej: "10x10x10")
  model_url?: string; // Ruta del archivo 3D (.glb)
  is_active: boolean;
  featured?: boolean;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [newModel, setNewModel] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  
  const { token } = useAuth();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        const data = await res.json();
        setError(data.error || "Error al cargar productos");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
    }
  }, [token, fetchProducts, fetchCategories]);
  
  const resetFormState = () => {
    setCurrentProduct(null);
    setIsCreating(false);
    setNewImage(null);
    setImagePreview(null);
    setNewModel(null);
    setModelName(null);
    setError("");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const res = await fetch(`${API_URL}/admin/products/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          fetchProducts(); // Recargar productos
        } else {
          const data = await res.json();
          setError(data.error || "Error al eliminar el producto");
        }
      } catch (err: any) {
        setError(err.message || "Error de conexión al eliminar");
      }
    }
  };
  
  const handleEdit = (product: Product) => {
    resetFormState();
    setCurrentProduct(product);
    if(product.image_url) {
      setImagePreview(product.image_url.startsWith('http') ? product.image_url : product.image_url);
    }
  };
  
  const handleAddNew = () => {
    console.log("Clic en Nuevo Producto");
    resetFormState();
    setCurrentProduct({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category_id: 0,
        is_active: true,
        featured: false,
        image_url: '',
        dimensions: ''
    });
    setIsCreating(true);
  };
  
  const handleCancel = () => {
    resetFormState();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => (prev ? { ...prev, [name]: value } : null));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentProduct(prev => (prev ? { ...prev, [name]: checked } : null));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(currentProduct?.image_url ? `${API_URL}${currentProduct.image_url}` : null);
    }
  };

  const handleModelChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewModel(file);
    setModelName(file ? file.name : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!currentProduct.name || !currentProduct.price || !currentProduct.stock || !currentProduct.category_id) {
        setError("Por favor, completa todos los campos requeridos.");
        return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('name', currentProduct.name);
    formData.append('description', currentProduct.description || '');
    formData.append('price', String(currentProduct.price));
    formData.append('stock', String(currentProduct.stock));
    formData.append('category_id', String(currentProduct.category_id));
    formData.append('is_active', String(currentProduct.is_active || false));
    formData.append('featured', String(currentProduct.featured || false));
    if (newImage) formData.append('image', newImage);
    if (newModel) formData.append('model3d', newModel);

    const endpoint = isCreating 
        ? `${API_URL}/admin/products`
        : `${API_URL}/admin/products/${currentProduct.id}`;
    const method = isCreating ? "POST" : "PUT";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        resetFormState();
        fetchProducts();
      } else {
        const data = await res.json();
        setError(data.error || "Error al actualizar el producto");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  if (!isClient || !token) {
    return <div className="p-8 text-center">Cargando autenticación...</div>;
  }

  if (loading && products.length === 0) {
    return <div className="p-8 text-center">Cargando productos...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-32 pb-16">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center sm:text-left">Gestionar Productos</h1>
          <button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-lg border-2 border-green-400 hover:border-blue-600 transition-all duration-200 text-lg"
          >
            <PlusCircle size={20} /> Nuevo Producto
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-base mb-4 font-semibold text-center">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Activo</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && <tr><td colSpan={7} className="text-center py-6 text-lg font-semibold text-gray-400">Cargando...</td></tr>}
              {!loading && safeProducts.map((product) => (
                <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">{product.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{safeCategories.find(c => c.id === product.category_id)?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-700 font-bold">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {product.is_active ? <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Sí</span> : <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">No</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors" title="Editar">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal de producto: mejora visual si ya existe */}
        {currentProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in">
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                title="Cerrar"
              >
                <span className="sr-only">Cerrar</span>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
                {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-4">
                  <label className="block mb-1">Nombre</label>
                  <input name="name" value={currentProduct?.name || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Descripción</label>
                  <textarea name="description" value={currentProduct?.description || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Precio</label>
                  <input type="number" name="price" value={currentProduct?.price || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Stock</label>
                  <input type="number" name="stock" value={currentProduct?.stock || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Categoría</label>
                  <select name="category_id" value={currentProduct?.category_id || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                    <option value="">Selecciona una categoría</option>
                    {safeCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Dimensiones físicas</label>
                  <input name="dimensions" value={currentProduct?.dimensions || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Ej: 10x10x10" />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Imagen</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-24" />}
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Modelo 3D (.glb, .gltf, .obj)</label>
                  <input type="file" accept=".glb,.gltf,.obj,.fbx,.dae" onChange={handleModelChange} />
                  {modelName && <span className="ml-2">{modelName}</span>}
                </div>
                <div className="mb-4 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="is_active" checked={currentProduct?.is_active || false} onChange={handleCheckboxChange} />
                    Activo
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="featured" checked={currentProduct?.featured || false} onChange={handleCheckboxChange} />
                    Producto destacado
                  </label>
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">{isCreating ? 'Crear' : 'Actualizar'}</button>
                  <button type="button" onClick={handleCancel} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}