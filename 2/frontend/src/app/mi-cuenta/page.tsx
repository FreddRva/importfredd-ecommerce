'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ShoppingBag, Settings, LogOut, Edit, Shield, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/context/FavoritesContext';
import { API_BASE_URL } from '@/lib/api';
import AddressMapPicker from '@/components/AddressMapPicker';

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
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: true,
  });

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
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' && e.target instanceof HTMLInputElement ? e.target.checked : value,
    }));
  };

  const handleSaveAddress = async () => {
    setAddressError(null);
    setAddressSaved(false);
    if (!selectedAddress || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        method: 'POST',
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
    } catch (err: any) {
      setAddressError('Error de red al guardar la dirección');
    }
  };

  useEffect(() => {
    fetchFavoriteProducts();
  }, [favorites]);

  useEffect(() => {
    if (!user || !token) return;
    fetchOrders();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 relative overflow-x-hidden">
      {/* Partículas animadas */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400/50 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-indigo-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-violet-400/40 rounded-full animate-ping animation-delay-200"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in-premium">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent">
            Mi Cuenta
          </h1>
          <p className="text-slate-600 text-lg">
            Gestiona tu perfil, pedidos y configuraciones
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation Premium */}
          <div className="lg:col-span-1 animate-slide-in-left-premium">
            <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-6 sticky top-8 flex flex-row lg:flex-col gap-4 lg:gap-0 overflow-x-auto lg:overflow-visible">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-premium">
                  <span className="text-white font-black text-2xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900">{user.email}</h3>
                <p className="text-xs text-slate-500">Cliente desde 2024</p>
              </div>

              {/* Navigation Tabs Premium */}
              <nav className="flex flex-row lg:flex-col gap-2 w-full">
                {[
                  { key: 'profile', label: 'Perfil', icon: <User className="w-5 h-5 mr-3" /> },
                  { key: 'orders', label: 'Mis Pedidos', icon: <ShoppingBag className="w-5 h-5 mr-3" /> },
                  { key: 'wishlist', label: 'Lista de Deseos', icon: <Heart className="w-5 h-5 mr-3" /> },
                  { key: 'addresses', label: 'Direcciones', icon: <MapPin className="w-5 h-5 mr-3" /> },
                  { key: 'security', label: 'Seguridad', icon: <Shield className="w-5 h-5 mr-3" /> },
                  { key: 'settings', label: 'Configuración', icon: <Settings className="w-5 h-5 mr-3" /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-left font-bold transition-all duration-200 text-base ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border border-violet-200 shadow-md' 
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Logout Button Premium */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-left text-red-600 font-bold hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Premium */}
          <div className="lg:col-span-3 animate-fade-in-premium">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Información del Perfil</h2>
                  <button className="flex items-center text-violet-600 hover:text-violet-800 font-bold transition-colors">
                    <Edit className="w-5 h-5 mr-1" />
                    Editar
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                    <input type="text" defaultValue="Tu Nombre" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos</label>
                    <input type="text" defaultValue="Tus Apellidos" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input type="email" defaultValue={user.email} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-400" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono</label>
                    <input type="tel" defaultValue="+34 600 000 000" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" />
                  </div>
                </div>
                <div className="mt-8">
                  <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl w-full md:w-auto">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Mis Pedidos</h2>
                {ordersLoading ? (
                  <div className="text-center py-12 text-slate-500">Cargando...</div>
                ) : ordersError ? (
                  <div className="text-center py-12 text-red-500">{ordersError}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No tienes pedidos aún.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-gray-100">
                          <th className="px-4 py-3 font-bold text-slate-700">#</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Fecha</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Total</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Estado</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Pago</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Tracking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-t hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleOrderClick(order.id)}>
                            <td className="px-4 py-3 font-mono font-bold">{order.order_number}</td>
                            <td className="px-4 py-3">{new Date(order.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold">{order.currency} {order.total.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </td>
                            <td className="px-4 py-3">{order.payment_status}</td>
                            <td className="px-4 py-3">{order.tracking || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Heart className="w-7 h-7 text-red-500" fill="currentColor" /> Lista de Deseos
                </h2>
                {favLoading ? (
                  <div className="text-center py-12 text-slate-500">Cargando...</div>
                ) : favProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Tu lista de deseos está vacía</h3>
                    <p className="text-slate-500 mb-6">
                      Guarda productos que te gusten para comprarlos más tarde
                    </p>
                    <Link 
                      href="/productos"
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Explorar Productos
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-gray-100">
                          <th className="px-4 py-3 font-bold text-slate-700">Imagen</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Nombre</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Categoría</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Precio</th>
                          <th className="px-4 py-3 font-bold text-slate-700">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favProducts.filter(product => favorites.includes(product.id)).map((product) => (
                          <tr key={product.id} className="border-t hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <img src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : product.image_url) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                            </td>
                            <td className="px-4 py-3 font-bold">
                              <Link href={`/productos/${product.id}`} className="text-violet-600 hover:text-violet-800">{product.name}</Link>
                            </td>
                            <td className="px-4 py-3">{product.category_name}</td>
                            <td className="px-4 py-3 font-bold">${product.price.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removeFavorite(product.id)}
                                className={`p-2 rounded-full transition-all ${isFavorite(product.id) ? 'text-red-500 bg-red-100' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                aria-label="Quitar de favoritos"
                              >
                                <Heart className="w-5 h-5" fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Mis Direcciones</h2>
                </div>
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <AddressMapPicker
                      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                      onChange={setSelectedAddress}
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      Selecciona la ubicación en el mapa o busca tu dirección exacta.
                    </div>
                  </div>
                  <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveAddress(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700">Nombre</label>
                        <input type="text" name="first_name" value={addressForm.first_name} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700">Apellidos</label>
                        <input type="text" name="last_name" value={addressForm.last_name} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Teléfono</label>
                      <input type="tel" name="phone" value={addressForm.phone} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Dirección 2 (opcional)</label>
                      <input type="text" name="address2" value={addressForm.address2} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700">Ciudad</label>
                        <input type="text" name="city" value={addressForm.city} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700">Estado/Provincia</label>
                        <input type="text" name="state" value={addressForm.state} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700">Código Postal</label>
                        <input type="text" name="postal_code" value={addressForm.postal_code} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700">País</label>
                        <input type="text" name="country" value={addressForm.country} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80" required />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleFormChange} className="rounded" />
                      <label className="text-sm font-bold">Marcar como dirección principal</label>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl w-full"
                      disabled={!selectedAddress}
                    >
                      Guardar Dirección
                    </button>
                    {addressSaved && selectedAddress && !addressError && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 rounded-xl border border-green-200">
                        Dirección guardada:<br />
                        <strong>{selectedAddress.address}</strong><br />
                        <small>Lat: {selectedAddress.lat}, Lng: {selectedAddress.lng}</small>
                      </div>
                    )}
                    {addressError && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 text-red-800 rounded-xl border border-red-200">
                        {addressError}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Seguridad</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Cambiar Contraseña</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="password"
                        placeholder="Contraseña actual"
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80"
                      />
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white/80"
                      />
                      <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                        Actualizar
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Autenticación de Dos Factores</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Añade una capa extra de seguridad a tu cuenta
                    </p>
                    <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
                      Activar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Configuración</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-6">Notificaciones</h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3 rounded" defaultChecked />
                        <span className="text-slate-700 font-medium">Notificaciones por email</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3 rounded" />
                        <span className="text-slate-700 font-medium">Notificaciones push</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3 rounded" defaultChecked />
                        <span className="text-slate-700 font-medium">Ofertas y promociones</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-900 mb-6">Privacidad</h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3 rounded" defaultChecked />
                        <span className="text-slate-700 font-medium">Compartir datos de uso</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3 rounded" />
                        <span className="text-slate-700 font-medium">Perfil público</span>
                      </label>
                    </div>
                  </div>
                  
                  <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle de pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="glass-premium rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative mx-4 animate-scale-in-premium">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setSelectedOrder(null)}>&times;</button>
            <h3 className="text-xl font-black text-slate-900 mb-4">Pedido #{selectedOrder.order_number}</h3>
            <div className="mb-4 text-sm text-slate-500">Fecha: {new Date(selectedOrder.created_at).toLocaleString()}</div>
            <div className="mb-4 text-sm">Estado: <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' : selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{selectedOrder.status}</span></div>
            <div className="mb-4 text-sm">Pago: {selectedOrder.payment_status}</div>
            <div className="mb-4 text-sm">Tracking: {selectedOrder.tracking || '-'}</div>
            <div className="mb-6 text-sm font-bold">Total: {selectedOrder.currency} {selectedOrder.total.toFixed(2)}</div>
            <h4 className="font-bold text-slate-900 mb-4">Productos:</h4>
            <ul className="mb-6 divide-y divide-gray-200">
              {selectedOrder.items.map(item => (
                <li key={item.id} className="py-4 flex items-center gap-4">
                  {item.image_url && <img src={item.image_url.startsWith('http') ? item.image_url : item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />}
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">Cantidad: {item.quantity} &bull; Precio: {selectedOrder.currency} {item.price.toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>
            {selectedOrder.shipping_address && (
              <div className="mb-4 text-sm">
                <div className="font-bold text-slate-900">Enviado a:</div>
                <div>{selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}, {selectedOrder.shipping_address.zip}, {selectedOrder.shipping_address.country}</div>
              </div>
            )}
            {selectedOrder.notes && (
              <div className="mb-4 text-sm">
                <div className="font-bold text-slate-900">Notas:</div>
                <div>{selectedOrder.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 