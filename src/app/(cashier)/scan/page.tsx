import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScanView } from '@/components/cashier/ScanView';
import { BaristaKpiBanner } from '@/components/cashier/BaristaKpiBanner';
import { logout } from '@/app/login/actions';
import {
  Coffee,
  ShieldCheck,
  LogOut,
  Clock,
  Gift,
  Store,
  User,
} from 'lucide-react';

export default async function CashierScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Находим сотрудника и строго проверяем роль BARISTA
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      branch: {
        include: {
          network: {
            include: {
              kpiTargets: {
                orderBy: { activeMonth: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!dbUser || dbUser.role !== 'BARISTA') {
    if (dbUser?.role === 'OWNER') {
      redirect('/dashboard');
    }
    // Если гость — перенаправляем строго в кабинет гостя
    redirect('/guest');
  }

  // 2. Считаем штампы, выданные этим бариста в текущем месяце
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthStamps, recentBaristaTransactions] = await Promise.all([
    prisma.transaction.count({
      where: {
        baristaId: user.id,
        type: 'EARN_STAMP',
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        baristaId: user.id,
      },
      include: {
        customer: true,
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    }),
  ]);

  const activeKpi = dbUser.branch?.network?.kpiTargets[0] || null;
  const targetCount = activeKpi ? activeKpi.targetCount : 500;
  const rewardTitle = activeKpi ? activeKpi.reward : 'Премия за 500 штампов';

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Верхняя панель терминала кассы */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2 border-b border-stone-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">
              {dbUser.name || 'Бариста'}
            </span>
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Store className="w-3 h-3 text-amber-500" />
              {dbUser.branch?.name || 'Филиал сети'}
            </span>
          </div>
        </div>

        {/* Кнопка выхода из терминала */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-500/10 border border-stone-800 text-stone-400 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </form>
      </header>

      {/* Основной контент терминала */}
      <main className="flex-1 flex flex-col items-center max-w-md mx-auto w-full space-y-4 py-2">
        {/* Баннер личного KPI бариста */}
        <BaristaKpiBanner
          baristaName={dbUser.name}
          branchName={dbUser.branch?.name || 'Филиал сети'}
          monthStamps={monthStamps}
          targetCount={targetCount}
          rewardTitle={rewardTitle}
        />

        {/* Сканер камеры и ручной ввод кода гостя */}
        <ScanView />

        {/* История выданных штампов этим сотрудником */}
        <div className="w-full p-4 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">
                Моя история штампов
              </h3>
            </div>
            <span className="text-[10px] text-stone-400 font-medium">
              Последние смены
            </span>
          </div>

          <div className="space-y-2">
            {recentBaristaTransactions.length > 0 ? (
              recentBaristaTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                        tx.type === 'REDEEM_REWARD'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {tx.type === 'REDEEM_REWARD' ? (
                        <Gift className="w-3.5 h-3.5" />
                      ) : (
                        <Coffee className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-stone-200 block">
                        {tx.type === 'REDEEM_REWARD'
                          ? 'Выдан напиток'
                          : '+1 штамп начислен'}
                      </span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-stone-500" />
                        {tx.customer?.name ||
                          tx.customer?.email?.split('@')[0] ||
                          'Гость'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold block ${
                        tx.type === 'EARN_STAMP'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'EARN_STAMP' ? '+1' : 'Подарок'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(tx.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-stone-500">
                Вы пока не провели ни одного сканирования в этой смене.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-stone-500 py-2">
        Сотрудник: {dbUser.email} • LoyaltyHub POS Terminal
      </footer>
    </div>
  );
}
