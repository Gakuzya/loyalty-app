import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScanView } from '@/components/cashier/ScanView';
import { BaristaKpiBanner } from '@/components/cashier/BaristaKpiBanner';
import { Coffee, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default async function CashierScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Находим сотрудника и его филиал
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

  // 2. Считаем штампы, выданные этим бариста в текущем месяце
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthStamps = await prisma.transaction.count({
    where: {
      baristaId: user.id,
      type: 'EARN_STAMP',
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  const activeKpi = dbUser?.branch?.network?.kpiTargets[0] || null;
  const targetCount = activeKpi ? activeKpi.targetCount : 500;
  const rewardTitle = activeKpi ? activeKpi.reward : 'Премия за 500 штампов';

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Верхняя навигационная панель */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Терминал кассы
        </span>
      </header>

      {/* Основной контент */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-4 py-4">
        {/* Баннер личного KPI бариста */}
        <BaristaKpiBanner
          baristaName={dbUser?.name}
          branchName={dbUser?.branch?.name || 'Филиал сети'}
          monthStamps={monthStamps}
          targetCount={targetCount}
          rewardTitle={rewardTitle}
        />

        {/* Сканер камеры */}
        <ScanView />
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        Бариста: {user.email} • LoyaltyHub POS
      </footer>
    </div>
  );
}
