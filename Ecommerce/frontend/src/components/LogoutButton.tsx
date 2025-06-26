'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = "", children }: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    // 🧹 Limpiar JWT y datos del usuario
    logout();
    
    // 🔁 Redirigir al login
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors ${className}`}
    >
      {children || 'Cerrar Sesión'}
    </button>
  );
} 