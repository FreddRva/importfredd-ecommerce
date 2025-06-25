import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/context/CartContext';
import Navigation from '@/components/Navigation';
import { FavoritesProvider } from '@/context/FavoritesContext';
import DemoBanner from '@/components/DemoBanner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImportFredd - Tienda Online Premium",
  description: "Descubre nuestra colección exclusiva de productos premium. Zapatillas, ropa y accesorios de la más alta calidad.",
  keywords: "ecommerce, zapatillas, ropa, accesorios, premium, moda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("DEBUG: layout.tsx montado");
  return (
    <html lang="es">
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans">
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <div className="min-h-screen flex flex-col">
                <DemoBanner />
                <Navigation />
                <main className="flex-1">
                  {children}
                </main>
                <footer className="bg-gray-900 text-white py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">ImportFredd</h3>
                        <p className="text-gray-300 text-sm">
                          Tu destino para productos premium de la más alta calidad.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-md font-semibold mb-4">Productos</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li><a href="/productos" className="hover:text-white transition-colors">Zapatillas</a></li>
                          <li><a href="/productos" className="hover:text-white transition-colors">Ropa</a></li>
                          <li><a href="/productos" className="hover:text-white transition-colors">Accesorios</a></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-md font-semibold mb-4">Soporte</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Envíos</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Devoluciones</a></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-md font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                      <p>&copy; 2024 ImportFredd. Todos los derechos reservados.</p>
                    </div>
                  </div>
                </footer>
              </div>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
