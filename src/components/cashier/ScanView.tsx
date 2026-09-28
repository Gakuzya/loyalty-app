'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/cashier/QRScanner';
import { ArrowRight, Keyboard, Sparkles } from 'lucide-react';

export const ScanView: React.FC = () => {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScan = (decodedText: string) => {
    if (!decodedText || isSubmitting) return;
    setIsSubmitting(true);
    router.push(`/action/${encodeURIComponent(decodedText.trim())}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isSubmitting) return;
    handleScan(manualCode.trim());
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* Видоискатель сканера */}
      <QRScanner onScan={handleScan} />

      {/* Разделитель */}
      <div className="w-full flex items-center gap-3 pt-1">
        <div className="h-px bg-stone-800 flex-1" />
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          или ввести код вручную
        </span>
        <div className="h-px bg-stone-800 flex-1" />
      </div>

      {/* Ручной ввод */}
      <form onSubmit={handleManualSubmit} className="w-full flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="ID или токен гостя..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 text-xs text-stone-200 placeholder-stone-500 outline-none transition-all font-mono"
          />
          <Keyboard className="w-4 h-4 text-stone-500 absolute right-3 top-3 pointer-events-none" />
        </div>
        <button
          type="submit"
          disabled={!manualCode.trim() || isSubmitting}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Найти</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
