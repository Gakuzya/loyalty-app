'use client';

import React, { useState, useEffect } from 'react';
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
  Crown,
  Zap,
  Clock,
  PartyPopper,
  X,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { TIER_CONFIG } from '@/lib/loyalty';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

export interface BranchLoyaltyItem {
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

export interface ActivityHistoryItem {
  id: string;
  type: 'EARN_STAMP' | 'REDEEM_REWARD';
  branchName: string;
  baristaName?: string;
  createdAt: string;
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
  initialHistory?: ActivityHistoryItem[];
}

export const GuestPortalView: React.FC<GuestPortalViewProps> = ({
  user: initialUser,
  branches: initialBranches,
  initialHistory = [],
}) => {
  const [user, setUser] = useState(initialUser);
  const [branches, setBranches] = useState<BranchLoyaltyItem[]>(initialBranches);
  const [history, setHistory] = useState<ActivityHistoryItem[]>(initialHistory);
  const [copied, setCopied] = useState(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [celebrationReward, setCelebrationReward] = useState<{
    branchName: string;
    rewardTitle: string;
  } | null>(null);

  const supabase = createClient();
  const guestQrValue = `guest:${user.id}`;
  const tierInfo = TIER_CONFIG[user.tier] || TIER_CONFIG.BRONZE;

  // Проверяем, есть ли хотя бы один доступный бесплатный напиток
  const readyRewardBranch = branches.find((b) => b.rewardsAvailable > 0);

  // Расчет прогресса до следующего уровня
  const nextTierMin = tierInfo.nextTierStamps;
  const stampsToNext = nextTierMin
    ? Math.max(0, nextTierMin - user.totalStamps)
    : 0;
  const tierProgressPercent = nextTierMin
    ? Math.min(100, Math.round((user.totalStamps / nextTierMin) * 100))
    : 100;

  // 1. ПОДПИСКА НА REALTIME BROADCAST ИЗ SUPABASE
  useEffect(() => {
    const channel = supabase
      .channel('loyalty-live-events')
      .on('broadcast', { event: 'stamp-update' }, ({ payload }) => {
        if (!payload || payload.customerId !== user.id) return;

        // Звуковая и тактильная отдача
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        // Обновляем список филиалов
        setBranches((prev) =>
          prev.map((b) => {
            if (b.branchId === payload.branchId) {
              return {
                ...b,
                currentStamps: payload.currentStamps,
                rewardsAvailable: payload.rewardsAvailable,
                targetStamps: payload.targetStamps || b.targetStamps,
              };
            }
            return b;
          })
        );

        // Обновляем данные пользователя
        if (payload.totalStamps !== undefined) {
          setUser((prev) => ({
            ...prev,
            totalStamps: payload.totalStamps,
            tier: payload.tier || prev.tier,
          }));
        }

        // Добавляем в историю активности
        setHistory((prev) => [
          {
            id: `live-${Date.now()}`,
            type: payload.action,
            branchName: payload.branchName || 'Филиал',
            baristaName: payload.baristaName,
            createdAt: payload.timestamp || new Date().toISOString(),
          },
          ...prev.slice(0, 7),
        ]);

        // Если это закрытие 6-й чашки — взрываем конфетти и открываем праздник
        if (payload.action === 'EARN_STAMP' && payload.rewardsAvailable > 0) {
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.5 },
            });
          } catch (e) {
            // ignore
          }

          setCelebrationReward({
            branchName: payload.branchName || 'кофейне',
            rewardTitle: payload.rewardTitle || 'Бесплатный напиток',
          });

          setLiveToast(`🎉 ВАШ 6-Й НАПИТОК — БЕСПЛАТНЫЙ!`);
        } else if (payload.action === 'EARN_STAMP') {
          setLiveToast(
            `+1 Штамп начислен в «${payload.branchName || 'кофейне'}»!`
          );
        } else if (payload.action === 'REDEEM_REWARD') {
          setLiveToast(`☕ Бесплатный напиток успешно выдан! Приятного кофе!`);
        }

        setTimeout(() => setLiveToast(null), 4000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  // 2. БЫСТРЫЙ ФОНОВЫЙ POLLING (каждые 3 сек), чтобы гарантировать 100% синхронизацию без ручного F5
  useEffect(() => {
    const pollStatus = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/guest/status?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.branches) {
          setBranches(data.branches);
        }
        if (data.user) {
          setUser((prev) => ({
            ...prev,
            totalStamps: data.user.totalStamps,
            tier: data.user.tier,
          }));
        }
        if (data.history) {
          setHistory(data.history);
        }
      } catch (e) {
        // silent
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 select-none relative">
      {/* МОДАЛЬНОЕ ОКНО ПРАЗДНОВАНИЯ 6-ГО БЕСПЛАТНОГО НАПИТКА */}
      {celebrationReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500 shadow-2xl text-center space-y-4 animate-scaleUp">
            <button
              onClick={() => setCelebrationReward(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 animate-bounce">
              <Gift className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">
                Поздравляем!
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ВАШ 6-Й НАПИТОК — БЕСПЛАТНЫЙ! ☕
              </h2>
              <p className="text-xs text-stone-300 pt-1">
                Вы закрыли карточку в «{celebrationReward.branchName}».
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold">
              Покажите бариста этот экран прямо сейчас, и он сразу выдаст вам «{celebrationReward.rewardTitle}»!
            </div>

            <button
              onClick={() => setCelebrationReward(null)}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
            >
              ОТЛИЧНО, ЗАБРАТЬ ПОДАРОК!
            </button>
          </div>
        </div>
      )}

      {/* ЖИВОЙ ТОСТ УВЕДОМЛЕНИЕ ПРИ НАЧИСЛЕНИИ */}
      {liveToast && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-40 p-3.5 rounded-2xl bg-amber-500 text-stone-950 font-black text-xs shadow-2xl flex items-center justify-between gap-2 animate-slideDown">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{liveToast}</span>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="p-1 rounded-lg hover:bg-stone-950/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ОГРОМНЫЙ ГЛАВНЫЙ БАННЕР БЕСПЛАТНОГО НАПИТКА (ЕСЛИ ДОСТУПЕН НА БАЛАНСЕ) */}
      {readyRewardBranch && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-stone-950 shadow-2xl shadow-emerald-500/30 border-2 border-emerald-300 relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Gift className="w-7 h-7 text-white stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider mb-1">
                <PartyPopper className="w-3 h-3 text-amber-300" />
                Готов к получению!
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                ВАШ 6-Й НАПИТОК — БЕСПЛАТНЫЙ! ☕
              </h2>
              <p className="text-xs text-white/90 mt-1">
                Филиал: <strong className="text-white">{readyRewardBranch.branchName}</strong>. Покажите QR-код ниже бариста для списания!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Шапка профиля гостя */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-600/20">
            <Coffee className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white leading-tight">
                {user.fullName || user.email?.split('@')[0] || 'Любимый гость'}
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </div>
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
      <div
        className={`p-5 rounded-3xl bg-gradient-to-br ${tierInfo.color} border border-white/20 shadow-2xl relative overflow-hidden text-stone-950`}
      >
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
          Покажите бариста на кассе — штамп или подарок зачислятся моментально в реальном времени!
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

      {/* Список заведений и наглядный баланс штампов */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-500" />
            <span>Ваши филиалы и карточки ({branches.length})</span>
          </h2>
          <span className="text-[11px] text-stone-500">6-й кофе бесплатно</span>
        </div>

        {branches.length > 0 ? (
          <div className="space-y-3">
            {branches.map((b) => {
              return (
                <div
                  key={b.branchId}
                  className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {b.branchName}
                      </h3>
                      <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-500" />
                        <span>{b.address || b.networkName}</span>
                      </p>
                    </div>

                    {b.rewardsAvailable > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-stone-950 text-xs font-black shadow-md animate-pulse">
                        <Gift className="w-3.5 h-3.5" />
                        {b.rewardsAvailable} кофе в подарок!
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-400">
                          {b.currentStamps} / {b.targetStamps}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          до подарка
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ЧЕТКАЯ ШКАЛА ШТАМПОВ С ЯСНОЙ ИНДИКАЦИЕЙ 6-ГО ПОДАРКА */}
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {Array.from({ length: b.targetStamps }, (_, i) => {
                      const isEarned = i < b.currentStamps;
                      const isLastGiftSlot = i === b.targetStamps - 1;

                      return (
                        <div
                          key={i}
                          className={`h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                            isEarned
                              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                              : isLastGiftSlot
                              ? 'bg-amber-500/10 border-2 border-dashed border-amber-500 text-amber-400'
                              : 'bg-stone-950 border border-stone-800 text-stone-600'
                          }`}
                        >
                          {isEarned ? (
                            <Coffee className="w-4 h-4 stroke-[2.5]" />
                          ) : isLastGiftSlot ? (
                            <Gift className="w-4 h-4 animate-bounce" />
                          ) : (
                            <span>{i + 1}</span>
                          )}
                          <span className="text-[8px] font-extrabold uppercase mt-0.5">
                            {isLastGiftSlot ? 'ПРИЗ!' : `${i + 1}й`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/50">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Gift className="w-3 h-3" />
                      {b.rewardTitle}
                    </span>
                    <Link
                      href={`/card/${b.branchSlug}`}
                      className="text-stone-300 hover:text-white flex items-center gap-0.5 font-medium"
                    >
                      <span>Открыть карту</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
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

      {/* ИСТОРИЯ ВИЗИТОВ И НАЧИСЛЕНИЙ (ПОНЯТНО, ЧТО И КОГДА ПОЛУЧЕНО) */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 px-1">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>История штампов и подарков</span>
        </h2>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h) => {
              const isGift = h.type === 'REDEEM_REWARD';
              return (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isGift
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {isGift ? (
                        <Gift className="w-3.5 h-3.5" />
                      ) : (
                        <Coffee className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        {isGift
                          ? 'Получен бесплатный напиток'
                          : 'Начислен +1 штамп'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {h.branchName}
                        {h.baristaName && ` • ${h.baristaName}`}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(h.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-stone-950/40 border border-stone-800/50 text-center text-[11px] text-stone-500">
            История операций пока пуста
          </div>
        )}
      </div>
    </div>
  );
};
