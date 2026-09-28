import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Coffee,
  QrCode,
  User,
  Gift,
  AlertTriangle,
  ArrowLeft,
  Crown,
  MapPin,
} from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { calculateCustomerStamps, calculateTier, TIER_CONFIG } from '@/lib/loyalty';

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
  let baristaUser = await prisma.user.findUnique({
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

  if (!baristaUser && authUser.email) {
    baristaUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name:
          authUser.user_metadata?.full_name ||
          authUser.email.split('@')[0],
        role: 'BARISTA',
      },
      include: {
        branch: {
          include: { network: true },
        },
        network: {
          include: { branches: true },
        },
      },
    });
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
    // Резервный поиск первого филиала в системе
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
    // Пробуем найти по email или создаем временную запись
    customer = await prisma.user.create({
      data: {
        id: customerId,
        email: `guest-${customerId.slice(0, 8)}@loyaltyhub.local`,
        name: `Гость #${customerId.slice(0, 4)}`,
        role: 'CUSTOMER',
      },
    });
  }

  const validCustomer = customer;
  const validBranch = activeBranch;

  // 4. Загружаем транзакции клиента в данном филиале
  const transactions = await prisma.transaction.findMany({
    where: {
      customerId: validCustomer.id,
      branchId: validBranch.id,
    },
  });

  const stats = calculateCustomerStamps(
    transactions,
    validBranch.network.targetStamps
  );

  // 5. Все транзакции гостя по всей сети для определения Tier
  const allGuestEarnedTxs = await prisma.transaction.count({
    where: {
      customerId: validCustomer.id,
      type: 'EARN_STAMP',
    },
  });
  const guestTier = calculateTier(allGuestEarnedTxs);
  const tierInfo = TIER_CONFIG[guestTier];

  // Server Action: Начислить 1 штамп
  async function awardStamp() {
    'use server';

    const sb = await createClient();
    const {
      data: { user: currentUser },
    } = await sb.auth.getUser();

    if (!currentUser) {
      redirect('/login');
    }

    // Записываем транзакцию
    await prisma.transaction.create({
      data: {
        type: 'EARN_STAMP',
        customerId: validCustomer.id,
        baristaId: currentUser.id,
        branchId: validBranch.id,
      },
    });

    // Пересчитываем общий тир гостя
    const newTotal = allGuestEarnedTxs + 1;
    const newTier = calculateTier(newTotal);
    if (newTier !== validCustomer.tier) {
      await prisma.user.update({
        where: { id: validCustomer.id },
        data: { tier: newTier },
      });
    }

    revalidatePath(`/action/${encodeURIComponent(qrToken)}`);
    revalidatePath('/scan');
    revalidatePath('/guest');
    revalidatePath('/dashboard');
    revalidatePath('/kpi');
  }

  // Server Action: Списать бесплатный кофе
  async function redeemReward() {
    'use server';

    const sb = await createClient();
    const {
      data: { user: currentUser },
    } = await sb.auth.getUser();

    if (!currentUser) {
      redirect('/login');
    }

    if (stats.rewardsAvailable <= 0) return;

    await prisma.transaction.create({
      data: {
        type: 'REDEEM_REWARD',
        customerId: validCustomer.id,
        baristaId: currentUser.id,
        branchId: validBranch.id,
      },
    });

    revalidatePath(`/action/${encodeURIComponent(qrToken)}`);
    revalidatePath('/scan');
    revalidatePath('/guest');
    revalidatePath('/dashboard');
  }

  const isRewardReady = stats.rewardsAvailable > 0;
  const targetStamps = activeBranch.network.targetStamps;

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

      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-4 py-4">
        {/* Карточка информации о госте */}
        <div className="w-full p-5 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700/60 flex items-center justify-center text-amber-400 font-bold">
                {customer.name?.charAt(0) || <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {customer.name || 'Любимый гость'}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierInfo.badgeColor}`}
                  >
                    <Crown className="w-3 h-3" />
                    <span>{tierInfo.title}</span>
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  {customer.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                Филиал
              </span>
              <span className="text-xs font-semibold text-amber-400">
                {activeBranch.name}
              </span>
            </div>
          </div>

          {/* Баланс штампов и подарков */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-400 block mb-1">
                Штампы филиала
              </span>
              <div className="text-2xl font-black text-white">
                {stats.currentStamps}{' '}
                <span className="text-stone-500 text-sm font-semibold">
                  / {targetStamps}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-[11px] text-amber-400 block mb-1">
                Подарков на балансе
              </span>
              <div className="text-2xl font-black text-amber-400">
                {stats.rewardsAvailable} ☕
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="w-full space-y-3 pt-2">
          <form action={awardStamp} className="w-full">
            <button
              type="submit"
              className="w-full py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-extrabold text-base transition-all shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coffee className="w-5 h-5 stroke-[2.5]" />
              <span>Начислить +1 Штамп</span>
            </button>
          </form>

          <form action={redeemReward} className="w-full">
            <button
              type="submit"
              disabled={!isRewardReady}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isRewardReady
                  ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-stone-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                  : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>
                {isRewardReady
                  ? `Списать «${activeBranch.network.rewardTitle}»`
                  : 'Нет доступных подарков для списания'}
              </span>
            </button>
          </form>

          <Link
            href="/scan"
            className="w-full py-3 px-4 rounded-xl bg-stone-900/60 border border-stone-800/80 hover:bg-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Сканировать следующего гостя</span>
          </Link>
        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        Оператор: {authUser.email} • {activeBranch.name}
      </footer>
    </div>
  );
}
