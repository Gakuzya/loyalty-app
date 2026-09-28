import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { Settings, Sparkles } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Находим заведение текущего владельца
  let shop = await prisma.shop.findFirst({
    where: { ownerId: user.id },
  });

  if (!shop) {
    const generatedSlug = `shop-${user.id.slice(0, 6)}`;
    shop = await prisma.shop.create({
      data: {
        ownerId: user.id,
        name: 'Моя Кофейня',
        slug: generatedSlug,
        address: 'ул. Главная, д. 1',
        targetStamps: 6,
        rewardTitle: 'Бесплатный кофе любого объёма',
      },
    });
  }

  return (
    <div className="space-y-6 select-none">
      {/* Заголовок страницы */}
      <div className="pb-4 border-b border-stone-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
          <Settings className="w-3.5 h-3.5" />
          Параметры заведения
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Настройки лояльности
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Управляйте названием, персональной веб-ссылкой для гостей и правилами начисления штампов
        </p>
      </div>

      {/* Форма редактирования */}
      <SettingsForm
        initialShop={{
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          address: shop.address,
          targetStamps: shop.targetStamps,
          rewardTitle: shop.rewardTitle,
        }}
      />
    </div>
  );
}
