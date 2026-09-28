'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateShopSettings(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Пользователь не авторизован' };
  }

  const name = (formData.get('name') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim().toLowerCase();
  const address = (formData.get('address') as string)?.trim() || null;
  const rewardTitle = (formData.get('rewardTitle') as string)?.trim();
  const targetStampsRaw = formData.get('targetStamps') as string;
  const targetStamps = parseInt(targetStampsRaw, 10);

  if (!name || name.length < 2) {
    return { error: 'Укажите корректное название кофейни (от 2 символов)' };
  }

  // Валидация slug (только латиница, цифры и дефис)
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slug || !slugRegex.test(slug)) {
    return {
      error:
        'Ссылка может содержать только латинские строчные буквы, цифры и дефис (например: surf-coffee)',
    };
  }

  if (isNaN(targetStamps) || targetStamps < 3 || targetStamps > 20) {
    return { error: 'Количество штампов должно быть от 3 до 20' };
  }

  // Находим кофейню текущего владельца
  let shop = await prisma.shop.findFirst({
    where: { ownerId: user.id },
  });

  if (!shop) {
    return { error: 'Заведение не найдено' };
  }

  // Проверяем, не занят ли slug другой кофейней
  const existingSlug = await prisma.shop.findFirst({
    where: {
      slug,
      NOT: { id: shop.id },
    },
  });

  if (existingSlug) {
    return { error: `Ссылка /card/${slug} уже занята другим заведением. Выберите другую.` };
  }

  // Обновляем настройки в базе данных
  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: {
      name,
      slug,
      address,
      rewardTitle: rewardTitle || 'Бесплатный напиток на выбор',
      targetStamps,
    },
  });

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/guests');
  revalidatePath(`/card/${updated.slug}`);

  return { success: 'Настройки заведения успешно сохранены!' };
}
