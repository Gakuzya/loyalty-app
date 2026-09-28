import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loyalty Hub — Цифровые штампы для кофеен',
  description: 'Облачная система лояльности и цифровых штампов для локальных кофеен и пекарен',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#0f0d0c] text-stone-100 antialiased selection:bg-amber-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
