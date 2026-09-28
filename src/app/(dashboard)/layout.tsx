import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/login/actions';
import {
  BarChart3,
  Users,
  Settings,
  Coffee,
  QrCode,
  Store,
  ChevronRight,
  ExternalLink,
  LogOut,
  User,
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col md:flex-row select-none">
      {/* Боковая панель для десктопа (Sidebar) */}
      <aside className="w-full md:w-64 bg-stone-900/90 border-b md:border-b-0 md:border-r border-stone-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-600/20">
              <Coffee className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 block">
                Loyalty Hub
              </span>
              <span className="text-sm font-bold text-white leading-tight">
                Панель Владельца
              </span>
            </div>
          </div>

          {/* Навигационное меню */}
          <nav className="space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Аналитика</span>
            </Link>

            <Link
              href="/dashboard#customers"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 text-xs font-medium transition-all"
            >
              <Users className="w-4 h-4" />
              <span>База гостей</span>
            </Link>

            <Link
              href="/dashboard#settings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 text-xs font-medium transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Настройки лояльности</span>
            </Link>
          </nav>

          {/* Блок быстрого доступа */}
          <div className="pt-4 border-t border-stone-800/80 space-y-2">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest px-3 block">
              Быстрый доступ
            </span>

            <Link
              href="/scan"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-medium transition-all"
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Терминал бариста</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
            </Link>
          </div>
        </div>

        {/* Профиль и кнопка выхода внизу сайдбара */}
        <div className="pt-4 border-t border-stone-800/80 space-y-3">
          {user && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {user.email}
                </span>
                <span className="text-[10px] text-amber-500 block uppercase font-medium">
                  Владелец
                </span>
              </div>
            </div>
          )}

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-stone-400 hover:text-rose-400 text-xs font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти из аккаунта</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
