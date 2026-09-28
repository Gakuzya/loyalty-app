'use client';

import React, { useActionState } from 'react';
import { addStaffMember } from '@/app/(dashboard)/staff/actions';
import { UserPlus, Mail, User, Store, CheckCircle2, AlertCircle } from 'lucide-react';

interface StaffFormProps {
  branches: {
    id: string;
    name: string;
  }[];
}

export const StaffForm: React.FC<StaffFormProps> = ({ branches }) => {
  const [state, formAction, isPending] = useActionState(addStaffMember, null);

  return (
    <form action={formAction} className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4 select-none">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <UserPlus className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Добавить сотрудника (Бариста)</h3>
          <p className="text-[11px] text-stone-400">Сотрудник получит доступ к терминалу сканирования филиала</p>
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
            Email бариста
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              required
              placeholder="barista@coffee.ru"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <Mail className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Имя сотрудника
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="Дмитрий (Старший бариста)"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <User className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Филиал работы
          </label>
          <div className="relative">
            <select
              name="branchId"
              required
              defaultValue={branches[0]?.id || ''}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white outline-none transition-all cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Store className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending || branches.length === 0}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isPending ? 'Добавление...' : 'Назначить бариста'}</span>
        </button>
      </div>
    </form>
  );
};
