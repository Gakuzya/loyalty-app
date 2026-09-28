'use client';

import React, { useState, useEffect } from 'react';
import {
  Coffee,
  QrCode,
  Gift,
  MapPin,
  Sparkles,
  PartyPopper,
  X,
} from 'lucide-react';
import { StampGrid } from './StampGrid';
import { GuestQR } from './GuestQR';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

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
  card: initialCard,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [currentStamps, setCurrentStamps] = useState(initialCard.currentStamps);
  const [rewardsAvailable, setRewardsAvailable] = useState(
    initialCard.rewardsAvailable
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const supabase = createClient();
  const customerId = initialCard.qrToken.replace('guest:', '').trim();
  const targetStamps = shop.targetStamps;

  const progressPercent = Math.min(
    100,
    Math.round((currentStamps / targetStamps) * 100)
  );

  // 1. Live Realtime синхронизация через Supabase Broadcast
  useEffect(() => {
    if (!customerId || customerId.startsWith('anonymous')) return;

    const channel = supabase
      .channel('loyalty-live-events')
      .on('broadcast', { event: 'stamp-update' }, ({ payload }) => {
        if (!payload || payload.customerId !== customerId) return;

        if (payload.branchId === shop.id) {
          setCurrentStamps(payload.currentStamps);
          setRewardsAvailable(payload.rewardsAvailable);

          if (payload.action === 'EARN_STAMP' && payload.rewardsAvailable > 0) {
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.5 },
              });
            } catch (e) {
              // ignore
            }
            setShowCelebration(true);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, shop.id, supabase]);

  // 2. Фоновый polling для гарантированного обновления без F5
  useEffect(() => {
    if (!customerId || customerId.startsWith('anonymous')) return;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/guest/status?userId=${customerId}`);
        if (!res.ok) return;
        const data = await res.json();
        const thisBranch = data.branches?.find(
          (b: any) => b.branchId === shop.id
        );
        if (thisBranch) {
          setCurrentStamps(thisBranch.currentStamps);
          setRewardsAvailable(thisBranch.rewardsAvailable);
        }
      } catch (e) {
        // silent
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [customerId, shop.id]);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col space-y-4 select-none relative">
      {/* МОДАЛКА ПРАЗДНОВАНИЯ БЕСПЛАТНОГО НАПИТКА */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500 shadow-2xl text-center space-y-4 animate-scaleUp">
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 animate-bounce">
              <Gift className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">
                Ура! Вы накопили все штампы!
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ВАШ 6-Й НАПИТОК — БЕСПЛАТНЫЙ! ☕
              </h2>
              <p className="text-xs text-stone-300 pt-1">
                Карточка в «{shop.name}» закрыта!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold">
              Покажите бариста этот экран или переключитесь на QR-код для получения бесплатного напитка!
            </div>

            <button
              onClick={() => {
                setShowCelebration(false);
                setActiveTab('qr');
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
            >
              ОТКРЫТЬ QR-КОД ДЛЯ ПОДАРКА
            </button>
          </div>
        </div>
      )}

      {/* ОГРОМНЫЙ БАННЕР БЕСПЛАТНОГО НАПИТКА */}
      {rewardsAvailable > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-stone-950 shadow-2xl shadow-emerald-500/30 border-2 border-emerald-300 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block">
              Готов к выдаче!
            </span>
            <h3 className="text-sm font-black text-white leading-tight">
              ВАШ 6-Й НАПИТОК — БЕСПЛАТНЫЙ! ☕
            </h3>
            <p className="text-[11px] text-white/90">
              Покажите QR-код бариста для списания
            </p>
          </div>
        </div>
      )}

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
                Ваша награда за 6 штампов
              </div>
              <div className="text-xs font-medium text-stone-200 mt-0.5">
                {shop.rewardTitle}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <GuestQR qrToken={initialCard.qrToken} shopName={shop.name} />
      )}

      {/* Подсказка для гостя */}
      <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/60 text-center text-xs text-stone-400">
        {activeTab === 'card' ? (
          <span>
            Нажмите на иконку{' '}
            <QrCode className="w-3.5 h-3.5 inline text-amber-400" /> сверху,
            чтобы открыть QR-код на кассе
          </span>
        ) : (
          <span>Покажите экран бариста — штамп начислится в реальном времени</span>
        )}
      </div>
    </div>
  );
};
