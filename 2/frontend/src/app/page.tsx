'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, ShoppingCart, Eye, Heart, Settings, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState('');
  const { isAuthenticated, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState("");
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  // Paleta de colores premium
  const colors = {
    primary: 'from-violet-600 via-purple-600 to-indigo-600',
    secondary: 'from-emerald-500 via-teal-500 to-cyan-500',
    accent: 'from-amber-500 via-orange-500 to-red-500',
    dark: 'from-slate-900 via-purple-900 to-slate-900',
    light: 'from-blue-50 via-indigo-50 to-purple-50',
    success: 'from-green-500 via-emerald-500 to-teal-500',
    warning: 'from-amber-400 via-orange-400 to-red-400',
    danger: 'from-rose-500 via-pink-500 to-purple-500',
    info: 'from-sky-500 via-blue-500 to-indigo-500',
    premium: 'from-yellow-400 via-orange-500 to-red-500'
  };

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      setErrorFeatured("");
      try {
        const res = await fetch('http://localhost:8080/products?featured=true&limit=4');
        if (!res.ok) throw new Error("Error al cargar productos destacados");
        const data = await res.json();
        setFeaturedProducts(data.products || []);
      } catch (err: any) {
        setErrorFeatured(err.message);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    { name: "Zapatillas", icon: "👟", count: 15, color: colors.info, gradient: "from-blue-500 to-cyan-500" },
    { name: "Electrónicos", icon: "📱", count: 23, color: colors.premium, gradient: "from-yellow-400 to-orange-500" },
    { name: "Ropa", icon: "👕", count: 34, color: colors.danger, gradient: "from-rose-500 to-pink-500" },
    { name: "Hogar", icon: "🏠", count: 18, color: colors.warning, gradient: "from-amber-400 to-orange-500" },
    { name: "Deportes", icon: "⚽", count: 12, color: colors.success, gradient: "from-green-500 to-emerald-500" },
    { name: "Libros", icon: "📚", count: 45, color: colors.secondary, gradient: "from-emerald-500 to-teal-500" }
  ];

  const handleAddToCart = async (product: any) => {
    setAddingToCart(product.id);
    try {
      await addToCart({
        product_id: product.id,
        product_name: product.name,
        image_url: product.image_url || '',
        price: product.price,
        quantity: 1
      });
      alert('Producto agregado al carrito');
    } catch (error) {
      alert('Error al agregar al carrito');
    } finally {
      setAddingToCart(null);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { text: 'Agotado', color: 'text-red-600', bgColor: 'bg-red-100/80', borderColor: 'border-red-200', icon: '❌' };
    if (stock <= 5) return { text: `Solo ${stock} disponibles`, color: 'text-orange-600', bgColor: 'bg-orange-100/80', borderColor: 'border-orange-200', icon: '⚠️' };
    return { text: 'Disponible', color: 'text-green-600', bgColor: 'bg-green-100/80', borderColor: 'border-green-200', icon: '✅' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section - Premium con partículas */}
      <section className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white overflow-hidden shadow-2xl">
        {/* Partículas animadas */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-white/50 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-white/20 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Nuevo diseño premium</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight drop-shadow-2xl animate-fade-in">
              Descubre el
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 animate-pulse">
                Futuro del Comercio
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100/90 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              Una experiencia de compra revolucionaria con productos exclusivos, 
              tecnología de vanguardia y servicio premium 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link 
                href="/productos"
                className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-2xl hover:shadow-yellow-500/25 transition-all duration-500 transform hover:scale-105 flex items-center justify-center border-2 border-yellow-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Explorar Catálogo</span>
                <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/carrito"
                className="group border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all duration-300 flex items-center justify-center backdrop-blur-md hover:backdrop-blur-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ShoppingCart className="mr-2 w-5 h-5 relative z-10" />
                <span className="relative z-10">Ver Carrito</span>
              </Link>
              {isAuthenticated && isAdmin && (
                <Link 
                  href="/admin/products"
                  className="group bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold hover:from-purple-800 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center border-2 border-purple-400/50 shadow-xl"
                >
                  <Settings className="mr-2 w-5 h-5" />
                  Panel Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="relative">
              <div className="w-80 h-80 bg-gradient-to-br from-white/10 to-white/5 rounded-full backdrop-blur-md border border-white/20 animate-float"></div>
              <div className="absolute inset-0 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Chips premium */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full px-4 py-2 mb-4 border border-purple-200">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">Categorías más populares</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Explora por Categoría
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Descubre productos únicos en nuestras categorías cuidadosamente seleccionadas
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {categories.map((category, index) => (
              <Link 
                key={index}
                href="/productos"
                className={`group relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r ${category.gradient} text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-110 border-2 border-white/30 backdrop-blur-sm`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                  <div>
                    <div className="text-lg">{category.name}</div>
                    <div className="text-sm opacity-90">{category.count} productos</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Cards premium */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full px-4 py-2 mb-4 border border-yellow-200">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">Productos destacados</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Productos Destacados
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Los productos más vendidos y mejor valorados por nuestra comunidad
            </p>
          </div>
          
          {loadingFeatured ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin animation-delay-200"></div>
              </div>
            </div>
          ) : errorFeatured ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-red-100 text-red-700 border border-red-200">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorFeatured}
              </div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">No hay productos destacados disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group relative bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-4 border border-white/50 overflow-hidden">
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-yellow-400/0 to-orange-500/0 group-hover:from-purple-500/10 group-hover:via-yellow-400/10 group-hover:to-orange-500/10 transition-all duration-700"></div>
                  
                  <div className="relative">
                    {product.isNew && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-black shadow-lg animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          NUEVO
                        </span>
                      </div>
                    )}
                    <div className="w-full h-64 bg-gradient-to-br from-slate-100 via-purple-50 to-indigo-50 rounded-t-3xl flex items-center justify-center overflow-hidden relative">
                      {product.image_url ? (
                        <img 
                          src={`http://localhost:8080${product.image_url}`} 
                          alt={product.name} 
                          className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110 group-hover:rotate-2" 
                        />
                      ) : (
                        <div className="text-slate-400 text-center">
                          <div className="text-4xl mb-2">📷</div>
                          <div className="text-sm">Sin imagen</div>
                        </div>
                      )}
                      {/* Overlay de gradiente */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                  
                  <div className="p-6 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-purple-600 uppercase tracking-wider bg-purple-100 px-2 py-1 rounded-full">{product.category_name}</span>
                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-bold text-yellow-700">4.5</span>
                      </div>
                    </div>
                    
                    <h3 className="font-black text-slate-900 mb-3 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 text-lg">
                      {product.name}
                    </h3>
                    
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${getStockStatus(product.stock).bgColor} ${getStockStatus(product.stock).color} ${getStockStatus(product.stock).borderColor}`}>
                        <span>{getStockStatus(product.stock).icon}</span>
                        {getStockStatus(product.stock).text}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-black text-slate-900">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          href={`/productos/${product.id}`} 
                          className="group/btn bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:from-slate-200 hover:to-slate-300 transition-all duration-300 text-sm flex items-center border border-slate-200 hover:shadow-lg"
                        >
                          <Eye className="w-4 h-4 mr-1 group-hover/btn:scale-110 transition-transform" />
                          Ver
                        </Link>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          disabled={addingToCart === product.id || product.stock <= 0}
                          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                            product.stock <= 0 
                              ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 border-gray-300 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600 border-yellow-300 hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          {addingToCart === product.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-1"></div>
                          ) : (
                            <ShoppingCart className="w-4 h-4 mr-1" />
                          )}
                          {addingToCart === product.id ? 'Agregando...' : product.stock <= 0 ? 'Agotado' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-20">
            <Link 
              href="/productos"
              className="group inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-black hover:from-purple-700 hover:to-indigo-700 transition-all duration-500 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 border-2 border-purple-400/50"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Beneficios premium */}
      <section className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-purple-100 hover:border-purple-200 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 text-center">Envío Express</h3>
              <p className="text-slate-600 text-center leading-relaxed">Entrega ultra rápida en 24-48 horas con seguimiento en tiempo real</p>
            </div>
            
            <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-emerald-100 hover:border-emerald-200 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 text-center">Garantía Premium</h3>
              <p className="text-slate-600 text-center leading-relaxed">Hasta 3 años de garantía extendida en productos seleccionados</p>
            </div>
            
            <div className="group bg-gradient-to-br from-rose-50 to-pink-50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-rose-100 hover:border-rose-200 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 text-center">Soporte VIP</h3>
              <p className="text-slate-600 text-center leading-relaxed">Asistencia personalizada 24/7 con expertos especializados</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Impactante */}
      <section className="py-32 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700/30 via-indigo-700/30 to-blue-700/30"></div>
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-bold">Experiencia Premium</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
            ¿Listo para una experiencia de compra
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              revolucionaria?
            </span>
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-purple-100/90 max-w-4xl mx-auto leading-relaxed">
            Únete a miles de clientes satisfechos y descubre por qué somos la elección preferida 
            para compras online de calidad premium.
          </p>
          <Link 
            href="/productos"
            className="group inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-12 py-6 rounded-2xl font-black hover:from-yellow-500 hover:to-orange-600 transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-yellow-500/25 border-2 border-yellow-300"
          >
            <span className="text-lg">Comenzar a Explorar</span>
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Admin Section - Solo visible para administradores */}
      {isAuthenticated && isAdmin && (
        <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
          <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full px-6 py-3 mb-8 border border-purple-400/30">
                <Settings className="w-5 h-5 text-purple-300" />
                <span className="text-sm font-bold text-purple-200">Panel de Administración</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Consola de Administración Premium
              </h2>
              <p className="text-xl mb-10 text-slate-300 leading-relaxed">
                Gestiona todos los aspectos de tu tienda con nuestras herramientas profesionales 
                de última generación
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link 
                  href="/admin/products"
                  className="group bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-black hover:from-purple-700 hover:to-indigo-700 transition-all duration-500 flex items-center justify-center shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 border-2 border-purple-400/50"
                >
                  <ShoppingCart className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
                  Gestión de Productos
                </Link>
                <Link 
                  href="/admin"
                  className="group border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black hover:bg-white/10 transition-all duration-500 flex items-center justify-center backdrop-blur-sm hover:backdrop-blur-lg transform hover:scale-105"
                >
                  <Settings className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
                  Panel de Control
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Info - Premium */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">Hoy es {currentDate}</span>
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black">ImportFredd</span> - 
            Revolucionando tu experiencia de compra online
          </p>
        </div>
      </div>
    </div>
  );
} 