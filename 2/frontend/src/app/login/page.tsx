'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserPlus, Key, Shield, Sparkles, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginPasskey } from '@/lib/webauthn';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleResendVerification = async () => {
    // Lógica para reenviar el correo (a implementar en el futuro)
    setLoading(true);
    setError('');
    alert('Funcionalidad de reenvío de correo aún no implementada.');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResend(false);

    try {
      const result = await loginPasskey(email);
      
      if (result.access_token && result.refresh_token && result.user) {
        console.log('Guardando token en contexto...');
        login(result.access_token, result.refresh_token, result.user);
        console.log('Token guardado. Redirigiendo...');
        
        // Esperar un poco para que el contexto se actualice
        setTimeout(() => {
          router.push('/');
        }, 100);
      } else {
        throw new Error('Respuesta de login inválida del servidor');
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Error en el login';
      setError(errorMessage);
      if (errorMessage.includes('verifica tu email')) {
        setShowResend(true);
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Partículas animadas de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400/50 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-indigo-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-violet-400/40 rounded-full animate-ping animation-delay-200"></div>
      </div>

      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-md w-full space-y-8 animate-fade-in-premium">
          {/* Header Premium */}
          <div className="text-center animate-slide-in-left-premium">
            <div className="relative mx-auto h-20 w-20 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-full animate-pulse-premium"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-2xl">IF</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent">
              Iniciar Sesión
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Usa tu Passkey para acceder de forma segura
            </p>
          </div>

          {/* Login Form Premium */}
          <div className="glass-premium rounded-3xl shadow-2xl border border-white/50 p-8 animate-scale-in-premium">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm animate-fade-in-premium">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{error}</p>
                      {showResend && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="mt-2 text-sm font-bold text-red-800 underline hover:text-red-900 transition-colors duration-200"
                        >
                          Reenviar correo de verificación
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field Premium */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all duration-300 group-hover:bg-white/90 group-hover:shadow-lg">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-slate-900 placeholder-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Passkey Info Premium */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 animate-fade-in-premium">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Key className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-2">
                      Inicio de sesión con Passkey
                    </h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Después de ingresar tu email, se te pedirá que uses tu dispositivo de seguridad (huella, PIN, o llave física).
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button Premium */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ripple-effect"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Iniciar Sesión con Passkey</span>
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Sign Up Link Premium */}
          <div className="text-center space-y-4 animate-slide-in-right-premium">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <p className="text-slate-700 font-medium mb-3">
                ¿No tienes una cuenta?
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Regístrate aquí
              </Link>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <p className="text-slate-700 font-medium mb-3">
                ¿Olvidaste tu acceso?
              </p>
              <Link
                href="/recuperar"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Shield className="mr-2 h-5 w-5" />
                Recuperar Passkey
              </Link>
            </div>
          </div>

          {/* Footer Premium */}
          <div className="text-center animate-fade-in-premium">
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
              <p className="text-xs text-slate-600 font-medium">
                Al continuar, aceptas nuestros{' '}
                <a href="#" className="text-purple-600 hover:text-purple-500 font-bold underline">Términos de Servicio</a>
                {' '}y{' '}
                <a href="#" className="text-purple-600 hover:text-purple-500 font-bold underline">Política de Privacidad</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}