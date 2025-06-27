'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, CreditCard, Truck, User, Lock, Sparkles } from 'lucide-react';
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
  const { cart, updateQuantity, removeFromCart, clearCart, clearLocalCart, itemCount, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setItemToDelete(itemId);
  };

  const confirmRemoveItem = async () => {
    if (itemToDelete === null) return;
    
    try {
      await removeFromCart(itemToDelete);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
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
                          className="w-9 h-9 rounded-full border border-fuchsia-400/50 flex items-center justify-center bg-gradient-to-br from-fuchsia-600/20 to-yellow-600/20 hover:from-fuchsia-600/40 hover:to-yellow-600/40 text-yellow-300 hover:text-yellow-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center text-xl font-black text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-9 h-9 rounded-full border border-fuchsia-400/50 flex items-center justify-center bg-gradient-to-br from-fuchsia-600/20 to-yellow-600/20 hover:from-fuchsia-600/40 hover:to-yellow-600/40 text-yellow-300 hover:text-yellow-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                        className="flex-shrink-0 p-2 rounded-full border border-red-400/50 bg-gradient-to-br from-red-600/20 to-fuchsia-600/20 hover:from-red-600/40 hover:to-fuchsia-600/40 text-red-300 hover:text-red-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in transform hover:scale-105"
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
                          onClick={async () => { await clearCart(); clearLocalCart(); setShowConfirmClear(false); }}
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
                <div className="flex justify-between text-base">
                  <span className="text-fuchsia-200">Envío</span>
                  <span className="text-green-400 font-bold">Gratis</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-fuchsia-200">Impuestos</span>
                  <span className="text-cyan-400 font-bold">$18.90</span>
                </div>
                <div className="flex justify-between text-xl font-black border-t border-fuchsia-800/30 pt-4">
                  <span className="text-white">Total</span>
                  <span className="text-yellow-400 drop-shadow-xl">$108.89</span>
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

      {/* Modal de autenticación premium */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-fuchsia-900/95 rounded-3xl p-8 shadow-2xl border border-fuchsia-800/30 max-w-md w-full mx-4 animate-scale-in relative overflow-hidden">
            {/* Floating icons decorativos */}
            <div className="absolute top-4 right-4 opacity-20 animate-float">
              <Sparkles className="w-6 h-6 text-fuchsia-400" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20 animate-float-delayed">
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            
            <div className="text-center relative z-10">
              {/* Icono premium */}
              <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-fuchsia-400/30 shadow-lg">
                <Lock className="w-10 h-10 text-fuchsia-400" />
              </div>
              
              <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                Acceso Requerido
              </h3>
              
              <p className="text-fuchsia-200 mb-8 text-lg leading-relaxed">
                Para continuar con tu compra, necesitas iniciar sesión en tu cuenta de <span className="text-yellow-400 font-bold">ImportFredd</span>
              </p>
              
              <div className="space-y-4">
                <Link
                  href="/login"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 animate-glow border-2 border-fuchsia-400/30"
                >
                  <User className="w-6 h-6" />
                  Iniciar Sesión
                </Link>
                
                <Link
                  href="/register"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-slate-800/60 to-indigo-900/60 text-fuchsia-200 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:from-slate-700/60 hover:to-indigo-800/60 transition-all duration-300 border border-fuchsia-800/30"
                >
                  <Sparkles className="w-5 h-5" />
                  Crear Cuenta
                </Link>
                
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full text-fuchsia-300 hover:text-yellow-400 font-semibold transition-colors duration-300"
                >
                  Continuar como invitado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar producto individual */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-fuchsia-900/95 rounded-3xl p-8 shadow-2xl border border-fuchsia-800/30 max-w-md w-full mx-4 animate-scale-in relative overflow-hidden">
            {/* Floating icons decorativos */}
            <div className="absolute top-4 right-4 opacity-20 animate-float">
              <Sparkles className="w-6 h-6 text-red-400" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20 animate-float-delayed">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
            </div>
            
            <div className="text-center relative z-10">
              {/* Icono premium */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/30 shadow-lg">
                <Trash2 className="w-10 h-10 text-red-400" />
              </div>
              
              <h3 className="text-2xl font-black bg-gradient-to-r from-red-400 via-fuchsia-400 to-yellow-400 bg-clip-text text-transparent mb-4">
                ¿Eliminar producto?
              </h3>
              
              <p className="text-fuchsia-200 mb-8 text-lg leading-relaxed">
                ¿Estás seguro de que quieres eliminar este producto de tu carrito? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-slate-800/60 to-indigo-900/60 text-fuchsia-200 hover:from-slate-700/60 hover:to-indigo-800/60 transition-all duration-300 border border-fuchsia-800/30"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRemoveItem}
                  className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-red-600 to-fuchsia-600 text-white shadow-lg hover:from-fuchsia-600 hover:to-red-600 transition-all duration-300"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}