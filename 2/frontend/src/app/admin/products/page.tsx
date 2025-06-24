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

  // Agregar log para depuración
  console.log('Renderizando AdminProductsPage');

  if (loading && products.length === 0) {
    return <div className="p-8 text-center">Cargando productos...</div>;
  }

  // Forzar return mínimo para depuración
  return (
    <div style={{ padding: 40 }}>
      <button
        style={{ display: 'block', position: 'relative', zIndex: 9999, background: 'red', fontSize: 24, padding: 20 }}
        onClick={() => alert('Funciona!')}
      >
        Nuevo Producto
      </button>
    </div>
  );
} 