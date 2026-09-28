'use client';

import React, { useActionState, useState } from 'react';
import { addStaffMember } from '@/app/(dashboard)/staff/actions';
import {
  UserPlus,
  Mail,
  User,
  Store,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';

interface StaffFormProps {
  branches: {
    id: string;
    name: string;
  }[];
}

export const StaffForm: React.FC<StaffFormProps> = ({ branches }) => {
  const [state, formAction, isPending] = useActionState(addStaffMember, null);
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = (email: string, pass: string, branch: string) => {
    const text = `Привет! Вот твои доступы к сканеру бариста в LoyaltyHub:\nВход: ${window.location.origin}/login\nEmail: ${email}\nПароль: ${pass}\nФилиал: ${branch}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <form
      action={formAction}
      className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4 select-none"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <UserPlus className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            Добавить сотрудника (Бариста)
          </h3>
          <p className="text-[11px] text-stone-400">
            Сотрудник получит доступ к сканеру QR-кодов и начислению штампов
          </p>
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

      {/* Карточка созданных доступов для отправки сотруднику */}
      {state?.credentials && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Доступы для бариста готовы
            </span>
            <button
              type="button"
              onClick={() =>
                handleCopyCredentials(
                  state.credentials.email,
                  state.credentials.password,
                  state.credentials.branchName
                )
              }
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-stone-950" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать текст для бариста</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] text-stone-500 block">Логин (Email)</span>
              <span className="font-mono text-stone-200 font-semibold truncate block">
                {state.credentials.email}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] text-stone-500 block">Пароль</span>
              <span className="font-mono text-amber-400 font-bold block">
                {state.credentials.password}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] text-stone-500 block">Филиал</span>
              <span className="text-stone-300 font-semibold truncate block">
                {state.credentials.branchName}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              placeholder="Дмитрий"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <User className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Пароль для входа
          </label>
          <div className="relative">
            <input
              type="text"
              name="password"
              defaultValue="coffee2026"
              required
              minLength={6}
              placeholder="coffee2026"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all font-mono"
            />
            <Lock className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
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
