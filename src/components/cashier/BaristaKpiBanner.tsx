'use client';

import React from 'react';
import { Target, Award, Sparkles, TrendingUp } from 'lucide-react';

interface BaristaKpiBannerProps {
  baristaName?: string | null;
  branchName?: string | null;
  monthStamps: number;
  targetCount: number;
  rewardTitle: string;
}

export const BaristaKpiBanner: React.FC<BaristaKpiBannerProps> = ({
  baristaName,
  branchName,
  monthStamps,
  targetCount = 500,
  rewardTitle = 'Премия месяца',
}) => {
  const percent = Math.min(100, Math.round((monthStamps / targetCount) * 100));
  const remaining = Math.max(0, targetCount - monthStamps);
  const isCompleted = monthStamps >= targetCount;

  return (
    <div className="w-full p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-900 border border-amber-500/30 shadow-xl space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Мой KPI за месяц
            </span>
            <span className="text-xs font-bold text-white">
              {branchName || 'Филиал кофейни'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-stone-400 block">Бонус:</span>
          <span className="text-xs font-black text-amber-400">
            {rewardTitle}
          </span>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-stone-300 font-medium">
            Выдано: <strong className="text-white font-mono">{monthStamps}</strong> из {targetCount}
          </span>
          <span
            className={`font-bold font-mono ${
              isCompleted ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isCompleted ? '100% ВЫПОЛНЕНО!' : `${percent}%`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="text-[10px] text-stone-400 text-center font-medium">
        {isCompleted ? (
          <span className="text-emerald-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Поздравляем! Вы выполнили цель и заработали премию!
          </span>
        ) : (
          <span>До получения премии осталось выдать {remaining} штампов</span>
        )}
      </div>
    </div>
  );
};
