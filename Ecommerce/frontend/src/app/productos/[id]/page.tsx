'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Star, CheckCircle, ArrowLeft, Loader2, Orbit } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { API_BASE_URL } from '@/lib/api';

const ThreeJSViewer = dynamic(() => import('@/components/ThreeJSViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex justify-center items-center bg-gray-200">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  ),
});

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  dimensions: string; // URL del modelo 3D
  is_active: boolean; // Necesitamos este campo
  model_url?: string;
  stock: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const res = await fetch(`${API_BASE_URL}/products/${id}`);
          if (!res.ok) {
            throw new Error('Producto no encontrado');
          }
          const data = await res.json();
          setProduct(data);
          console.log('🔍 Product loaded:', data);
          console.log('🔍 Product model_url:', data.model_url);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000); // Reset after 2 seconds
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
        <p className="text-gray-600 mb-6">Lo sentimos, no pudimos encontrar el producto que buscas.</p>
        <Link href="/productos" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-10">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!product) {
    return null; // Should be handled by error state
  }

  return (
    <>
      {/* Fondo gradiente y floating icons premium */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 relative overflow-x-hidden">
        {/* Floating icons decorativos premium detrás del contenido */}
        <div className="pointer-events-none select-none absolute inset-0 z-0">
          <Star className="absolute top-10 left-10 w-16 h-16 text-yellow-400 opacity-10 animate-float-slow" />
          <ShoppingCart className="absolute bottom-20 right-20 w-24 h-24 text-fuchsia-400 opacity-10 animate-float-medium" />
          <Orbit className="absolute top-1/2 left-1/3 w-24 h-24 text-cyan-400 opacity-10 animate-float-fast" />
          <Star className="absolute bottom-10 left-1/4 w-14 h-14 text-fuchsia-400 opacity-10 animate-float-medium" />
          <ShoppingCart className="absolute top-1/4 right-1/4 w-16 h-16 text-yellow-400 opacity-10 animate-float-slow" />
          <Orbit className="absolute bottom-1/3 right-10 w-20 h-20 text-cyan-400 opacity-10 animate-float-fast" />
          <Star className="absolute top-1/3 right-1/3 w-10 h-10 text-fuchsia-400 opacity-10 animate-float-slow" />
        </div>
        <div className="container mx-auto px-4 pt-28 pb-8 sm:pt-32 sm:pb-12 relative z-10">
          <div className="mb-16">
            <Link href="/productos" className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-400/20 to-cyan-400/20 backdrop-blur-md rounded-full px-6 py-3 font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-400/40 hover:to-cyan-400/40 hover:text-yellow-300 transition-all duration-300 animate-fade-in">
              <ArrowLeft size={20} />
              Volver al catálogo
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 sm:p-12 animate-scale-in">
            {/* Columna de Imagen / Visor 3D */}
            <div className="w-full aspect-square bg-gradient-to-br from-slate-800/60 to-indigo-900/60 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-xl border border-fuchsia-800/30 animate-float-medium">
              {product.model_url ? (
                <>
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-fuchsia-400 text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-md animate-bounce-in z-10">Visor 3D</span>
                  <ThreeJSViewer 
                    modelPath={product.model_url}
                    width={600}
                    height={600}
                  />
                </>
              ) : (
                <img
                  src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : product.image_url) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23232b3b'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-2xl drop-shadow-xl"
                />
              )}
            </div>
            {/* Columna de Detalles */}
            <div className="flex flex-col justify-center gap-6">
              <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-tight mb-2 animate-fade-in">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-2 animate-fade-in">
                <span className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-fuchsia-900/60 to-indigo-900/60 text-fuchsia-200 border border-fuchsia-800/30 shadow-md">ID: {product.id}</span>
                <span className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-400/80 to-emerald-400/80 text-slate-900 border border-green-300/40 shadow-md">Activo</span>
                {/* Puedes agregar más chips aquí si hay stock, categoría, etc. */}
              </div>
              <div className="flex items-center gap-2 mb-4 animate-fade-in">
                <div className="flex text-yellow-400">
                  <Star size={22} fill="currentColor" className="animate-glow" />
                  <Star size={22} fill="currentColor" className="animate-glow" />
                  <Star size={22} fill="currentColor" className="animate-glow" />
                  <Star size={22} fill="currentColor" className="animate-glow" />
                  <Star size={22} className="text-fuchsia-900" fill="currentColor" />
                </div>
                <span className="ml-2 text-sm text-fuchsia-200">(12 reseñas)</span>
              </div>
              <p className="text-fuchsia-100 text-lg leading-relaxed mb-2 animate-fade-in drop-shadow-xl">{product.description}</p>
              <div className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent mb-6 drop-shadow-xl animate-glow">${product.price.toFixed(2)}</div>
              <button
                onClick={product.stock === 0 ? undefined : handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full flex items-center justify-center px-8 py-5 rounded-2xl text-xl font-extrabold shadow-xl transition-all duration-300 animate-glow
                  ${product.stock === 0
                    ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-fuchsia-200 cursor-not-allowed opacity-60'
                    : addedToCart
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-slate-900 hover:from-green-500 hover:to-emerald-500'
                      : 'bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-white hover:from-yellow-400 hover:to-fuchsia-600'}
                `}
              >
                {product.stock === 0 ? (
                  <>
                    <ShoppingCart className="mr-3" size={28} />
                    Producto agotado
                  </>
                ) : addedToCart ? (
                  <>
                    <CheckCircle className="mr-3 animate-bounce-in" size={28} />
                    Añadido al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-3 animate-float-fast" size={28} />
                    Añadir al carrito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 