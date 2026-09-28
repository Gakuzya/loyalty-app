'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Coffee,
  Gift,
  QrCode,
  Store,
  ChevronRight,
  LogOut,
  Sparkles,
  MapPin,
  Copy,
  Check,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/app/login/actions';

interface CardItem {
  id: string;
  currentStamps: number;
  totalStampsEarned: number;
  rewardsAvailable: number;
  shop: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    targetStamps: number;
    rewardTitle: string;
  };
}

interface GuestPortalViewProps {
  user: {
    id: string;
    email?: string;
    fullName?: string | null;
  };
  cards: CardItem[];
}

export const GuestPortalView: React.FC<GuestPortalViewProps> = ({
  user,
  cards,
}) => {
  const [copied, setCopied] = useState(false);
  const guestQrValue = `guest:${user.id}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 select-none">
      {/* Шапка гостя */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-600/20">
            <Coffee className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {user.fullName || user.email?.split('@')[0] || 'Любимый гость'}
            </h1>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-[180px]">
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

      {/* Центральный блок: ЕДИНЫЙ БОЛЬШОЙ QR-КОД ГОСТЯ */}
      <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Ваш универсальный QR-код
        </div>

        {/* Белая контрастная подложка под QR-код */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-black/50 ring-4 ring-amber-500/20 mb-4 transition-transform hover:scale-105">
          <QRCodeSVG
            value={guestQrValue}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-xs text-stone-200 font-medium max-w-xs">
          Покажите этот код на кассе в любой кофейне-партнере для начисления штампа
        </p>

        {/* Код буквами для ручного ввода */}
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

      {/* Список заведений и накопленных штампов */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-500" />
            <span>Ваши карты лояльности ({cards.length})</span>
          </h2>
          <span className="text-[11px] text-stone-500">Штампы и подарки</span>
        </div>

        {cards.length > 0 ? (
          <div className="space-y-3">
            {cards.map((card) => {
              const target = card.shop.targetStamps;
              const current = card.currentStamps;
              const percent = Math.min(100, Math.round((current / target) * 100));

              return (
                <Link
                  key={card.id}
                  href={`/card/${card.shop.slug}`}
                  className="block p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/40 hover:bg-stone-900 transition-all duration-300 shadow-md group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {card.shop.name}
                      </h3>
                      {card.shop.address && (
                        <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-500" />
                          <span>{card.shop.address}</span>
                        </p>
                      )}
                    </div>

                    {card.rewardsAvailable > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-pulse">
                        <Gift className="w-3.5 h-3.5" />
                        {card.rewardsAvailable} кофе в подарок!
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-400">
                          {current} / {target}
                        </span>
                        <span className="text-[10px] text-stone-500 block">штампов</span>
                      </div>
                    )}
                  </div>

                  {/* Мини-кружки штампов */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-stone-800/60">
                    {Array.from({ length: target }, (_, i) => {
                      const isEarned = i < current;
                      const isLast = i === target - 1;
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
              У вас пока нет активных карт
            </p>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
              Покажите QR-код бариста при покупке кофе, и заведение автоматически появится в вашем списке!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
