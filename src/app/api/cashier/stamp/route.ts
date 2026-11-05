import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import prisma from '@/lib/prisma';
import { calculateCustomerStamps, calculateTier } from '@/lib/loyalty';
import { analyzeGuest } from '@/lib/analytics';

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

    const txType = action === 'REDEEM_REWARD' ? 'REDEEM_REWARD' : 'EARN_STAMP';

    // 2. Перед созданием транзакции оцениваем RFM-сегмент, привилегию уровня и персональный оффер гостя
    const existingCustomerTxs = await prisma.transaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });

    const preAwardAnalytics = analyzeGuest(
      customerId,
      existingCustomerTxs,
      branch.network.targetStamps
    );

    const stampsToAward =
      txType === 'EARN_STAMP' ? preAwardAnalytics.personalOffer.stampsToAward : 1;
    const appliedOfferTitle =
      txType === 'EARN_STAMP' && stampsToAward > 1
        ? preAwardAnalytics.personalOffer.title
        : null;

    // 3. Создаем транзакцию (или 2 транзакции при срабатывании штампа x2 по привилегии уровня / офферу)
    let baristaName = 'Бариста';
    for (let i = 0; i < stampsToAward; i++) {
      const created = await prisma.transaction.create({
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
      if (created.barista?.name) {
        baristaName = created.barista.name;
      }
    }

    // 4. Пересчитываем статистику для филиала
    const branchTxs = await prisma.transaction.findMany({
      where: {
        customerId,
        branchId,
      },
      orderBy: { createdAt: 'asc' },
    });

    const stats = calculateCustomerStamps(
      branchTxs,
      branch.network.targetStamps
    );

    // 5. Пересчитываем общий тир и обновленную аналитику гостя после визита
    const updatedAllCustomerTxs = await prisma.transaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });

    const allEarnedTxsCount = updatedAllCustomerTxs.filter(
      (t) => t.type === 'EARN_STAMP'
    ).length;

    const newTier = calculateTier(allEarnedTxsCount);
    await prisma.user.update({
      where: { id: customerId },
      data: { tier: newTier },
    });

    const updatedAnalytics = analyzeGuest(
      customerId,
      updatedAllCustomerTxs,
      branch.network.targetStamps
    );

    // 6. Отправляем Realtime Broadcast в Supabase, чтобы экран гостя мгновенно обновился
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.channel('loyalty-live-events').send({
        type: 'broadcast',
        event: 'stamp-update',
        payload: {
          customerId,
          branchId,
          branchName: branch.name,
          baristaName,
          action: txType,
          stampsAwarded: stampsToAward,
          appliedOfferTitle,
          currentStamps: stats.currentStamps,
          targetStamps: branch.network.targetStamps,
          rewardsAvailable: stats.rewardsAvailable,
          rewardTitle: branch.network.rewardTitle,
          totalStamps: allEarnedTxsCount,
          tier: newTier,
          analytics: updatedAnalytics,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (realtimeErr) {
      console.warn('Realtime broadcast error (non-fatal):', realtimeErr);
    }

    return NextResponse.json({
      success: true,
      stampsAwarded: stampsToAward,
      appliedOfferTitle,
      currentStamps: stats.currentStamps,
      targetStamps: branch.network.targetStamps,
      rewardsAvailable: stats.rewardsAvailable,
      rewardTitle: branch.network.rewardTitle,
      totalStamps: allEarnedTxsCount,
      tier: newTier,
      analytics: updatedAnalytics,
      isRewardReady: stats.rewardsAvailable > 0,
      justEarnedReward:
        txType === 'EARN_STAMP' &&
        stats.rewardsAvailable > preAwardAnalytics.rewardsAvailable,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error executing cashier stamp action:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
