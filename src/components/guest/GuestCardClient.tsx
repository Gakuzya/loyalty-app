'use client';

import React, { useState } from 'react';
import { Coffee, QrCode, Gift, MapPin, Sparkles } from 'lucide-react';
import { StampGrid } from './StampGrid';
import { GuestQR } from './GuestQR';

interface GuestCardClientProps {
  shop: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    targetStamps: number;
    rewardTitle: string;
  };
  card: {
    id: string;
    currentStamps: number;
    targetStamps: number;
    rewardsAvailable: number;
    qrToken: string;
  };
}

export const GuestCardClient: React.FC<GuestCardClientProps> = ({
  shop,
  card,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const currentStamps = card.currentStamps;
  const targetStamps = shop.targetStamps;

  const progressPercent = Math.min(
    100,
    Math.round((currentStamps / targetStamps) * 100)
  );

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col space-y-4">
      {/* Шапка кофейни с переключателем табов */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-stone-900/80 border border-stone-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-600/20 shrink-0">
            <Coffee className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight truncate">
              {shop.name}
            </h1>
            <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{shop.address || 'ул. Кофейная'}</span>
            </div>
          </div>
        </div>

        {/* Переключатель табов: Штампы / QR для бариста */}
        <div className="flex p-1 rounded-xl bg-stone-800/90 border border-stone-700/50 shrink-0">
          <button
            onClick={() => setActiveTab('card')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'card'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="Карта со штампами"
          >
            <Coffee className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="Показать QR-код бариста"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Прогресс-бар заполнения */}
      <div className="px-4 py-3 rounded-2xl bg-stone-900/50 border border-stone-800/60 shadow-inner">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-stone-400">Прогресс лояльности</span>
          <span className="font-bold text-amber-400">
            {currentStamps} из {targetStamps} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Контент: Штампы или QR-код */}
      {activeTab === 'card' ? (
        <div className="space-y-4">
          <StampGrid
            currentStamps={currentStamps}
            targetStamps={targetStamps}
            rewardTitle={shop.rewardTitle}
          />

          {/* Карточка текущей награды */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                Ваша награда
              </div>
              <div className="text-xs font-medium text-stone-200 mt-0.5">
                {shop.rewardTitle}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <GuestQR qrToken={card.qrToken} shopName={shop.name} />
      )}

      {/* Подсказка для гостя */}
      <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/60 text-center text-xs text-stone-400">
        {activeTab === 'card' ? (
          <span>
            Нажмите на иконку <QrCode className="w-3.5 h-3.5 inline text-amber-400" /> сверху, чтобы открыть QR-код на кассе
          </span>
        ) : (
          <span>Покажите экран бариста — штамп начислится мгновенно</span>
        )}
      </div>
    </div>
  );
};
