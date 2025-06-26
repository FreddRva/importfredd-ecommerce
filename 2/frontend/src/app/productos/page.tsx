'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Grid, List, Star, ShoppingCart, Eye, Heart, Orbit, ChevronLeft, ChevronRight, RefreshCw, Sparkles, Zap, TrendingUp, Package, Tag } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/context/FavoritesContext';
import { API_BASE_URL } from '@/lib/api';

const ModelViewerModal = dynamic(() => import('@/components/ModelViewerModal'), {
  ssr: false,
  loading: () => <p className="text-center p-4">Cargando visor 3D...</p>,
});

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  image_url?: string;
  created_at: string;
  category_name?: string;
  model_url?: string;
}

interface Category {
  id: number;
  name: string;
}

const MAX_RECENT_SEARCHES = 5;

export default function ProductosPage() {
  return (
    <Suspense fallback={<div>Cargando productos...</div>}>
      <ProductosContent />
    </Suspense>
  );
}

function ProductosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven state
  const searchTermFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : null;
  const pageFromUrl = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // Component state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the search input field itself, separate from URL
  const [inputValue, setInputValue] = useState(searchTermFromUrl);
  const debouncedInputValue = useDebounce(inputValue, 400); // Debounce de 400ms

  // State for suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effect to update URL when debounced input changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (debouncedInputValue) {
      params.set('search', debouncedInputValue);
    } else {
      params.delete('search');
    }
    
    if (debouncedInputValue !== searchTermFromUrl) {
      router.push(`/productos?${params.toString()}`, { scroll: false });
    }
  }, [debouncedInputValue, router, searchTermFromUrl, searchParams]);
  
  // Effect to fetch products when URL parameters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setIsSuggestionsOpen(false);
      const params = new URLSearchParams({
        page: String(pageFromUrl),
        limit: '12',
      });
      if (searchTermFromUrl) params.set('search', searchTermFromUrl);
      if (categoryFromUrl) params.set('category_id', String(categoryFromUrl));

      try {
        const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        
        setProducts(data.products || []);
        setTotalPages(Math.ceil((data.total || 0) / 12));
        
        if (response.ok && searchTermFromUrl) {
          setRecentSearches(prevSearches => {
            const newSearches = [searchTermFromUrl, ...prevSearches.filter(s => s !== searchTermFromUrl)].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem('recentSearches', JSON.stringify(newSearches));
            return newSearches;
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchTermFromUrl, categoryFromUrl, pageFromUrl]);

  // Effect to fetch categories (runs once)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) return;
        const data = await response.json();
        setCategories(data || []);
      } catch (err: any) { console.error(err); }
    };
    fetchCategories();
  }, []);
  
  // Effect to load recent searches (runs once)
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches));
    }
  }, []);

  // Effect to fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedInputValue.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/products/suggestions?q=${debouncedInputValue}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          if ((data.suggestions || []).length > 0) {
            setIsSuggestionsOpen(true);
          }
        }
      } catch (error) { console.error(error); }
    };
    fetchSuggestions();
  }, [debouncedInputValue]);

  // Effect to close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handlers for UI interaction
  const handleCategoryChange = (categoryId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (categoryId) {
        params.set('category_id', String(categoryId));
    } else {
        params.delete('category_id');
    }
    router.push(`/productos?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`/productos?${params.toString()}`, { scroll: false });
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setIsSuggestionsOpen(false);
  };

  const handleInputFocus = () => {
    if (inputValue.length === 0 && recentSearches.length > 0) {
      setSuggestions(recentSearches);
      setIsSuggestionsOpen(true);
    }
  };

  const { addToCart } = useCart();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [selectedModel, setSelectedModel] = useState<{ path: string, name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 animate-fade-in">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin animation-delay-200"></div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Cargando productos...</h3>
                <p className="text-slate-600">Estamos preparando todo para ti</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 p-8 rounded-2xl shadow-xl animate-scale-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-black text-red-800 mb-2">Error al cargar los productos</h3>
                <div className="text-red-700 mb-4">
                  <p>{error}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Intentar nuevamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-40">
      {/* Hero Section - Premium */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-2xl overflow-hidden">
        {/* Partículas animadas */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-white/50 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-white/20 rounded-full animate-bounce"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0 text-center lg:text-left animate-slide-in-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-white/20">
                <Package className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-bold text-white">Catálogo Premium</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4">
                Nuestros Productos
              </h1>
              <p className="text-xl md:text-2xl text-purple-100/90 max-w-2xl leading-relaxed">
                Descubre nuestra colección exclusiva con las mejores ofertas y productos premium
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-right">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:text-purple-100'}`}
                  aria-label="Vista de cuadrícula"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:text-purple-100'}`}
                  aria-label="Vista de lista"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <Filter className="w-5 h-5" />
                <span>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Premium */}
          <div className={`lg:w-80 transition-all duration-500 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 sticky top-8 animate-scale-in">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <Filter className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-black text-slate-900">Filtros</h3>
              </div>
              
              {/* Search Box - Premium */}
              <div className="mb-8" ref={searchContainerRef}>
                <label className="block text-sm font-bold text-slate-700 mb-3">Buscar productos</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all duration-300 group-hover:bg-white/90 group-hover:shadow-lg">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar productos premium..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={handleInputFocus}
                      className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-slate-900 placeholder-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                    />
                  </div>
                  {isSuggestionsOpen && suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-2 w-full bg-white/95 backdrop-blur-md shadow-2xl max-h-60 rounded-2xl py-2 text-base ring-1 ring-black/5 overflow-auto focus:outline-none sm:text-sm border border-gray-200">
                      {suggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          onMouseDown={() => handleSuggestionClick(suggestion)} 
                          className="text-slate-900 cursor-default select-none relative py-3 px-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 transition-all duration-200"
                        >
                          <span className="block truncate font-medium">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Categories Filter - Premium */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-4">Categorías</label>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleCategoryChange(null)} 
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center group ${categoryFromUrl === null ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 font-bold shadow-md' : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50'}`}
                  >
                    <Tag className="w-4 h-4 mr-3 text-purple-500" />
                    <span>Todas las categorías</span>
                    {categoryFromUrl === null && (
                      <span className="ml-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {products.length}
                      </span>
                    )}
                  </button>
                  {categories.map((category) => (
                    <button 
                      key={category.id} 
                      onClick={() => handleCategoryChange(category.id)} 
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center group ${categoryFromUrl === category.id ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 font-bold shadow-md' : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50'}`}
                    >
                      <Tag className="w-4 h-4 mr-3 text-purple-500" />
                      <span>{category.name}</span>
                      {categoryFromUrl === category.id && (
                        <span className="ml-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {products.filter(p => p.category_id === category.id).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1">
            {loading && products.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Cargando...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 animate-scale-in">
                <div className="mx-auto h-24 w-24 text-slate-400 mb-6">
                  <Search className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">No se encontraron productos</h3>
                <p className="text-slate-600 mb-8">Intenta ajustar tus filtros de búsqueda</p>
                <button 
                  onClick={() => {
                    setInputValue('');
                    handleCategoryChange(null);
                    searchInputRef.current?.focus();
                  }} 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                {/* Results Info - Premium */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/50 animate-fade-in">
                  <p className="text-slate-600 mb-2 sm:mb-0">
                    Mostrando <span className="font-bold text-slate-900">{(pageFromUrl - 1) * 12 + 1}-{Math.min(pageFromUrl * 12, products.length + (pageFromUrl - 1) * 12)}</span> de <span className="font-bold text-slate-900">{(totalPages * 12)}</span> productos
                  </p>
                  {searchTermFromUrl && (
                    <div className="flex items-center">
                      <span className="text-sm text-slate-500 mr-2">Búsqueda:</span>
                      <span className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-sm font-bold px-4 py-2 rounded-full flex items-center border border-purple-200">
                        {searchTermFromUrl}
                        <button 
                          onClick={() => setInputValue('')} 
                          className="ml-2 inline-flex items-center p-1 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-900 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Products Display - Premium */}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
                  {products.map((product, index) => (
                    <div 
                      key={product.id} 
                      className={viewMode === 'grid' ? 
                        'group relative bg-white/70 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl border border-white/50 overflow-hidden transition-all duration-500 hover:-translate-y-2 animate-scale-in hover-lift' : 
                        'group flex flex-col sm:flex-row items-start bg-white/70 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl border border-white/50 overflow-hidden transition-all duration-500 hover:-translate-y-2 animate-scale-in hover-lift'
                      }
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          {/* Grid View - Premium */}
                          <Link href={`/productos/${product.id}`} className="block">
                            <div className="relative aspect-square w-full bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
                              <img 
                                src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : product.image_url) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                              <div className="absolute top-4 left-4 flex gap-2">
                                {product.stock > 0 ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                                    ✅ Disponible
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200">
                                    ❌ Agotado
                                  </span>
                                )}
                                {isFavorite(product.id) && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border border-pink-200">
                                    <Heart className="w-3 h-3 mr-1" /> Favorito
                                  </span>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                <span className="text-white font-bold flex items-center text-lg">
                                  <Eye className="w-5 h-5 mr-2" /> Ver detalles
                                </span>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors duration-300">{product.name}</h3>
                                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 bg-purple-100 px-3 py-1 rounded-full inline-block">{product.category_name}</p>
                                </div>
                                <div className="flex items-center text-amber-400">
                                  <Star size={18} fill="currentColor" />
                                  <span className="text-slate-600 text-sm font-bold ml-1">4.5</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl font-black text-slate-900">${product.price.toFixed(2)}</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    isFavorite(product.id) ? removeFavorite(product.id) : addFavorite(product.id);
                                  }}
                                  className={`p-2 rounded-full transition-all duration-300 ${isFavorite(product.id) ? 'text-pink-500 bg-pink-100' : 'text-slate-300 hover:text-pink-400 hover:bg-pink-50'}`}
                                  aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                >
                                  <Heart className="w-6 h-6" fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </div>
                          </Link>
                          <div className="px-6 pb-6">
                            {product.stock === 0 ? (
                              <span className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent text-sm font-bold rounded-xl shadow-lg text-slate-600 bg-slate-100 cursor-not-allowed">
                                Producto agotado
                              </span>
                            ) : (
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => addToCart({ product_id: product.id, product_name: product.name, price: product.price, quantity: 1, image_url: product.image_url || '' })} 
                                  className="flex-1 inline-flex justify-center items-center px-6 py-4 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                                >
                                  <ShoppingCart className="w-5 h-5 mr-2" />
                                  Añadir
                                </button>
                                <button
                                  onClick={() => setSelectedModel({ path: product.model_url || '', name: product.name })}
                                  className="p-4 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white text-slate-700 shadow-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                                  aria-label="Ver en 3D"
                                >
                                  <Orbit className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* List View - Premium */}
                          <Link href={`/productos/${product.id}`} className="block sm:w-48 sm:h-48 w-full h-48 flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden relative">
                              <img 
                                src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : product.image_url) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                              {isFavorite(product.id) && (
                                <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                                  <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 p-6 flex flex-col h-full">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <Link href={`/productos/${product.id}`} className="block">
                                    <h3 className="text-2xl font-black text-slate-900 hover:text-purple-600 transition-colors duration-300">{product.name}</h3>
                                  </Link>
                                  <p className="text-sm font-bold text-purple-600 mt-2 uppercase tracking-wider bg-purple-100 px-3 py-1 rounded-full inline-block">{product.category_name}</p>
                                </div>
                                <div className="flex items-center text-amber-400 ml-4">
                                  <Star size={18} fill="currentColor" />
                                  <span className="text-slate-600 text-sm font-bold ml-1">4.5</span>
                                </div>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{product.description}</p>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <p className="text-3xl font-black text-slate-900">${product.price.toFixed(2)}</p>
                                {product.stock > 0 ? (
                                  <p className="text-xs text-green-600 font-bold mt-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                    Disponible: {product.stock} unidades
                                  </p>
                                ) : (
                                  <p className="text-xs text-red-600 font-bold mt-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                    Producto agotado
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {product.stock === 0 ? (
                                  <span className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-slate-600 bg-slate-100 cursor-not-allowed">
                                    No disponible
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => addToCart({ product_id: product.id, product_name: product.name, price: product.price, quantity: 1, image_url: product.image_url || '' })} 
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Añadir al carrito
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedModel({ path: product.model_url || '', name: product.name })}
                                  className="p-3 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white text-slate-700 shadow-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
                                  aria-label="Ver en 3D"
                                >
                                  <Orbit className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination - Premium */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-8">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button 
                        onClick={() => handlePageChange(pageFromUrl - 1)} 
                        disabled={pageFromUrl <= 1}
                        className="relative inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                      >
                        Anterior
                      </button>
                      <button 
                        onClick={() => handlePageChange(pageFromUrl + 1)} 
                        disabled={pageFromUrl >= totalPages}
                        className="ml-3 relative inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
                          Mostrando página <span className="font-bold">{pageFromUrl}</span> de <span className="font-bold">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-xl shadow-lg -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(pageFromUrl - 1)}
                            disabled={pageFromUrl <= 1}
                            className="relative inline-flex items-center px-4 py-3 rounded-l-xl border border-gray-300 bg-white text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-3 border text-sm font-bold transition-all duration-300 ${pageFromUrl === page ? 'z-10 bg-gradient-to-r from-purple-100 to-blue-100 border-purple-500 text-purple-600 shadow-lg' : 'bg-white border-gray-300 text-slate-500 hover:bg-slate-50'}`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(pageFromUrl + 1)}
                            disabled={pageFromUrl >= totalPages}
                            className="relative inline-flex items-center px-4 py-3 rounded-r-xl border border-gray-300 bg-white text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            <span className="sr-only">Siguiente</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 3D Model Viewer Modal */}
      {selectedModel && (
        <ModelViewerModal 
          modelPath={selectedModel.path} 
          productName={selectedModel.name} 
          onClose={() => setSelectedModel(null)}
          noModelMessage={!selectedModel.path ? "Este producto no tiene un modelo 3D disponible." : undefined}
        />
      )}
    </div>
  );
}