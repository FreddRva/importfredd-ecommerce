'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, ShoppingCart, Eye, Heart, Settings, Sparkles, Zap, TrendingUp, Shield, Truck, Clock, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { API_BASE_URL } from '@/lib/api';

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState('');
  const { isAuthenticated, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState("");
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState("");

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

    // Efecto de parallax suave
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      setErrorFeatured("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/products?featured=true&limit=4`);
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

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setErrorCategories("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/categories-with-count`);
        if (!res.ok) throw new Error("Error al cargar categorías");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err: any) {
        setErrorCategories(err.message);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const stats = [
    { icon: Users, value: "50K+", label: "Clientes Satisfechos", color: "from-blue-500 to-cyan-500" },
    { icon: Truck, value: "24h", label: "Envío Express", color: "from-green-500 to-emerald-500" },
    { icon: Shield, value: "100%", label: "Garantía", color: "from-purple-500 to-indigo-500" },
    { icon: Clock, value: "24/7", label: "Soporte", color: "from-orange-500 to-red-500" }
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

  // Iconos SVG para fondo animado
  const FloatingIcons = () => (
    <div className="pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0">
      <svg className="absolute left-10 top-10 animate-spin-slow opacity-30" width="80" height="80" viewBox="0 0 80 80"><image href="/file.svg" width="80" height="80" /></svg>
      <svg className="absolute right-20 top-1/4 animate-float opacity-40" width="70" height="70" viewBox="0 0 70 70"><image href="/globe.svg" width="70" height="70" /></svg>
      <svg className="absolute left-1/3 bottom-10 animate-spin-reverse opacity-20" width="90" height="90" viewBox="0 0 90 90"><image href="/window.svg" width="90" height="90" /></svg>
      <svg className="absolute right-10 bottom-20 animate-float opacity-30" width="60" height="60" viewBox="0 0 60 60"><image href="/vercel.svg" width="60" height="60" /></svg>
      <svg className="absolute left-1/4 top-1/2 animate-spin-slow opacity-25" width="100" height="100" viewBox="0 0 100 100"><image href="/Zapatillas.glb" width="100" height="100" /></svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-x-hidden">
      <FloatingIcons />
      {/* Hero Section - Fondo oscuro, iconos flotando, premium */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 gap-12">
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 px-4 py-2 rounded-full mb-6 font-bold shadow-lg animate-bounce-in">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span>¡Bienvenido a la nueva era ImportFredd!</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight drop-shadow-2xl animate-slide-in-left bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Compra diferente, compra <span className="block">con estilo único</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-indigo-100/90 mb-8 max-w-xl animate-slide-in-left">
            Descubre productos exclusivos, tecnología de vanguardia y una experiencia visual nunca antes vista en e-commerce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center lg:justify-start animate-slide-in-left">
            <Link href="/productos" className="group bg-gradient-to-r from-fuchsia-500 via-yellow-400 to-orange-500 text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:shadow-fuchsia-500/25 transition-all duration-500 transform hover:scale-105 flex items-center justify-center border-2 border-yellow-300 relative overflow-hidden text-lg focus-ring">
              <span className="relative z-10">Explorar Catálogo</span>
              <ArrowRight className="ml-3 w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/carrito" className="group border-2 border-fuchsia-400 text-white px-8 py-4 rounded-2xl font-bold hover:bg-fuchsia-900/20 transition-all duration-300 flex items-center justify-center backdrop-blur-md hover:backdrop-blur-lg relative overflow-hidden text-lg focus-ring">
              <ShoppingCart className="mr-3 w-6 h-6 relative z-10" />
              <span className="relative z-10">Ver Carrito</span>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center animate-slide-in-right">
          <div className="relative w-80 h-80 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-700/40 via-yellow-400/20 to-cyan-400/30 blur-2xl animate-pulse"></div>
            <img src="/Zapatillas.glb" alt="Producto destacado ImportFredd" className="w-64 h-64 object-contain rounded-full shadow-2xl border-4 border-fuchsia-400/30 bg-white/10 backdrop-blur-md animate-float" />
          </div>
        </div>
      </section>

      {/* Stats Section - Rediseño premium y único */}
      <section className="py-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-8 text-center tracking-tight animate-fade-in drop-shadow-lg">
            ¿Por qué elegir ImportFredd?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="group text-center bg-gradient-to-br from-indigo-900/60 via-slate-900/60 to-fuchsia-900/60 backdrop-blur-xl border border-fuchsia-700/30 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-fuchsia-500/30 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg animate-bounce-in`}>
                  <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg animate-pulse" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-2 animate-slide-in-left drop-shadow-lg">{stat.value}</div>
                <div className="text-base sm:text-lg text-indigo-100 animate-slide-in-right">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías - Rediseño premium y único */}
      <section className="py-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-8 text-center tracking-tight animate-fade-in drop-shadow-lg">
            Explora por Categoría
          </h2>
          {loadingCategories ? (
            <div className="flex justify-center items-center h-32">
              <span className="loader animate-spin w-8 h-8 border-4 border-fuchsia-400 border-t-transparent rounded-full"></span>
            </div>
          ) : errorCategories ? (
            <div className="text-center text-red-400 font-semibold">{errorCategories}</div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-8 md:overflow-x-visible">
              {categories.map((cat, idx) => (
                <a
                  key={cat.id}
                  href={`/productos?categoria=${cat.slug}`}
                  className="group min-w-[160px] max-w-xs w-full bg-gradient-to-br from-slate-900/70 via-indigo-900/60 to-fuchsia-900/60 backdrop-blur-xl border border-fuchsia-700/30 rounded-2xl shadow-xl p-5 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-fuchsia-500/30 cursor-pointer snap-center animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 via-yellow-300 to-cyan-400 shadow-md group-hover:scale-110 transition-transform">
                    <img src={cat.icon_url || '/globe.svg'} alt={cat.name} className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-base font-bold text-white text-center mb-1 animate-slide-in-left drop-shadow-lg">{cat.name}</span>
                  <span className="text-xs text-indigo-100 animate-slide-in-right">{cat.product_count} productos</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Productos Destacados - Rediseño premium y único */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-fuchsia-900 to-indigo-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-8 text-center tracking-tight animate-fade-in drop-shadow-lg">
            Productos Destacados
          </h2>
          {loadingFeatured ? (
            <div className="flex justify-center items-center h-40">
              <span className="loader animate-spin w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full"></span>
            </div>
          ) : errorFeatured ? (
            <div className="text-center text-red-400 font-semibold">{errorFeatured}</div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8 md:overflow-x-visible">
              {featuredProducts.map((product, idx) => {
                const stock = getStockStatus(product.stock);
                return (
                  <div
                    key={product.id}
                    className="group relative min-w-[260px] max-w-xs w-full bg-gradient-to-br from-indigo-900/60 via-slate-900/60 to-fuchsia-900/60 backdrop-blur-xl border border-fuchsia-700/30 rounded-3xl shadow-2xl p-5 flex flex-col items-center justify-between transition-transform duration-300 hover:scale-105 hover:shadow-fuchsia-500/30 hover:-translate-y-2 cursor-pointer snap-center animate-fade-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stock.bgColor} ${stock.color} ${stock.borderColor} shadow-sm flex items-center gap-1 animate-pulse bg-slate-900/80`}> <span>{stock.icon}</span> {stock.text} </span>
                    </div>
                    <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-4 relative">
                      <img
                        src={product.image_url || '/file.svg'}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500 bg-gradient-to-br from-fuchsia-400/10 to-indigo-400/10"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 bg-fuchsia-700/80 rounded-full px-2 py-1 text-xs font-semibold text-white shadow-md animate-fade-in">
                        ${product.price}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center line-clamp-2 animate-slide-in-left drop-shadow-lg">{product.name}</h3>
                    <p className="text-indigo-100 text-sm mb-4 text-center line-clamp-2 animate-slide-in-right">{product.description}</p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart === product.id || product.stock <= 0}
                      className={`group/addcart mt-auto px-6 py-3 rounded-xl font-bold text-base shadow-lg transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2
                        ${product.stock <= 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-fuchsia-500 via-yellow-400 to-orange-500 text-slate-900 hover:from-fuchsia-600 hover:to-yellow-500 hover:scale-105'}
                        relative overflow-hidden animate-bounce-in`}
                    >
                      <span className="relative z-10">{addingToCart === product.id ? 'Agregando...' : 'Agregar al carrito'}</span>
                      <ShoppingCart className="w-5 h-5 relative z-10 group-hover/addcart:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 to-yellow-400 opacity-0 group-hover/addcart:opacity-20 transition-opacity duration-300"></div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Beneficios premium */}
      <section className="py-16 sm:py-20 md:py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-purple-100 hover:border-purple-200 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4 text-center">Envío Express</h3>
              <p className="text-sm sm:text-base text-slate-600 text-center leading-relaxed">Entrega ultra rápida en 24-48 horas con seguimiento en tiempo real</p>
            </div>
            
            <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-emerald-100 hover:border-emerald-200 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4 text-center">Garantía Premium</h3>
              <p className="text-sm sm:text-base text-slate-600 text-center leading-relaxed">Hasta 3 años de garantía extendida en productos seleccionados</p>
            </div>
            
            <div className="group bg-gradient-to-br from-rose-50 to-pink-50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-rose-100 hover:border-rose-200 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4 text-center">Soporte VIP</h3>
              <p className="text-sm sm:text-base text-slate-600 text-center leading-relaxed">Asistencia personalizada 24/7 con expertos especializados</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Impactante */}
      <section className="py-20 sm:py-24 md:py-32 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700/30 via-indigo-700/30 to-blue-700/30"></div>
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 border border-white/20">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            <span className="text-xs sm:text-sm font-bold">Experiencia Premium</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 sm:mb-8 leading-tight">
            ¿Listo para una experiencia de compra
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              revolucionaria?
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 md:mb-12 text-purple-100/90 max-w-4xl mx-auto leading-relaxed px-4">
            Únete a miles de clientes satisfechos y descubre por qué somos la elección preferida 
            para compras online de calidad premium.
          </p>
          <Link 
            href="/productos"
            className="group inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl font-black hover:from-yellow-500 hover:to-orange-600 transition-all duration-500 transform hover:scale-105 shadow-xl sm:shadow-2xl hover:shadow-yellow-500/25 border-2 border-yellow-300 text-sm sm:text-base md:text-lg"
          >
            <span>Comenzar a Explorar</span>
            <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Admin Section - Solo visible para administradores */}
      {isAuthenticated && isAdmin && (
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
          <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 border border-purple-400/30">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                <span className="text-xs sm:text-sm font-bold text-purple-200">Panel de Administración</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6">
                Consola de Administración Premium
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-slate-300 leading-relaxed px-4">
                Gestiona todos los aspectos de tu tienda con nuestras herramientas profesionales 
                de última generación
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <Link 
                  href="/admin/products"
                  className="group bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-black hover:from-purple-700 hover:to-indigo-700 transition-all duration-500 flex items-center justify-center shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 border-2 border-purple-400/50 text-sm sm:text-base"
                >
                  <ShoppingCart className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                  Gestión de Productos
                </Link>
                <Link 
                  href="/admin"
                  className="group border-2 border-white/20 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-black hover:bg-white/10 transition-all duration-500 flex items-center justify-center backdrop-blur-sm hover:backdrop-blur-lg transform hover:scale-105 text-sm sm:text-base"
                >
                  <Settings className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                  Panel de Control
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Info - Premium */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-1 sm:w-2 sm:h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-slate-300">Hoy es {currentDate}</span>
            <div className="w-1 h-1 sm:w-2 sm:h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black">Axiora</span> - 
            Revolucionando tu experiencia de compra online en <span className="text-purple-300">axiora.pro</span>
          </p>
        </div>
      </div>
    </div>
  );
} 