'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, MailWarning, LoaderCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado. Por favor, revisa el enlace en tu correo.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Ocurrió un error inesperado.');
        }

        setStatus('success');
        setMessage('¡Tu correo ha sido verificado exitosamente! Ya puedes iniciar sesión.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'No se pudo verificar tu correo. El token puede ser inválido o haber expirado.');
      }
    };

    verifyToken();
  }, [token, router]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <LoaderCircle className="h-12 w-12 text-blue-500 animate-spin" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">{message}</h2>
          </>
        );
      case 'success':
        return (
          <>
            <MailCheck className="h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">¡Verificación Exitosa!</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Ir a Iniciar Sesión
            </Link>
          </>
        );
      case 'error':
        return (
          <>
            <MailWarning className="h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Error de Verificación</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a Registrarse
            </Link>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        {renderContent()}
      </div>
    </div>
  );
} 