import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Loyalty Hub — Цифровые штампы для кофеен',
  description: 'Облачная система лояльности и цифровых штампов для локальных кофеен и пекарен',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LoyaltyHub',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0d0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#0f0d0c] text-stone-100 antialiased selection:bg-amber-600 selection:text-white">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
