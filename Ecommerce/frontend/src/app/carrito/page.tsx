'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, CreditCard, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export default function CarritoPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, itemCount, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert('Por favor, inicia sesión para continuar con la compra');
      return;
    }
    // Redirigir al checkout
    window.location.href = '/checkout';
  };

  // Función helper para formatear precios de forma segura
  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(price)) {
      return '0.00';
    }
    return price.toFixed(2);
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 py-8 pt-40 text-white relative overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Parece que aún no has agregado ningún producto a tu carrito. 
              ¡Explora nuestra colección y encuentra algo increíble!
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-400/20 to-cyan-400/20 backdrop-blur-md rounded-full px-6 py-3 font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-400/40 hover:to-cyan-400/40 hover:text-yellow-300 transition-all duration-300 animate-fade-in mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 py-8 pt-40 text-white relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/productos"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-400/20 to-cyan-400/20 backdrop-blur-md rounded-full px-6 py-3 font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-400/40 hover:to-cyan-400/40 hover:text-yellow-300 transition-all duration-300 animate-fade-in mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Productos
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-tight mb-2 animate-fade-in">Carrito de Compras</h1>
          <p className="text-fuchsia-200 mt-2 animate-fade-in">
            {itemCount} producto{itemCount !== 1 ? 's' : ''} en tu carrito
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 overflow-hidden animate-scale-in">
              <div className="px-6 py-4 border-b border-fuchsia-800/30">
                <h2 className="text-xl font-black text-white">Productos</h2>
              </div>
              
              <div className="divide-y divide-fuchsia-800/20">
                {cart.map((item) => (
                  <div key={item.id} className="p-6 group hover:bg-fuchsia-900/10 transition-colors duration-300 rounded-2xl animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-fuchsia-400/10 to-indigo-400/10 rounded-2xl flex items-center justify-center shadow-lg border border-fuchsia-800/20">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.product_name}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <span className="text-fuchsia-300 text-xs">Imagen</span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-white truncate mb-1 animate-slide-in-left">
                          {item.product_name}
                        </h3>
                        <p className="text-fuchsia-300 text-xs bg-fuchsia-900/40 px-3 py-1 rounded-full inline-block shadow-md animate-fade-in">
                          ID: {item.product_id}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 animate-fade-in">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-9 h-9 rounded-full border border-fuchsia-800/30 flex items-center justify-center bg-slate-900/60 hover:bg-fuchsia-900/40 text-fuchsia-200 hover:text-yellow-400 transition-colors shadow-md"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center text-xl font-black text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-9 h-9 rounded-full border border-fuchsia-800/30 flex items-center justify-center bg-slate-900/60 hover:bg-fuchsia-900/40 text-fuchsia-200 hover:text-yellow-400 transition-colors shadow-md"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right animate-fade-in">
                        <p className="text-2xl font-black text-yellow-400 drop-shadow-xl">
                          ${formatPrice((item.price || 0) * item.quantity)}
                        </p>
                        <p className="text-xs text-fuchsia-200">
                          ${formatPrice(item.price)} c/u
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex-shrink-0 p-2 rounded-full border border-fuchsia-800/30 bg-slate-900/60 hover:bg-fuchsia-900/40 text-fuchsia-200 hover:text-red-400 shadow-md transition-colors animate-fade-in"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Cart Button */}
              <div className="px-6 py-4 border-t border-fuchsia-800/30 flex justify-end">
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 animate-glow border-2 border-fuchsia-400/30"
                >
                  <Trash2 className="w-5 h-5" />
                  Limpiar carrito
                </button>
                {/* Modal de confirmación */}
                {showConfirmClear && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-slate-900/90 via-indigo-950/90 to-fuchsia-900/90 rounded-2xl p-8 shadow-2xl border border-fuchsia-800/30 max-w-sm w-full animate-scale-in">
                      <h3 className="text-xl font-black text-white mb-4">¿Limpiar todo el carrito?</h3>
                      <p className="text-fuchsia-200 mb-6">Esta acción eliminará todos los productos de tu carrito. ¿Estás seguro?</p>
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setShowConfirmClear(false)}
                          className="px-6 py-3 rounded-xl font-bold bg-slate-800 text-fuchsia-200 hover:bg-slate-900 transition-all duration-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => { await clearCart(); setShowConfirmClear(false); }}
                          className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-red-600 to-fuchsia-600 text-white shadow-lg hover:from-fuchsia-600 hover:to-red-600 transition-all duration-300"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 sticky top-8 animate-scale-in">
              <h2 className="text-xl font-black text-white mb-6">Resumen del Pedido</h2>
              
              {/* Order Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-base">
                  <span className="text-fuchsia-200">Subtotal ({itemCount} items)</span>
                  <span className="text-yellow-400 font-black text-xl drop-shadow-xl">${formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-green-600 font-medium">Gratis</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="text-gray-900">${formatPrice((totalPrice || 0) * 0.21)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ${formatPrice((totalPrice || 0) * 1.21)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2 text-green-500" />
                  Envío gratis en pedidos superiores a $50
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                  Pago seguro con tarjeta
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 py-5 rounded-2xl font-black text-xl shadow-xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 flex items-center justify-center gap-3 animate-glow border-2 border-fuchsia-400/30"
              >
                <CreditCard className="w-7 h-7" />
                Ir a Pagar
              </button>

              {/* Continue Shopping */}
              <Link 
                href="/productos"
                className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium mt-4 transition-colors"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}