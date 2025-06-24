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
  dimensions: string; // Used for 3D model URL
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
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);
  
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
    const method = isCreating ? "POST" : "PUT";

    try {
        const res = await fetch(endpoint, {
            method: method,
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            resetFormState();
            fetchProducts();
        } else {
            const errorData = await res.json();
            setError(errorData.error || `Error al ${isCreating ? 'crear' : 'actualizar'} el producto`);
        }
    } catch (err: any) {
        setError(err.message);
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

      {isCreating || currentProduct ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">{isCreating ? "Crear Nuevo Producto" : "Editar Producto"}</h2>
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input type="text" id="name" name="name" value={currentProduct?.name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="description" name="description" rows={4} value={currentProduct?.description || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
                <input type="number" id="price" name="price" step="0.01" value={currentProduct?.price || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required min="0" />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
                <input type="number" id="stock" name="stock" value={currentProduct?.stock || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required min="0" />
              </div>
            </div>

            <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Categoría</label>
                <select id="category_id" name="category_id" value={currentProduct?.category_id || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
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
                      checked={currentProduct?.is_active || false}
                      onChange={handleCheckboxChange}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {imagePreview ? <img src={imagePreview} alt="Vista previa" className="h-20 w-20 mt-1 rounded-md object-cover" /> : <div className="h-20 w-20 mt-1 rounded-md bg-gray-100"></div>}
                </div>
                <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 border border-gray-300 px-4 py-2 self-center">
                  <span><UploadCloud size={16} className="inline-block mr-2"/>Subir Imagen</span>
                  <input id="image-upload" name="image" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                </label>
              </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">Modelo 3D (.glb)</label>
                <div className="mt-2 flex items-center gap-4">
                    <div className="w-full">
                        <span className="text-xs text-gray-500">Archivo actual</span>
                        <div className="text-sm text-gray-800 mt-1">
                          {modelName ? <span className="font-semibold text-indigo-600">{modelName}</span> : (currentProduct?.dimensions ? currentProduct.dimensions.split('/').pop() : 'Ninguno')}
                        </div>
                    </div>
                    <label htmlFor="model-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 border border-gray-300 px-4 py-2 whitespace-nowrap self-center">
                        <span><UploadCloud size={16} className="inline-block mr-2"/>Subir Modelo</span>
                        <input id="model-upload" name="model3d" type="file" className="sr-only" onChange={handleModelChange} accept=".glb" />
                    </label>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm py-2">{error}</p>}

            <div className="flex justify-end gap-4">
               <button type="button" onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                Cancelar
              </button>
              <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                <Save size={16} /> {isCreating ? "Guardar Producto" : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Imagen</th>
                <th scope="col" className="px-6 py-3">Nombre</th>
                <th scope="col" className="px-6 py-3">Precio</th>
                <th scope="col" className="px-6 py-3">Stock</th>
                <th scope="col" className="px-6 py-3">Estado</th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Editar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img
                      src={`${API_URL}${product.image_url}`}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                    />
                  </td>
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                  >
                    {product.name}
                  </th>
                  <td className="px-6 py-4">${product.price}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(product)} className="font-medium text-blue-600 hover:underline">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="font-medium text-red-600 hover:underline">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && !currentProduct && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
} 