'use client';

import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

export default function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  useEffect(() => {
    // Verificar si el backend está disponible
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health');
        setIsBackendAvailable(response.ok);
      } catch (error) {
        setIsBackendAvailable(false);
      }
    };

    checkBackend();
    
    // Mostrar banner después de 2 segundos si el backend no está disponible
    const timer = setTimeout(() => {
      if (!isBackendAvailable) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isBackendAvailable]);

  if (!isVisible || isBackendAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">🚀 Demo en Vivo</p>
            <p className="text-sm opacity-90">
              Esta es una demostración del frontend. Algunas funcionalidades como autenticación y pagos están simuladas.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 