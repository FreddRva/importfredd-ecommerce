"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface FavoritesContextType {
  favorites: number[];
  addFavorite: (productId: number) => Promise<void>;
  removeFavorite: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
  syncFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const LOCAL_KEY = "favorites";

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, token } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);

  // Cargar favoritos desde localStorage o API
  useEffect(() => {
    if (!isAuthenticated) {
      const local = localStorage.getItem(LOCAL_KEY);
      setFavorites(local ? JSON.parse(local) : []);
    } else {
      fetchFavoritesFromAPI();
    }
  }, [isAuthenticated, token]);

  // Sincronizar favoritos locales con la API al iniciar sesión
  const syncFavorites = async () => {
    if (!isAuthenticated || !token) return;
    const local = localStorage.getItem(LOCAL_KEY);
    if (local) {
      const localFavs: number[] = JSON.parse(local);
      for (const pid of localFavs) {
        await fetch("http://localhost:8080/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: pid }),
        });
      }
      localStorage.removeItem(LOCAL_KEY);
    }
    await fetchFavoritesFromAPI();
  };

  // Obtener favoritos de la API
  const fetchFavoritesFromAPI = async () => {
    if (!isAuthenticated || !token) return;
    const res = await fetch("http://localhost:8080/api/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFavorites(data.favorites || []);
    }
  };

  // Añadir favorito
  const addFavorite = async (productId: number) => {
    if (!isAuthenticated || !token) {
      const updated = Array.from(new Set([...favorites, productId]));
      setFavorites(updated);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return;
    }
    await fetch("http://localhost:8080/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId }),
    });
    await fetchFavoritesFromAPI();
  };

  // Quitar favorito
  const removeFavorite = async (productId: number) => {
    if (!isAuthenticated || !token) {
      const updated = favorites.filter((id) => id !== productId);
      setFavorites(updated);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return;
    }
    await fetch(`http://localhost:8080/api/favorites/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchFavoritesFromAPI();
  };

  // Saber si un producto es favorito
  const isFavorite = (productId: number) => favorites.includes(productId);

  // Sincronizar favoritos locales al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      syncFavorites();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, token]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, syncFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de FavoritesProvider");
  return ctx;
}; 