'use client';

import React, { useActionState } from 'react';
import { createKpiTarget } from '@/app/(dashboard)/kpi/actions';
import { Target, Award, Sparkles, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export const KpiForm: React.FC = () => {
  const [state, formAction, isPending] = useActionState(createKpiTarget, null);

  return (
    <form action={formAction} className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4 select-none">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Установить цель KPI на текущий месяц</h3>
          <p className="text-[11px] text-stone-400">Бариста видят свой прогресс-бар и премию прямо в терминале кассы</p>
        </div>
      </div>

      {state?.error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Название цели
          </label>
          <div className="relative">
            <input
              type="text"
              name="title"
              required
              placeholder="Выдать 500 штампов гостям"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <Target className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Целевое кол-во штампов
          </label>
          <input
            type="number"
            name="targetCount"
            required
            min={10}
            defaultValue={500}
            className="w-full px-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Бонус / Премия за выполнение
          </label>
          <div className="relative">
            <input
              type="text"
              name="reward"
              required
              placeholder="Премия 5000 ₽ или 25 000 ₸"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <Award className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isPending ? 'Активация...' : 'Активировать KPI цель'}</span>
        </button>
      </div>
    </form>
  );
};
