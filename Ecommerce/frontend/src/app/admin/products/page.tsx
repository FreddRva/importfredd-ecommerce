"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { PlusCircle, Edit, Trash2, UploadCloud, Save, Search, Filter, Eye, EyeOff, Star, Package, ArrowLeft, Sparkles, Shield, X, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  stock: number;
  image_url: string;
  dimensions: string;
  model_url?: string;
  is_active: boolean;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
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
  const [success, setSuccess] = useState("");

  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [newModel, setNewModel] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "created">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
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

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && product.is_active) ||
                           (statusFilter === "inactive" && !product.is_active);
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "stock":
          aValue = a.stock;
          bValue = b.stock;
          break;
        case "created":
          aValue = new Date(a.created_at || "").getTime();
          bValue = new Date(b.created_at || "").getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  
  const resetFormState = () => {
    setCurrentProduct(null);
    setIsCreating(false);
    setIsEditing(false);
    setNewImage(null);
    setImagePreview(null);
    setNewModel(null);
    setModelName(null);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const res = await fetch(`${API_URL}/admin/products/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setSuccess("Producto eliminado correctamente");
          fetchProducts();
          setTimeout(() => setSuccess(""), 3000);
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
    setIsEditing(true);
    if(product.image_url) {
      setImagePreview(product.image_url.startsWith('http') ? product.image_url : `${API_URL}${product.image_url}`);
    }
  };
  
  const handleAddNew = () => {
    resetFormState();
    setCurrentProduct({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category_id: categories[0]?.id || 0,
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
    formData.append('dimensions', currentProduct.dimensions || '');
    if (newImage) formData.append('image', newImage);
    if (newModel) formData.append('model', newModel);

    try {
      const url = isCreating 
        ? `${API_URL}/admin/products` 
        : `${API_URL}/admin/products/${currentProduct.id}`;
      
      const method = isCreating ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const message = isCreating ? "Producto creado correctamente" : "Producto actualizado correctamente";
        setSuccess(message);
        resetFormState();
        fetchProducts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || `Error al ${isCreating ? 'crear' : 'actualizar'} el producto`);
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const res = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...product,
          is_active: !product.is_active
        }),
      });
      
      if (res.ok) {
        setSuccess(`Producto ${product.is_active ? 'desactivado' : 'activado'} correctamente`);
        fetchProducts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Error al cambiar el estado del producto");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 text-white relative overflow-hidden">
      {/* Floating Icons Decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-fuchsia-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-yellow-400/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-cyan-400/15 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-fuchsia-400/25 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-yellow-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-cyan-400/30 rounded-full animate-float-delayed"></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16">
            <Link 
              href="/admin"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-400/20 to-cyan-400/20 backdrop-blur-md rounded-full px-6 py-3 font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-400/40 hover:to-cyan-400/40 hover:text-yellow-300 transition-all duration-300 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>
            <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-tight mb-4">
              Gestión de Productos
            </h1>
            <p className="text-xl text-fuchsia-200">
              Administra tu catálogo de productos con herramientas avanzadas
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="bg-gradient-to-r from-red-900/40 to-fuchsia-900/40 border border-red-800/30 rounded-2xl p-4 mb-6 backdrop-blur-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-bold">{error}</p>
              <button onClick={() => setError("")} className="ml-auto">
                <X className="w-4 h-4 text-red-400 hover:text-red-300" />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-800/30 rounded-2xl p-4 mb-6 backdrop-blur-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-bold">{success}</p>
              <button onClick={() => setSuccess("")} className="ml-auto">
                <X className="w-4 h-4 text-green-400 hover:text-green-300" />
              </button>
            </div>
          )}

          {/* Controles y Filtros */}
          <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Búsqueda premium */}
                <div className="relative flex-1 max-w-md group">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-gradient-to-r from-slate-900/70 via-fuchsia-900/60 to-indigo-900/70 backdrop-blur-md rounded-2xl border-2 border-fuchsia-800/40 text-black placeholder-black focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300 shadow-lg focus:shadow-xl outline-none"
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fuchsia-400 group-focus-within:text-yellow-400 transition-colors duration-300" />
                </div>

                {/* Filtros */}
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-black focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-black focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón Nuevo Producto */}
              <button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 px-6 py-3 rounded-2xl font-black hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30 flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Nuevo Producto
              </button>
            </div>

            {/* Ordenamiento */}
            <div className="flex gap-3 mt-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-fuchsia-800/30 text-white focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price">Ordenar por precio</option>
                <option value="stock">Ordenar por stock</option>
                <option value="created">Ordenar por fecha</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-fuchsia-800/30 text-white hover:bg-slate-900/80 transition-all duration-300"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* Lista de Productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <div key={product.id} className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-6 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
                {/* Imagen del producto */}
                <div className="relative mb-4">
                  <div className="w-full h-48 bg-gradient-to-br from-fuchsia-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center border border-fuchsia-400/30 overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url.startsWith('http') ? product.image_url : `${API_URL}${product.image_url}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-fuchsia-400" />
                    )}
                  </div>
                  
                  {/* Badges de estado */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {!product.is_active && (
                      <div className="bg-red-900/80 backdrop-blur-sm text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-400/30">
                        Inactivo
                      </div>
                    )}
                    {product.featured && (
                      <div className="bg-yellow-900/80 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400/30 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Destacado
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del producto */}
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-white group-hover:text-yellow-300 transition-colors duration-300 truncate">
                    {product.name}
                  </h3>
                  
                  <p className="text-fuchsia-200 text-sm line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-yellow-400">
                      €{product.price.toFixed(2)}
                    </span>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                      product.stock > 10 
                        ? 'bg-green-900/40 text-green-400 border border-green-400/30' 
                        : product.stock > 0 
                        ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-400/30'
                        : 'bg-red-900/40 text-red-400 border border-red-400/30'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Categoría */}
                  <div className="text-xs text-cyan-300">
                    {categories.find(c => c.id === product.category_id)?.name || 'Sin categoría'}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t border-fuchsia-800/30">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 px-3 py-2 rounded-xl border border-cyan-400/30 hover:from-blue-600/40 hover:to-cyan-600/40 transition-all duration-300 text-sm font-bold"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </button>
                    
                    <button
                      onClick={() => toggleProductStatus(product)}
                      className={`px-3 py-2 rounded-xl border text-sm font-bold transition-all duration-300 ${
                        product.is_active
                          ? 'bg-red-600/20 text-red-400 border-red-400/30 hover:from-red-600/40 hover:to-red-600/40'
                          : 'bg-green-600/20 text-green-400 border-green-400/30 hover:from-green-600/40 hover:to-green-600/40'
                      }`}
                    >
                      {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-600/20 text-red-400 rounded-xl border border-red-400/30 hover:from-red-600/40 hover:to-red-600/40 transition-all duration-300 text-sm font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje cuando no hay productos */}
          {filteredAndSortedProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-fuchsia-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-fuchsia-200 mb-2">No se encontraron productos</h3>
              <p className="text-fuchsia-300">Intenta ajustar los filtros o crear un nuevo producto.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-600 to-yellow-400 rounded-full flex items-center justify-center animate-spin mx-auto mb-4">
                <div className="w-8 h-8 bg-slate-900 rounded-full"></div>
              </div>
              <p className="text-fuchsia-200">Cargando productos...</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      {(isCreating || isEditing) && currentProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-fuchsia-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent">
                {isCreating ? 'Crear Nuevo Producto' : 'Editar Producto'}
              </h2>
              <button
                onClick={handleCancel}
                className="w-8 h-8 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center hover:bg-red-600/40 transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campos básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-fuchsia-200">Nombre *</label>
                  <input
                    type="text"
                    name="name"
                    value={currentProduct.name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-white placeholder-fuchsia-300/50 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-fuchsia-200">Precio (€) *</label>
                  <input
                    type="number"
                    name="price"
                    value={currentProduct.price || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-white placeholder-fuchsia-300/50 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-fuchsia-200">Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={currentProduct.stock || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-white placeholder-fuchsia-300/50 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-fuchsia-200">Categoría *</label>
                  <select
                    name="category_id"
                    value={currentProduct.category_id || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-white focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-fuchsia-200">Descripción</label>
                <textarea
                  name="description"
                  value={currentProduct.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-white placeholder-fuchsia-300/50 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300 resize-none"
                  placeholder="Descripción del producto..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-fuchsia-200">Dimensiones</label>
                <input
                  type="text"
                  name="dimensions"
                  value={currentProduct.dimensions || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 text-white placeholder-fuchsia-300/50 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 transition-all duration-300"
                  placeholder="10x10x10 cm"
                />
              </div>

              {/* Imagen */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-fuchsia-200">Imagen del Producto</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="w-full h-32 bg-gradient-to-br from-fuchsia-500/20 to-yellow-500/20 rounded-2xl border-2 border-dashed border-fuchsia-400/30 flex flex-col items-center justify-center cursor-pointer hover:from-fuchsia-500/30 hover:to-yellow-500/30 transition-all duration-300"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-fuchsia-400 mb-2" />
                        <span className="text-fuchsia-200 text-sm">Haz clic para subir una imagen</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Modelo 3D */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-fuchsia-200">Modelo 3D (.glb)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".glb"
                    onChange={handleModelChange}
                    className="hidden"
                    id="model-upload"
                  />
                  <label
                    htmlFor="model-upload"
                    className="w-full px-4 py-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border-2 border-dashed border-cyan-400/30 flex items-center justify-center cursor-pointer hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300"
                  >
                    <UploadCloud className="w-5 h-5 text-cyan-400 mr-2" />
                    <span className="text-cyan-200 text-sm">
                      {modelName || 'Haz clic para subir un modelo 3D'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={currentProduct.is_active || false}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500 border-fuchsia-800/30 rounded bg-slate-900/60"
                  />
                  <span className="text-fuchsia-200 font-bold">Producto Activo</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={currentProduct.featured || false}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-yellow-600 focus:ring-yellow-500 border-yellow-800/30 rounded bg-slate-900/60"
                  />
                  <span className="text-yellow-200 font-bold">Producto Destacado</span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 py-3 rounded-2xl font-black hover:from-yellow-400 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{isCreating ? 'Crear Producto' : 'Guardar Cambios'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gradient-to-r from-slate-600/20 to-slate-600/20 text-slate-300 rounded-2xl border border-slate-600/30 hover:from-slate-600/40 hover:to-slate-600/40 transition-all duration-300 font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}