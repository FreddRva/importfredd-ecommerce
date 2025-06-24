"use client";

import { useFavorites } from '@/context/FavoritesContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Eye } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

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
}

export default function FavoritosPage() {
  const { favorites, removeFavorite, isFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      if (favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_BASE_URL}/products?ids=${favorites.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching favorite products:', err);
      }
      setLoading(false);
    };
    
    fetchProducts();
  }, [favorites]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-8 h-8 text-red-500" fill="currentColor" /> Mis Favoritos
        </h1>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes productos favoritos</h3>
            <p className="text-gray-500">Agrega productos a tu lista de favoritos para verlos aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                <Link href={`/productos/${product.id}`} className="block">
                  <div className="w-full h-56 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    <img src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : product.image_url) : "/placeholder.png"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="w-8 h-8 text-white" /></div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category_name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                      <button
                        onClick={e => { e.preventDefault(); removeFavorite(product.id); }}
                        className={`p-2 ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        aria-label="Quitar de favoritos"
                      >
                        <Heart className="w-5 h-5" fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 