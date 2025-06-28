'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ShoppingBag, Settings, LogOut, Edit, Shield, Heart, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/context/FavoritesContext';
import { API_BASE_URL } from '@/lib/api';
import AddressMapPicker from '@/components/AddressMapPicker';
import { validateAddressForm, sanitizeText } from '@/lib/validation';
import './premium-animations.css';

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

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  payment_status: string;
  tracking?: string;
  created_at: string;
}

interface OrderDetail extends Order {
  items: Array<{
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
  }>;
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes?: string;
}

export default function MiCuentaPage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const { favorites, removeFavorite, isFavorite } = useFavorites();
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: true,
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<{ id: number; first_name: string; last_name: string; phone: string; address1: string; address2: string; city: string; state: string; postal_code: string; country: string; is_default: boolean; lat: number; lng: number } | null>(null);
  const [addresses, setAddresses] = useState<{ id: number; first_name: string; last_name: string; phone: string; address1: string; address2: string; city: string; state: string; postal_code: string; country: string; is_default: boolean; lat: number; lng: number }[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState("");

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const fetchFavoriteProducts = async () => {
    setFavLoading(true);
    try {
      if (favorites.length === 0) {
        setFavProducts([]);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/products?ids=${favorites.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setFavProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching favorite products:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      if (!token) return;
      setOrdersLoading(true);
      setOrdersError("");
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setOrdersError("No se pudieron cargar los pedidos.");
      }
    } catch (err) {
      setOrdersError("Error al cargar pedidos");
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.order || null);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const sanitizedValue = type === 'checkbox' && e.target instanceof HTMLInputElement 
      ? e.target.checked 
      : sanitizeText(value);
    
    setAddressForm(prev => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleSaveAddress = async () => {
    setAddressError(null);
    setAddressSaved(false);
    if (!selectedAddress || !token) return;
    
    // Validar formulario antes de enviar
    const validation = validateAddressForm({
      first_name: addressForm.first_name,
      last_name: addressForm.last_name,
      phone: addressForm.phone,
      address1: selectedAddress.address,
      city: addressForm.city,
      state: addressForm.state,
      postal_code: addressForm.postal_code,
      country: addressForm.country,
    });
    
    if (!validation.isValid) {
      setAddressError('Por favor corrige los errores en el formulario: ' + Object.values(validation.errors).join(', '));
      return;
    }
    
    try {
      const url = editingAddress 
        ? `${API_BASE_URL}/api/addresses/${editingAddress.id}`
        : `${API_BASE_URL}/api/addresses`;
      
      const method = editingAddress ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'shipping',
          first_name: addressForm.first_name,
          last_name: addressForm.last_name,
          company: '',
          address1: selectedAddress.address,
          address2: addressForm.address2,
          city: addressForm.city,
          state: addressForm.state,
          postal_code: addressForm.postal_code,
          country: addressForm.country,
          phone: addressForm.phone,
          is_default: addressForm.is_default,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        setAddressError('Error al guardar la dirección: ' + errorText);
        return;
      }
      
      setAddressSaved(true);
      
      // Recargar direcciones y cerrar formulario
      setTimeout(() => {
        fetchAddresses();
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
          first_name: '',
          last_name: '',
          phone: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          is_default: true,
        });
        setSelectedAddress(null);
      }, 1500);
      
    } catch (err: any) {
      setAddressError('Error de red al guardar la dirección');
    }
  };

  const fetchAddresses = async () => {
    try {
      if (!token) return;
      setAddressesLoading(true);
      setAddressesError("");
      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      } else {
        setAddressesError("No se pudieron cargar las direcciones.");
      }
    } catch (err) {
      setAddressesError("Error al cargar direcciones");
      console.error('Error fetching addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleEditAddress = (address: { id: number; first_name: string; last_name: string; phone: string; address1: string; address2: string; city: string; state: string; postal_code: string; country: string; is_default: boolean; lat: number; lng: number }) => {
    setEditingAddress(address);
    setAddressForm({
      first_name: address.first_name,
      last_name: address.last_name,
      phone: address.phone,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setSelectedAddress({ address: `${address.address1}, ${address.city}, ${address.state} ${address.postal_code}`, lat: address.lat, lng: address.lng });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      } else {
        console.error('Error deleting address:', res.statusText);
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/addresses/${addressId}/set-default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      } else {
        console.error('Error setting default address:', res.statusText);
      }
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  useEffect(() => {
    fetchFavoriteProducts();
  }, [favorites]);

  useEffect(() => {
    if (!user || !token) return;
    fetchOrders();
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    fetchAddresses();
  }, [user, token]);

  const handleOrderClick = async (orderId: number) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      fetchOrderDetails(orderId);
    } catch (err: any) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center animate-fade-in-premium">
          <div className="glass-premium rounded-2xl shadow-2xl border border-white/50 p-8">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse-premium" />
            <h2 className="text-2xl font-black text-slate-900 mb-4">Acceso requerido</h2>
            <p className="text-slate-600 mb-6">
              Necesitas iniciar sesión para ver tu cuenta
            </p>
            <Link 
              href="/login"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-fuchsia-950 to-indigo-900 pt-20 sm:pt-32 md:pt-40 relative overflow-x-hidden">
      {/* Fondo animado premium */}
      <div className="absolute inset-0 pointer-events-none z-0 animate-gradient-x">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-fuchsia-500/30 via-yellow-400/20 to-cyan-400/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-indigo-500/30 via-fuchsia-400/20 to-yellow-400/30 rounded-full blur-2xl animate-pulse animation-delay-200"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-yellow-400/30 via-fuchsia-400/20 to-cyan-400/30 rounded-full blur-2xl animate-pulse animation-delay-400"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 z-10">
        {/* Header premium */}
        <div className="mb-6 sm:mb-10 flex flex-col items-center justify-center animate-fade-in-premium">
          <div className="relative mb-4">
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-fuchsia-600 via-yellow-400 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-fuchsia-400/30 animate-float">
              <span className="text-white font-black text-3xl sm:text-5xl drop-shadow-xl">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 sm:bottom-2 sm:right-2 bg-gradient-to-r from-yellow-400 to-fuchsia-400 text-slate-900 px-2 sm:px-4 py-1 rounded-full font-bold text-xs shadow-lg animate-bounce-in">
              ¡Bienvenido, {user.email?.split('@')[0]}!
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-2 text-center">
            Mi Cuenta
          </h1>
          <p className="text-indigo-100 text-sm sm:text-lg mb-2 text-center">Gestiona tu perfil, pedidos y configuraciones</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar Navigation Premium mejorado para móvil */}
          <div className="lg:col-span-1 animate-slide-in-left-premium">
            <div className="glass-premium rounded-2xl sm:rounded-3xl shadow-2xl border border-fuchsia-400/30 p-4 sm:p-8 sticky top-4 sm:top-8 flex flex-row lg:flex-col gap-2 sm:gap-4 lg:gap-0 overflow-x-auto lg:overflow-visible backdrop-blur-xl bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
              {/* User Info mejorado */}
              <div className="text-center mb-4 sm:mb-8 pb-4 sm:pb-8 border-b border-fuchsia-400/20 flex-shrink-0 lg:flex-shrink">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-fuchsia-600 via-yellow-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 animate-pulse-premium shadow-lg border-4 border-fuchsia-400/30">
                  <span className="text-white font-black text-2xl sm:text-4xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-fuchsia-100 text-sm sm:text-lg hidden lg:block">{user.email}</h3>
                <p className="text-xs text-fuchsia-300 hidden lg:block">Cliente desde 2024</p>
              </div>

              {/* Navigation Tabs Premium */}
              <nav className="flex flex-row lg:flex-col gap-1 sm:gap-2 w-full">
                {[
                  { key: 'profile', label: 'Perfil', icon: <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> },
                  { key: 'orders', label: 'Pedidos', icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> },
                  { key: 'wishlist', label: 'Deseos', icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> },
                  { key: 'addresses', label: 'Direcciones', icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> },
                  { key: 'security', label: 'Seguridad', icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> },
                  { key: 'settings', label: 'Config', icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-left font-bold transition-all duration-200 text-xs sm:text-base whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 border border-fuchsia-200 shadow-md scale-105' 
                        : 'text-fuchsia-100 hover:bg-gradient-to-r hover:from-fuchsia-900/40 hover:to-cyan-900/40 hover:text-yellow-400'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Logout Button Premium */}
              <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-fuchsia-400/20 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="flex items-center px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-left text-red-400 font-bold hover:bg-red-900/20 hover:text-red-200 transition-all duration-200 text-xs sm:text-base"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Premium */}
          <div className="lg:col-span-3 animate-fade-in-premium">
            {/* Profile Tab mejorado */}
            {activeTab === 'profile' && (
              <div className="glass-premium rounded-2xl sm:rounded-3xl shadow-2xl border border-fuchsia-400/30 p-4 sm:p-6 lg:p-10 mb-6 sm:mb-8 animate-scale-in-premium bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 gap-4">
                  <h2 className="text-xl sm:text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl">Información del Perfil</h2>
                  <button className="flex items-center justify-center text-fuchsia-300 hover:text-yellow-400 font-bold transition-colors bg-gradient-to-r from-fuchsia-900/40 to-cyan-900/40 px-4 py-2 rounded-xl shadow-md border border-fuchsia-400/20">
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    Editar
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-2">Nombre</label>
                    <input type="text" defaultValue="Tu Nombre" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-2">Apellidos</label>
                    <input type="text" defaultValue="Tus Apellidos" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-2">Email</label>
                    <input type="email" defaultValue={user.email} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl bg-gray-900/30 text-fuchsia-400 text-sm sm:text-base" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-2">Teléfono</label>
                    <input type="tel" defaultValue="+34 600 000 000" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" />
                  </div>
                </div>
                <div className="mt-6 sm:mt-10">
                  <button className="bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-black hover:from-yellow-500 hover:to-fuchsia-500 transition-all shadow-xl hover:shadow-fuchsia-500/25 w-full sm:w-auto animate-bounce-in text-sm sm:text-base">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* Orders Tab mejorado */}
            {activeTab === 'orders' && (
              <div className="glass-premium rounded-3xl shadow-2xl border border-fuchsia-400/30 p-10 mb-8 animate-scale-in-premium bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
                <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-8">Mis Pedidos</h2>
                {ordersLoading ? (
                  <div className="text-center py-12 text-fuchsia-300 animate-pulse">Cargando...</div>
                ) : ordersError ? (
                  <div className="text-center py-12 text-red-400 animate-fade-in">{ordersError}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-fuchsia-200 animate-fade-in">No tienes pedidos aún.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white/10 backdrop-blur-md border border-fuchsia-400/20 rounded-xl shadow-lg">
                      <thead>
                        <tr className="bg-gradient-to-r from-fuchsia-900/40 to-cyan-900/40">
                          <th className="px-4 py-3 font-bold text-fuchsia-200">#</th>
                          <th className="px-4 py-3 font-bold text-fuchsia-200">Fecha</th>
                          <th className="px-4 py-3 font-bold text-fuchsia-200">Total</th>
                          <th className="px-4 py-3 font-bold text-fuchsia-200">Estado</th>
                          <th className="px-4 py-3 font-bold text-fuchsia-200">Pago</th>
                          <th className="px-4 py-3 font-bold text-fuchsia-200">Tracking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-t border-fuchsia-400/10 hover:bg-fuchsia-900/10 cursor-pointer transition-colors animate-fade-in" onClick={() => handleOrderClick(order.id)}>
                            <td className="px-4 py-3 font-mono font-bold text-yellow-300">{order.order_number}</td>
                            <td className="px-4 py-3 text-fuchsia-100">{new Date(order.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-fuchsia-200">{order.currency} {order.total.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${order.status === 'delivered' ? 'bg-green-200/20 text-green-400 border border-green-400/30' : order.status === 'shipped' ? 'bg-blue-200/20 text-blue-400 border border-blue-400/30' : order.status === 'pending' ? 'bg-yellow-200/20 text-yellow-400 border border-yellow-400/30' : order.status === 'cancelled' ? 'bg-red-200/20 text-red-400 border border-red-400/30' : 'bg-fuchsia-200/10 text-fuchsia-300 border border-fuchsia-400/10'}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </td>
                            <td className="px-4 py-3 text-fuchsia-100">{order.payment_status}</td>
                            <td className="px-4 py-3 text-fuchsia-100">{order.tracking || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab mejorado */}
            {activeTab === 'wishlist' && (
              <div className="glass-premium rounded-3xl shadow-2xl border border-fuchsia-400/30 p-10 mb-8 animate-scale-in-premium bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
                <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-8 flex items-center gap-2">
                  <Heart className="w-7 h-7 text-red-500" fill="currentColor" /> Lista de Deseos
                </h2>
                {favLoading ? (
                  <div className="text-center py-12 text-fuchsia-300 animate-pulse">Cargando...</div>
                ) : favProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-fuchsia-300 mx-auto mb-4 animate-bounce-in" />
                    <h3 className="text-lg font-bold text-fuchsia-100 mb-2">Tu lista de deseos está vacía</h3>
                    <p className="text-fuchsia-300 mb-6">
                      Guarda productos que te gusten para comprarlos más tarde
                    </p>
                    <Link 
                      href="/productos"
                      className="bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 px-8 py-3 rounded-xl font-black shadow-lg hover:from-yellow-500 hover:to-fuchsia-500 transition-all animate-bounce-in"
                    >
                      Explorar Productos
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favProducts
                      .filter(product => favorites.includes(product.id))
                      .map(product => (
                        <div key={product.id} className="glass-premium rounded-2xl shadow-xl border border-fuchsia-400/20 p-6 flex flex-col items-center bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 animate-fade-in">
                          <img src={product.image_url || '/file.svg'} alt={product.name} className="w-32 h-32 object-contain rounded-xl mb-4 shadow-lg bg-gradient-to-br from-fuchsia-400/10 to-indigo-400/10" />
                          <h3 className="text-lg font-bold text-fuchsia-100 mb-2 text-center line-clamp-2">{product.name}</h3>
                          <p className="text-fuchsia-300 text-sm mb-2 text-center line-clamp-2">{product.description}</p>
                          <span className="text-2xl font-black text-yellow-300 mb-4">${product.price}</span>
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => removeFavorite(product.id)}
                              className="flex-1 bg-gradient-to-r from-red-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:from-fuchsia-600 hover:to-red-600 transition-all animate-bounce-in"
                            >
                              Quitar
                            </button>
                            <Link
                              href={`/productos/${product.id}`}
                              className="flex-1 bg-gradient-to-r from-yellow-400 to-cyan-400 text-slate-900 px-4 py-2 rounded-xl font-bold shadow-md hover:from-yellow-500 hover:to-cyan-500 transition-all animate-bounce-in text-center"
                            >
                              Ver
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab mejorado */}
            {activeTab === 'addresses' && (
              <div className="glass-premium rounded-2xl sm:rounded-3xl shadow-2xl border border-fuchsia-400/30 p-4 sm:p-6 lg:p-10 mb-6 sm:mb-8 animate-scale-in-premium bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
                <h2 className="text-xl sm:text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-6 sm:mb-8 flex items-center gap-2">
                  <MapPin className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400" /> Direcciones Guardadas
                </h2>
                {addressesLoading ? (
                  <div className="text-center py-12 text-fuchsia-300 animate-pulse">Cargando...</div>
                ) : addressesError ? (
                  <div className="text-center py-12 text-red-400 animate-fade-in">{addressesError}</div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 text-fuchsia-200 animate-fade-in">No tienes direcciones guardadas.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    {addresses.map(address => (
                      <div key={address.id} className={`glass-premium rounded-xl sm:rounded-2xl shadow-xl border ${address.is_default ? 'border-yellow-400' : 'border-fuchsia-400/20'} p-4 sm:p-6 flex flex-col bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 animate-fade-in relative`}>
                        {address.is_default && (
                          <span className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-r from-yellow-400 to-fuchsia-400 text-slate-900 px-2 sm:px-3 py-1 rounded-full font-bold text-xs shadow-md animate-bounce-in">Predeterminada</span>
                        )}
                        <div className="mb-2 text-fuchsia-100 font-bold text-base sm:text-lg flex items-center gap-2">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> {address.address1}
                        </div>
                        <div className="text-fuchsia-300 text-xs sm:text-sm mb-2">{address.city}, {address.state}, {address.country}</div>
                        <div className="text-fuchsia-300 text-xs mb-2">{address.postal_code}</div>
                        <div className="text-fuchsia-200 text-xs mb-4">{address.first_name} {address.last_name} - {address.phone}</div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="flex-1 bg-gradient-to-r from-yellow-400 to-cyan-400 text-slate-900 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold shadow-md hover:from-yellow-500 hover:to-cyan-500 transition-all animate-bounce-in text-xs sm:text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-fuchsia-500 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold shadow-md hover:from-fuchsia-600 hover:to-red-600 transition-all animate-bounce-in text-xs sm:text-sm"
                          >
                            Eliminar
                          </button>
                          {!address.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="flex-1 bg-gradient-to-r from-fuchsia-400 to-yellow-400 text-slate-900 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold shadow-md hover:from-yellow-500 hover:to-fuchsia-500 transition-all animate-bounce-in text-xs sm:text-sm"
                            >
                              Predeterminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 sm:mt-10 flex justify-center">
                  <button
                    onClick={() => { setShowAddressForm(true); setEditingAddress(null); }}
                    className="bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-black hover:from-yellow-500 hover:to-fuchsia-500 transition-all shadow-xl hover:shadow-fuchsia-500/25 animate-bounce-in text-sm sm:text-base w-full sm:w-auto"
                  >
                    Agregar Nueva Dirección
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab mejorado */}
            {activeTab === 'security' && (
              <div className="glass-premium rounded-3xl shadow-2xl border border-fuchsia-400/30 p-10 mb-8 animate-scale-in-premium bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
                <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-8 flex items-center gap-2">
                  <Shield className="w-7 h-7 text-yellow-400" /> Seguridad de la Cuenta
                </h2>
                <div className="space-y-8">
                  {/* Cambiar contraseña */}
                  <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-8 shadow-lg animate-fade-in">
                    <h3 className="text-lg font-bold text-fuchsia-100 mb-4">Cambiar Contraseña</h3>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-fuchsia-200 mb-2">Contraseña Actual</label>
                        <input type="password" className="w-full px-4 py-3 border border-fuchsia-400/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white/10 text-fuchsia-100 placeholder-fuchsia-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-fuchsia-200 mb-2">Nueva Contraseña</label>
                        <input type="password" className="w-full px-4 py-3 border border-fuchsia-400/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white/10 text-fuchsia-100 placeholder-fuchsia-300" />
                      </div>
                      <div className="md:col-span-2">
                        <button className="bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 px-10 py-4 rounded-xl font-black hover:from-yellow-500 hover:to-fuchsia-500 transition-all shadow-xl hover:shadow-fuchsia-500/25 w-full md:w-auto animate-bounce-in">
                          Cambiar Contraseña
                        </button>
                      </div>
                    </form>
                  </div>
                  {/* 2FA y otras opciones */}
                  <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-8 shadow-lg animate-fade-in">
                    <h3 className="text-lg font-bold text-fuchsia-100 mb-4">Autenticación en Dos Pasos (2FA)</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-fuchsia-200 font-bold">Estado:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-fuchsia-400 text-slate-900 shadow-md">Desactivado</span>
                    </div>
                    <button className="bg-gradient-to-r from-fuchsia-400 to-yellow-400 text-slate-900 px-8 py-3 rounded-xl font-black hover:from-yellow-500 hover:to-fuchsia-500 transition-all shadow-lg hover:shadow-fuchsia-500/25 animate-bounce-in">
                      Activar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab mejorado */}
            {activeTab === 'settings' && (
              <div className="glass-premium rounded-3xl shadow-2xl border border-fuchsia-400/30 p-10 mb-8 animate-scale-in-premium bg-gradient-to-br from-slate-900/60 via-fuchsia-900/40 to-indigo-900/60">
                <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-8 flex items-center gap-2">
                  <Settings className="w-7 h-7 text-fuchsia-400" /> Configuración de la Cuenta
                </h2>
                <div className="space-y-8">
                  {/* Notificaciones */}
                  <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-8 shadow-lg animate-fade-in">
                    <h3 className="text-lg font-bold text-fuchsia-100 mb-4">Notificaciones</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-fuchsia-200 font-bold">Recibir emails de promociones</span>
                      <input type="checkbox" className="w-6 h-6 rounded-full border-2 border-fuchsia-400 bg-white/10 checked:bg-fuchsia-400 transition-all" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-fuchsia-200 font-bold">Alertas de pedidos</span>
                      <input type="checkbox" className="w-6 h-6 rounded-full border-2 border-yellow-400 bg-white/10 checked:bg-yellow-400 transition-all" />
                    </div>
                  </div>
                  {/* Preferencias de idioma */}
                  <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-8 shadow-lg animate-fade-in">
                    <h3 className="text-lg font-bold text-fuchsia-100 mb-4">Idioma</h3>
                    <select className="w-full px-4 py-3 border border-fuchsia-400/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white/10 text-fuchsia-100">
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  {/* Guardar cambios */}
                  <div className="flex justify-end">
                    <button className="bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 px-10 py-4 rounded-xl font-black hover:from-yellow-500 hover:to-fuchsia-500 transition-all shadow-xl hover:shadow-fuchsia-500/25 animate-bounce-in">
                      Guardar Configuración
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalles de pedidos mejorado */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-premium rounded-3xl shadow-2xl max-w-4xl w-full p-8 relative mx-4 animate-scale-in-premium max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/80 via-fuchsia-900/60 to-indigo-900/80 border border-fuchsia-400/30">
            <button 
              className="absolute top-4 right-4 text-fuchsia-300 hover:text-yellow-400 text-2xl font-bold transition-colors" 
              onClick={() => setSelectedOrder(null)}
            >
              &times;
            </button>
            
            <h3 className="text-2xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-6">
              Pedido #{selectedOrder.order_number}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Detalles del pedido */}
              <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-6 shadow-lg animate-fade-in">
                <h4 className="text-lg font-bold text-fuchsia-100 mb-4">Información del Pedido</h4>
                <div className="space-y-3 text-fuchsia-200">
                  <div className="flex justify-between">
                    <span className="font-bold">Estado:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOrder.status === 'delivered' ? 'bg-green-200/20 text-green-400 border border-green-400/30' : selectedOrder.status === 'shipped' ? 'bg-blue-200/20 text-blue-400 border border-blue-400/30' : selectedOrder.status === 'pending' ? 'bg-yellow-200/20 text-yellow-400 border border-yellow-400/30' : selectedOrder.status === 'cancelled' ? 'bg-red-200/20 text-red-400 border border-red-400/30' : 'bg-fuchsia-200/10 text-fuchsia-300 border border-fuchsia-400/10'}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="text-yellow-300 font-bold">{selectedOrder.currency} {selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Pago:</span>
                    <span className="text-fuchsia-300">{selectedOrder.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Fecha:</span>
                    <span className="text-fuchsia-300">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  {selectedOrder.tracking && (
                    <div className="flex justify-between">
                      <span className="font-bold">Tracking:</span>
                      <span className="text-cyan-300">{selectedOrder.tracking}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-6 shadow-lg animate-fade-in">
                <h4 className="text-lg font-bold text-fuchsia-100 mb-4">Productos</h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-fuchsia-400/10">
                      <img src={item.image_url || '/file.svg'} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-gradient-to-br from-fuchsia-400/10 to-indigo-400/10" />
                      <div className="flex-1">
                        <h5 className="text-fuchsia-100 font-bold text-sm line-clamp-1">{item.name}</h5>
                        <p className="text-fuchsia-300 text-xs">Cantidad: {item.quantity}</p>
                      </div>
                      <span className="text-yellow-300 font-bold text-sm">${item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            {selectedOrder.shipping_address && (
              <div className="mt-8 bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-6 shadow-lg animate-fade-in">
                <h4 className="text-lg font-bold text-fuchsia-100 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" /> Dirección de Envío
                </h4>
                <div className="text-fuchsia-200">
                  <p>{selectedOrder.shipping_address.street}</p>
                  <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}</p>
                  <p>{selectedOrder.shipping_address.country}</p>
                </div>
              </div>
            )}

            {/* Notas del pedido */}
            {selectedOrder.notes && (
              <div className="mt-8 bg-gradient-to-br from-fuchsia-900/30 via-slate-900/30 to-indigo-900/30 rounded-2xl p-6 shadow-lg animate-fade-in">
                <h4 className="text-lg font-bold text-fuchsia-100 mb-4">Notas</h4>
                <p className="text-fuchsia-200">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario de direcciones mejorado */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4">
          <div className="glass-premium rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 lg:p-8 relative mx-2 sm:mx-4 animate-scale-in-premium max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-900/80 via-fuchsia-900/60 to-indigo-900/80 border border-fuchsia-400/30">
            <button 
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-fuchsia-300 hover:text-yellow-400 text-2xl font-bold transition-colors z-10" 
              onClick={() => {
                setShowAddressForm(false)
                setEditingAddress(null)
                setAddressForm({
                  first_name: '',
                  last_name: '',
                  phone: '',
                  address1: '',
                  address2: '',
                  city: '',
                  state: '',
                  postal_code: '',
                  country: '',
                  is_default: true,
                })
              }}
            >
              &times;
            </button>
            
            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text drop-shadow-xl mb-4 sm:mb-6">
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <AddressMapPicker
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                  onChange={setSelectedAddress}
                  defaultCenter={editingAddress ? { lat: editingAddress.lat, lng: editingAddress.lng } : undefined}
                />
                <div className="mt-2 text-xs text-fuchsia-300">
                  Selecciona la ubicación en el mapa o busca tu dirección exacta.
                </div>
              </div>
              
              <form className="space-y-3 sm:space-y-4" onSubmit={e => { e.preventDefault(); handleSaveAddress(); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Nombre</label>
                    <input 
                      type="text" 
                      name="first_name" 
                      value={addressForm.first_name} 
                      onChange={handleFormChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Apellidos</label>
                    <input 
                      type="text" 
                      name="last_name" 
                      value={addressForm.last_name} 
                      onChange={handleFormChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Teléfono</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={addressForm.phone} 
                    onChange={handleFormChange} 
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Dirección 2 (opcional)</label>
                  <input 
                    type="text" 
                    name="address2" 
                    value={addressForm.address2} 
                    onChange={handleFormChange} 
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Ciudad</label>
                    <input 
                      type="text" 
                      name="city" 
                      value={addressForm.city} 
                      onChange={handleFormChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Estado/Provincia</label>
                    <input 
                      type="text" 
                      name="state" 
                      value={addressForm.state} 
                      onChange={handleFormChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">Código Postal</label>
                    <input 
                      type="text" 
                      name="postal_code" 
                      value={addressForm.postal_code} 
                      onChange={handleFormChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-200 mb-1 sm:mb-2">País</label>
                    <input 
                      type="text" 
                      name="country" 
                      value={addressForm.country} 
                      onChange={handleFormChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fuchsia-400/20 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white text-black placeholder-gray-500 text-sm sm:text-base" 
                      required 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="is_default" 
                    checked={addressForm.is_default} 
                    onChange={handleFormChange} 
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-fuchsia-400 bg-white/10 checked:bg-fuchsia-400 transition-all" 
                  />
                  <label className="text-sm font-bold text-fuchsia-200">Marcar como dirección principal</label>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 text-slate-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black hover:from-yellow-500 hover:to-fuchsia-500 transition-all shadow-xl hover:shadow-fuchsia-500/25 animate-bounce-in text-sm sm:text-base"
                    disabled={!selectedAddress}
                  >
                    {editingAddress ? 'Actualizar Dirección' : 'Guardar Dirección'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false)
                      setEditingAddress(null)
                      setAddressForm({
                        first_name: '',
                        last_name: '',
                        phone: '',
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        postal_code: '',
                        country: '',
                        is_default: true,
                      })
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 border border-fuchsia-400/20 text-fuchsia-300 rounded-lg sm:rounded-xl font-bold hover:bg-fuchsia-900/20 transition-all text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                </div>
                {addressSaved && selectedAddress && !addressError && (
                  <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-400 rounded-lg sm:rounded-xl border border-green-400/30 animate-fade-in text-sm">
                    Dirección guardada:<br />
                    <strong>{selectedAddress.address}</strong><br />
                    <small>Lat: {selectedAddress.lat}, Lng: {selectedAddress.lng}</small>
                  </div>
                )}
                {addressError && (
                  <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-red-900/40 to-pink-900/40 text-red-400 rounded-lg sm:rounded-xl border border-red-400/30 animate-fade-in text-sm">
                    {addressError}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 