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
      setImagePreview(`${API_URL}${product.image_url}`);
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
    if (newImage) formData.append('image', newImage);
    if (newModel) formData.append('model3d', newModel);

    const endpoint = isCreating 
        ? `${API_URL}/admin/products`
        : `${API_URL}/admin/products/${currentProduct.id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
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

  if (loading && products.length === 0) {
    return <div className="p-8 text-center">Cargando productos...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <PlusCircle size={16} /> Nuevo Producto
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Activo</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-4 py-2">{product.id}</td>
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2">{categories.find(c => c.id === product.category_id)?.name || '-'}</td>
                <td className="px-4 py-2">${product.price}</td>
                <td className="px-4 py-2">{product.stock}</td>
                <td className="px-4 py-2">{product.is_active ? 'Sí' : 'No'}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:underline"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(isCreating || currentProduct) && (
        <form onSubmit={handleSubmit} className="mt-8 bg-gray-50 p-6 rounded-lg shadow-md max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-4">{isCreating ? 'Nuevo Producto' : 'Editar Producto'}</h2>
          {error && <div className="mb-4 text-red-600">{error}</div>}
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
              {categories.map(cat => (
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
            <label className="block mb-1">Modelo 3D (.glb)</label>
            <input type="file" accept=".glb" onChange={handleModelChange} />
            {modelName && <span className="ml-2">{modelName}</span>}
          </div>
          <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" checked={currentProduct?.is_active || false} onChange={handleCheckboxChange} />
              Activo
            </label>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">{isCreating ? 'Crear' : 'Actualizar'}</button>
            <button type="button" onClick={handleCancel} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}