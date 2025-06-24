'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Grid, List, Star, ShoppingCart, Eye, Heart, Orbit, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
              <h3 className="text-xl font-semibold text-gray-800">Cargando productos...</h3>
              <p className="text-gray-500">Estamos preparando todo para ti</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-red-800">Error al cargar los productos</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button onClick={() => window.location.reload()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Intentar nuevamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Nuestros Productos</h1>
              <p className="mt-3 max-w-md text-xl text-blue-100">Descubre nuestra colección exclusiva con las mejores ofertas</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:text-blue-100'}`}
                  aria-label="Vista de cuadrícula"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:text-blue-100'}`}
                  aria-label="Vista de lista"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="flex items-center space-x-2 bg-white text-blue-600 px-5 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg"
              >
                <Filter className="w-5 h-5" />
                <span>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-72 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Filtros</h3>
              
              {/* Search Box */}
              <div className="mb-8" ref={searchContainerRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Buscar productos</label>
                <div className="relative rounded-lg shadow-sm bg-white border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar productos..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleInputFocus}
                    className="block w-full pl-10 pr-3 py-3 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-0 sm:text-sm"
                  />
                  {isSuggestionsOpen && suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {suggestions.map((suggestion, index) => (
                        <li 
                          key={index} 
                          onMouseDown={() => handleSuggestionClick(suggestion)} 
                          className="text-gray-900 cursor-default select-none relative py-2 pl-10 pr-4 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <span className="block truncate">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Categories Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Categorías</label>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleCategoryChange(null)} 
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center ${categoryFromUrl === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span>Todas las categorías</span>
                    {categoryFromUrl === null && (
                      <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {products.length}
                      </span>
                    )}
                  </button>
                  {categories.map((category) => (
                    <button 
                      key={category.id} 
                      onClick={() => handleCategoryChange(category.id)} 
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center ${categoryFromUrl === category.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span>{category.name}</span>
                      {categoryFromUrl === category.id && (
                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
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
              <div className="text-center py-12 text-gray-500">Cargando...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm p-8">
                <div className="mx-auto h-24 w-24 text-gray-400">
                  <Search className="w-full h-full" />
                </div>
                <h3 className="mt-4 text-2xl font-medium text-gray-900">No se encontraron productos</h3>
                <p className="mt-2 text-gray-500 mb-6">Intenta ajustar tus filtros de búsqueda</p>
                <button 
                  onClick={() => {
                    setInputValue('');
                    handleCategoryChange(null);
                    searchInputRef.current?.focus();
                  }} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-gray-600 mb-2 sm:mb-0">
                    Mostrando <span className="font-semibold">{(pageFromUrl - 1) * 12 + 1}-{Math.min(pageFromUrl * 12, products.length + (pageFromUrl - 1) * 12)}</span> de <span className="font-semibold">{(totalPages * 12)}</span> productos
                  </p>
                  {searchTermFromUrl && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Búsqueda:</span>
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                        {searchTermFromUrl}
                        <button 
                          onClick={() => setInputValue('')} 
                          className="ml-1.5 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-900"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Products Display */}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className={viewMode === 'grid' ? 
                        'group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1' : 
                        'group flex flex-col sm:flex-row items-start bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1'
                      }
                    >
                      {viewMode === 'grid' ? (
                        <>
                          {/* Grid View */}
                          <Link href={`/productos/${product.id}`} className="block">
                            <div className="relative aspect-square w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                              <img 
                                src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`) : "/placeholder.png"} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                              />
                              <div className="absolute top-3 left-3 flex gap-2">
                                {product.stock > 0 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Agotado
                                  </span>
                                )}
                                {isFavorite(product.id) && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    <Heart className="w-3 h-3 mr-1" /> Favorito
                                  </span>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-white font-medium flex items-center">
                                  <Eye className="w-4 h-4 mr-1" /> Ver detalles
                                </span>
                              </div>
                            </div>
                            <div className="p-5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{product.category_name}</p>
                                </div>
                                <div className="flex items-center text-amber-400">
                                  <Star size={16} fill="currentColor" />
                                  <span className="text-gray-600 text-sm ml-1">4.5</span>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-2xl font-extrabold text-gray-900">${product.price.toFixed(2)}</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    isFavorite(product.id) ? removeFavorite(product.id) : addFavorite(product.id);
                                  }}
                                  className={`p-2 rounded-full ${isFavorite(product.id) ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400'}`}
                                  aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                >
                                  <Heart className="w-5 h-5" fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </div>
                          </Link>
                          <div className="px-5 pb-5">
                            {product.stock === 0 ? (
                              <span className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-600 bg-gray-100 cursor-not-allowed">
                                Producto agotado
                              </span>
                            ) : (
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => addToCart({ product_id: product.id, product_name: product.name, price: product.price, quantity: 1, image_url: product.image_url || '' })} 
                                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <ShoppingCart className="w-5 h-5 mr-2" />
                                  Añadir
                                </button>
                                <button 
                                  onClick={() => setSelectedModel({ path: product.model_url || `/uploads/1750571279467126500_Zapatillas.glb`, name: product.name })} 
                                  className="p-3 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                          {/* List View */}
                          <Link href={`/productos/${product.id}`} className="block sm:w-48 sm:h-48 w-full h-48 flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
                              <img 
                                src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`) : "/placeholder.png"} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                              {isFavorite(product.id) && (
                                <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md">
                                  <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 p-6 flex flex-col h-full">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <Link href={`/productos/${product.id}`} className="block">
                                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">{product.name}</h3>
                                  </Link>
                                  <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider">{product.category_name}</p>
                                </div>
                                <div className="flex items-center text-amber-400 ml-4">
                                  <Star size={16} fill="currentColor" />
                                  <span className="text-gray-600 text-sm ml-1">4.5</span>
                                </div>
                              </div>
                              <p className="text-gray-600 mt-3 text-sm leading-relaxed line-clamp-3">{product.description}</p>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                                {product.stock > 0 ? (
                                  <p className="text-xs text-green-600 font-medium mt-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                    Disponible: {product.stock} unidades
                                  </p>
                                ) : (
                                  <p className="text-xs text-red-600 font-medium mt-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                                    Producto agotado
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {product.stock === 0 ? (
                                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-600 bg-gray-100 cursor-not-allowed">
                                    No disponible
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => addToCart({ product_id: product.id, product_name: product.name, price: product.price, quantity: 1, image_url: product.image_url || '' })} 
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Añadir al carrito
                                  </button>
                                )}
                                <button 
                                  onClick={() => setSelectedModel({ path: product.model_url || `/uploads/1750571279467126500_Zapatillas.glb`, name: product.name })} 
                                  className="p-2 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button 
                        onClick={() => handlePageChange(pageFromUrl - 1)} 
                        disabled={pageFromUrl <= 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button 
                        onClick={() => handlePageChange(pageFromUrl + 1)} 
                        disabled={pageFromUrl >= totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando página <span className="font-medium">{pageFromUrl}</span> de <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(pageFromUrl - 1)}
                            disabled={pageFromUrl <= 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageFromUrl === page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(pageFromUrl + 1)}
                            disabled={pageFromUrl >= totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {selectedModel && <ModelViewerModal modelPath={selectedModel.path} productName={selectedModel.name} onClose={() => setSelectedModel(null)} />}
    </div>
  );
}