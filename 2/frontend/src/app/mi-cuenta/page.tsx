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
            {/* Aquí van los tabs, cada uno con glass, gradientes, tablas y formularios mejorados, cards apiladas en móvil, etc. */}
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
            {activeTab === 'orders' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Mis Pedidos</h2>
                  <button className="flex items-center text-violet-600 hover:text-violet-800 font-bold transition-colors">
                    Ver Todos
                  </button>
                </div>
                {/* Contenido del tab de pedidos */}
              </div>
            )}
            {activeTab === 'wishlist' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Lista de Deseos</h2>
                  <button className="flex items-center text-violet-600 hover:text-violet-800 font-bold transition-colors">
                    Ver Todos
                  </button>
                </div>
                {/* Contenido del tab de lista de deseos */}
              </div>
            )}
            {activeTab === 'addresses' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Direcciones</h2>
                  <button className="flex items-center text-violet-600 hover:text-violet-800 font-bold transition-colors">
                    Añadir Nueva
                  </button>
                </div>
                {/* Contenido del tab de direcciones */}
              </div>
            )}
            {activeTab === 'security' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Seguridad</h2>
                  <button className="flex items-center text-violet-600 hover:text-violet-800 font-bold transition-colors">
                    Cambiar Contraseña
                  </button>
                </div>
                {/* Contenido del tab de seguridad */}
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="glass-premium rounded-2xl shadow-xl border border-white/50 p-8 mb-6 animate-scale-in-premium">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Configuración</h2>
                  <button className="flex items-center text-violet-600 hover:text-violet-800 font-bold transition-colors">
                    Ver Configuración
                  </button>
                </div>
                {/* Contenido del tab de configuración */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle de pedido: mejorar visualmente, glass, animaciones, responsive */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSelectedOrder(null)}>&times;</button>
            <h3 className="text-lg font-semibold mb-2">Pedido #{selectedOrder.order_number}</h3>
            <div className="mb-2 text-sm text-gray-500">Fecha: {new Date(selectedOrder.created_at).toLocaleString()}</div>
            <div className="mb-2 text-sm">Estado: <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' : selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{selectedOrder.status}</span></div>
            <div className="mb-2 text-sm">Pago: {selectedOrder.payment_status}</div>
            <div className="mb-2 text-sm">Tracking: {selectedOrder.tracking || '-'}</div>
            <div className="mb-4 text-sm">Total: {selectedOrder.currency} {selectedOrder.total.toFixed(2)}</div>
            <h4 className="font-semibold mb-1">Productos:</h4>
            <ul className="mb-4 divide-y divide-gray-200">
              {selectedOrder.items.map(item => (
                <li key={item.id} className="py-2 flex items-center gap-3">
                  {item.image_url && <img src={item.image_url.startsWith('http') ? item.image_url : item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />}
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">Cantidad: {item.quantity} &bull; Precio: {selectedOrder.currency} {item.price.toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>
            {selectedOrder.shipping_address && (
              <div className="mb-2 text-sm">
                <div className="font-semibold">Enviado a:</div>
                <div>{selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}, {selectedOrder.shipping_address.zip}, {selectedOrder.shipping_address.country}</div>
              </div>
            )}
            {selectedOrder.notes && (
              <div className="mb-2 text-sm">
                <div className="font-semibold">Notas:</div>
                <div>{selectedOrder.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 