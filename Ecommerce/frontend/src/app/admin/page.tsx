'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Package, Users, BarChart2, DollarSign, LogOut, ArrowLeft } from 'lucide-react'
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

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-4 hover:shadow-xl hover:scale-[1.02] transition-all">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
)

const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => (
    <Link href={href} className="flex items-center gap-4 text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors">
        <Icon size={20} />
        <span className="font-medium">{children}</span>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user?.isAdmin) {
    return <div className="p-8 text-center text-red-500">Acceso denegado.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Barra lateral */}
        <aside className="w-64 bg-white p-6 border-r border-gray-200 h-screen sticky top-0 flex-col justify-between hidden lg:flex">
            <div>
                <div className="text-2xl font-bold text-gray-900 mb-10">Admin Panel</div>
                <nav className="space-y-2">
                    <NavLink href="/admin" icon={LayoutDashboard}>Dashboard</NavLink>
                    <NavLink href="/admin/products" icon={Package}>Productos</NavLink>
                    <NavLink href="/admin/users" icon={Users}>Usuarios</NavLink>
                    <NavLink href="/admin/categories" icon={Users}>Categorías</NavLink>
                </nav>
            </div>
            <div className="space-y-2">
                <Link href="/" className="flex items-center gap-4 text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors">
                    <ArrowLeft size={20}/>
                    <span className="font-medium">Volver a la Tienda</span>
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-4 text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Bienvenido, {user?.email}. Aquí tienes un resumen de tu tienda.</p>
                </div>
                
                {/* Estadísticas */}
                {error && <p className="text-red-500">{error}</p>}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Ingresos Totales" value={`$${stats.total_revenue.toFixed(2)}`} icon={DollarSign} />
                        <StatCard title="Pedidos Totales" value={stats.total_orders} icon={BarChart2} />
                        <StatCard title="Productos Totales" value={stats.total_products} icon={Package} />
                    </div>
                )}

                {/* Accesos directos */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/products" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
                        <Package className="h-8 w-8 text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Gestionar Productos</h3>
                        <p className="text-gray-500 mt-2">Añadir, editar y eliminar productos.</p>
                    </Link>
                     <Link href="/admin/users" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
                        <Users className="h-8 w-8 text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Gestionar Usuarios</h3>
                        <p className="text-gray-500 mt-2">Administrar roles y estado de los usuarios.</p>
                    </Link>
                    <Link href="/admin/categories" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
                        <Users className="h-8 w-8 text-blue-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Gestionar Categorías</h3>
                        <p className="text-gray-500 mt-2">Añadir, editar y eliminar categorías.</p>
                    </Link>
                </div>
            </div>
        </main>
      </div>
    </div>
  )
} 