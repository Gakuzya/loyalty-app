'use client';

import React, { useState } from 'react';
import { login } from './actions';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
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
          <div className="text-center space-y-2 mb-6 relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-600/20 mb-1">
              <Coffee className="w-6 h-6 stroke-[2.3]" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Вход для персонала
            </h1>
            <p className="text-xs text-stone-400">
              Доступ к панели владельца и сканеру бариста
            </p>
          </div>

          {/* Ошибка авторизации */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Форма входа */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {/* Поле Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 block">
                Электронная почта
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="barista@coffee.ru"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Поле Пароль */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 block">
                Пароль
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
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
              <span>{loading ? 'Проверка данных...' : 'Войти в систему'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Информационная плашка */}
          <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Авторизация через Supabase Cloud Auth
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
