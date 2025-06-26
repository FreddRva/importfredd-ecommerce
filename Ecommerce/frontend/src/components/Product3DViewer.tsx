'use client';

import ThreeJSViewer from './ThreeJSViewer';

interface Product3DViewerProps {
  productName: string;
  modelPath?: string;
  width?: number;
  height?: number;
}

export default function Product3DViewer({ 
  productName, 
  modelPath, 
  width, 
  height 
}: Product3DViewerProps) {
  // Si no hay modelo 3D disponible, mostrar mensaje
  if (!modelPath) {
    return (
      <div className="product-3d-viewer">
        <div className="viewer-header mb-4 text-center">
          <h3 className="text-xl font-bold">Vista 3D - {productName}</h3>
          <p className="text-sm text-gray-500">
            Modelo interactivo. Usa el mouse para explorar.
          </p>
        </div>
        <div className="viewer-container rounded-lg overflow-hidden shadow-inner bg-gray-100 flex items-center justify-center" style={{ width: width || 400, height: height || 400 }}>
          <div className="text-center p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Modelo 3D no disponible</p>
            <p className="text-sm text-gray-500 mt-1">Este producto no tiene un modelo 3D para visualizar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-3d-viewer">
      <div className="viewer-header mb-4 text-center">
        <h3 className="text-xl font-bold">Vista 3D - {productName}</h3>
        <p className="text-sm text-gray-500">
          Modelo interactivo. Usa el mouse para explorar.
        </p>
      </div>
      <div className="viewer-container rounded-lg overflow-hidden shadow-inner bg-gray-100">
        <ThreeJSViewer 
          modelPath={modelPath}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
} 