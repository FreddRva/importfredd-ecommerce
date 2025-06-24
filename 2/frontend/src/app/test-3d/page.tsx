'use client';

import { useState } from 'react';
import ThreeJSViewer from '@/components/ThreeJSViewer';
import Product3DViewer from '@/components/Product3DViewer';

export default function Test3D() {
  const [viewerType, setViewerType] = useState<'threejs' | 'product'>('threejs');
  const modelPath = '/Zapatillas.glb';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">👟 Visor 3D Zapatilla</h1>
          <p className="text-gray-600 mb-6">
            Página de demostración para el visor 3D del producto.
          </p>

          {/* Controles */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Componente
              </label>
              <select
                value={viewerType}
                onChange={(e) => setViewerType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="threejs">Componente Base (Three.js)</option>
                <option value="product">Componente Producto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visor 3D */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Visor Actual: {
              {
                'threejs': 'ThreeJSViewer (Base)',
                'product': 'Product3DViewer (Completo)'
              }[viewerType]
            }
          </h2>

          <div className="flex justify-center">
            {viewerType === 'threejs' && (
              <ThreeJSViewer 
                modelPath={modelPath}
                width={600}
                height={500}
              />
            )}
            {viewerType === 'product' && (
              <Product3DViewer 
                productName="Zapatilla Skater B9S"
                modelPath={modelPath}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 