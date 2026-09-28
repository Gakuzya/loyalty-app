import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users,
  Coffee,
  Gift,
  Award,
  Calendar,
  Search,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export default async function GuestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Находим заведение текущего владельца
  const shop = await prisma.shop.findFirst({
    where: { ownerId: user.id },
  });

  if (!shop) {
    return (
      <div className="p-8 text-center bg-stone-900/50 rounded-3xl border border-stone-800">
        <Users className="w-12 h-12 text-stone-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Кофейня не найдена</h2>
        <p className="text-sm text-stone-400 mt-1">
          Создайте кофейню в настройках для просмотра базы клиентов.
        </p>
      </div>
    );
  }

  // Запрашиваем всех гостей заведения
  const cards = await prisma.loyaltyCard.findMany({
    where: {
      shopId: shop.id,
    },
    include: {
      customer: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Агрегированные метрики базы гостей
  const totalGuests = cards.length;
  const totalStampsAllTime = cards.reduce((acc, c) => acc + c.totalStampsEarned, 0);
  const totalRedeemedRewards = cards.reduce((acc, c) => acc + c.rewardsRedeemed, 0);
  const activeRewardsAvailable = cards.reduce((acc, c) => acc + c.rewardsAvailable, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Заголовок */}
      <div className="pb-4 border-b border-stone-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
          <Users className="w-3.5 h-3.5" />
          CRM Система
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          База постоянных клиентов
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Полный реестр гостей заведения «{shop.name}», история визитов и выданных наград
        </p>
      </div>

      {/* Быстрые метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider block">
              Всего гостей
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {totalGuests}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider block">
              Всего штампов
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {totalStampsAllTime}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider block">
              Выпито подарков
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {totalRedeemedRewards} ☕
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider block">
              Ждут получения
            </span>
            <span className="text-2xl font-black text-yellow-400 mt-1 block">
              {activeRewardsAvailable} кофе
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Таблица клиентов */}
      <div className="rounded-3xl bg-stone-900/80 border border-stone-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>Реестр лояльных гостей</span>
          </h2>
          <span className="text-xs text-stone-400">
            Сортировка: по дате последнего визита
          </span>
        </div>

        {cards.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/60 text-stone-400 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-5">Гость</th>
                  <th className="py-3 px-5 text-center">Текущая карта</th>
                  <th className="py-3 px-5 text-center">Всего штампов</th>
                  <th className="py-3 px-5 text-center">Подарки</th>
                  <th className="py-3 px-5 text-right">Последний визит</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 font-medium">
                {cards.map((card, idx) => (
                  <tr
                    key={card.id}
                    className="hover:bg-stone-850/50 transition-colors"
                  >
                    {/* Колонка: Гость */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700/60 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {card.customer.fullName?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {card.customer.fullName || 'Гость без имени'}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {card.customer.phone || card.customer.email || 'Без контакта'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Колонка: Текущая карта */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-mono">
                        {card.currentStamps} / {shop.targetStamps}
                      </span>
                    </td>

                    {/* Колонка: Всего штампов за всё время */}
                    <td className="py-4 px-5 text-center">
                      <span className="font-bold text-white text-sm">
                        {card.totalStampsEarned}
                      </span>
                      <span className="text-[10px] text-stone-500 block">за всё время</span>
                    </td>

                    {/* Колонка: Подарки */}
                    <td className="py-4 px-5 text-center">
                      {card.rewardsAvailable > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <Gift className="w-3 h-3" />
                          {card.rewardsAvailable} на балансе
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">
                          {card.rewardsRedeemed} получено
                        </span>
                      )}
                    </td>

                    {/* Колонка: Дата последнего визита */}
                    <td className="py-4 px-5 text-right text-stone-400 font-mono text-[11px]">
                      {card.lastStampedAt ? (
                        <span>
                          {new Date(card.lastStampedAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span>Недавно</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Список клиентов пока пуст</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Когда гости впервые отсканируют карточку вашей кофейни, они появятся в этой таблице.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
