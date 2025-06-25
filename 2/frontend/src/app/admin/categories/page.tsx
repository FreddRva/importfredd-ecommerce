'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PlusCircle, Edit, Trash2, Tag, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function AdminCategoriesPage() {
  return (
    <div style={{color: 'red', fontWeight: 'bold', fontSize: 32, padding: 40}}>
      DEBUG: Render forzado - Si ves esto, el archivo está bien conectado
    </div>
  );
}

// ... el resto del código original queda comentado o eliminado temporalmente para esta prueba ... 