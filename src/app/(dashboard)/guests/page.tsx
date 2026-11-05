import React from 'react';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { calculateTier } from '@/lib/loyalty';
import {
  analyzeGuest,
  summarizeNetworkGuestsAnalytics,
  type RawAnalyticsTx,
} from '@/lib/analytics';
import {
  GuestsCrmView,
  type GuestCrmRow,
} from '@/components/dashboard/GuestsCrmView';

export default async function GuestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Находим сеть текущего владельца
  const network = await prisma.network.findUnique({
    where: { ownerId: user.id },
  });

  if (!network) {
    return (
      <div className="p-8 text-center bg-stone-900/50 rounded-3xl border border-stone-800">
        <Users className="w-12 h-12 text-stone-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Сеть не найдена</h2>
        <p className="text-sm text-stone-400 mt-1">
          Создайте сеть в настройках для просмотра базы клиентов.
        </p>
      </div>
    );
  }

  // Запрашиваем все транзакции сети через Prisma
  const transactions = await prisma.transaction.findMany({
    where: {
      branch: {
        networkId: network.id,
      },
    },
    include: {
      customer: true,
      branch: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Группируем транзакции по гостям для RFM-анализа
  interface GuestBucket {
    customer: (typeof transactions)[0]['customer'];
    lastBranchName: string;
    lastVisit: Date;
    txs: RawAnalyticsTx[];
  }

  const guestsMap = new Map<string, GuestBucket>();

  for (const tx of transactions) {
    if (!guestsMap.has(tx.customerId)) {
      guestsMap.set(tx.customerId, {
        customer: tx.customer,
        lastBranchName: tx.branch.name,
        lastVisit: tx.createdAt,
        txs: [],
      });
    }
    guestsMap.get(tx.customerId)!.txs.push({
      type: tx.type,
      createdAt: tx.createdAt,
    });
  }

  const now = new Date();
  const guestRows: GuestCrmRow[] = Array.from(guestsMap.values())
    .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime())
    .map((bucket) => {
      const analytics = analyzeGuest(
        bucket.customer.id,
        bucket.txs,
        network.targetStamps,
        now
      );
      const calculatedTier = calculateTier(analytics.totalEarned);

      return {
        customer: {
          id: bucket.customer.id,
          name: bucket.customer.name,
          email: bucket.customer.email,
          tier: calculatedTier,
        },
        lastBranchName: bucket.lastBranchName,
        analytics,
      };
    });

  const summary = summarizeNetworkGuestsAnalytics(
    guestRows.map((g) => g.analytics)
  );
  const totalStampsAllTime = guestRows.reduce(
    (acc, g) => acc + g.analytics.totalEarned,
    0
  );
  const totalRedeemedRewards = guestRows.reduce(
    (acc, g) => acc + g.analytics.totalRedeemed,
    0
  );

  return (
    <GuestsCrmView
      networkName={network.name}
      guests={guestRows}
      summary={summary}
      totalStampsAllTime={totalStampsAllTime}
      totalRedeemedRewards={totalRedeemedRewards}
    />
  );
}
