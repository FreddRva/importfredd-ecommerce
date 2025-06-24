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
        <Link href="/productos" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mb-6">
            <Link href="/productos" className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              Volver a Productos
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
            {/* Columna de Imagen / Visor 3D */}
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden relative">
              {product.dimensions ? (
                <ThreeJSViewer 
                  modelPath={`${API_BASE_URL}${product.dimensions}`}
                  width={600}
                  height={600}
                />
              ) : (
                <img
                  src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`) : "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Columna de Detalles */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{product.name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" />
                  <Star size={20} fill="currentColor" />
                  <Star size={20} className="text-gray-300" fill="currentColor" />
                </div>
                <span className="ml-2 text-sm text-gray-500">(12 reseñas)</span>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
              
              <div className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">
                ${product.price.toFixed(2)}
              </div>

              <button
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 ${
                  addedToCart
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="mr-2" size={24} />
                    Añadido al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2" size={24} />
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