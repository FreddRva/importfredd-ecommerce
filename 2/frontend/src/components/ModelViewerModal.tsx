'use client';

import { X } from 'lucide-react';
import Product3DViewer from './Product3DViewer';

interface ModelViewerModalProps {
  modelPath: string;
  productName: string;
  onClose: () => void;
}

export default function ModelViewerModal({ modelPath, productName, onClose }: ModelViewerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative animate-fade-in-scale">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-transform hover:scale-110 z-10"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <Product3DViewer 
            productName={productName} 
            modelPath={modelPath} 
            width={800}
            height={600}
          />
        </div>
      </div>
    </div>
  );
} 