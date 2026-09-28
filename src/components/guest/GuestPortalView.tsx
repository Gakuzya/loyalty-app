'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Coffee,
  Gift,
  Store,
  ChevronRight,
  LogOut,
  Sparkles,
  MapPin,
  Copy,
  Check,
  Award,
  Crown,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { TIER_CONFIG } from '@/lib/loyalty';

interface BranchLoyaltyItem {
  branchId: string;
  branchName: string;
  branchSlug: string;
  networkName: string;
  address: string | null;
  targetStamps: number;
  rewardTitle: string;
  currentStamps: number;
  totalEarned: number;
  rewardsAvailable: number;
}

interface GuestPortalViewProps {
  user: {
    id: string;
    email?: string;
    fullName?: string | null;
    tier: 'BRONZE' | 'SILVER' | 'GOLD';
    totalStamps: number;
  };
  branches: BranchLoyaltyItem[];
}

export const GuestPortalView: React.FC<GuestPortalViewProps> = ({
  user,
  branches,
}) => {
  const [copied, setCopied] = useState(false);
  const guestQrValue = `guest:${user.id}`;
  const tierInfo = TIER_CONFIG[user.tier] || TIER_CONFIG.BRONZE;

  // Расчет прогресса до следующего уровня
  const nextTierMin = tierInfo.nextTierStamps;
  const stampsToNext = nextTierMin ? Math.max(0, nextTierMin - user.totalStamps) : 0;
  const tierProgressPercent = nextTierMin
    ? Math.min(100, Math.round((user.totalStamps / nextTierMin) * 100))
    : 100;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 select-none">
      {/* Шапка профиля гостя */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-600/20">
            <Coffee className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {user.fullName || user.email?.split('@')[0] || 'Любимый гость'}
            </h1>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-[170px]">
              {user.email}
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-rose-500/10 text-stone-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* КАРТОЧКА СТАТУСА ЛОЯЛЬНОСТИ (TIER GAMIFICATION) */}
      <div className={`p-5 rounded-3xl bg-gradient-to-br ${tierInfo.color} border border-white/20 shadow-2xl relative overflow-hidden text-stone-950`}>
        {/* Фоновые декоративные круги */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>{tierInfo.title}</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight drop-shadow-sm">
              {tierInfo.label}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-white/80 uppercase font-semibold block">
              Всего визитов
            </span>
            <span className="text-2xl font-black text-white drop-shadow-sm">
              {user.totalStamps} ☕
            </span>
          </div>
        </div>

        {/* Привилегия статуса */}
        <div className="mt-3 p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white text-xs font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{tierInfo.perk}</span>
        </div>

        {/* Прогресс до следующего уровня */}
        {nextTierMin && (
          <div className="mt-3 pt-2.5 border-t border-white/20 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-white/90 font-semibold">
              <span>До следующего статуса</span>
              <span>Осталось {stampsToNext} штампов</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${tierProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ЕДИНЫЙ УНИВЕРСАЛЬНЫЙ QR-КОД ГОСТЯ */}
      <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Персональный QR-код для кассы
        </div>

        {/* QR код */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-black/50 ring-4 ring-amber-500/20 mb-4 transition-transform hover:scale-105">
          <QRCodeSVG
            value={guestQrValue}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-xs text-stone-200 font-medium max-w-xs">
          Покажите бариста на кассе для начисления штампов и списания кофе
        </p>

        {/* Копирование ID */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 w-full flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono text-[11px] text-stone-500 truncate max-w-[190px]">
            ID: {user.id}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-[11px] font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-400" />
                <span>Код</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Список заведений и баланс штампов */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-500" />
            <span>Ваши филиалы и накопления ({branches.length})</span>
          </h2>
          <span className="text-[11px] text-stone-500">Штампы и призы</span>
        </div>

        {branches.length > 0 ? (
          <div className="space-y-3">
            {branches.map((b) => {
              return (
                <Link
                  key={b.branchId}
                  href={`/card/${b.branchSlug}`}
                  className="block p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/40 hover:bg-stone-900 transition-all duration-300 shadow-md group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {b.branchName}
                      </h3>
                      <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-500" />
                        <span>{b.address || b.networkName}</span>
                      </p>
                    </div>

                    {b.rewardsAvailable > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-pulse">
                        <Gift className="w-3.5 h-3.5" />
                        {b.rewardsAvailable} кофе в подарок!
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-400">
                          {b.currentStamps} / {b.targetStamps}
                        </span>
                        <span className="text-[10px] text-stone-500 block">штампов</span>
                      </div>
                    )}
                  </div>

                  {/* Мини-кружки штампов */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-stone-800/60">
                    {Array.from({ length: b.targetStamps }, (_, i) => {
                      const isEarned = i < b.currentStamps;
                      const isLast = i === b.targetStamps - 1;
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isEarned
                              ? isLast
                                ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300'
                                : 'bg-amber-500/25 border border-amber-500 text-amber-400'
                              : 'bg-stone-800 text-stone-600'
                          }`}
                        >
                          {isEarned ? (
                            isLast ? (
                              <Gift className="w-3 h-3 stroke-[2.5]" />
                            ) : (
                              <Coffee className="w-3 h-3 stroke-[2]" />
                            )
                          ) : (
                            <span>{i + 1}</span>
                          )}
                        </div>
                      );
                    })}

                    <div className="ml-auto text-[11px] text-stone-400 group-hover:text-white flex items-center gap-0.5 font-medium">
                      <span>Открыть</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 text-center space-y-2">
            <Coffee className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs font-semibold text-stone-300">
              У вас пока нет накопленных штампов
            </p>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
              Покажите QR-код бариста при покупке первого кофе, и филиал автоматически появится в вашем списке!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
