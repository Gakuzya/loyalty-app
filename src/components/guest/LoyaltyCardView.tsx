'use client';

import React, { useState } from 'react';
import { Coffee, QrCode, Gift, Sparkles, MapPin, Plus, RotateCcw } from 'lucide-react';
import { StampGrid } from './StampGrid';
import { GuestQR } from './GuestQR';

interface LoyaltyCardViewProps {
  initialData?: {
    shopName: string;
    shopAddress: string;
    targetStamps: number;
    currentStamps: number;
    rewardTitle: string;
    qrToken: string;
  };
}

export const LoyaltyCardView: React.FC<LoyaltyCardViewProps> = ({
  initialData = {
    shopName: 'Espresso & Croissant',
    shopAddress: 'ул. Кофейная, 14',
    targetStamps: 6,
    currentStamps: 4,
    rewardTitle: 'Бесплатный кофе любого объёма',
    qrToken: 'guest-demo-qr-token-12345',
  },
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [currentStamps, setCurrentStamps] = useState(initialData.currentStamps);
  const targetStamps = initialData.targetStamps;

  const progressPercent = Math.min(100, Math.round((currentStamps / targetStamps) * 100));

  const handleAddStamp = () => {
    setCurrentStamps((prev) => (prev < targetStamps ? prev + 1 : prev));
  };

  const handleReset = () => {
    setCurrentStamps(0);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col space-y-4">
      {/* Шапка кофейни */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-stone-900/80 border border-stone-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-600/20">
            <Coffee className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-snug">
              {initialData.shopName}
            </h1>
            <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>{initialData.shopAddress}</span>
            </div>
          </div>
        </div>

        {/* Переключатель табов: Карточка / QR */}
        <div className="flex p-1 rounded-xl bg-stone-800/90 border border-stone-700/50">
          <button
            onClick={() => setActiveTab('card')}
            className={`p-2 rounded-lg transition-all ${
              activeTab === 'card'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="Карточка со штампами"
          >
            <Coffee className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`p-2 rounded-lg transition-all ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="QR-код гостя"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Прогресс-бар заполнения */}
      <div className="px-4 py-3 rounded-2xl bg-stone-900/50 border border-stone-800/60">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-stone-400">Прогресс лояльности</span>
          <span className="font-bold text-amber-400">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Основной контент: Штампы или QR код */}
      {activeTab === 'card' ? (
        <div className="space-y-4">
          <StampGrid
            currentStamps={currentStamps}
            targetStamps={targetStamps}
            rewardTitle={initialData.rewardTitle}
          />

          {/* Карточка текущей награды */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                Ваш будущий подарок
              </div>
              <div className="text-xs font-medium text-stone-200 mt-0.5">
                {initialData.rewardTitle}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <GuestQR
          qrToken={initialData.qrToken}
          shopName={initialData.shopName}
        />
      )}

      {/* Интерактивная тестовая панель (для моментальной демонстрации анимаций и конфетти) */}
      <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/60 flex items-center justify-between gap-2 text-xs">
        <span className="text-stone-400 text-[11px] font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Тест работы:
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleAddStamp}
            disabled={currentStamps >= targetStamps}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-stone-950 font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            +1 Штамп
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all active:scale-95"
            title="Сбросить штампы"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
