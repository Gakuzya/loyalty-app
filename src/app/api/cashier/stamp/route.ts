import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import prisma from '@/lib/prisma';
import { calculateCustomerStamps, calculateTier } from '@/lib/loyalty';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, branchId, action } = body;

    if (!customerId || !branchId || !action) {
      return NextResponse.json(
        { error: 'Missing customerId, branchId, or action' },
        { status: 400 }
      );
    }

    // 1. Проверяем филиал
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { network: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // 2. Создаем транзакцию
    const txType = action === 'REDEEM_REWARD' ? 'REDEEM_REWARD' : 'EARN_STAMP';

    const newTx = await prisma.transaction.create({
      data: {
        type: txType,
        customerId,
        baristaId: authUser.id,
        branchId,
      },
      include: {
        barista: {
          select: { name: true },
        },
      },
    });

    // 3. Пересчитываем статистику для филиала
    const branchTxs = await prisma.transaction.findMany({
      where: {
        customerId,
        branchId,
      },
    });

    const stats = calculateCustomerStamps(
      branchTxs,
      branch.network.targetStamps
    );

    // 4. Пересчитываем общий тир гостя
    const allEarnedTxsCount = await prisma.transaction.count({
      where: {
        customerId,
        type: 'EARN_STAMP',
      },
    });

    const newTier = calculateTier(allEarnedTxsCount);
    await prisma.user.update({
      where: { id: customerId },
      data: { tier: newTier },
    });

    // 5. Отправляем Realtime Broadcast в Supabase, чтобы экран гостя мгновенно обновился
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.channel('loyalty-live-events').send({
        type: 'broadcast',
        event: 'stamp-update',
        payload: {
          customerId,
          branchId,
          branchName: branch.name,
          baristaName: newTx.barista?.name || 'Бариста',
          action: txType,
          currentStamps: stats.currentStamps,
          targetStamps: branch.network.targetStamps,
          rewardsAvailable: stats.rewardsAvailable,
          rewardTitle: branch.network.rewardTitle,
          totalStamps: allEarnedTxsCount,
          tier: newTier,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (realtimeErr) {
      console.warn('Realtime broadcast error (non-fatal):', realtimeErr);
    }

    return NextResponse.json({
      success: true,
      currentStamps: stats.currentStamps,
      targetStamps: branch.network.targetStamps,
      rewardsAvailable: stats.rewardsAvailable,
      rewardTitle: branch.network.rewardTitle,
      totalStamps: allEarnedTxsCount,
      tier: newTier,
      isRewardReady: stats.rewardsAvailable > 0,
      justEarnedReward: txType === 'EARN_STAMP' && stats.currentStamps === 0 && stats.rewardsAvailable > 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error executing cashier stamp action:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
