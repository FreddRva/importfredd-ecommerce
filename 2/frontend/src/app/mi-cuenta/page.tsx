'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ShoppingBag, Settings, LogOut, Edit, Shield, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/context/FavoritesContext';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso requerido</h2>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para ver tu cuenta
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu perfil, pedidos y configuraciones
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{user.email}</h3>
                <p className="text-sm text-gray-500">Cliente desde 2024</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5 mr-3" />
                  Perfil
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  Mis Pedidos
                </button>
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'wishlist' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="w-5 h-5 mr-3" />
                  Lista de Deseos
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'addresses' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-5 h-5 mr-3" />
                  Direcciones
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'security' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Seguridad
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Configuración
                </button>
              </nav>

              {/* Logout Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Información del Perfil</h2>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      defaultValue="Tu Nombre"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      defaultValue="Tus Apellidos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      defaultValue="+34 600 000 000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Mis Pedidos</h2>
                {ordersLoading ? (
                  <div className="text-center py-12 text-gray-500">Cargando...</div>
                ) : ordersError ? (
                  <div className="text-center py-12 text-red-500">{ordersError}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No tienes pedidos aún.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Fecha</th>
                          <th className="px-4 py-2">Total</th>
                          <th className="px-4 py-2">Estado</th>
                          <th className="px-4 py-2">Pago</th>
                          <th className="px-4 py-2">Tracking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => handleOrderClick(order.id)}>
                            <td className="px-4 py-2 font-mono">{order.order_number}</td>
                            <td className="px-4 py-2">{new Date(order.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2">{order.currency} {order.total.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </td>
                            <td className="px-4 py-2">{order.payment_status}</td>
                            <td className="px-4 py-2">{order.tracking || '-'}</td>
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Heart className="w-7 h-7 text-red-500" fill="currentColor" /> Lista de Deseos
                </h2>
                {favLoading ? (
                  <div className="text-center py-12 text-gray-500">Cargando...</div>
                ) : favProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tu lista de deseos está vacía</h3>
                    <p className="text-gray-500 mb-6">
                      Guarda productos que te gusten para comprarlos más tarde
                    </p>
                    <Link 
                      href="/productos"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Explorar Productos
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2">Imagen</th>
                          <th className="px-4 py-2">Nombre</th>
                          <th className="px-4 py-2">Categoría</th>
                          <th className="px-4 py-2">Precio</th>
                          <th className="px-4 py-2">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favProducts.map((product) => (
                          <tr key={product.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <img src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : product.image_url) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='Arial' font-size='16'%3EImagen no disponible%3C/text%3E%3C/svg%3E"} alt={product.name} className="w-12 h-12 object-cover rounded" />
                            </td>
                            <td className="px-4 py-2 font-medium">
                              <Link href={`/productos/${product.id}`}>{product.name}</Link>
                            </td>
                            <td className="px-4 py-2">{product.category_name}</td>
                            <td className="px-4 py-2">${product.price.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => removeFavorite(product.id)}
                                className={`p-2 ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Mis Direcciones</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Agregar Dirección
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Casa</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Principal</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Calle Principal 123<br />
                      Madrid, Madrid 28001<br />
                      España
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Trabajo</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Avenida del Trabajo 456<br />
                      Barcelona, Barcelona 08001<br />
                      España
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Seguridad</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Cambiar Contraseña</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="password"
                        placeholder="Contraseña actual"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Actualizar
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Autenticación de Dos Factores</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Añade una capa extra de seguridad a tu cuenta
                    </p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Activar 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Notificaciones</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-gray-700">Notificaciones por email</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-gray-700">Notificaciones push</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-gray-700">Ofertas y promociones</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Privacidad</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-gray-700">Compartir datos de uso</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-gray-700">Perfil público</span>
                      </label>
                    </div>
                  </div>
                  
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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