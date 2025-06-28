'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface AuthDebugProps {
  enabled?: boolean;
}

export default function AuthDebug({ enabled }: AuthDebugProps) {
  const { user, token, isLoading, isAuthenticated, isAdmin } = useAuth();
  const [mountCount, setMountCount] = useState(0);

  useEffect(() => {
    setMountCount(prev => prev + 1);
  }, []);

  // Usar la variable de entorno o la prop enabled
  const shouldShow = enabled !== undefined ? enabled : process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';

  if (!shouldShow || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">🔐 Auth Debug</div>
      <div>Mounts: {mountCount}</div>
      <div>Loading: {isLoading ? '✅' : '❌'}</div>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>Admin: {isAdmin ? '✅' : '❌'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Token: {token ? 'present' : 'null'}</div>
      <div className="text-xs text-gray-400 mt-2">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
} 