// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Russo_One } from "next/font/google"; // O las fuentes que estés usando
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

// IMPORTAR AuthProvider
import { AuthProvider } from '../utils/AuthContext'; // Asegúrate que esta ruta sea correcta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente de titulares: Russo One
const russo = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
});

export const metadata: Metadata = {
  title: {
    default: "Gala Premios Piorn 2025",
    template: "%s | Gala Premios Piorn 2025",
  },
  description: "Gala de Premios PIORN 2025",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${russo.variable}`}>
        {/* ENVOLVER LOS CHILDREN CON AuthProvider */}
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}