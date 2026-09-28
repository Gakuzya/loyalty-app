import React from 'react';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { GuestPortalAuth } from '@/components/guest/GuestPortalAuth';
import { GuestPortalView } from '@/components/guest/GuestPortalView';
import { calculateCustomerStamps, calculateTier } from '@/lib/loyalty';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function GuestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Если гость не авторизован — показываем экран входа/регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
        <header className="max-w-sm mx-auto w-full flex items-center justify-between py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>На главную</span>
          </Link>
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Гостевой доступ
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center py-6">
          <GuestPortalAuth />
        </main>

        <footer className="max-w-sm mx-auto w-full text-center text-[11px] text-stone-500 py-2">
          LoyaltyHub • Ваши кофейни в одном кармане
        </footer>
      </div>
    );
  }

  // Синхронизируем пользователя в БД с ролью CUSTOMER
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser && user.email) {
    dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split('@')[0],
        role: 'CUSTOMER',
      },
    });
  }

  // Загружаем все транзакции гостя
  const transactions = await prisma.transaction.findMany({
    where: {
      customerId: user.id,
    },
    include: {
      branch: {
        include: {
          network: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Расчет общего количества накопленных штампов и текущего уровня (Tier)
  const totalStamps = transactions.filter((t) => t.type === 'EARN_STAMP').length;
  const currentTier = calculateTier(totalStamps);

  // Синхронизируем уровень в БД, если изменился
  if (dbUser && dbUser.tier !== currentTier) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tier: currentTier },
    });
  }

  // Группируем транзакции по филиалам для отображения карточек
  const branchMap = new Map<
    string,
    {
      branch: (typeof transactions)[0]['branch'];
      txs: typeof transactions;
    }
  >();

  for (const tx of transactions) {
    if (!branchMap.has(tx.branchId)) {
      branchMap.set(tx.branchId, {
        branch: tx.branch,
        txs: [],
      });
    }
    branchMap.get(tx.branchId)!.txs.push(tx);
  }

  const branches = Array.from(branchMap.values()).map(({ branch, txs }) => {
    const stats = calculateCustomerStamps(txs, branch.network.targetStamps);
    return {
      branchId: branch.id,
      branchName: branch.name,
      branchSlug: branch.slug,
      networkName: branch.network.name,
      address: branch.address,
      targetStamps: branch.network.targetStamps,
      rewardTitle: branch.network.rewardTitle,
      currentStamps: stats.currentStamps,
      totalEarned: stats.totalEarned,
      rewardsAvailable: stats.rewardsAvailable,
    };
  });

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Личный кабинет
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-4">
        <GuestPortalView
          user={{
            id: user.id,
            email: user.email,
            fullName: dbUser?.name || user.user_metadata?.full_name,
            tier: currentTier,
            totalStamps,
          }}
          branches={branches}
        />
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub Pass • Цифровые штампы
      </footer>
    </div>
  );
}
