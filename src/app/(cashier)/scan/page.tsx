'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/cashier/QRScanner';
import { Coffee, ChevronLeft, ArrowRight, Keyboard, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CashierScanPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обработка успешного сканирования камеры
  const handleScan = (decodedText: string) => {
    if (!decodedText || isSubmitting) return;
    setIsSubmitting(true);
    // Мгновенный переход на экран действий бариста
    router.push(`/action/${encodeURIComponent(decodedText.trim())}`);
  };

  // Ручной ввод кода (на случай отсутствия камеры)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isSubmitting) return;
    handleScan(manualCode.trim());
  };

  // Быстрый тест без камеры
  const handleDemoScan = () => {
    handleScan('guest-qr-surf-coffee-token');
  };

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Верхняя навигационная панель */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Экран Бариста
        </span>
      </header>

      {/* Основной контент */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-5 py-4">
        {/* Заголовок */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1 shadow-lg">
            <Coffee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Сканирование карты гостя
          </h1>
          <p className="text-xs text-stone-400 max-w-xs">
            Наведите видоискатель на QR-код с экрана смартфона посетителя
          </p>
        </div>

        {/* Интерактивный компонент сканера */}
        <div className="w-full">
          <QRScanner onScan={handleScan} />
        </div>

        {/* Разделитель */}
        <div className="w-full flex items-center gap-3">
          <div className="h-px bg-stone-800 flex-1" />
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            или вручную
          </span>
          <div className="h-px bg-stone-800 flex-1" />
        </div>

        {/* Форма ручного ввода токена */}
        <form onSubmit={handleManualSubmit} className="w-full flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Код карты гостя..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-stone-200 placeholder-stone-500 outline-none transition-all font-mono"
            />
            <Keyboard className="w-4 h-4 text-stone-500 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-stone-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Найти</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Кнопка мгновенного теста (для проверки на ПК без камеры) */}
        <button
          onClick={handleDemoScan}
          disabled={isSubmitting}
          className="w-full py-2.5 px-3.5 rounded-xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 text-stone-400 hover:text-stone-200 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Быстрый тест: сканировать тестового гостя</span>
        </button>
      </main>

      {/* Футер */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub POS • Терминал бариста
      </footer>
    </div>
  );
}
