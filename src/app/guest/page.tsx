import React from 'react';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { GuestPortalAuth } from '@/components/guest/GuestPortalAuth';
import { GuestPortalView } from '@/components/guest/GuestPortalView';
import { calculateCustomerStamps, calculateTier } from '@/lib/loyalty';
import { logout } from '@/app/login/actions';
import { Coffee, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function GuestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Если гость не авторизован — показываем экран входа/регистрации гостя
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
        <header className="max-w-sm mx-auto w-full flex items-center justify-center py-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
              LoyaltyHub Guest Pass
            </span>
          </div>
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

  // Находим пользователя в БД
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

  // Строгая изоляция: если аккаунт принадлежит Владельцу или Бариста — перенаправляем в их панель
  if (dbUser?.role === 'OWNER') {
    redirect('/dashboard');
  } else if (dbUser?.role === 'BARISTA') {
    redirect('/scan');
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

  const initialHistory = transactions.slice(0, 8).map((tx) => ({
    id: tx.id,
    type: tx.type,
    branchName: tx.branch.name,
    createdAt: tx.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Шапка гостевого кабинета: только информация о карте и кнопка выхода */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2 border-b border-stone-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">
              {dbUser?.name || 'Гость кофейни'}
            </span>
            <span className="text-[10px] text-amber-500">
              Карта лояльности
            </span>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-500/10 border border-stone-800 text-stone-400 hover:text-rose-400 text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </form>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-2">
        <GuestPortalView
          user={{
            id: user.id,
            email: user.email,
            fullName: dbUser?.name || user.user_metadata?.full_name,
            tier: currentTier,
            totalStamps,
          }}
          branches={branches}
          initialHistory={initialHistory}
        />
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-stone-500 py-2">
        LoyaltyHub Pass • Персональный QR-код для начисления бонусов
      </footer>
    </div>
  );
}
