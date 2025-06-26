'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, LogIn, Key, Shield, MessageSquareQuote, Info, Sparkles, CheckCircle, AlertCircle, Zap, Star } from 'lucide-react';
import { requestVerificationCode, registerPasskey } from '@/lib/webauthn';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDebugCode(null);

    try {
      const result = await requestVerificationCode(email);
      setSuccess(result.message);
      setStep('code');
    } catch (error: any) {
      setError(error.message || 'Error al solicitar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await registerPasskey(email, code);
      setSuccess(result || '¡Registro completado! Tu Passkey ha sido configurada. Ya puedes iniciar sesión.');
      setStep('success');
    } catch (error: any) {
      setError(error.message || 'Error en el registro con Passkey.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleRequestCode} className="space-y-6 animate-fade-in-premium">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-slate-700">
          Correo electrónico
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all duration-300 group-hover:bg-white/90 group-hover:shadow-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
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
      
      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-green-500 via-emerald-600 to-blue-600 hover:from-green-600 hover:via-emerald-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ripple-effect"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            <span>Enviando...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span>Enviar Código de Verificación</span>
            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        )}
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-fade-in-premium">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 animate-scale-in-premium">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-900">Código enviado</h3>
            <p className="text-sm text-green-700">Revisa tu correo electrónico</p>
          </div>
        </div>
        <p className="text-center text-sm text-slate-700 font-medium">
          Se ha enviado un código a <strong className="text-green-800">{email}</strong>.
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-bold text-slate-700">
          Código de Verificación
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all duration-300 group-hover:bg-white/90 group-hover:shadow-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MessageSquareQuote className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
            </div>
            <input
              id="code"
              name="code"
              type="text"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-slate-900 placeholder-gray-400 focus:ring-0 sm:text-sm bg-transparent text-center text-2xl font-bold tracking-widest"
              placeholder="_ _ _ _ _ _"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 animate-fade-in-premium">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-bold text-green-900 mb-2">
              Siguiente Paso: Passkey
            </h3>
            <p className="text-sm text-green-700 leading-relaxed">
              Después de verificar el código, configurarás tu dispositivo (huella, PIN, etc.) para accesos futuros sin contraseña.
            </p>
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-green-500 via-emerald-600 to-blue-600 hover:from-green-600 hover:via-emerald-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ripple-effect"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            <span>Verificando y Registrando...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span>Verificar y Crear Passkey</span>
            <Key className="ml-3 h-5 w-5" />
          </div>
        )}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 relative overflow-hidden">
      {/* Partículas animadas de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-green-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400/50 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-emerald-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-teal-400/40 rounded-full animate-ping animation-delay-200"></div>
      </div>

      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen pt-40">
        <div className="max-w-md w-full space-y-8 animate-fade-in-premium">
          {/* Header Premium */}
          <div className="text-center animate-slide-in-left-premium">
            <div className="relative mx-auto h-20 w-20 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 rounded-full animate-pulse-premium"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-2xl">IF</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-slate-900 via-green-800 to-blue-800 bg-clip-text text-transparent">
              {step === 'email' && 'Crear Cuenta'}
              {step === 'code' && 'Verificar Correo'}
              {step === 'success' && '¡Registro Completo!'}
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              {step === 'success' ? success : 'Regístrate de forma segura con Passkeys y verificación por correo.'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 animate-fade-in-premium">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-all duration-300 ${
                step === 'email' ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg' : 
                step === 'code' || step === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg' : 
                'bg-white border-gray-300 text-gray-500'
              }`}>
                {step === 'email' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <div className={`w-16 h-1 rounded-full transition-all duration-300 ${
                step === 'code' || step === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-all duration-300 ${
                step === 'code' ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg' : 
                step === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg' : 
                'bg-white border-gray-300 text-gray-500'
              }`}>
                {step === 'success' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
            </div>
          </div>

          {/* Form Container Premium */}
          <div className="glass-premium rounded-3xl shadow-2xl border border-white/50 p-8 animate-scale-in-premium">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm mb-6 animate-fade-in-premium">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && step !== 'success' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl text-sm mb-6 animate-fade-in-premium">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 'email' && renderEmailStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'success' && (
              <div className="text-center animate-fade-in-premium">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse-premium">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">¡Registro Exitoso!</h3>
                  <p className="text-slate-600">Tu cuenta ha sido creada y tu Passkey configurada correctamente.</p>
                </div>
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  <LogIn className="mr-3 h-5 w-5" />
                  Ir a Iniciar Sesión
                </Link>
              </div>
            )}
          </div>

          {/* Login Link Premium */}
          {step !== 'success' && (
            <div className="text-center animate-slide-in-right-premium">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <p className="text-slate-700 font-medium mb-3">
                  ¿Ya tienes una cuenta?
                </p>
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Inicia sesión aquí
                </Link>
              </div>
            </div>
          )}

          {/* Footer Premium */}
          <div className="text-center animate-fade-in-premium">
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
              <p className="text-xs text-slate-600 font-medium">
                Al registrarte, aceptas nuestros{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-bold underline">Términos de Servicio</a>
                {' '}y{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-bold underline">Política de Privacidad</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
