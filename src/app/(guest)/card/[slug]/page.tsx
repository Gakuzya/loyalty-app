import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { GuestCardClient } from '@/components/guest/GuestCardClient';
import { calculateCustomerStamps } from '@/lib/loyalty';
import Link from 'next/link';
import { ChevronLeft, Store, LogIn } from 'lucide-react';

interface CardPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GuestCardPage({ params }: CardPageProps) {
  const { slug } = await params;

  // 1. Поиск филиала по slug в базе данных
  const branch = await prisma.branch.findUnique({
    where: { slug },
    include: {
      network: true,
    },
  });

  // 2. Если филиал не найден — экран ошибки
  if (!branch) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-xl">
          <Store className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Филиал не найден</h1>
        <p className="text-sm text-stone-400 max-w-xs mb-6">
          Филиал со ссылкой <span className="text-amber-400 font-mono">/card/{slug}</span> не найден в системе.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/40 text-xs font-semibold transition-all shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Вернуться на главную</span>
        </Link>
      </div>
    );
  }

  // 3. Проверяем авторизацию гостя
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentStamps = 0;
  let rewardsAvailable = 0;
  let qrToken = 'guest:anonymous';

  if (user) {
    qrToken = `guest:${user.id}`;

    // Загружаем транзакции гостя в этом филиале
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: user.id,
        branchId: branch.id,
      },
    });

    const stats = calculateCustomerStamps(
      transactions,
      branch.network.targetStamps
    );
    currentStamps = stats.currentStamps;
    rewardsAvailable = stats.rewardsAvailable;
  }

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Верхняя навигация */}
      <header className="max-w-sm mx-auto w-full flex items-center justify-between py-2">
        <Link
          href={user ? '/guest' : '/'}
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{user ? 'Мои карты' : 'На главную'}</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Карта филиала
        </span>
      </header>

      {/* Основной клиентский интерфейс */}
      <main className="flex-1 flex flex-col items-center justify-center py-4">
        {!user && (
          <div className="max-w-sm w-full mb-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <span className="text-amber-400 font-medium">Войдите, чтобы копить штампы</span>
            <Link
              href="/guest"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Войти</span>
            </Link>
          </div>
        )}

        <GuestCardClient
          shop={{
            id: branch.id,
            name: branch.name,
            slug: branch.slug,
            address: branch.address,
            targetStamps: branch.network.targetStamps,
            rewardTitle: branch.network.rewardTitle,
          }}
          card={{
            id: branch.id,
            currentStamps,
            targetStamps: branch.network.targetStamps,
            rewardsAvailable,
            qrToken,
          }}
        />
      </main>

      {/* Футер */}
      <footer className="max-w-sm mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub • {branch.network.name}
      </footer>
    </div>
  );
}
