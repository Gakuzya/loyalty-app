'use client';

import React, { useState } from 'react';
import { login, signUp, quickGoogleLogin } from '@/app/login/actions';
import { useRouter } from 'next/navigation';
import {
  Coffee,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  User,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import Link from 'next/link';

export const GuestPortalAuth: React.FC = () => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1-клик Google вход
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleModalLoading, setGoogleModalLoading] = useState(false);
  const [googleModalError, setGoogleModalError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', fullName);

      if (isSignUp) {
        const res = await signUp(formData);
        if (res && 'error' in res && res.error) {
          setError(res.error);
        } else if (res && 'success' in res && res.success) {
          setSuccessMessage(res.success);
          setIsSignUp(false);
        } else {
          router.refresh();
        }
      } else {
        const res = await login(formData);
        if (res && 'error' in res && res.error) {
          setError(res.error);
        } else {
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleModalError(null);
    setGoogleModalLoading(true);

    const res = await quickGoogleLogin(googleEmail);
    if (res && 'error' in res && res.error) {
      setGoogleModalError(res.error);
      setGoogleModalLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl relative overflow-hidden backdrop-blur-xl select-none">
      {/* МОДАЛЬНОЕ ОКНО 1-КЛИК ВХОДА ЧЕРЕЗ GOOGLE */}
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
                  Быстрый вход для гостей в 1 клик
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
          </div>
        </div>
      )}

      {/* Декоративное янтарное свечение */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Заголовок */}
      <div className="text-center space-y-2 mb-6 relative">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-bold shadow-lg shadow-amber-600/20 mb-1">
          <Coffee className="w-6 h-6 stroke-[2.3]" />
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          {isSignUp ? 'Создать карту гостя' : 'Вход для гостей'}
        </h1>
        <p className="text-xs text-stone-400">
          Копите штампы во всех любимых заведениях
        </p>
      </div>

      {/* Переключатель табов Вход / Регистрация */}
      <div className="flex p-1 rounded-2xl bg-stone-950/80 border border-stone-800 mb-5 relative">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
            setSuccessMessage(null);
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
            setSuccessMessage(null);
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

      {/* Оповещения об ошибке / успехе */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleAuth} className="space-y-3.5 relative">
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-stone-300 block">
              Ваше имя
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Константин"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
              />
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-300 block">
            Электронная почта
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@mail.ru"
              required
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all"
            />
            <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-stone-300 block">
              Пароль
            </label>
            {!isSignUp && (
              <Link
                href="/forgot-password"
                className="text-[10px] text-amber-400 hover:underline"
              >
                Забыли пароль?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-xs text-white placeholder-stone-500 outline-none transition-all font-mono"
            />
            <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <span>
            {loading ? 'Секунду...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </span>
          {!loading && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </form>

      {/* Вход через Google */}
      <div className="mt-4 pt-4 border-t border-stone-800/80">
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full py-2.5 px-3.5 rounded-xl bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer"
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
          <span>Продолжить с Google в 1 клик</span>
        </button>
      </div>

      <div className="mt-4 text-center">
        <span className="text-[11px] text-stone-400">
          Владелец сети или сотрудник?{' '}
          <Link
            href="/login"
            className="text-amber-400 font-semibold hover:underline"
          >
            Вход в Staff Portal
          </Link>
        </span>
      </div>

      <div className="mt-3 text-center">
        <span className="text-[11px] text-stone-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Все кофейни в одном личном QR-коде
        </span>
      </div>
    </div>
  );
};
