'use client';

import React, { useState } from 'react';
import { requestPasswordReset, resetPassword } from '@/app/login/actions';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [directLink, setDirectLink] = useState<string | null>(null);

  // Состояние формы установки нового пароля
  const [isResetStep, setIsResetStep] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Шаг 1: Запрос сброса по email
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await requestPasswordReset(email);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res && 'success' in res && res.success) {
        setSuccess(
          `Запрос успешно сформирован для ${res.email}. Письмо отправлено на почту!`
        );
        if (res.directLink) {
          setDirectLink(res.directLink);
        }
        setIsResetStep(true);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Ошибка: ${msg}`);
      setLoading(false);
    }
  };

  // Шаг 2: Установка нового пароля
  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Введенные пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setResetLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    const res = await resetPassword(formData);
    if (res && 'error' in res && res.error) {
      setError(res.error);
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none relative">
      {/* Верхняя навигация */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Ко входу</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Сброс пароля
        </span>
      </header>

      {/* Основной блок */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-8">
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Декоративное фоновое янтарное свечение */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Заголовок */}
          <div className="text-center space-y-2 mb-6 relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-600/20 mb-1">
              <KeyRound className="w-6 h-6 stroke-[2.3]" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Восстановление пароля
            </h1>
            <p className="text-xs text-stone-400">
              {!isResetStep
                ? 'Укажите email, к которому привязан ваш аккаунт'
                : 'Задайте новый надежный пароль'}
            </p>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Успех */}
          {success && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{success}</span>
                {directLink && (
                  <a
                    href={directLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[11px] text-amber-400 underline font-semibold mt-1 hover:text-amber-300"
                  >
                    Прямая ссылка подтверждения →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ШАГ 1: Ввод email */}
          {!isResetStep ? (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300 block">
                  Ваш Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>{loading ? 'Поиск аккаунта...' : 'Сбросить пароль'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          ) : (
            /* ШАГ 2: Установка нового пароля */
            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 text-[11px] text-stone-300 flex items-center justify-between">
                <span>
                  Аккаунт: <strong className="text-white">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsResetStep(false)}
                  className="text-amber-400 hover:underline text-[10px]"
                >
                  Изменить
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300 block">
                  Новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300 block">
                  Повторите новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all font-mono"
                  />
                  <ShieldCheck className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3.5 top-2.5 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>
                  {resetLoading
                    ? 'Сохранение пароля...'
                    : 'Сохранить новый пароль и войти'}
                </span>
                {!resetLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}

          {/* Ссылка на вход */}
          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-xs text-amber-400 font-bold hover:underline"
            >
              Вернуться ко входу
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Безопасный сброс через Supabase Auth
            </p>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub Security • Безопасное восстановление доступа
      </footer>
    </div>
  );
}
