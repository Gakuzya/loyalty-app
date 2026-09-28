'use client';

import React, { useActionState } from 'react';
import { updateNetworkSettings } from '@/app/(dashboard)/settings/actions';
import {
  Building2,
  Award,
  Gift,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SettingsFormProps {
  initialNetwork: {
    id: string;
    name: string;
    targetStamps: number;
    rewardTitle: string;
  };
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ initialNetwork }) => {
  const [state, formAction, isPending] = useActionState(updateNetworkSettings, null);

  return (
    <form action={formAction} className="space-y-6 select-none max-w-2xl">
      {/* Уведомление об ошибке */}
      {state?.error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Уведомление об успехе */}
      {state?.success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.success}</span>
        </div>
      )}

      {/* Блок 1: Основная информация */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-500" />
          <span>Информация о сети</span>
        </h2>

        <div className="space-y-4">
          {/* Поле: Название */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 block">
              Название сети кофеен или пекарен
            </label>
            <input
              type="text"
              name="name"
              defaultValue={initialNetwork.name}
              required
              placeholder="Coffee Hub Network"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Блок 2: Настройки правил программы лояльности */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Правила программы лояльности сети</span>
        </h2>

        <div className="space-y-4">
          {/* Поле: Количество штампов для подарка */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 block">
              Количество штампов для получения подарка во всех филиалах
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[6, 8, 10].map((num) => (
                <label
                  key={num}
                  className="flex items-center justify-center p-3 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/50 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-400 text-xs font-bold text-stone-300 transition-all"
                >
                  <input
                    type="radio"
                    name="targetStamps"
                    value={num}
                    defaultChecked={initialNetwork.targetStamps === num}
                    className="sr-only"
                  />
                  <span>{num} штампов</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Классический стандарт для кофеен — 6 или 10 штампов (где последний слот — подарок).
            </p>
          </div>

          {/* Поле: Название подарка */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 block">
              Название подарка за закрытую карточку
            </label>
            <div className="relative">
              <input
                type="text"
                name="rewardTitle"
                defaultValue={initialNetwork.rewardTitle}
                required
                placeholder="Любой напиток любого объёма в подарок"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
              />
              <Gift className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all shadow-lg shadow-amber-600/20 cursor-pointer active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? 'Сохранение...' : 'Сохранить изменения'}</span>
        </button>
      </div>
    </form>
  );
};
