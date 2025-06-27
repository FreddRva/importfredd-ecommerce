'use client';

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/api';

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  itemCount: number;
  totalPrice: number;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearLocalCart: () => void;
  mergeLocalAndDbCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, token } = useAuth();

  const getLocalCart = (): CartItem[] => {
    try {
      const localData = localStorage.getItem('cart');
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Failed to parse local cart", e);
      return [];
    }
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setCart(getLocalCart());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch cart');
      }
      const data: CartItem[] = await response.json();
      setCart(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const addToCart = async (itemToAdd: Omit<CartItem, 'id'>) => {
    if (!isAuthenticated || !token) {
      // Logic for guest cart using localStorage
      const localCart = getLocalCart();
      const existingItem = localCart.find(item => item.product_id === itemToAdd.product_id);
      
      if (existingItem) {
        existingItem.quantity += itemToAdd.quantity;
      } else {
        // Asignar un ID temporal negativo para que React pueda manejar las keys
        const newItem: CartItem = {
          ...itemToAdd,
          id: -Math.floor(Math.random() * 1000000), 
        };
        localCart.push(newItem);
      }
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCart([...localCart]);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: itemToAdd.product_id, quantity: itemToAdd.quantity }),
      });
      await fetchCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!isAuthenticated || !token) {
      const localCart = getLocalCart();
      const itemIndex = localCart.findIndex(item => item.id === itemId);
      if (itemIndex > -1) {
        if (quantity > 0) {
          localCart[itemIndex].quantity = quantity;
        } else {
          localCart.splice(itemIndex, 1);
        }
      }
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCart([...localCart]);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      await fetchCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!isAuthenticated || !token) {
        const localCart = getLocalCart();
        const updatedCart = localCart.filter(item => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
        return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchCart();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const clearLocalCart = () => {
    localStorage.removeItem('cart');
  };

  const mergeLocalAndDbCart = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    const localCart = getLocalCart();
    if (localCart.length === 0) return;

    setLoading(true);
    try {
      // 1. Obtener el carrito actual del backend
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const backendCart: CartItem[] = response.ok ? await response.json() : [];
      const backendProductIds = backendCart.map(item => item.product_id);

      // 2. Solo agregar productos del localCart que NO estén en el backend
      for (const item of localCart) {
        if (!backendProductIds.includes(item.product_id)) {
          await fetch(`${API_BASE_URL}/api/cart/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
          });
        }
      }
      clearLocalCart();
      await fetchCart();
    } catch (err: any) {
      setError("Failed to merge cart: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, fetchCart]);

  const clearCart = async () => {
    if (!isAuthenticated || !token) {
      localStorage.removeItem('cart');
      setCart([]);
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchCart();
    } catch (err: any) {
      setError('No se pudo limpiar el carrito: ' + err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(getLocalCart());
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    if (isAuthenticated) {
      mergeLocalAndDbCart();
    }
  }, [isAuthenticated, mergeLocalAndDbCart]);
  
  // Asegurar que cart sea siempre un array antes de usar reduce
  const safeCart = Array.isArray(cart) ? cart : [];
  const itemCount = safeCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = safeCart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  return (
    <CartContext.Provider value={{ 
        cart: safeCart, loading, error, itemCount, totalPrice,
        fetchCart, addToCart, updateQuantity, removeFromCart, 
        clearLocalCart, mergeLocalAndDbCart, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 