'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserPlus, Key, Shield, Sparkles, Zap, CheckCircle, AlertCircle, X, Fingerprint, Smartphone, Laptop } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginPasskey } from '@/lib/webauthn';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      setLoading(false);
    }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 relative overflow-hidden text-white">
      {/* Floating Icons Decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-fuchsia-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-yellow-400/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-cyan-400/15 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-fuchsia-400/25 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-yellow-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-cyan-400/30 rounded-full animate-float-delayed"></div>
      </div>

      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen pt-40">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          {/* Header Premium */}
          <div className="text-center animate-slide-in-left">
            <div className="relative mx-auto h-24 w-24 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-yellow-500 to-cyan-500 rounded-full animate-pulse shadow-2xl"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-fuchsia-900 rounded-full flex items-center justify-center shadow-2xl border border-fuchsia-400/30">
                <span className="text-white font-black text-3xl bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">IF</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-fuchsia-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4 tracking-tight">
              Bienvenido de Vuelta
            </h2>
            <p className="text-xl text-fuchsia-200 font-medium mb-2">
              Accede a tu cuenta de forma segura
            </p>
            <p className="text-fuchsia-300 text-sm">
              Usa tu Passkey para un acceso sin contraseñas
            </p>
          </div>

          {/* Login Form Premium */}
          <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-red-900/50 to-fuchsia-900/50 border border-red-400/30 text-red-200 px-6 py-4 rounded-2xl text-sm animate-fade-in backdrop-blur-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{error}</p>
                      {showResend && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="mt-2 text-sm font-bold text-fuchsia-300 underline hover:text-yellow-400 transition-colors duration-200"
                        >
                          Reenviar correo de verificación
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Field Premium */}
              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-bold text-fuchsia-200">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-fuchsia-800/30 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-fuchsia-400 group-hover:text-yellow-400 transition-colors duration-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 sm:text-sm bg-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Passkey Info Premium */}
              <div className="bg-gradient-to-r from-fuchsia-900/40 to-indigo-900/40 border border-fuchsia-800/30 rounded-2xl p-6 animate-fade-in backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Fingerprint className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">
                      Acceso con Passkey
                    </h3>
                    <p className="text-sm text-fuchsia-200 leading-relaxed">
                      Después de ingresar tu email, usa tu huella, PIN o dispositivo de seguridad para acceder de forma instantánea.
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-xs text-fuchsia-300">
                        <Smartphone className="w-4 h-4" />
                        <span>Móvil</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-fuchsia-300">
                        <Laptop className="w-4 h-4" />
                        <span>PC</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button Premium */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-5 px-6 border border-transparent text-lg font-black rounded-2xl text-slate-900 bg-gradient-to-r from-fuchsia-600 to-yellow-400 hover:from-yellow-400 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-glow border-2 border-fuchsia-400/30"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mr-3"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Acceder con Passkey</span>
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Sign Up Link Premium */}
          <div className="text-center space-y-4 animate-slide-in-right">
            <div className="bg-gradient-to-br from-slate-900/60 via-indigo-950/60 to-fuchsia-900/60 backdrop-blur-xl rounded-2xl p-6 border border-fuchsia-800/30 shadow-xl">
              <p className="text-fuchsia-200 font-medium mb-4">
                ¿No tienes una cuenta en <span className="text-yellow-400 font-bold">ImportFredd</span>?
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black rounded-2xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-green-400/30"
              >
                <UserPlus className="mr-3 h-6 w-6" />
                Crear Cuenta Gratis
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900/60 via-indigo-950/60 to-fuchsia-900/60 backdrop-blur-xl rounded-2xl p-6 border border-fuchsia-800/30 shadow-xl">
              <p className="text-fuchsia-200 font-medium mb-4">
                ¿Necesitas ayuda para acceder?
              </p>
              <Link
                href="/recuperar"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-800/60 to-indigo-900/60 text-fuchsia-200 font-bold rounded-xl hover:from-slate-700/60 hover:to-indigo-800/60 transition-all duration-300 border border-fuchsia-800/30"
              >
                <Key className="mr-2 h-5 w-5" />
                Recuperar Acceso
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-fuchsia-900/95 rounded-3xl p-8 shadow-2xl border border-fuchsia-800/30 max-w-md w-full mx-4 animate-scale-in relative overflow-hidden">
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-400/30 shadow-lg">
                <CheckCircle className="w-10 h-10 text-yellow-400" />
              </div>
              
              <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                ¡Código Enviado!
              </h3>
              
              <p className="text-fuchsia-200 mb-8 text-lg leading-relaxed">
                Se ha enviado un nuevo código de verificación a tu correo electrónico. Revisa tu bandeja de entrada.
              </p>
              
              <button
                onClick={() => setShowAlert(false)}
                className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 shadow-lg hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}