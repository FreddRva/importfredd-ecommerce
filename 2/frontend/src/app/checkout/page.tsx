'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Truck, CheckCircle, Lock, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import StripePayment from '@/components/StripePayment';
import { API_BASE_URL } from '@/lib/api';

interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  id: number;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function CheckoutPage() {
  const { cart, totalPrice, itemCount, clearLocalCart } = useCart();
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();
  
  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
    phone: ''
  });

  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
    phone: ''
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment' | 'review' | 'success'>('shipping');
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState('');

  const handleAddressChange = (type: 'shipping' | 'billing', field: keyof Address, value: string) => {
    if (type === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
      if (useSameAddress) {
        setBillingAddress(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCreateOrder = async () => {
    if (!user?.email) {
      alert('Error: Email de usuario no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping_address: {
            first_name: shippingAddress.firstName,
            last_name: shippingAddress.lastName,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
          },
          billing_address: {
            first_name: billingAddress.firstName,
            last_name: billingAddress.lastName,
            address1: billingAddress.address1,
            address2: billingAddress.address2,
            city: billingAddress.city,
            state: billingAddress.state,
            postal_code: billingAddress.postalCode,
            country: billingAddress.country,
            phone: billingAddress.phone,
          },
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando pedido');
      }

      const orderData = await response.json();
      setOrder(orderData.order);
      setStep('payment');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error creando pedido');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirm = async (paymentIntentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          order_id: order?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error confirmando pago');
      }

      const result = await response.json();
      if (result.success) {
        setStep('review');
        clearLocalCart();
      } else {
        alert('Error en el pago: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error confirmando pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Error de pago: ${error}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso requerido</h2>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para continuar con la compra
            </p>
            <Link 
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Carrito vacío</h2>
            <p className="text-gray-600 mb-6">
              Tu carrito está vacío. Agrega productos para continuar
            </p>
            <Link 
              href="/productos"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/carrito"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Carrito
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
          <p className="text-gray-600 mt-2">
            Completa tu información para procesar el pedido
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'shipping' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step === 'shipping' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <div className={`ml-2 ${step === 'shipping' ? 'text-blue-600' : 'text-gray-600'}`}>
                Envío
              </div>
            </div>
            <div className={`w-16 h-1 mx-4 ${step !== 'shipping' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-blue-600 text-white' : 
                step === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step === 'review' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <div className={`ml-2 ${step === 'payment' || step === 'review' ? 'text-blue-600' : 'text-gray-600'}`}>
                Pago
              </div>
            </div>
            <div className={`w-16 h-1 mx-4 ${step === 'review' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <div className={`ml-2 ${step === 'review' ? 'text-blue-600' : 'text-gray-600'}`}>
                Revisión
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {step === 'shipping' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Información de Envío
                  </h2>
                  
                  {/* Dirección de Envío */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={shippingAddress.firstName}
                          onChange={(e) => handleAddressChange('shipping', 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={shippingAddress.lastName}
                          onChange={(e) => handleAddressChange('shipping', 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        name="address1"
                        value={shippingAddress.address1}
                        onChange={(e) => handleAddressChange('shipping', 'address1', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={shippingAddress.city}
                          onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Provincia *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={shippingAddress.state}
                          onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código Postal *
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={(e) => handleAddressChange('shipping', 'postalCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => handleAddressChange('shipping', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Usar misma dirección para facturación */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sameAddress"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sameAddress" className="ml-2 block text-sm text-gray-900">
                        Usar la misma dirección para facturación
                      </label>
                    </div>

                    {/* Dirección de Facturación (si es diferente) */}
                    {!useSameAddress && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de Facturación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre *
                            </label>
                            <input
                              type="text"
                              name="billingFirstName"
                              value={billingAddress.firstName}
                              onChange={(e) => handleAddressChange('billing', 'firstName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Apellidos *
                            </label>
                            <input
                              type="text"
                              name="billingLastName"
                              value={billingAddress.lastName}
                              onChange={(e) => handleAddressChange('billing', 'lastName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        {/* Agregar más campos de facturación si es necesario */}
                      </div>
                    )}

                    {/* Notas del pedido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas del pedido (opcional)
                      </label>
                      <textarea
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Instrucciones especiales, comentarios..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateOrder}
                      disabled={loading || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.phone}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Creando Pedido...' : 'Continuar al Pago'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && order && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Información de Pago
                  </h2>
                  
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Pedido #{order.orderNumber}</h3>
                    <p className="text-blue-700">Total: {order.currency} {(order.total).toFixed(2)}</p>
                  </div>

                  <StripePayment
                    orderId={order.id}
                    amount={Math.round(order.total * 100)} // Convertir a centavos
                    currency={order.currency.toLowerCase()}
                    customerEmail={user?.email || ''}
                    onSuccess={handlePaymentConfirm}
                    onError={handlePaymentError}
                  />
                </div>
              )}

              {step === 'review' && order && (
                <div className="text-center p-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago realizado con éxito!</h2>
                  <p className="text-gray-700 mb-6">Revisa los detalles de tu pedido antes de finalizar.</p>
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-lg mx-auto">
                    <h3 className="font-semibold mb-2">Pedido #{order.orderNumber}</h3>
                    <p className="mb-1">Total: {order.currency} {(order.total).toFixed(2)}</p>
                    <p className="mb-1">Estado: {order.status}</p>
                    <p className="mb-1">Fecha: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    onClick={() => setStep('success')}
                  >
                    Finalizar compra
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
              
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.product_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">€{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">IVA (16%)</span>
                  <span className="text-gray-900">€{(totalPrice * 0.16).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">Gratis</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-gray-900">
                    €{(totalPrice * 1.16).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {step === 'success' && (
          <div className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por tu compra!</h2>
            <p className="text-gray-700 mb-6">Tu pedido ha sido procesado correctamente. Te enviaremos un correo con los detalles.</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 