import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { Settings } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Находим сеть текущего владельца
  let network = await prisma.network.findUnique({
    where: { ownerId: user.id },
  });

  if (!network) {
    network = await prisma.network.create({
      data: {
        ownerId: user.id,
        name: 'Моя Сеть Кофеен',
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
          Параметры сети
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Настройки сети
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Управляйте названием сети и правилами начисления штампов для всех филиалов
        </p>
      </div>

      {/* Форма редактирования */}
      <SettingsForm
        initialNetwork={{
          id: network.id,
          name: network.name,
          targetStamps: network.targetStamps,
          rewardTitle: network.rewardTitle,
        }}
      />
    </div>
  );
}
