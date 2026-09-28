'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createKpiTarget(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Пользователь не авторизован' };
  }

  const title = (formData.get('title') as string)?.trim();
  const targetCountRaw = formData.get('targetCount') as string;
  const targetCount = parseInt(targetCountRaw, 10);
  const reward = (formData.get('reward') as string)?.trim();

  if (!title || title.length < 3) {
    return { error: 'Укажите понятное название цели (например: 500 штампов за месяц)' };
  }

  if (isNaN(targetCount) || targetCount < 10) {
    return { error: 'Целевое количество штампов должно быть не менее 10' };
  }

  if (!reward || reward.length < 2) {
    return { error: 'Укажите размер премии или бонуса (например: Премия 5000 ₽)' };
  }

  const network = await prisma.network.findUnique({
    where: { ownerId: user.id },
  });

  if (!network) {
    return { error: 'Сеть заведений не найдена' };
  }

  // Первый день текущего месяца
  const now = new Date();
  const activeMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.kpiTarget.create({
    data: {
      networkId: network.id,
      title,
      targetCount,
      reward,
      activeMonth,
    },
  });

  revalidatePath('/kpi');
  revalidatePath('/scan');

  return { success: `Цель «${title}» с бонусом «${reward}» успешно активирована на этот месяц!` };
}
