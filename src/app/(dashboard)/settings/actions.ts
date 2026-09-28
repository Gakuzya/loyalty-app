'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateNetworkSettings(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Пользователь не авторизован' };
  }

  const name = (formData.get('name') as string)?.trim();
  const rewardTitle = (formData.get('rewardTitle') as string)?.trim();
  const targetStampsRaw = formData.get('targetStamps') as string;
  const targetStamps = parseInt(targetStampsRaw, 10);

  if (!name || name.length < 2) {
    return { error: 'Укажите корректное название сети (от 2 символов)' };
  }

  if (isNaN(targetStamps) || targetStamps < 3 || targetStamps > 20) {
    return { error: 'Количество штампов должно быть от 3 до 20' };
  }

  const network = await prisma.network.findUnique({
    where: { ownerId: user.id },
  });

  if (!network) {
    await prisma.network.create({
      data: {
        ownerId: user.id,
        name,
        targetStamps,
        rewardTitle: rewardTitle || 'Бесплатный кофе',
      },
    });
  } else {
    await prisma.network.update({
      where: { id: network.id },
      data: {
        name,
        targetStamps,
        rewardTitle: rewardTitle || 'Бесплатный кофе',
      },
    });
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/branches');
  revalidatePath('/guests');

  return { success: 'Настройки сети успешно сохранены!' };
}
