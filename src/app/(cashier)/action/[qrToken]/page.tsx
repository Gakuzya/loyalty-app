import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Coffee, ChevronLeft, QrCode, User, CheckCircle2, Gift, AlertTriangle, ArrowLeft } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface ActionPageProps {
  params: Promise<{
    qrToken: string;
  }>;
}

export default async function ActionPage({ params }: ActionPageProps) {
  const { qrToken } = await params;

  // Поиск карты лояльности по уникальному токену
  const card = await prisma.loyaltyCard.findUnique({
    where: { qrToken },
    include: {
      customer: true,
      shop: true,
    },
  });

  if (!card) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Карта не найдена</h1>
        <p className="text-xs text-stone-400 max-w-xs mb-6">
          QR-код <span className="font-mono text-amber-400">{qrToken}</span> не существует или устарел.
        </p>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-md"
        >
          <QrCode className="w-4 h-4" />
          <span>Сканировать заново</span>
        </Link>
      </div>
    );
  }

  // Server Action: Начислить 1 штамп
  async function awardStamp() {
    'use server';

    const current = await prisma.loyaltyCard.findUnique({
      where: { id: card!.id },
      include: { shop: true },
    });

    if (!current) return;

    const newStamps = current.currentStamps + 1;
    let earnedReward = false;
    let updatedStamps = newStamps;
    let rewardsDelta = 0;

    // Если достигли цели (например, 6 штампов)
    if (newStamps >= current.shop.targetStamps) {
      earnedReward = true;
      updatedStamps = 0; // Сбрасываем карточку на новый круг
      rewardsDelta = 1;  // Добавляем 1 подарок на баланс
    }

    // Обновляем баланс карты
    await prisma.loyaltyCard.update({
      where: { id: current.id },
      data: {
        currentStamps: updatedStamps,
        totalStampsEarned: { increment: 1 },
        rewardsAvailable: { increment: rewardsDelta },
        lastStampedAt: new Date(),
      },
    });

    // Записываем транзакцию для аналитики
    await prisma.transaction.create({
      data: {
        cardId: current.id,
        shopId: current.shopId,
        type: earnedReward ? 'REWARD_EARNED' : 'STAMP_ADDED',
        stampsDelta: 1,
        comment: earnedReward ? 'Получен бесплатный кофе!' : '+1 штамп за покупку',
      },
    });

    revalidatePath(`/action/${qrToken}`);
    revalidatePath(`/card/${current.shop.slug}`);
  }

  // Server Action: Списать подарочный кофе
  async function redeemReward() {
    'use server';

    const current = await prisma.loyaltyCard.findUnique({
      where: { id: card!.id },
    });

    if (!current || current.rewardsAvailable <= 0) return;

    await prisma.loyaltyCard.update({
      where: { id: current.id },
      data: {
        rewardsAvailable: { decrement: 1 },
        rewardsRedeemed: { increment: 1 },
      },
    });

    await prisma.transaction.create({
      data: {
        cardId: current.id,
        shopId: current.shopId,
        type: 'REWARD_REDEEMED',
        stampsDelta: 0,
        comment: 'Списан бесплатный напиток гостю',
      },
    });

    revalidatePath(`/action/${qrToken}`);
    revalidatePath(`/card/${card!.shop.slug}`);
  }

  const isRewardReady = card.rewardsAvailable > 0;
  const targetStamps = card.shop.targetStamps;

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Навигация */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/scan"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>К сканеру</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Карта найдена
        </span>
      </header>

      {/* Основная панель */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-4 py-4">
        {/* Карточка гостя */}
        <div className="w-full p-5 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700/60 flex items-center justify-center text-stone-300">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {card.customer.fullName || 'Гость кофейни'}
                </h2>
                <p className="text-xs text-stone-400">
                  {card.customer.phone || 'Без номера'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 block">
                Заведение
              </span>
              <span className="text-xs font-semibold text-amber-400">
                {card.shop.name}
              </span>
            </div>
          </div>

          {/* Баланс штампов и подарков */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-400 block mb-1">
                Текущие штампы
              </span>
              <div className="text-2xl font-black text-white">
                {card.currentStamps}{' '}
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
                {card.rewardsAvailable} ☕
              </div>
            </div>
          </div>
        </div>

        {/* Действия бариста */}
        <div className="w-full space-y-3 pt-2">
          {/* Кнопка начисления штампа */}
          <form action={awardStamp} className="w-full">
            <button
              type="submit"
              className="w-full py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-extrabold text-base transition-all shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coffee className="w-5 h-5 stroke-[2.5]" />
              <span>Начислить +1 Штамп</span>
            </button>
          </form>

          {/* Кнопка списания бесплатного кофе */}
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
                  ? 'Списать бесплатный кофе'
                  : 'Нет доступных подарков для списания'}
              </span>
            </button>
          </form>

          {/* Кнопка следующего гостя */}
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
        LoyaltyHub POS • Терминал бариста
      </footer>
    </div>
  );
}
