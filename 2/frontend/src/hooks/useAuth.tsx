'use client';

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api'; // Importamos el fetcher

interface User {
  id: number;
  email: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (accessToken: string, refreshTokenValue: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  console.log("DEBUG: AuthProvider montado", { user, isLoading, token });

  const clearSession = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
        try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            if (Date.now() < payload.exp * 1000) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } else {
                 // El token de acceso ha expirado, no hacemos nada aquí.
                 // fetchWithAuth se encargará de refrescarlo cuando sea necesario.
                 // Podríamos limpiar solo el access token si quisiéramos ser proactivos.
                 localStorage.removeItem('accessToken');
            }
        } catch(e) {
            console.error("Error al validar token inicial", e);
            clearSession();
        }
    }
    setIsLoading(false);
  }, [clearSession]);

  const login = useCallback(
    (accessToken: string, refreshTokenValue: string, userData: any) => {
      // Normalizamos el usuario para que coincida con la interfaz del frontend
      const normalizedUser: User = {
        id: userData.id,
        email: userData.email,
        isAdmin: userData.is_admin, // Mapeamos is_admin a isAdmin
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshTokenValue);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setToken(accessToken);
      setUser(normalizedUser);
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !isLoading && !!user && !!token,
    isAdmin: user?.isAdmin || false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};