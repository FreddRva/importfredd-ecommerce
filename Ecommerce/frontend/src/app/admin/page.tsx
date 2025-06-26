'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Package, Users, BarChart2, DollarSign, LogOut, ArrowLeft, ShoppingCart, TrendingUp, Eye, Settings, Plus, Sparkles, Shield, Star, Clock, CheckCircle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'

interface Stats {
  total_products: number
  active_products: number
  total_categories: number
  total_orders: number
  total_revenue: number
  pending_orders: number
  completed_orders: number
}

const StatCard = ({ title, value, icon: Icon, color, trend }: { 
  title: string, 
  value: string | number, 
  icon: React.ElementType,
  color: string,
  trend?: string
}) => (
  <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-6 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center border border-fuchsia-400/30 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className="text-xs font-bold text-green-400 bg-green-900/40 px-2 py-1 rounded-full border border-green-400/30">
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-fuchsia-200 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent">{value}</p>
    </div>
  </div>
)

const NavLink = ({ href, icon: Icon, children, isActive }: { 
  href: string, 
  icon: React.ElementType, 
  children: React.ReactNode,
  isActive?: boolean 
}) => (
  <Link 
    href={href} 
    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold ${
      isActive 
        ? 'bg-gradient-to-r from-fuchsia-600/20 to-yellow-400/20 text-yellow-300 border border-fuchsia-400/30 shadow-lg' 
        : 'text-fuchsia-200 hover:bg-gradient-to-r hover:from-fuchsia-600/10 hover:to-yellow-400/10 hover:text-yellow-300'
    }`}
  >
    <Icon size={20} />
    <span>{children}</span>
  </Link>
)

const QuickActionCard = ({ href, icon: Icon, title, description, color }: {
  href: string,
  icon: React.ElementType,
  title: string,
  description: string,
  color: string
}) => (
  <Link 
    href={href} 
    className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-6 hover:shadow-3xl hover:scale-105 transition-all duration-300 group"
  >
    <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 border border-fuchsia-400/30 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-black text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300">{title}</h3>
    <p className="text-fuchsia-200 text-sm">{description}</p>
    <div className="mt-4 flex items-center text-yellow-400 font-bold text-sm">
      <Plus className="w-4 h-4 mr-2" />
      Acceder
    </div>
  </Link>
)

export default function AdminPage() {
  const { user, logout, token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStats()
    } else if (user) {
      setLoading(false)
    }
  }, [user])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al cargar las estadísticas')
      const data = await res.json()
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 flex items-center justify-center">
        <div className="w-20 h-20 bg-gradient-to-r from-fuchsia-600 to-yellow-400 rounded-full flex items-center justify-center animate-spin">
          <div className="w-16 h-16 bg-slate-900 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 flex items-center justify-center text-white">
        <div className="bg-gradient-to-br from-red-900/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-red-800/30 p-8 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-400 mb-2">Acceso Denegado</h2>
          <p className="text-fuchsia-200">No tienes permisos de administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 text-white relative overflow-hidden">
      {/* Floating Icons Decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-fuchsia-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-yellow-400/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-cyan-400/15 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-fuchsia-400/25 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-yellow-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-cyan-400/30 rounded-full animate-float-delayed"></div>
      </div>

      <div className="flex relative z-10">
        {/* Barra lateral */}
        <aside className="w-80 bg-gradient-to-br from-slate-900/90 via-indigo-950/90 to-fuchsia-900/90 backdrop-blur-2xl border-r border-fuchsia-800/30 h-screen sticky top-0 flex flex-col p-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-600 to-yellow-400 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-fuchsia-300 text-sm">ImportFredd</p>
              </div>
            </div>
            
            <nav className="space-y-3 mb-8">
              <NavLink href="/admin" icon={LayoutDashboard} isActive={true}>
                Dashboard
              </NavLink>
              <NavLink href="/admin/products" icon={Package}>
                Productos
              </NavLink>
              <NavLink href="/admin/orders" icon={ShoppingCart}>
                Pedidos
              </NavLink>
              <NavLink href="/admin/users" icon={Users}>
                Usuarios
              </NavLink>
              <NavLink href="/admin/categories" icon={Settings}>
                Categorías
              </NavLink>
            </nav>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/" 
              className="flex items-center gap-4 text-fuchsia-200 hover:text-yellow-300 px-6 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-fuchsia-600/10 hover:to-yellow-400/10 transition-all duration-300 font-bold"
            >
              <ArrowLeft size={20}/>
              <span>Volver a la Tienda</span>
            </Link>
            <button 
              onClick={logout} 
              className="w-full flex items-center gap-4 text-red-400 hover:text-red-300 hover:bg-red-900/20 px-6 py-4 rounded-2xl transition-all duration-300 font-bold border border-red-800/30 hover:border-red-600/50"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                Dashboard
              </h1>
              <p className="text-xl text-fuchsia-200">
                Bienvenido, <span className="text-yellow-400 font-bold">{user?.email}</span>. 
                Aquí tienes un resumen completo de tu tienda.
              </p>
            </div>
            
            {/* Estadísticas */}
            {error && (
              <div className="bg-gradient-to-r from-red-900/40 to-fuchsia-900/40 border border-red-800/30 rounded-2xl p-4 mb-8 backdrop-blur-sm">
                <p className="text-red-400 font-bold">{error}</p>
              </div>
            )}
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard 
                  title="Ingresos Totales" 
                  value={`€${stats.total_revenue.toFixed(2)}`} 
                  icon={DollarSign} 
                  color="from-green-500/20 to-emerald-500/20"
                  trend="+12%"
                />
                <StatCard 
                  title="Pedidos Totales" 
                  value={stats.total_orders} 
                  icon={ShoppingCart} 
                  color="from-blue-500/20 to-cyan-500/20"
                  trend="+8%"
                />
                <StatCard 
                  title="Productos Activos" 
                  value={stats.active_products} 
                  icon={Package} 
                  color="from-fuchsia-500/20 to-purple-500/20"
                />
                <StatCard 
                  title="Pedidos Pendientes" 
                  value={stats.pending_orders} 
                  icon={Clock} 
                  color="from-yellow-500/20 to-orange-500/20"
                />
              </div>
            )}

            {/* Accesos directos */}
            <div className="mb-12">
              <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent mb-6 flex items-center">
                <Settings className="w-8 h-8 mr-3" />
                Gestión Rápida
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuickActionCard
                  href="/admin/products"
                  icon={Package}
                  title="Gestionar Productos"
                  description="Añadir, editar y eliminar productos de tu catálogo."
                  color="from-fuchsia-500/20 to-purple-500/20"
                />
                <QuickActionCard
                  href="/admin/orders"
                  icon={ShoppingCart}
                  title="Ver Pedidos"
                  description="Revisar y gestionar todos los pedidos de clientes."
                  color="from-blue-500/20 to-cyan-500/20"
                />
                <QuickActionCard
                  href="/admin/users"
                  icon={Users}
                  title="Gestionar Usuarios"
                  description="Administrar roles y estado de los usuarios."
                  color="from-green-500/20 to-emerald-500/20"
                />
                <QuickActionCard
                  href="/admin/categories"
                  icon={Settings}
                  title="Gestionar Categorías"
                  description="Organizar productos en categorías y subcategorías."
                  color="from-yellow-500/20 to-orange-500/20"
                />
              </div>
            </div>

            {/* Resumen de actividad reciente */}
            <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8">
              <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3" />
                Actividad Reciente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-800/30 rounded-2xl backdrop-blur-sm">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-400 mb-1">Pedidos Completados</h3>
                  <p className="text-2xl font-black text-white">{stats?.completed_orders || 0}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-800/30 rounded-2xl backdrop-blur-sm">
                  <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-yellow-400 mb-1">Pedidos Pendientes</h3>
                  <p className="text-2xl font-black text-white">{stats?.pending_orders || 0}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-800/30 rounded-2xl backdrop-blur-sm">
                  <Eye className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-cyan-400 mb-1">Productos Totales</h3>
                  <p className="text-2xl font-black text-white">{stats?.total_products || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 