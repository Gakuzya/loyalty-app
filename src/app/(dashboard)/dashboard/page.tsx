import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  AnalyticsDashboardView,
  type TransactionItem,
} from '@/components/dashboard/AnalyticsDashboardView';

export default async function DashboardPage() {
  // 1. Получаем текущую сессию пользователя через Supabase Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Строгая проверка роли: только Владелец имеет доступ
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== 'OWNER') {
    if (dbUser?.role === 'BARISTA') {
      redirect('/scan');
    }
    redirect('/guest');
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
        name: dbUser.name ? `Сеть ${dbUser.name}` : 'Моя Сеть Кофеен',
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

  // 4. Загружаем все транзакции сети для аналитики
  const rawTransactions = await prisma.transaction.findMany({
    where: {
      branch: {
        networkId: network.id,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          tier: true,
        },
      },
      barista: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Сериализуем данные для клиентского компонента
  const transactions: TransactionItem[] = rawTransactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    createdAt: tx.createdAt.toISOString(),
    customer: {
      id: tx.customer.id,
      name: tx.customer.name,
      email: tx.customer.email,
      tier: tx.customer.tier,
    },
    barista: tx.barista
      ? {
          id: tx.barista.id,
          name: tx.barista.name,
          email: tx.barista.email,
        }
      : null,
    branch: tx.branch
      ? {
          id: tx.branch.id,
          name: tx.branch.name,
          slug: tx.branch.slug,
        }
      : null,
  }));

  return (
    <AnalyticsDashboardView
      networkName={network.name}
      branchesCount={network.branches.length}
      targetStamps={network.targetStamps}
      rewardTitle={network.rewardTitle}
      transactions={transactions}
    />
  );
}
