import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para producción
  output: 'standalone',
  
  // Deshabilitar ESLint temporalmente para el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuración de imágenes
  images: {
    domains: ['localhost', 'axiora.pro', 'importfredd-ecommerce.onrender.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configuración de CORS para desarrollo
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Optimizaciones de rendimiento
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  
  // Configuración de WebAuthn para producción
  env: {
    NEXT_PUBLIC_WEBAUTHN_RPID: process.env.NEXT_PUBLIC_WEBAUTHN_RPID || 'axiora.pro',
    NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ORIGIN || 'https://axiora.pro',
  },
};

export default nextConfig;
