import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Settings,
  Coffee,
  QrCode,
  Store,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col md:flex-row">
      {/* Боковая панель для десктопа (Sidebar) */}
      <aside className="w-full md:w-64 bg-stone-900/90 border-b md:border-b-0 md:border-r border-stone-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Логотип и заголовок */}
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

          {/* Быстрые ссылки на клиентскую часть и сканер */}
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

            <Link
              href="/card/surf-coffee"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-medium transition-all"
            >
              <span className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Карта кофейни</span>
              </span>
              <ExternalLink className="w-3 h-3 text-stone-500" />
            </Link>
          </div>
        </div>

        {/* Подвал сайдбара */}
        <div className="pt-4 border-t border-stone-800/60 text-[11px] text-stone-500 text-center md:text-left">
          <p>© 2026 LoyaltyHub Cloud</p>
        </div>
      </aside>

      {/* Основная рабочая область */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
