'use client';

import React, { useActionState, useState } from 'react';
import { createBranch } from '@/app/(dashboard)/branches/actions';
import { Store, MapPin, Link as LinkIcon, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export const BranchForm: React.FC = () => {
  const [state, formAction, isPending] = useActionState(createBranch, null);
  const [slugPreview, setSlugPreview] = useState('');

  return (
    <form action={formAction} className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4 select-none">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Добавить новый филиал</h3>
          <p className="text-[11px] text-stone-400">Каждый филиал получает персональную ссылку для гостей и терминал</p>
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
            Название точки
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              required
              placeholder="Филиал на Покровке"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <Store className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Адрес филиала
          </label>
          <div className="relative">
            <input
              type="text"
              name="address"
              placeholder="ул. Покровская, 22"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <MapPin className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Уникальный Slug ссылки
          </label>
          <div className="relative">
            <input
              type="text"
              name="slug"
              required
              onChange={(e) => setSlugPreview(e.target.value.toLowerCase().trim())}
              placeholder="pokrovka"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all font-mono"
            />
            <LinkIcon className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <span className="text-[11px] text-stone-500 font-mono">
          Ссылка гостя: /card/{slugPreview || 'vash-slug'}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{isPending ? 'Создание...' : 'Добавить филиал'}</span>
        </button>
      </div>
    </form>
  );
};
