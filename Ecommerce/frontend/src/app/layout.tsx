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
  title: "Axiora - Tienda Online Premium",
  description: "Descubre nuestra colección exclusiva de productos premium en axiora.pro. Zapatillas, ropa y accesorios de la más alta calidad.",
  keywords: "ecommerce, zapatillas, ropa, accesorios, premium, moda, axiora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              </div>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
