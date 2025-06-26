'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [maxScroll, setMaxScroll] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setMaxScroll(containerRef.current.scrollHeight - window.innerHeight);
      } else {
        setMaxScroll(document.body.scrollHeight - window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Rebote matemático
  const bounce = (y: number, amplitude: number, speed: number) => {
    if (maxScroll === 0) return y;
    const t = Math.min(y, maxScroll);
    const norm = t / maxScroll;
    // Rebote: seno para suavidad, abs para rebote
    return amplitude * Math.abs(Math.sin(norm * Math.PI * speed));
  };

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

  // Iconos SVG inline para fondo animado, parallax scroll y rebote
  const FloatingIcons = () => (
    <div className="pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0">
      {/* Zapatilla: sube y rebota */}
      <svg style={{ left: 40, top: 40 + bounce(scrollY, 200, 1) }} className="absolute animate-spin-slow opacity-30" width="60" height="60" viewBox="0 0 24 24" fill="none"><path d="M2 17c0-2 2-4 4-4h10c2 0 4 2 4 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1Z" stroke="#fbbf24" strokeWidth="1.5"/><path d="M6 13V7a5 5 0 0 1 5-5c2.5 0 4 2 4 4v7" stroke="#f472b6" strokeWidth="1.5"/></svg>
      {/* Ropa: baja y rebota más rápido */}
      <svg style={{ right: 80, top: 120 - bounce(scrollY, 180, 1.5), transform: `rotate(${scrollY * 0.2}deg)` }} className="absolute opacity-40" width="60" height="60" viewBox="0 0 24 24" fill="none"><path d="M4 4l4 2 4-2 4 2 4-2" stroke="#38bdf8" strokeWidth="1.5"/><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4" stroke="#a78bfa" strokeWidth="1.5"/></svg>
      {/* Tecnología: diagonal arriba derecha y rebota */}
      <svg style={{ left: `calc(33% + ${bounce(scrollY, 60, 1.2)}px)`, bottom: 40 + bounce(scrollY, 120, 1.1) }} className="absolute animate-spin-reverse opacity-20" width="60" height="60" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="#34d399" strokeWidth="1.5"/><rect x="9" y="17" width="6" height="2" rx="1" stroke="#fbbf24" strokeWidth="1.5"/></svg>
      {/* Casa: sube más lento y rebota */}
      <svg style={{ right: 40, bottom: 80 + bounce(scrollY, 100, 0.7) }} className="absolute opacity-30" width="60" height="60" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z" stroke="#f472b6" strokeWidth="1.5"/><rect x="9" y="14" width="6" height="5" rx="1" stroke="#38bdf8" strokeWidth="1.5"/></svg>
      {/* Accesorio (reloj): diagonal abajo izquierda y rebota */}
      <svg style={{ left: `50%`, top: 120 + bounce(scrollY, 90, 1.3), transform: `rotate(${-scrollY * 0.3}deg)` }} className="absolute opacity-25" width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="#a78bfa" strokeWidth="1.5"/></svg>
      {/* Electrónica (auriculares): sube y gira y rebota */}
      <svg style={{ right: `33%`, top: 60 - bounce(scrollY, 110, 1.7), transform: `rotate(${scrollY * 0.4}deg)` }} className="absolute opacity-20" width="56" height="56" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="16" height="8" rx="4" stroke="#34d399" strokeWidth="1.5"/><circle cx="8" cy="12" r="2" stroke="#f472b6" strokeWidth="1.5"/><circle cx="16" cy="12" r="2" stroke="#f472b6" strokeWidth="1.5"/></svg>
      {/* Bolsa de compras: sube y baja más rápido y rebota */}
      <svg style={{ left: 120, bottom: 120 + bounce(scrollY, 140, 2) }} className="absolute opacity-20" width="52" height="52" viewBox="0 0 24 24" fill="none"><rect x="5" y="7" width="14" height="13" rx="2" stroke="#fbbf24" strokeWidth="1.5"/><path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="#a78bfa" strokeWidth="1.5"/></svg>
      {/* Camiseta: diagonal arriba izquierda y rebota */}
      <svg style={{ right: 120, bottom: 40 + bounce(scrollY, 80, 1.4), transform: `rotate(${-scrollY * 0.2}deg)` }} className="absolute opacity-25" width="54" height="54" viewBox="0 0 24 24" fill="none"><path d="M4 4l4 2 4-2 4 2 4-2" stroke="#38bdf8" strokeWidth="1.5"/><rect x="6" y="6" width="12" height="12" rx="2" stroke="#f472b6" strokeWidth="1.5"/></svg>
      {/* Más iconos: estrella */}
      <svg style={{ left: 200, top: 60 + bounce(scrollY, 160, 1.6) }} className="absolute opacity-20" width="40" height="40" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10" stroke="#fbbf24" strokeWidth="1.2" fill="none"/></svg>
      {/* Más iconos: mochila */}
      <svg style={{ right: 200, top: 80 + bounce(scrollY, 120, 1.8) }} className="absolute opacity-18" width="44" height="44" viewBox="0 0 24 24" fill="none"><rect x="6" y="7" width="12" height="13" rx="3" stroke="#a78bfa" strokeWidth="1.5"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="#fbbf24" strokeWidth="1.5"/></svg>
      {/* Más iconos: gafas */}
      <svg style={{ left: 300, bottom: 100 + bounce(scrollY, 100, 1.1) }} className="absolute opacity-18" width="38" height="38" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="12" r="3" stroke="#34d399" strokeWidth="1.2"/><circle cx="16" cy="12" r="3" stroke="#34d399" strokeWidth="1.2"/><rect x="11" y="11" width="2" height="2" fill="#a78bfa"/></svg>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-x-hidden">
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

      {/* Bloques destacados de servicios premium */}
      <section className="relative z-10 py-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-fuchsia-900/60 via-indigo-900/60 to-slate-900/60 rounded-2xl p-8 shadow-xl flex flex-col items-center text-center animate-fade-in">
            <Truck className="w-10 h-10 mb-4 text-yellow-400 animate-bounce-in" />
            <h3 className="text-xl font-bold mb-2">Envío Express</h3>
            <p className="text-indigo-100">Entrega ultra rápida en 24-48 horas con seguimiento en tiempo real</p>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-900/60 via-indigo-900/60 to-slate-900/60 rounded-2xl p-8 shadow-xl flex flex-col items-center text-center animate-fade-in">
            <Shield className="w-10 h-10 mb-4 text-green-400 animate-bounce-in" />
            <h3 className="text-xl font-bold mb-2">Garantía Premium</h3>
            <p className="text-indigo-100">Hasta 3 años de garantía extendida en productos seleccionados</p>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-900/60 via-indigo-900/60 to-slate-900/60 rounded-2xl p-8 shadow-xl flex flex-col items-center text-center animate-fade-in">
            <Users className="w-10 h-10 mb-4 text-cyan-400 animate-bounce-in" />
            <h3 className="text-xl font-bold mb-2">Soporte VIP</h3>
            <p className="text-indigo-100">Asistencia personalizada 24/7 con expertos especializados</p>
          </div>
        </div>
      </section>

      {/* Experiencia Premium + CTA */}
      <section className="relative z-10 py-16 bg-gradient-to-br from-fuchsia-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent animate-fade-in">¿Listo para una experiencia de compra revolucionaria?</h2>
        <p className="text-lg sm:text-xl md:text-2xl text-indigo-100 mb-8 max-w-2xl animate-fade-in">Únete a miles de clientes satisfechos y descubre por qué somos la elección preferida para compras online de calidad premium.</p>
        <Link href="/productos" className="group bg-gradient-to-r from-fuchsia-500 via-yellow-400 to-orange-500 text-slate-900 px-10 py-5 rounded-2xl font-black shadow-xl hover:shadow-fuchsia-500/25 transition-all duration-500 transform hover:scale-105 flex items-center justify-center border-2 border-yellow-300 relative overflow-hidden text-xl focus-ring animate-bounce-in">
          Comenzar a Explorar
        </Link>
        <div className="mt-8 text-indigo-200 text-sm animate-fade-in">Hoy es {currentDate}</div>
        <div className="mt-2 text-indigo-300 text-xs animate-fade-in">Axiora - Revolucionando tu experiencia de compra online en axiora.pro</div>
      </section>

      {/* Footer premium */}
      <footer className="relative z-10 py-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 text-white border-t border-fuchsia-800/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-black mb-2">ImportFredd</h3>
            <p className="text-indigo-100 mb-4">Tu destino para productos premium de la más alta calidad.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Productos</h4>
            <ul className="space-y-1 text-indigo-100">
              <li><Link href="/productos?categoria=zapatillas">Zapatillas</Link></li>
              <li><Link href="/productos?categoria=ropa">Ropa</Link></li>
              <li><Link href="/productos?categoria=accesorios">Accesorios</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Soporte</h4>
            <ul className="space-y-1 text-indigo-100">
              <li><Link href="/contacto">Contacto</Link></li>
              <li><Link href="/envios">Envíos</Link></li>
              <li><Link href="/devoluciones">Devoluciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Legal</h4>
            <ul className="space-y-1 text-indigo-100">
              <li><Link href="/terminos">Términos</Link></li>
              <li><Link href="/privacidad">Privacidad</Link></li>
              <li><Link href="/cookies">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-indigo-300 text-xs">© 2024 ImportFredd. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
} 