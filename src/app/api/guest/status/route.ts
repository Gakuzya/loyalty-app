import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { calculateCustomerStamps, calculateTier } from '@/lib/loyalty';
import { analyzeGuest } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const searchParams = request.nextUrl.searchParams;
  const queryUserId = searchParams.get('userId');
  const targetUserId = user?.id || queryUserId;

  if (!targetUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [dbUser, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true, tier: true },
      }),
      prisma.transaction.findMany({
        where: { customerId: targetUserId },
        include: {
          branch: {
            include: {
              network: true,
            },
          },
          barista: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const targetStamps =
      transactions[0]?.branch?.network?.targetStamps || 6;
    const analytics = analyzeGuest(
      targetUserId,
      transactions,
      targetStamps
    );
    const totalStamps = analytics.totalEarned;
    const currentTier = calculateTier(totalStamps);

    // Группируем по филиалам
    const branchMap = new Map<
      string,
      {
        branch: (typeof transactions)[0]['branch'];
        txs: typeof transactions;
      }
    >();

    for (const tx of transactions) {
      if (!branchMap.has(tx.branchId)) {
        branchMap.set(tx.branchId, {
          branch: tx.branch,
          txs: [],
        });
      }
      branchMap.get(tx.branchId)!.txs.push(tx);
    }

    const branches = Array.from(branchMap.values()).map(({ branch, txs }) => {
      const stats = calculateCustomerStamps(txs, branch.network.targetStamps);
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchSlug: branch.slug,
        networkName: branch.network.name,
        address: branch.address,
        targetStamps: branch.network.targetStamps,
        rewardTitle: branch.network.rewardTitle,
        currentStamps: stats.currentStamps,
        totalEarned: stats.totalEarned,
        rewardsAvailable: stats.rewardsAvailable,
      };
    });

    // Последние 8 операций для ленты активности
    const history = transactions.slice(0, 8).map((tx) => ({
      id: tx.id,
      type: tx.type,
      branchName: tx.branch.name,
      baristaName: tx.barista?.name || 'Бариста',
      createdAt: tx.createdAt.toISOString(),
    }));

    return NextResponse.json({
      user: {
        id: targetUserId,
        name: dbUser?.name,
        email: dbUser?.email,
        tier: currentTier,
        totalStamps,
      },
      analytics,
      branches,
      history,
    });
  } catch (error) {
    console.error('Error fetching guest status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
