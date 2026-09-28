import React from 'react';
import prisma from '@/lib/prisma';
import { GuestCardClient } from '@/components/guest/GuestCardClient';
import Link from 'next/link';
import { Coffee, ChevronLeft, Store } from 'lucide-react';

interface CardPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Временный ID гостя для демонстрации до внедрения полноценной авторизации
const DEMO_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

export default async function GuestCardPage({ params }: CardPageProps) {
  const { slug } = await params;

  // 1. Поиск кофейни по slug в базе данных
  const shop = await prisma.shop.findUnique({
    where: { slug },
  });

  // 2. Если кофейня не найдена — красивый минималистичный экран ошибки
  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-xl">
          <Store className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Кофейня не найдена</h1>
        <p className="text-sm text-stone-400 max-w-xs mb-6">
          Заведение со ссылкой <span className="text-amber-400 font-mono">/card/{slug}</span> не зарегистрировано в системе лояльности.
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

  // 3. Убеждаемся, что тестовый пользователь существует в БД
  let customer = await prisma.user.findUnique({
    where: { id: DEMO_CUSTOMER_ID },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        id: DEMO_CUSTOMER_ID,
        phone: '+7 (999) 000-00-00',
        fullName: 'Тестовый Гость',
        role: 'CUSTOMER',
      },
    });
  }

  // 4. Поиск или создание карты лояльности для этого гостя и этой кофейни
  let loyaltyCard = await prisma.loyaltyCard.findUnique({
    where: {
      customerId_shopId: {
        customerId: customer.id,
        shopId: shop.id,
      },
    },
  });

  if (!loyaltyCard) {
    loyaltyCard = await prisma.loyaltyCard.create({
      data: {
        customerId: customer.id,
        shopId: shop.id,
        currentStamps: 0,
        rewardsAvailable: 0,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#0f0d0c] text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Верхняя навигация */}
      <header className="max-w-sm mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Карта гостя
        </span>
      </header>

      {/* Основной клиентский интерфейс с реальными данными из БД */}
      <main className="flex-1 flex items-center justify-center py-4">
        <GuestCardClient
          shop={{
            id: shop.id,
            name: shop.name,
            slug: shop.slug,
            address: shop.address,
            targetStamps: shop.targetStamps,
            rewardTitle: shop.rewardTitle,
          }}
          card={{
            id: loyaltyCard.id,
            currentStamps: loyaltyCard.currentStamps,
            targetStamps: shop.targetStamps,
            rewardsAvailable: loyaltyCard.rewardsAvailable,
            qrToken: loyaltyCard.qrToken,
          }}
        />
      </main>

      {/* Футер */}
      <footer className="max-w-sm mx-auto w-full text-center text-[11px] text-stone-500 py-2">
        LoyaltyHub • Синхронизировано с базой данных
      </footer>
    </div>
  );
}
