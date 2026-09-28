'use client';

import React, { useState } from 'react';
import {
  Coffee,
  QrCode,
  Gift,
  ArrowLeft,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { TIER_CONFIG } from '@/lib/loyalty';

interface CashierActionViewProps {
  customer: {
    id: string;
    name: string;
    email: string;
    tier: 'BRONZE' | 'SILVER' | 'GOLD';
    totalStamps: number;
  };
  branch: {
    id: string;
    name: string;
    targetStamps: number;
    rewardTitle: string;
  };
  initialStats: {
    currentStamps: number;
    rewardsAvailable: number;
  };
  baristaEmail?: string;
}

export const CashierActionView: React.FC<CashierActionViewProps> = ({
  customer,
  branch,
  initialStats,
  baristaEmail,
}) => {
  const router = useRouter();

  const [currentStamps, setCurrentStamps] = useState(initialStats.currentStamps);
  const [rewardsAvailable, setRewardsAvailable] = useState(initialStats.rewardsAvailable);
  const [isPending, setIsPending] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [justEarnedReward, setJustEarnedReward] = useState(
    initialStats.rewardsAvailable > 0 && initialStats.currentStamps === 0
  );

  const tierInfo = TIER_CONFIG[customer.tier] || TIER_CONFIG.BRONZE;
  const isRewardReady = rewardsAvailable > 0;
  const targetStamps = branch.targetStamps;

  // Моментальное начисление штампа (Optimistic UI 0ms)
  const handleAwardStamp = async () => {
    if (isPending) return;

    // 1. Оптимистичное мгновенное обновление
    const nextStamps = currentStamps + 1;
    const hitReward = nextStamps >= targetStamps;

    if (hitReward) {
      setCurrentStamps(0);
      setRewardsAvailable((prev) => prev + 1);
      setJustEarnedReward(true);
      setActionNotice(`🎉 Закрыта 6-я чашка! Начислен бесплатный напиток!`);

      // Запуск праздничного конфетти
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } else {
      setCurrentStamps(nextStamps);
      setActionNotice(`✓ Штамп ${nextStamps} из ${targetStamps} начислен!`);
    }

    // Тактильная вибро-отдача на мобильном
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(hitReward ? [100, 50, 100] : 60);
    }

    setIsPending(true);

    try {
      const res = await fetch('/api/cashier/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          branchId: branch.id,
          action: 'AWARD_STAMP',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentStamps(data.currentStamps);
        setRewardsAvailable(data.rewardsAvailable);
      }
    } catch (err) {
      console.error('Network sync error:', err);
    } finally {
      setIsPending(false);
    }
  };

  // Моментальное списание бесплатного кофе (Optimistic UI 0ms)
  const handleRedeemReward = async () => {
    if (isPending || rewardsAvailable <= 0) return;

    // 1. Оптимистичное мгновенное обновление
    setRewardsAvailable((prev) => Math.max(0, prev - 1));
    setJustEarnedReward(false);
    setActionNotice(`☕ Подарочный кофе успешно списан гостю!`);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }

    setIsPending(true);

    try {
      const res = await fetch('/api/cashier/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          branchId: branch.id,
          action: 'REDEEM_REWARD',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentStamps(data.currentStamps);
        setRewardsAvailable(data.rewardsAvailable);
      }
    } catch (err) {
      console.error('Network sync error:', err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 select-none">
      {/* УВЕДОМЛЕНИЕ О ГОТОВОМ БЕСПЛАТНОМ КОФЕ (БОЛЬШОЙ ЗАМЕТНЫЙ БАННЕР) */}
      {isRewardReady && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-stone-950 shadow-2xl shadow-emerald-500/30 animate-pulse border-2 border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Gift className="w-7 h-7 text-white stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
                Внимание кассиру!
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                У ГОСТЯ БЕСПЛАТНЫЙ НАПИТОК! ☕
              </h3>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                {rewardsAvailable} {rewardsAvailable === 1 ? 'напиток' : 'напитка'} на балансе («{branch.rewardTitle}»)
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex gap-2">
            <button
              onClick={handleRedeemReward}
              disabled={isPending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 active:scale-95 text-emerald-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Gift className="w-4 h-4 text-emerald-700" />
              <span>СПИСАТЬ ПОДАРОК СЕЙЧАС</span>
            </button>
          </div>
        </div>
      )}

      {/* Карточка информации о госте */}
      <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 flex items-center justify-center font-black text-base shadow-lg shadow-amber-600/20">
              {customer.name?.charAt(0) || 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">
                  {customer.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierInfo.badgeColor}`}
                >
                  <Crown className="w-3 h-3" />
                  <span>{tierInfo.title}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {customer.email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
              Филиал
            </span>
            <span className="text-xs font-semibold text-amber-400">
              {branch.name}
            </span>
          </div>
        </div>

        {/* Интерактивная шкала штампов (наглядно видно все кружки) */}
        <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-400 font-medium">Штампы для бесплатного кофе</span>
            <span className="font-bold text-amber-400 font-mono text-sm">
              {currentStamps} / {targetStamps}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: targetStamps }, (_, i) => {
              const isFilled = i < currentStamps;
              const isGiftSlot = i === targetStamps - 1;

              return (
                <div
                  key={i}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative ${
                    isFilled
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20 scale-105'
                      : isGiftSlot
                      ? 'bg-amber-500/10 border-2 border-dashed border-amber-500/50 text-amber-400'
                      : 'bg-stone-900 border border-stone-800 text-stone-600'
                  }`}
                >
                  {isFilled ? (
                    <Coffee className="w-5 h-5 stroke-[2.5]" />
                  ) : isGiftSlot ? (
                    <Gift className="w-5 h-5 animate-pulse" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                  <span className="text-[9px] font-semibold mt-0.5">
                    {isGiftSlot ? 'ПРИЗ' : `${i + 1}й`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Уведомление о действии */}
        {actionNotice && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs font-bold animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* ГЛАВНЫЕ КНОПКИ ДЕЙСТВИЙ (БОЛЬШИЕ, ДЛЯ МОМЕНТАЛЬНОГО НАЖАТИЯ НА КАССЕ) */}
      <div className="space-y-3 pt-1">
        {/* Кнопка +1 Штамп */}
        <button
          type="button"
          onClick={handleAwardStamp}
          disabled={isPending}
          className="w-full py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-base sm:text-lg transition-all shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70"
        >
          <Zap className="w-6 h-6 fill-stone-950 stroke-none" />
          <span>НАЧИСЛИТЬ +1 ШТАМП</span>
        </button>

        {/* Кнопка Списать подарок (если доступен) */}
        {isRewardReady && (
          <button
            type="button"
            onClick={handleRedeemReward}
            disabled={isPending}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-stone-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <Gift className="w-5 h-5" />
            <span>СПИСАТЬ БЕСПЛАТНЫЙ КОФЕ ({rewardsAvailable})</span>
          </button>
        )}

        {/* Кнопка Сканировать следующего гостя */}
        <Link
          href="/scan"
          className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-850 active:scale-[0.98] border border-stone-800 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>СКАНИРОВАТЬ СЛЕДУЮЩЕГО ГОСТЯ</span>
        </Link>
      </div>

      <footer className="text-center text-[11px] text-stone-500 pt-2">
        Оператор: {baristaEmail} • LoyaltyHub Instant POS
      </footer>
    </div>
  );
};
