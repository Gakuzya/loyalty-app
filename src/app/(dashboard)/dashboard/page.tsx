import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HourlyChart } from '@/components/dashboard/HourlyChart';
import Link from 'next/link';
import {
  Coffee,
  Gift,
  Users,
  TrendingUp,
  Sparkles,
  Clock,
  Award,
  ArrowUpRight,
  Store,
  QrCode,
  ExternalLink,
} from 'lucide-react';

export default async function DashboardPage() {
  // 1. Получаем текущую сессию пользователя через Supabase Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Синхронизируем пользователя в базе данных Prisma
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
        role: 'OWNER',
      },
    });
  }

  // 3. Получаем сеть текущего владельца
  let network = await prisma.network.findUnique({
    where: { ownerId: user.id },
    include: {
      branches: true,
    },
  });

  // Если у владельца еще нет сети — создаем автоматически с первым филиалом
  if (!network) {
    network = await prisma.network.create({
      data: {
        ownerId: user.id,
        name: dbUser?.name ? `Сеть ${dbUser.name}` : 'Моя Сеть Кофеен',
        targetStamps: 6,
        rewardTitle: 'Бесплатный напиток на выбор',
        branches: {
          create: {
            name: 'Главный филиал',
            slug: `branch-${user.id.slice(0, 6)}`,
            address: 'ул. Главная, д. 1',
          },
        },
      },
      include: {
        branches: true,
      },
    });
  }

  const primaryBranch = network.branches[0];

  // 4. Загрузка статистики транзакций для всех филиалов этой сети
  const [
    totalStampsIssued,
    totalRewardsRedeemed,
    allTransactions,
    recentTransactions,
  ] = await Promise.all([
    // Выданные штампы
    prisma.transaction.count({
      where: {
        branch: {
          networkId: network.id,
        },
        type: 'EARN_STAMP',
      },
    }),

    // Списанные бесплатные подарки
    prisma.transaction.count({
      where: {
        branch: {
          networkId: network.id,
        },
        type: 'REDEEM_REWARD',
      },
    }),

    // Все транзакции для графиков и когортного анализа
    prisma.transaction.findMany({
      where: {
        branch: {
          networkId: network.id,
        },
      },
      select: {
        id: true,
        type: true,
        customerId: true,
        createdAt: true,
      },
    }),

    // Журнал последних операций
    prisma.transaction.findMany({
      where: {
        branch: {
          networkId: network.id,
        },
      },
      include: {
        customer: true,
        barista: true,
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    }),
  ]);

  // 5. Уникальные клиенты и группировка
  const customerVisitsMap = new Map<string, number>();
  const customerStampsMap = new Map<string, number>();

  allTransactions.forEach((tx) => {
    customerVisitsMap.set(
      tx.customerId,
      (customerVisitsMap.get(tx.customerId) || 0) + 1
    );
    if (tx.type === 'EARN_STAMP') {
      customerStampsMap.set(
        tx.customerId,
        (customerStampsMap.get(tx.customerId) || 0) + 1
      );
    }
  });

  const uniqueGuestsCount = customerVisitsMap.size;
  const repeatGuests = Array.from(customerVisitsMap.values()).filter(
    (count) => count >= 2
  ).length;

  const retentionPercent =
    uniqueGuestsCount > 0
      ? Math.round((repeatGuests / uniqueGuestsCount) * 100)
      : 0;

  // 6. Почасовая группировка активности (00:00 - 23:00)
  const hourlyMap: { [hour: number]: number } = {};
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = 0;
  }

  allTransactions
    .filter((tx) => tx.type === 'EARN_STAMP')
    .forEach((tx) => {
      const hour = new Date(tx.createdAt).getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    });

  const hourlyChartData = Array.from({ length: 24 }, (_, h) => {
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      stamps: hourlyMap[h],
    };
  });

  // 7. Топ-5 постоянных гостей
  const topCustomerEntries = Array.from(customerStampsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topUserIds = topCustomerEntries.map(([id]) => id);
  const topUsersDb = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
  });
  const topUserMap = new Map(topUsersDb.map((u) => [u.id, u]));

  const topCustomers = topCustomerEntries.map(([customerId, stamps]) => {
    const userObj = topUserMap.get(customerId);
    return {
      id: customerId,
      name: userObj?.name || 'Гость',
      email: userObj?.email,
      tier: userObj?.tier || 'BRONZE',
      stamps,
    };
  });

  const isBrandNew = totalStampsIssued === 0 && uniqueGuestsCount === 0;

  return (
    <div className="space-y-6 select-none">
      {/* Шапка дашборда */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Live Аналитика сети
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {network.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            Филиалов: {network.branches.length} • Правило: {network.targetStamps} штампов до подарка ({network.rewardTitle})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {primaryBranch && (
            <Link
              href={`/card/${primaryBranch.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white text-xs font-medium transition-all shadow-md"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Карта филиала</span>
              <ExternalLink className="w-3 h-3 text-stone-500" />
            </Link>
          )}
          <Link
            href="/scan"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Сканер бариста</span>
          </Link>
        </div>
      </div>

      {/* Онбординг-подсказка для новых заведений */}
      {isBrandNew && primaryBranch && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Сеть успешно развернута!
            </h3>
            <p className="text-xs text-stone-300 max-w-xl">
              Поделитесь ссылкой на карту филиала со своими первыми гостями или откройте сканер бариста, чтобы начислить первый штамп.
            </p>
          </div>
          <Link
            href={`/card/${primaryBranch.slug}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-all shrink-0 text-center"
          >
            Открыть карту: /card/{primaryBranch.slug}
          </Link>
        </div>
      )}

      {/* Блок KPI карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Карточка 1: Выдано штампов */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Выдано штампов
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coffee className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight">
              {totalStampsIssued}
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">всего по сети</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Данные сети</span>
          </div>
        </div>

        {/* Карточка 2: Заработано и выдано подарков */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Выдано призов
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Gift className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-400 tracking-tight">
              {totalRewardsRedeemed}
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">
              выдано гостям
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Вознаграждения постоянных гостей</span>
          </div>
        </div>

        {/* Карточка 3: База гостей */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              База гостей
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight">
              {uniqueGuestsCount}
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">уникальных клиентов</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Активные гости сети</span>
          </div>
        </div>

        {/* Карточка 4: Retention */}
        <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Удержание (Retention)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">
              {retentionPercent}%
            </span>
            <span className="text-xs text-stone-500 ml-1.5 font-medium">постоянные</span>
          </div>
          <div className="mt-2.5 text-xs text-stone-400">
            {repeatGuests} из {uniqueGuestsCount || 0} вернулись повторно
          </div>
        </div>
      </div>

      {/* Почасовой график активности */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Почасовая активность выдачи штампов</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Аналитика визитов по 24 часовым интервалам (00:00 - 23:00)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span>Штампы за час</span>
            </div>
          </div>
        </div>

        <HourlyChart data={hourlyChartData} />
      </div>

      {/* Сетка: Топ клиентов и Журнал транзакций */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ постоянных гостей */}
        <div id="customers" className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Топ постоянных клиентов</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">По накопленным штампам</span>
          </div>

          <div className="divide-y divide-stone-800/80">
            {topCustomers.length > 0 ? (
              topCustomers.map((guest, idx) => (
                <div key={guest.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {guest.name}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {guest.email || 'ID: ' + guest.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 block">
                      {guest.stamps} штампов
                    </span>
                    <span className="text-[10px] text-stone-500 uppercase font-semibold">
                      Статус: {guest.tier}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-stone-500">
                В программе лояльности пока нет зарегистрированных гостей
              </div>
            )}
          </div>
        </div>

        {/* Журнал операций */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Журнал операций</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Живая лента по всей сети</span>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                        tx.type === 'REDEEM_REWARD'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {tx.type === 'REDEEM_REWARD' ? (
                        <Gift className="w-4 h-4" />
                      ) : (
                        <Coffee className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-stone-200 block">
                        {tx.type === 'REDEEM_REWARD' ? 'Выдача подарка' : 'Начисление штампа'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Гость: {tx.customer?.name || tx.customer?.email?.split('@')[0] || 'Клиент'}
                        {tx.barista?.name && ` • Бариста: ${tx.barista.name}`}
                        {tx.branch?.name && ` • ${tx.branch.name}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold block ${
                        tx.type === 'EARN_STAMP' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'EARN_STAMP' ? '+1 штамп' : '☕ подарок'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(tx.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-stone-500">
                Транзакций пока нет. Отсканируйте карту в терминале бариста!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
