'use client';

import React, { useState } from 'react';
import { login, signUp } from './actions';
import { createClient } from '@/lib/supabase/client';
import {
  Coffee,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = isSignUp ? await signUp(formData) : await login(formData);

    if (result && 'error' in result && result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result && 'success' in result && result.success) {
      setSuccess(result.success);
      setIsSignUp(false);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (oauthError) {
        if (
          oauthError.message.toLowerCase().includes('not enabled') ||
          oauthError.message.toLowerCase().includes('unsupported')
        ) {
          setError(
            'Провайдер Google еще не активирован в вашей панели Supabase (Auth -> Providers -> Google). Пожалуйста, включите его или используйте вход по Email.'
          );
        } else {
          setError(`Ошибка Google: ${oauthError.message}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Ошибка подключения Google: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Верхняя навигация */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Staff Portal
        </span>
      </header>

      {/* Основной блок формы */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-8">
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Декоративное фоновое янтарное свечение */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Заголовок */}
          <div className="text-center space-y-2 mb-5 relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-600/20 mb-1">
              <Coffee className="w-6 h-6 stroke-[2.3]" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {isSignUp ? 'Регистрация владельца' : 'Вход для персонала'}
            </h1>
            <p className="text-xs text-stone-400">
              {isSignUp
                ? 'Создайте сеть и начните начислять штампы'
                : 'Панель аналитики сети и терминал бариста'}
            </p>
          </div>

          {/* Переключатель табов Вход / Регистрация */}
          <div className="flex p-1 rounded-2xl bg-stone-950/80 border border-stone-800 mb-5 relative">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Ошибка авторизации */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Уведомление об успехе */}
          {success && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Форма входа / регистрации */}
          <form onSubmit={handleSubmit} className="space-y-3.5 relative">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300 block">
                  Ваше имя или название заведения
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Алексей (Кофейня CoffeeHub)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                  />
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Поле Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 block">
                Электронная почта
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="owner@coffee.ru"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Поле Пароль */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 block">
                Пароль
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-stone-950 font-bold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>
                {loading
                  ? 'Обработка...'
                  : isSignUp
                  ? 'Зарегистрировать сеть'
                  : 'Войти в систему'}
              </span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Вход через Google */}
          <div className="mt-4 pt-4 border-t border-stone-800/80">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-3.5 rounded-xl bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Войти через Google</span>
            </button>
          </div>

          {/* Информационная плашка */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Защищенная авторизация Supabase Cloud Auth
            </p>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub POS Security • Защищенное соединение
      </footer>
    </div>
  );
}
