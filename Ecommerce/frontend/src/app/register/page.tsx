'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, LogIn, Key, Shield, MessageSquareQuote, Info, Sparkles, CheckCircle, AlertCircle, Zap, Star, Fingerprint, Smartphone, Laptop, UserPlus, Rocket } from 'lucide-react';
import { requestVerificationCode, registerPasskey } from '@/lib/webauthn';
import { validateAndSanitizeEmail, validateAndSanitizeCode } from '@/lib/validation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Validar email en tiempo real
    if (value) {
      const validation = validateAndSanitizeEmail(value);
      setEmailError(validation.error || '');
    } else {
      setEmailError('');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    
    // Validar código en tiempo real
    if (value) {
      const validation = validateAndSanitizeCode(value);
      setCodeError(validation.error || '');
    } else {
      setCodeError('');
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDebugCode(null);

    // Validar email antes de enviar
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Email inválido');
      setLoading(false);
      return;
    }

    try {
      const result = await requestVerificationCode(emailValidation.sanitized);
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

    // Validar código antes de enviar
    const codeValidation = validateAndSanitizeCode(code);
    if (!codeValidation.isValid) {
      setError(codeValidation.error || 'Código inválido');
      setLoading(false);
      return;
    }

    try {
      const result = await registerPasskey(email, codeValidation.sanitized);
      setSuccess(result || '¡Registro completado! Tu Passkey ha sido configurada. Ya puedes iniciar sesión.');
      setStep('success');
    } catch (error: any) {
      setError(error.message || 'Error en el registro con Passkey.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleRequestCode} className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <label htmlFor="email" className="block text-sm font-bold text-fuchsia-200">
          Correo electrónico
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className={`relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg ${
            emailError 
              ? 'border-red-400/50 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/20' 
              : 'border-fuchsia-800/30 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20'
          }`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className={`h-5 w-5 transition-colors duration-300 ${
                emailError ? 'text-red-400' : 'text-fuchsia-400 group-hover:text-green-400'
              }`} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 sm:text-sm bg-transparent"
              placeholder="tu@email.com"
            />
          </div>
          {emailError && (
            <div className="mt-2 text-sm text-red-400 animate-fade-in">
              {emailError}
            </div>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-5 px-6 border border-transparent text-lg font-black rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-glow border-2 border-green-400/30"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            <span>Enviando código...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span>Enviar Código de Verificación</span>
            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        )}
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-green-900/40 to-fuchsia-900/40 border border-green-800/30 rounded-2xl p-6 animate-scale-in backdrop-blur-sm">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-400">¡Código enviado!</h3>
            <p className="text-sm text-fuchsia-200">Revisa tu correo electrónico</p>
          </div>
        </div>
        <p className="text-center text-sm text-fuchsia-200 font-medium">
          Se ha enviado un código a <strong className="text-green-400">{email}</strong>.
        </p>
      </div>
      
      <div className="space-y-3">
        <label htmlFor="code" className="block text-sm font-bold text-fuchsia-200">
          Código de Verificación
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className={`relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border transition-all duration-300 group-hover:bg-slate-900/80 group-hover:shadow-lg ${
            codeError 
              ? 'border-red-400/50 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/20' 
              : 'border-fuchsia-800/30 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20'
          }`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MessageSquareQuote className={`h-5 w-5 transition-colors duration-300 ${
                codeError ? 'text-red-400' : 'text-fuchsia-400 group-hover:text-green-400'
              }`} />
            </div>
            <input
              id="code"
              name="code"
              type="text"
              maxLength={6}
              required
              value={code}
              onChange={handleCodeChange}
              className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl text-white placeholder-fuchsia-300/50 focus:ring-0 sm:text-sm bg-transparent text-center text-2xl font-bold tracking-widest"
              placeholder="_ _ _ _ _ _"
            />
          </div>
          {codeError && (
            <div className="mt-2 text-sm text-red-400 animate-fade-in">
              {codeError}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-900/40 to-fuchsia-900/40 border border-green-800/30 rounded-2xl p-6 animate-fade-in backdrop-blur-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-bold text-green-400 mb-2">
              Siguiente Paso: Configurar Passkey
            </h3>
            <p className="text-sm text-fuchsia-200 leading-relaxed">
              Después de verificar el código, configurarás tu dispositivo (huella, PIN, etc.) para accesos futuros sin contraseña.
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
      
      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-5 px-6 border border-transparent text-lg font-black rounded-2xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-glow border-2 border-green-400/30"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            <span>Verificando y Registrando...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span>Verificar y Crear Passkey</span>
            <Key className="ml-3 h-6 w-6" />
          </div>
        )}
      </button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30 shadow-lg">
        <CheckCircle className="w-12 h-12 text-green-400" />
      </div>
      
      <h3 className="text-3xl font-black bg-gradient-to-r from-green-400 via-fuchsia-400 to-yellow-400 bg-clip-text text-transparent">
        ¡Cuenta Creada Exitosamente!
      </h3>
      
      <p className="text-fuchsia-200 text-lg leading-relaxed">
        Tu cuenta en <span className="text-yellow-400 font-bold">ImportFredd</span> ha sido creada y tu Passkey configurada. Ya puedes acceder de forma segura.
      </p>
      
      <div className="bg-gradient-to-r from-green-900/40 to-fuchsia-900/40 border border-green-800/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Rocket className="w-6 h-6 text-green-400" />
          <span className="text-green-400 font-bold">¡Bienvenido a ImportFredd!</span>
        </div>
        <p className="text-fuchsia-200 text-sm">
          Explora nuestra colección premium y disfruta de una experiencia de compra única.
        </p>
      </div>
      
      <Link
        href="/login"
        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 font-black rounded-2xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30"
      >
        <LogIn className="mr-3 h-6 w-6" />
        Ir al Login
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-900 relative overflow-hidden text-white">
      {/* Floating Icons Decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-green-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-fuchsia-400/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-emerald-400/15 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-green-400/25 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-fuchsia-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-emerald-400/30 rounded-full animate-float-delayed"></div>
      </div>

      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen pt-40">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          {/* Header Premium */}
          <div className="text-center animate-slide-in-left">
            <div className="relative mx-auto h-24 w-24 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-fuchsia-500 rounded-full animate-pulse shadow-2xl"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-fuchsia-900 rounded-full flex items-center justify-center shadow-2xl border border-green-400/30">
                <span className="text-white font-black text-3xl bg-gradient-to-r from-green-400 via-emerald-400 to-fuchsia-400 bg-clip-text text-transparent">IF</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-fuchsia-400 bg-clip-text text-transparent mb-4 tracking-tight">
              Únete a ImportFredd
            </h2>
            <p className="text-xl text-fuchsia-200 font-medium mb-2">
              Crea tu cuenta de forma segura
            </p>
            <p className="text-fuchsia-300 text-sm">
              Acceso sin contraseñas con tecnología Passkey
            </p>
          </div>

          {/* Register Form Premium */}
          <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-800/30 p-8 animate-scale-in">
            {error && (
              <div className="bg-gradient-to-r from-red-900/50 to-fuchsia-900/50 border border-red-400/30 text-red-200 px-6 py-4 rounded-2xl text-sm animate-fade-in backdrop-blur-sm mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-bold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-gradient-to-r from-green-900/50 to-fuchsia-900/50 border border-green-400/30 text-green-200 px-6 py-4 rounded-2xl text-sm animate-fade-in backdrop-blur-sm mb-6">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-bold">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 'email' && renderEmailStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'success' && renderSuccessStep()}
          </div>

          {/* Login Link Premium */}
          {step !== 'success' && (
            <div className="text-center space-y-4 animate-slide-in-right">
              <div className="bg-gradient-to-br from-slate-900/60 via-indigo-950/60 to-fuchsia-900/60 backdrop-blur-xl rounded-2xl p-6 border border-fuchsia-800/30 shadow-xl">
                <p className="text-fuchsia-200 font-medium mb-4">
                  ¿Ya tienes una cuenta en <span className="text-yellow-400 font-bold">ImportFredd</span>?
                </p>
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-yellow-400 text-slate-900 font-black rounded-2xl hover:from-yellow-400 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-fuchsia-400/30"
                >
                  <LogIn className="mr-3 h-6 w-6" />
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-fuchsia-900/95 rounded-3xl p-8 shadow-2xl border border-fuchsia-800/30 max-w-md w-full mx-4 animate-scale-in relative overflow-hidden">
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30 shadow-lg">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              
              <h3 className="text-2xl font-black bg-gradient-to-r from-green-400 via-fuchsia-400 to-yellow-400 bg-clip-text text-transparent mb-4">
                ¡Registro Exitoso!
              </h3>
              
              <p className="text-fuchsia-200 mb-8 text-lg leading-relaxed">
                Tu cuenta ha sido creada exitosamente. Ya puedes acceder con tu Passkey.
              </p>
              
              <button
                onClick={() => setShowAlert(false)}
                className="px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300"
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
