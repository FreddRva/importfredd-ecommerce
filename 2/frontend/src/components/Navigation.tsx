'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, Menu, X, Search, Settings, ChevronDown, LayoutDashboard, Package, Tag, Heart, Sparkles } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adminMenuRef]);

  // Log para debug
  console.log('Navigation - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'user:', user);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-xl shadow-2xl border-b border-white/20' 
        : 'bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                ImportFredd
              </span>
              <span className="text-xs font-semibold text-gray-500 tracking-wider">PREMIUM STORE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/"
              className="relative px-4 py-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold group"
            >
              <span className="relative z-10">Inicio</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link 
              href="/productos"
              className="relative px-4 py-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold group"
            >
              <span className="relative z-10">Productos</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link 
              href="/favoritos"
              className="relative px-4 py-2 text-gray-700 hover:text-red-500 transition-all duration-300 font-semibold group"
            >
              <span className="relative z-10">Favoritos</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <span className="absolute left-4 flex items-center pointer-events-none">
                  <Search className="text-blue-500 w-5 h-5 group-hover:text-purple-500 transition-colors duration-300" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar productos premium..."
                  className="w-full pl-12 pr-4 py-3 h-12 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 backdrop-blur-sm shadow-lg placeholder-gray-400 font-medium transition-all duration-300 group-hover:bg-white/90 group-hover:shadow-xl"
                />
              </div>
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-3">
            {/* Debug indicator - Temporal */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1 text-xs">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></span>
                <span className="text-gray-500 font-semibold">{isAdmin ? 'Admin' : 'User'}</span>
              </div>
            )}

            {/* Admin Button - Solo visible para administradores */}
            {isAuthenticated && isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="hidden sm:block">Admin</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 origin-top-right bg-white/95 backdrop-blur-xl divide-y divide-gray-100/50 rounded-2xl shadow-2xl ring-1 ring-black/5 focus:outline-none animate-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      <Link href="/admin" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-200 group">
                        <LayoutDashboard size={18} className="text-blue-500 group-hover:text-blue-600" /> Dashboard
                      </Link>
                      <Link href="/admin/products" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-200 group">
                        <Package size={18} className="text-green-500 group-hover:text-green-600" /> Productos
                      </Link>
                      <Link href="/admin/users" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-200 group">
                        <User size={18} className="text-purple-500 group-hover:text-purple-600" /> Usuarios
                      </Link>
                      <Link href="/admin/categories" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-200 group">
                        <Tag size={18} className="text-orange-500 group-hover:text-orange-600" /> Categorías
                      </Link>
                      <Link href="/admin/orders" onClick={() => setIsAdminMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-200 group">
                        <Package size={18} className="text-indigo-500 group-hover:text-indigo-600" /> Pedidos
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Icon */}
            <Link href="/carrito" className="relative p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 group">
              <div className="relative">
                <ShoppingCart className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-white font-bold animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <Link href="/mi-cuenta" className="flex items-center space-x-2 p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
                  </div>
                  <span className="hidden sm:block text-sm font-semibold">
                    {user?.email?.split('@')[0]}
                  </span>
                </Link>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 group"
              >
                <span className="relative z-10">Iniciar Sesión</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 group"
            >
              <div className="relative">
                {isMenuOpen ? <X className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" /> : <Menu className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden mb-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              <span className="absolute left-4 flex items-center pointer-events-none">
                <Search className="text-blue-500 w-5 h-5 group-hover:text-purple-500 transition-colors duration-300" />
              </span>
              <input
                type="text"
                placeholder="Buscar productos premium..."
                className="w-full pl-12 pr-4 py-3 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 backdrop-blur-sm shadow-lg placeholder-gray-400 font-medium transition-all duration-300 group-hover:bg-white/90 group-hover:shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-white/20 animate-in slide-in-from-top-2 duration-300">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 font-semibold group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              Inicio
            </Link>
            <Link
              href="/productos"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 font-semibold group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              Productos
            </Link>
            <Link
              href="/favoritos"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-2xl transition-all duration-300 font-semibold group"
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart className="w-5 h-5 text-red-400" />
              Favoritos
            </Link>
            <Link
              href="/carrito"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 font-semibold group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              Carrito
            </Link>
            {isAuthenticated ? (
              <>
                {/* Admin Link - Solo visible para administradores */}
                {isAdmin && (
                  <>
                    <div className="px-4 pt-6 pb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Panel Admin</p>
                    </div>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-blue-500" /> Dashboard
                    </Link>
                    <Link
                      href="/admin/products"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-2xl transition-all duration-300 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Package size={18} className="text-green-500" /> Productos
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-2xl transition-all duration-300 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={18} className="text-purple-500" /> Usuarios
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-2xl transition-all duration-300 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Tag size={18} className="text-orange-500" /> Categorías
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Package size={18} className="text-indigo-500" /> Pedidos
                    </Link>
                    <div className="border-t border-gray-200/50 my-4"></div>
                  </>
                )}
                <Link
                  href="/mi-cuenta"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={18} className="text-blue-500" /> Mi Cuenta
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-2xl transition-all duration-300 group"
                >
                  <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 