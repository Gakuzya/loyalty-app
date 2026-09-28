'use client';

import React, { useState } from 'react';
import { signUp, quickGoogleLogin } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/client';
import {
  Coffee,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  Eye,
  EyeOff,
  Store,
  QrCode,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [role, setRole] = useState<'OWNER' | 'CUSTOMER'>('OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Состояние модального окна Google
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleModalLoading, setGoogleModalLoading] = useState(false);
  const [googleModalError, setGoogleModalError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Введенные пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('role', role);

    const result = await signUp(formData);

    if (result && 'error' in result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const targetNext = role === 'OWNER' ? '/dashboard' : '/guest';
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${targetNext}`,
        },
      });

      if (oauthError) {
        if (
          oauthError.message.toLowerCase().includes('not enabled') ||
          oauthError.message.toLowerCase().includes('unsupported')
        ) {
          // Открываем модалку быстрого входа
          setShowGoogleModal(true);
        } else {
          setError(`Ошибка Google: ${oauthError.message}`);
        }
      }
    } catch (err: unknown) {
      setShowGoogleModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleModalError(null);
    setGoogleModalLoading(true);

    const res = await quickGoogleLogin(googleEmail, role);
    if (res && 'error' in res && res.error) {
      setGoogleModalError(res.error);
      setGoogleModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none relative">
      {/* МОДАЛЬНОЕ ОКНО БЫСТРОГО ВХОДА С GOOGLE EMAIL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 animate-scaleUp">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0">
                <svg className="w-full h-full" viewBox="0 0 24 24">
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
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Вход под вашим Google Email
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Быстрый вход в 1 клик без паролей
                </p>
              </div>
            </div>

            {googleModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{googleModalError}</span>
              </div>
            )}

            <form onSubmit={handleQuickGoogleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300 block">
                  Ваш Google Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={googleModalLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {googleModalLoading
                  ? 'Вход...'
                  : 'Войти под этим Google Email в 1 клик'}
              </button>
            </form>

            <div className="pt-3 border-t border-stone-800 text-[10px] text-stone-500 space-y-1">
              <span className="font-semibold text-stone-400 block">
                Примечание разработчику:
              </span>
              <p>
                Официальный OAuth Google включается в панели Supabase: Auth → Providers → Google (Client ID + Secret).
              </p>
            </div>
          </div>
        </div>
      )}

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
          Регистрация в LoyaltyHub
        </span>
      </header>

      {/* Основной блок формы */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-6">
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Декоративное фоновое янтарное свечение */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Заголовок */}
          <div className="text-center space-y-1.5 mb-5 relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-600/20 mb-1">
              <Coffee className="w-6 h-6 stroke-[2.3]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Создать аккаунт
            </h1>
            <p className="text-xs text-stone-400">
              Быстрая регистрация без подтверждения по ссылкам
            </p>
          </div>

          {/* ВЫБОР РОЛИ: ВЛАДЕЛЕЦ ИЛИ ГОСТЬ */}
          <div className="space-y-1.5 mb-5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Тип аккаунта
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  role === 'OWNER'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-950/20'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Store
                    className={`w-4 h-4 ${
                      role === 'OWNER' ? 'text-amber-400' : 'text-stone-500'
                    }`}
                  />
                  {role === 'OWNER' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block">Владелец сети</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5 leading-tight">
                    Кофейня, аналитика, персонал
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  role === 'CUSTOMER'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-950/20'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <QrCode
                    className={`w-4 h-4 ${
                      role === 'CUSTOMER' ? 'text-amber-400' : 'text-stone-500'
                    }`}
                  />
                  {role === 'CUSTOMER' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block">Гость кофейни</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5 leading-tight">
                    QR-код, копить 6 штампов
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Форма регистрации */}
          <form onSubmit={handleSubmit} className="space-y-3.5 relative">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 block">
                {role === 'OWNER'
                  ? 'Ваше имя или название заведения'
                  : 'Ваше имя'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={
                    role === 'OWNER'
                      ? 'Алексей (Surf Coffee)'
                      : 'Константин'
                  }
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                />
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 block">
                Электронная почта
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 block">
                Пароль (минимум 6 символов)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                Подтверждение пароля
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all font-mono"
                />
                <ShieldCheck className="w-4 h-4 text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>
                {loading
                  ? 'Создание аккаунта...'
                  : role === 'OWNER'
                  ? 'Зарегистрировать сеть и войти'
                  : 'Получить карту гостя'}
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
              <span>Зарегистрироваться через Google</span>
            </button>
          </div>

          {/* Ссылка на вход */}
          <div className="mt-5 text-center">
            <span className="text-xs text-stone-400">
              Уже есть учетная запись?{' '}
              <Link
                href="/login"
                className="text-amber-400 font-bold hover:underline"
              >
                Войти
              </Link>
            </span>
          </div>
        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub Security • Защищенная регистрация
      </footer>
    </div>
  );
}
