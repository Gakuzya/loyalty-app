import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { calculateCustomerStamps, calculateTier } from '@/lib/loyalty';
import { analyzeGuest } from '@/lib/analytics';
import { CashierActionView } from '@/components/cashier/CashierActionView';

interface ActionPageProps {
  params: Promise<{
    qrToken: string;
  }>;
}

export default async function ActionPage({ params }: ActionPageProps) {
  const { qrToken: rawQrToken } = await params;
  const qrToken = decodeURIComponent(rawQrToken);

  // 1. Проверяем авторизацию сотрудника
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // 2. Находим текущего сотрудника в базе и определяем его филиал
  const baristaUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      branch: {
        include: { network: true },
      },
      network: {
        include: { branches: true },
      },
    },
  });

  if (baristaUser?.role === 'CUSTOMER') {
    redirect('/guest');
  }

  // Филиал, в котором работает бариста (или первый филиал сети владельца)
  let activeBranch = baristaUser?.branch;
  if (!activeBranch && baristaUser?.network?.branches?.length) {
    activeBranch = {
      ...baristaUser.network.branches[0],
      network: baristaUser.network,
    };
  }

  if (!activeBranch) {
    const fallbackBranch = await prisma.branch.findFirst({
      include: { network: true },
    });
    activeBranch = fallbackBranch;
  }

  if (!activeBranch) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <h1 className="text-xl font-bold text-white mb-2">Филиал не найден</h1>
        <p className="text-xs text-stone-400 max-w-xs mb-6">
          Создайте хотя бы один филиал в панели владельца для работы кассы.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-2xl bg-amber-500 text-stone-950 text-xs font-bold"
        >
          В дашборд
        </Link>
      </div>
    );
  }

  // 3. Извлекаем ID клиента
  const customerId = qrToken.replace('guest:', '').trim();

  let customer = await prisma.user.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        id: customerId,
        email: `guest-${customerId.slice(0, 8)}@loyaltyhub.local`,
        name: `Гость #${customerId.slice(0, 4)}`,
        role: 'CUSTOMER',
      },
    });
  }

  // 4. Загружаем транзакции клиента в данном филиале и по всей сети
  const [branchTransactions, allGuestTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        branchId: activeBranch.id,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.transaction.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const stats = calculateCustomerStamps(
    branchTransactions,
    activeBranch.network.targetStamps
  );

  const guestAnalytics = analyzeGuest(
    customer.id,
    allGuestTransactions,
    activeBranch.network.targetStamps
  );
  const guestTier = calculateTier(guestAnalytics.totalEarned);

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/scan"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>К сканеру</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Карта гостя найдена
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-4">
        <CashierActionView
          customer={{
            id: customer.id,
            name: customer.name || 'Любимый гость',
            email: customer.email,
            tier: guestTier,
            totalStamps: guestAnalytics.totalEarned,
          }}
          branch={{
            id: activeBranch.id,
            name: activeBranch.name,
            targetStamps: activeBranch.network.targetStamps,
            rewardTitle: activeBranch.network.rewardTitle,
          }}
          initialStats={{
            currentStamps: stats.currentStamps,
            rewardsAvailable: stats.rewardsAvailable,
          }}
          initialAnalytics={guestAnalytics}
          baristaEmail={authUser.email}
        />
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        Оператор: {authUser.email} • {activeBranch.name}
      </footer>
    </div>
  );
}
