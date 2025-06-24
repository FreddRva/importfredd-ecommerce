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
  const finalModelPath = modelPath || '/Zapatillas.glb';

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
          modelPath={finalModelPath}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
} 