'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/api';

export interface Notification {
  id: number;
  user_id: number;
  type: 'order' | 'payment' | 'stock' | 'security' | 'admin';
  title: string;
  message: string;
  data: string;
  is_read: boolean;
  is_admin: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  expires_at?: string;
  read_at?: string;
}

export interface NotificationPreference {
  user_id: number;
  type: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  adminUnreadCount: number;
  preferences: NotificationPreference[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchAdminNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchAdminUnreadCount: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreference: (type: string, emailEnabled: boolean, pushEnabled: boolean, inAppEnabled: boolean) => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchNotifications = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        setError('Error al cargar notificaciones');
      }
    } catch (err) {
      setError('Error de red al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminNotifications = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        setError('Error al cargar notificaciones de administrador');
      }
    } catch (err) {
      setError('Error de red al cargar notificaciones de administrador');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError('Error al marcar notificación como leída');
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        // Forzar actualización real del contador desde el backend
        fetchUnreadCount();
      }
    } catch (err) {
      setError('Error al marcar todas las notificaciones como leídas');
    }
  };

  const deleteNotification = async (id: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        // Forzar actualización real del contador desde el backend
        fetchUnreadCount();
      }
    } catch (err) {
      setError('Error al eliminar notificación');
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error al obtener conteo de notificaciones no leídas:', err);
    }
  };

  const fetchAdminUnreadCount = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error al obtener conteo de notificaciones admin no leídas:', err);
    }
  };

  const fetchPreferences = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      }
    } catch (err) {
      console.error('Error al obtener preferencias de notificación:', err);
    }
  };

  const updatePreference = async (
    type: string, 
    emailEnabled: boolean, 
    pushEnabled: boolean, 
    inAppEnabled: boolean
  ) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          email_enabled: emailEnabled,
          push_enabled: pushEnabled,
          in_app_enabled: inAppEnabled,
        }),
      });
      
      if (response.ok) {
        // Actualizar preferencias localmente
        setPreferences(prev => {
          const existing = prev.find(p => p.type === type);
          if (existing) {
            return prev.map(p => 
              p.type === type 
                ? { ...p, email_enabled: emailEnabled, push_enabled: pushEnabled, in_app_enabled: inAppEnabled }
                : p
            );
          } else {
            return [...prev, {
              user_id: user?.id || 0,
              type,
              email_enabled: emailEnabled,
              push_enabled: pushEnabled,
              in_app_enabled: inAppEnabled,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }];
          }
        });
      }
    } catch (err) {
      setError('Error al actualizar preferencias');
    }
  };

  // Cargar datos iniciales cuando el usuario se autentica
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      fetchUnreadCount();
      fetchPreferences();
      
      // Si es admin, cargar también las notificaciones admin
      if (user.isAdmin) {
        fetchAdminUnreadCount();
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setAdminUnreadCount(0);
      setPreferences([]);
    }
  }, [user, token]);

  // Polling para actualizar el conteo de notificaciones no leídas
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
      if (user.isAdmin) {
        fetchAdminUnreadCount();
      }
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, [user, token]);

  useEffect(() => {
    if (notifications.length === 0) {
      setUnreadCount(0);
    }
  }, [notifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    adminUnreadCount,
    preferences,
    loading,
    error,
    fetchNotifications,
    fetchAdminNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount,
    fetchAdminUnreadCount,
    fetchPreferences,
    updatePreference,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 