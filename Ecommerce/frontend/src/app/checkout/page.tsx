'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Truck, CheckCircle, Lock, ShoppingBag, MapPin, User, Phone, Mail, Shield, Sparkles, Package, Clock, Star, ChevronDown, Check } from 'lucide-react';
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

interface SavedAddress {
  id: number;
  first_name: string;
  last_name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  lat: number;
  lng: number;
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

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<number | null>(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<number | null>(null);
  const [showShippingAddressSelector, setShowShippingAddressSelector] = useState(false);
  const [showBillingAddressSelector, setShowBillingAddressSelector] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment' | 'review' | 'success'>('shipping');
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState('');

  // Cargar direcciones guardadas del usuario
  const fetchSavedAddresses = async () => {
    if (!token) return;
    
    setAddressesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data.addresses || []);
        
        // Si hay direcciones guardadas, usar la predeterminada
        const defaultAddress = data.addresses?.find((addr: SavedAddress) => addr.is_default);
        if (defaultAddress) {
          selectShippingAddress(defaultAddress);
          if (useSameAddress) {
            selectBillingAddress(defaultAddress);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Seleccionar dirección de envío
  const selectShippingAddress = (address: SavedAddress) => {
    setShippingAddress({
      firstName: address.first_name,
      lastName: address.last_name,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone
    });
    setSelectedShippingAddressId(address.id);
    setShowShippingAddressSelector(false);
    
    // Si está marcado "usar misma dirección", actualizar también facturación
    if (useSameAddress) {
      selectBillingAddress(address);
    }
  };

  // Seleccionar dirección de facturación
  const selectBillingAddress = (address: SavedAddress) => {
    setBillingAddress({
      firstName: address.first_name,
      lastName: address.last_name,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone
    });
    setSelectedBillingAddressId(address.id);
    setShowBillingAddressSelector(false);
  };

  // Cargar direcciones al montar el componente
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSavedAddresses();
    }
  }, [isAuthenticated, token]);

  // Actualizar facturación cuando cambia "usar misma dirección"
  useEffect(() => {
    if (useSameAddress) {
      setBillingAddress(shippingAddress);
      setSelectedBillingAddressId(selectedShippingAddressId);
    }
  }, [useSameAddress, shippingAddress, selectedShippingAddressId]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-40 text-white">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/30 shadow-lg">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-red-400 via-fuchsia-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              Acceso Requerido
            </h2>
            <p className="text-fuchsia-200 mb-6 text-lg">
              Necesitas iniciar sesión para continuar con la compra
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 font-black rounded-2xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30"
            >
              <User className="mr-3 h-6 w-6" />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-40 text-white">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-400/30 shadow-lg">
              <ShoppingBag className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Carrito Vacío
            </h2>
            <p className="text-fuchsia-200 mb-6 text-lg">
              Tu carrito está vacío. Agrega productos para continuar
            </p>
            <Link 
              href="/productos"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 font-black rounded-2xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30"
            >
              <Package className="mr-3 h-6 w-6" />
              Ver Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 py-8 pt-40 text-white relative overflow-hidden">
      {/* Floating Icons Decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-fuchsia-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-yellow-400/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-cyan-400/15 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-fuchsia-400/25 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-yellow-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-cyan-400/30 rounded-full animate-float-delayed"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Premium */}
        <div className="mb-8">
          <Link 
            href="/carrito"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-400/20 to-cyan-400/20 backdrop-blur-md rounded-full px-6 py-3 font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-400/40 hover:to-cyan-400/40 hover:text-yellow-300 transition-all duration-300 animate-fade-in mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Carrito
          </Link>
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-tight mb-4 animate-fade-in">
            Finalizar Compra
          </h1>
          <p className="text-xl text-fuchsia-200 font-medium animate-fade-in">
            Completa tu información para procesar el pedido
          </p>
        </div>

        {/* Progress Steps Premium */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step === 'shipping' 
                  ? 'bg-gradient-to-r from-fuchsia-600 to-yellow-400 border-fuchsia-400 text-slate-900 shadow-lg' 
                  : step === 'payment' || step === 'review' || step === 'success'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-400 border-green-400 text-white shadow-lg'
                  : 'bg-slate-800/60 border-fuchsia-800/30 text-fuchsia-300'
              }`}>
                {step === 'shipping' ? '1' : <CheckCircle className="w-6 h-6" />}
              </div>
              <div className={`ml-3 font-bold ${step === 'shipping' ? 'text-yellow-400' : step === 'payment' || step === 'review' || step === 'success' ? 'text-green-400' : 'text-fuchsia-300'}`}>
                Envío
              </div>
            </div>
            <div className={`w-20 h-1 mx-6 rounded-full transition-all duration-300 ${
              step === 'payment' || step === 'review' || step === 'success' 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : 'bg-fuchsia-800/30'
            }`}></div>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step === 'payment' 
                  ? 'bg-gradient-to-r from-fuchsia-600 to-yellow-400 border-fuchsia-400 text-slate-900 shadow-lg' 
                  : step === 'review' || step === 'success'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-400 border-green-400 text-white shadow-lg'
                  : 'bg-slate-800/60 border-fuchsia-800/30 text-fuchsia-300'
              }`}>
                {step === 'review' || step === 'success' ? <CheckCircle className="w-6 h-6" /> : '2'}
              </div>
              <div className={`ml-3 font-bold ${step === 'payment' ? 'text-yellow-400' : step === 'review' || step === 'success' ? 'text-green-400' : 'text-fuchsia-300'}`}>
                Pago
              </div>
            </div>
            <div className={`w-20 h-1 mx-6 rounded-full transition-all duration-300 ${
              step === 'review' || step === 'success' 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : 'bg-fuchsia-800/30'
            }`}></div>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step === 'review' 
                  ? 'bg-gradient-to-r from-fuchsia-600 to-yellow-400 border-fuchsia-400 text-slate-900 shadow-lg' 
                  : step === 'success'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-400 border-green-400 text-white shadow-lg'
                  : 'bg-slate-800/60 border-fuchsia-800/30 text-fuchsia-300'
              }`}>
                {step === 'success' ? <CheckCircle className="w-6 h-6" /> : '3'}
              </div>
              <div className={`ml-3 font-bold ${step === 'review' ? 'text-yellow-400' : step === 'success' ? 'text-green-400' : 'text-fuchsia-300'}`}>
                Confirmación
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 animate-scale-in">
              {step === 'shipping' && (
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-6 flex items-center">
                    <Truck className="w-6 h-6 mr-3" />
                    Información de Envío
                  </h2>
                  
                  {/* Selector de Direcciones Guardadas */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-fuchsia-200 flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Direcciones Guardadas
                        </h3>
                        <button
                          onClick={() => setShowShippingAddressSelector(!showShippingAddressSelector)}
                          className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600/20 to-yellow-600/20 backdrop-blur-md rounded-xl px-4 py-2 font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-600/40 hover:to-yellow-600/40 hover:text-yellow-300 transition-all duration-300"
                        >
                          {showShippingAddressSelector ? 'Ocultar' : 'Seleccionar'}
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showShippingAddressSelector ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {showShippingAddressSelector && (
                        <div className="space-y-3">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id}
                              onClick={() => selectShippingAddress(address)}
                              className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                selectedShippingAddressId === address.id
                                  ? 'bg-gradient-to-r from-fuchsia-600/20 to-yellow-600/20 border-fuchsia-400 shadow-lg'
                                  : 'bg-slate-900/60 border-fuchsia-800/30 hover:border-fuchsia-400/50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-fuchsia-200">
                                      {address.first_name} {address.last_name}
                                    </span>
                                    {address.is_default && (
                                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-xs font-bold rounded-full border border-yellow-400/30">
                                        Predeterminada
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-fuchsia-300 text-sm mb-1">
                                    {address.address1}
                                    {address.address2 && `, ${address.address2}`}
                                  </p>
                                  <p className="text-fuchsia-300 text-sm">
                                    {address.city}, {address.state} {address.postal_code}
                                  </p>
                                  <p className="text-fuchsia-300 text-sm">
                                    {address.phone}
                                  </p>
                                </div>
                                {selectedShippingAddressId === address.id && (
                                  <div className="w-6 h-6 bg-gradient-to-r from-fuchsia-600 to-yellow-400 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-slate-900" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indicador de carga de direcciones */}
                  {addressesLoading && (
                    <div className="mb-8 p-4 bg-gradient-to-r from-fuchsia-900/40 to-indigo-900/40 border border-fuchsia-800/30 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-400 mr-3"></div>
                        <span className="text-fuchsia-200 font-bold">Cargando direcciones guardadas...</span>
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay direcciones guardadas */}
                  {!addressesLoading && savedAddresses.length === 0 && (
                    <div className="mb-8 p-4 bg-gradient-to-r from-slate-900/40 to-indigo-900/40 border border-fuchsia-800/30 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-center text-center">
                        <div className="flex flex-col items-center">
                          <MapPin className="w-8 h-8 text-fuchsia-400 mb-2" />
                          <span className="text-fuchsia-200 font-bold mb-1">No tienes direcciones guardadas</span>
                          <span className="text-fuchsia-300 text-sm">Puedes agregar direcciones en tu perfil para futuras compras</span>
                          <Link 
                            href="/mi-cuenta"
                            className="mt-3 inline-flex items-center px-4 py-2 bg-gradient-to-r from-fuchsia-600/20 to-yellow-600/20 backdrop-blur-md rounded-xl font-bold text-fuchsia-200 border border-fuchsia-400/30 shadow-lg hover:from-fuchsia-600/40 hover:to-yellow-600/40 hover:text-yellow-300 transition-all duration-300"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Ir a Mi Cuenta
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicador de dirección seleccionada */}
                  {selectedShippingAddressId && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-800/30 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-green-400 mr-3" />
                          <div>
                            <span className="text-green-200 font-bold">Dirección seleccionada</span>
                            <p className="text-green-300 text-sm">
                              {savedAddresses.find(addr => addr.id === selectedShippingAddressId)?.first_name} {savedAddresses.find(addr => addr.id === selectedShippingAddressId)?.last_name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedShippingAddressId(null);
                            setShippingAddress({
                              firstName: '',
                              lastName: '',
                              address1: '',
                              city: '',
                              state: '',
                              postalCode: '',
                              country: 'España',
                              phone: ''
                            });
                          }}
                          className="text-green-300 hover:text-green-200 text-sm font-bold transition-colors duration-300"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Dirección de Envío */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-fuchsia-200">
                          Nombre *
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                            </div>
                            <input
                              type="text"
                              name="firstName"
                              value={shippingAddress.firstName}
                              onChange={(e) => handleAddressChange('shipping', 'firstName', e.target.value)}
                              className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                              placeholder="Tu nombre"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-fuchsia-200">
                          Apellidos *
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                            </div>
                            <input
                              type="text"
                              name="lastName"
                              value={shippingAddress.lastName}
                              onChange={(e) => handleAddressChange('shipping', 'lastName', e.target.value)}
                              className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                              placeholder="Tus apellidos"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-fuchsia-200">
                        Dirección *
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                          </div>
                          <input
                            type="text"
                            name="address1"
                            value={shippingAddress.address1}
                            onChange={(e) => handleAddressChange('shipping', 'address1', e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                            placeholder="Calle, número, piso..."
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-fuchsia-200">
                          Ciudad *
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                            <input
                              type="text"
                              name="city"
                              value={shippingAddress.city}
                              onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                              className="w-full px-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                              placeholder="Madrid"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-fuchsia-200">
                          Provincia *
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                            <input
                              type="text"
                              name="state"
                              value={shippingAddress.state}
                              onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                              className="w-full px-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                              placeholder="Madrid"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-fuchsia-200">
                          Código Postal *
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                            <input
                              type="text"
                              name="postalCode"
                              value={shippingAddress.postalCode}
                              onChange={(e) => handleAddressChange('shipping', 'postalCode', e.target.value)}
                              className="w-full px-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                              placeholder="28001"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-fuchsia-200">
                        Teléfono *
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={shippingAddress.phone}
                            onChange={(e) => handleAddressChange('shipping', 'phone', e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                            placeholder="+34 600 000 000"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Usar misma dirección para facturación */}
                    <div className="flex items-center p-4 bg-gradient-to-r from-fuchsia-900/40 to-indigo-900/40 border border-fuchsia-800/30 rounded-2xl backdrop-blur-sm">
                      <input
                        type="checkbox"
                        id="sameAddress"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className="h-5 w-5 text-fuchsia-600 focus:ring-fuchsia-500 border-fuchsia-800/30 rounded bg-slate-900/60"
                      />
                      <label htmlFor="sameAddress" className="ml-3 block text-sm font-bold text-fuchsia-200">
                        Usar la misma dirección para facturación
                      </label>
                    </div>

                    {/* Dirección de Facturación (si es diferente) */}
                    {!useSameAddress && (
                      <div className="border-t border-fuchsia-800/30 pt-6">
                        <h3 className="text-lg font-bold text-yellow-400 mb-4">Dirección de Facturación</h3>
                        
                        {/* Selector de Direcciones Guardadas para Facturación */}
                        {savedAddresses.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-bold text-fuchsia-200 flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                Direcciones Guardadas
                              </h4>
                              <button
                                onClick={() => setShowBillingAddressSelector(!showBillingAddressSelector)}
                                className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-md rounded-xl px-3 py-2 font-bold text-yellow-200 border border-yellow-400/30 shadow-lg hover:from-yellow-600/40 hover:to-orange-600/40 hover:text-orange-300 transition-all duration-300"
                              >
                                {showBillingAddressSelector ? 'Ocultar' : 'Seleccionar'}
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showBillingAddressSelector ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                            
                            {showBillingAddressSelector && (
                              <div className="space-y-3">
                                {savedAddresses.map((address) => (
                                  <div
                                    key={address.id}
                                    onClick={() => selectBillingAddress(address)}
                                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                      selectedBillingAddressId === address.id
                                        ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400 shadow-lg'
                                        : 'bg-slate-900/60 border-fuchsia-800/30 hover:border-yellow-400/50'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-bold text-fuchsia-200">
                                            {address.first_name} {address.last_name}
                                          </span>
                                          {address.is_default && (
                                            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-xs font-bold rounded-full border border-yellow-400/30">
                                              Predeterminada
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-fuchsia-300 text-sm mb-1">
                                          {address.address1}
                                          {address.address2 && `, ${address.address2}`}
                                        </p>
                                        <p className="text-fuchsia-300 text-sm">
                                          {address.city}, {address.state} {address.postal_code}
                                        </p>
                                        <p className="text-fuchsia-300 text-sm">
                                          {address.phone}
                                        </p>
                                      </div>
                                      {selectedBillingAddressId === address.id && (
                                        <div className="w-6 h-6 bg-gradient-to-r from-yellow-600 to-orange-400 rounded-full flex items-center justify-center">
                                          <Check className="w-4 h-4 text-slate-900" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Indicador de dirección de facturación seleccionada */}
                        {selectedBillingAddressId && (
                          <div className="mb-6 p-4 bg-gradient-to-r from-orange-900/40 to-yellow-900/40 border border-orange-800/30 rounded-2xl backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Check className="w-5 h-5 text-orange-400 mr-3" />
                                <div>
                                  <span className="text-orange-200 font-bold">Dirección de facturación seleccionada</span>
                                  <p className="text-orange-300 text-sm">
                                    {savedAddresses.find(addr => addr.id === selectedBillingAddressId)?.first_name} {savedAddresses.find(addr => addr.id === selectedBillingAddressId)?.last_name}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedBillingAddressId(null);
                                  setBillingAddress({
                                    firstName: '',
                                    lastName: '',
                                    address1: '',
                                    city: '',
                                    state: '',
                                    postalCode: '',
                                    country: 'España',
                                    phone: ''
                                  });
                                }}
                                className="text-orange-300 hover:text-orange-200 text-sm font-bold transition-colors duration-300"
                              >
                                Cambiar
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-fuchsia-200">
                              Nombre *
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <User className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                                </div>
                                <input
                                  type="text"
                                  name="billingFirstName"
                                  value={billingAddress.firstName}
                                  onChange={(e) => handleAddressChange('billing', 'firstName', e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                                  placeholder="Nombre de facturación"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-fuchsia-200">
                              Apellidos *
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <User className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                                </div>
                                <input
                                  type="text"
                                  name="billingLastName"
                                  value={billingAddress.lastName}
                                  onChange={(e) => handleAddressChange('billing', 'lastName', e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent"
                                  placeholder="Apellidos de facturación"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notas del pedido */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-fuchsia-200">
                        Notas del pedido (opcional)
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                          <textarea
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 bg-transparent resize-none"
                            placeholder="Instrucciones especiales, comentarios..."
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateOrder}
                      disabled={loading || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.phone}
                      className="w-full bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 py-5 rounded-2xl font-black text-lg shadow-xl hover:from-yellow-400 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 animate-glow border-2 border-fuchsia-400/30"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mr-3"></div>
                          <span>Creando Pedido...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Continuar al Pago</span>
                          <CreditCard className="ml-3 h-6 w-6" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && order && (
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-6 flex items-center">
                    <CreditCard className="w-6 h-6 mr-3" />
                    Información de Pago
                  </h2>
                  
                  <div className="mb-6 p-6 bg-gradient-to-r from-fuchsia-900/40 to-indigo-900/40 border border-fuchsia-800/30 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-yellow-400 mb-1">Pedido #{order.orderNumber}</h3>
                      <p className="text-fuchsia-200">Total: <span className="text-yellow-400 font-bold text-xl">{order.currency} {(order.total).toFixed(2)}</span></p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
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
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30 shadow-lg">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-green-400 via-fuchsia-400 to-yellow-400 bg-clip-text text-transparent mb-4">
                    ¡Pago realizado con éxito!
                  </h2>
                  <p className="text-fuchsia-200 text-lg mb-6">Revisa los detalles de tu pedido antes de finalizar.</p>
                  <div className="bg-gradient-to-r from-green-900/40 to-fuchsia-900/40 border border-green-800/30 rounded-2xl p-6 mb-6 text-left max-w-lg mx-auto backdrop-blur-sm">
                    <h3 className="font-bold text-green-400 mb-3">Pedido #{order.orderNumber}</h3>
                    <p className="mb-2 text-fuchsia-200">Total: <span className="text-yellow-400 font-bold">{order.currency} {(order.total).toFixed(2)}</span></p>
                    <p className="mb-2 text-fuchsia-200">Estado: <span className="text-green-400 font-bold">{order.status}</span></p>
                    <p className="mb-2 text-fuchsia-200">Fecha: <span className="text-cyan-400 font-bold">{new Date(order.createdAt).toLocaleString()}</span></p>
                  </div>
                  <button
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-green-400/30"
                    onClick={() => setStep('success')}
                  >
                    <CheckCircle className="mr-3 h-6 w-6 inline" />
                    Finalizar compra
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 sticky top-8 animate-scale-in">
              <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-3" />
                Resumen del Pedido
              </h3>
              
              {/* Productos */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-fuchsia-200 font-bold text-lg">Productos ({itemCount})</span>
                  <div className="w-8 h-8 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-full flex items-center justify-center border border-fuchsia-400/30">
                    <Package className="w-4 h-4 text-fuchsia-400" />
                  </div>
                </div>
                
                {cart.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-slate-900/60 to-indigo-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 p-4 hover:from-slate-900/80 hover:to-indigo-900/80 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center flex-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center mr-4 border border-fuchsia-400/30 group-hover:from-fuchsia-500/30 group-hover:to-yellow-500/30 transition-all duration-300">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.product_name}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate group-hover:text-yellow-300 transition-colors duration-300">
                            {item.product_name}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-fuchsia-300 text-sm font-medium">Cantidad: {item.quantity}</span>
                            <div className="w-2 h-2 bg-fuchsia-400 rounded-full mx-2"></div>
                            <span className="text-cyan-300 text-sm font-medium">€{item.price.toFixed(2)} c/u</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-black text-lg text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de costos */}
              <div className="bg-gradient-to-r from-fuchsia-900/40 to-indigo-900/40 border border-fuchsia-800/30 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Resumen de Costos
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-fuchsia-200 font-medium">Subtotal</span>
                    <span className="text-white font-bold">€{totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-fuchsia-200 font-medium">IVA (16%)</span>
                    <span className="text-cyan-400 font-bold">€{(totalPrice * 0.16).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-fuchsia-200 font-medium">Envío</span>
                    <div className="flex items-center">
                      <span className="text-green-400 font-bold mr-2">Gratis</span>
                      <div className="w-4 h-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                        <CheckCircle className="w-2 h-2 text-green-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-fuchsia-800/30 pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Total
                      </span>
                      <span className="text-2xl font-black text-yellow-400">
                        €{(totalPrice * 1.16).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-6 space-y-4">
                <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-800/30 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mr-3 border border-cyan-400/30">
                      <Truck className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-cyan-200 font-bold text-sm">Envío Gratuito</p>
                      <p className="text-cyan-300 text-xs">Entrega en 2-3 días hábiles</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-800/30 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mr-3 border border-green-400/30">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-green-200 font-bold text-sm">Pago Seguro</p>
                      <p className="text-green-300 text-xs">Protegido con Stripe</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-800/30 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mr-3 border border-yellow-400/30">
                      <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-yellow-200 font-bold text-sm">Garantía Premium</p>
                      <p className="text-yellow-300 text-xs">30 días de devolución</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {step === 'success' && (
          <div className="text-center p-12 animate-fade-in">
            <div className="w-28 h-28 bg-gradient-to-br from-yellow-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-yellow-400/30 shadow-2xl animate-glow">
              <Sparkles className="w-16 h-16 text-yellow-400 animate-bounce" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-fade-in">
              ¡Gracias por tu compra!
            </h2>
            <p className="text-fuchsia-200 text-lg mb-8 animate-fade-in">
              Tu pedido ha sido procesado correctamente.<br />Te enviaremos un correo con los detalles y pronto recibirás tu paquete.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 font-black rounded-2xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30 text-xl animate-glow"
            >
              <Star className="w-7 h-7" />
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 