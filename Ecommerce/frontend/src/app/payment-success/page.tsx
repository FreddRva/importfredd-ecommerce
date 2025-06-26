'use client';

import Link from 'next/link';
import { CheckCircle, ShoppingBag, Package } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600 mb-6">
            Tu pedido ha sido procesado correctamente. Recibirás un email de confirmación con los detalles de tu compra.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/mi-cuenta"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Ver Mis Pedidos
            </Link>
            
            <Link 
              href="/productos"
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 