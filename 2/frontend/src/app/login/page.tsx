'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserPlus, Key } from 'lucide-react';
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
      console.log('Resultado del login:', result);
      console.log('Token recibido:', result.access_token ? result.access_token.substring(0, 20) + '...' : 'no existe');
      console.log('User recibido:', result.user);
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">IF</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600">
            Usa tu Passkey para acceder de forma segura
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p>{error}</p>
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="mt-2 text-sm font-medium text-red-800 underline hover:text-red-900"
                  >
                    Reenviar correo de verificación
                  </button>
                )}
              </div>
            )}

            {/* Email Field SOLO si es necesario para Passkey */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Passkey Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Key className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    Inicio de sesión con Passkey
                  </h3>
                  <p className="text-sm text-blue-700">
                    Después de ingresar tu email, se te pedirá que uses tu dispositivo de seguridad (huella, PIN, o llave física).
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center">
                  Iniciar Sesión con Passkey
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link 
              href="/register" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors inline-flex items-center"
            >
              Regístrate aquí
              <UserPlus className="ml-1 h-4 w-4" />
            </Link>
          </p>
          <p className="text-gray-600 mt-2">
            ¿Olvidaste tu acceso?{' '}
            <Link
              href="/recuperar"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors inline-flex items-center"
            >
              Recuperar Passkey
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Al continuar, aceptas nuestros{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Términos de Servicio</a>
            {' '}y{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  );
}