'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, LogIn, Key, Shield, MessageSquareQuote, Info } from 'lucide-react';
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
      if (result.debug_code) {
        setDebugCode(result.debug_code);
        setCode(result.debug_code); // Autorellenar el campo para conveniencia
      }
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
    <form onSubmit={handleRequestCode} className="space-y-6">
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
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            placeholder="tu@email.com"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
      >
        {loading ? 'Enviando...' : 'Enviar Código de Verificación'}
        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyAndRegister} className="space-y-6">
       <p className="text-center text-sm text-gray-600">
         Se ha enviado un código a <strong>{email}</strong>.
       </p>
       <div>
         <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
           Código de Verificación
         </label>
         <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <MessageSquareQuote className="h-5 w-5 text-gray-400" />
           </div>
           <input
             id="code"
             name="code"
             type="text"
             maxLength={6}
             required
             value={code}
             onChange={(e) => setCode(e.target.value)}
             className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
             placeholder="_ _ _ _ _ _"
           />
         </div>
       </div>
       <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
         <div className="flex items-start">
           <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
           <div>
             <h3 className="text-sm font-medium text-green-900 mb-1">
               Siguiente Paso: Passkey
             </h3>
             <p className="text-sm text-green-700">
               Después de verificar el código, configurarás tu dispositivo (huella, PIN, etc.) para accesos futuros sin contraseña.
             </p>
           </div>
         </div>
       </div>
       <button
         type="submit"
         disabled={loading}
         className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
       >
         {loading ? 'Verificando y Registrando...' : 'Verificar y Crear Passkey'}
         <Key className="ml-2 h-4 w-4" />
       </button>
     </form>
  );

  const renderDebugBox = () => (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-6 rounded-r-lg" role="alert">
      <div className="flex">
        <div className="py-1"><Info className="h-5 w-5 mr-3"/></div>
        <div>
          <p className="font-bold">Modo de Demostración</p>
          <p className="text-sm">
            La cuenta de envío de correos es de prueba. En un entorno de producción, este código llegaría a tu email.
          </p>
          <p className="text-sm mt-2">
            Tu código de verificación es: <strong className="text-lg font-mono">{debugCode}</strong>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">IF</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'email' && 'Crear Cuenta'}
            {step === 'code' && 'Verificar Correo'}
            {step === 'success' && '¡Registro Completo!'}
          </h2>
          <p className="text-gray-600">
            {step === 'success' ? success : 'Regístrate de forma segura con Passkeys y verificación por correo.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {debugCode && step === 'code' && renderDebugBox()}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          {success && step !== 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'success' && (
            <div className="text-center">
               <Link 
                href="/login" 
                className="font-medium text-green-600 hover:text-green-500 transition-colors inline-flex items-center text-lg"
              >
                Ir a Iniciar Sesión
                <LogIn className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <div className="text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href="/login" 
                className="font-medium text-green-600 hover:text-green-500 transition-colors inline-flex items-center"
              >
                Inicia sesión aquí
                <LogIn className="ml-1 h-4 w-4" />
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
