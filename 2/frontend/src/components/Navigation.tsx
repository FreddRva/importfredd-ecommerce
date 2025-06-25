'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, Menu, X, Settings, ChevronDown, LayoutDashboard, Package, Tag, Heart, Sparkles, Home, LogOut } from 'lucide-react';

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

  // Cerrar menú móvil al hacer click en un enlace
  const handleMobileLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-b border-white/20' 
        : 'bg-white/90 backdrop-blur-lg shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo - Mejorado para móvil */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                ImportFredd
              </span>
              <span className="text-xs font-semibold text-gray-500 tracking-wider hidden sm:block">PREMIUM STORE</span>
            </div>
          </Link>

          {/* Desktop Navigation - Mejorado */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link 
              href="/"
              className="relative px-4 py-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold group rounded-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Inicio
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link 
              href="/productos"
              className="relative px-4 py-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold group rounded-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Productos
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link 
              href="/favoritos"
              className="relative px-4 py-2 text-gray-700 hover:text-red-500 transition-all duration-300 font-semibold group rounded-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favoritos
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Right side icons - Mejorado */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Admin Button - Solo visible para administradores */}
            {isAuthenticated && isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl sm:rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold group"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="hidden sm:block">Admin</span>
                  <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
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

            {/* Cart Icon - Mejorado */}
            <Link href="/carrito" className="relative p-2 sm:p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 group">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center shadow-lg border-2 border-white font-bold animate-pulse">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu - Mejorado */}
            {isAuthenticated ? (
              <div className="relative group">
                <Link href="/mi-cuenta" className="flex items-center space-x-2 p-2 sm:p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold">
                  <div className="relative">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
                className="relative px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 group text-sm sm:text-base"
              >
                <span className="relative z-10">Iniciar Sesión</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </Link>
            )}

            {/* Mobile menu button - Mejorado */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 sm:p-3 text-gray-700 hover:text-blue-600 transition-all duration-300 group"
              aria-label="Toggle menu"
            >
              <div className="relative">
                {isMenuOpen ? <X className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-300" /> : <Menu className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-300" />}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Completamente rediseñado */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-white/20 animate-in slide-in-from-top-2 duration-300">
          <div className="px-4 pt-4 pb-6 space-y-1">
            {/* Navegación principal */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Navegación</h3>
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 font-semibold group"
                onClick={handleMobileLinkClick}
              >
                <Home className="w-5 h-5 text-blue-500" />
                Inicio
              </Link>
              <Link
                href="/productos"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 font-semibold group"
                onClick={handleMobileLinkClick}
              >
                <Package className="w-5 h-5 text-green-500" />
                Productos
              </Link>
              <Link
                href="/favoritos"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-300 font-semibold group"
                onClick={handleMobileLinkClick}
              >
                <Heart className="w-5 h-5 text-red-500" />
                Favoritos
              </Link>
              <Link
                href="/carrito"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 font-semibold group"
                onClick={handleMobileLinkClick}
              >
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                Carrito
                {itemCount > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Sección de usuario */}
            {isAuthenticated ? (
              <>
                {/* Admin Section - Solo visible para administradores */}
                {isAdmin && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Panel Admin</h3>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                      onClick={handleMobileLinkClick}
                    >
                      <LayoutDashboard size={18} className="text-blue-500" /> Dashboard
                    </Link>
                    <Link
                      href="/admin/products"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-xl transition-all duration-300 group"
                      onClick={handleMobileLinkClick}
                    >
                      <Package size={18} className="text-green-500" /> Productos
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all duration-300 group"
                      onClick={handleMobileLinkClick}
                    >
                      <User size={18} className="text-purple-500" /> Usuarios
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-xl transition-all duration-300 group"
                      onClick={handleMobileLinkClick}
                    >
                      <Tag size={18} className="text-orange-500" /> Categorías
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                      onClick={handleMobileLinkClick}
                    >
                      <Package size={18} className="text-indigo-500" /> Pedidos
                    </Link>
                  </div>
                )}

                {/* User Account */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Mi Cuenta</h3>
                  <Link
                    href="/mi-cuenta"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                    onClick={handleMobileLinkClick}
                  >
                    <User size={18} className="text-blue-500" /> Mi Cuenta
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      handleMobileLinkClick();
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-300 group"
                  >
                    <LogOut size={18} className="text-red-500" />
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Acceso</h3>
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                  onClick={handleMobileLinkClick}
                >
                  <User size={18} className="text-blue-500" />
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-xl transition-all duration-300 group"
                  onClick={handleMobileLinkClick}
                >
                  <User size={18} className="text-green-500" />
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 