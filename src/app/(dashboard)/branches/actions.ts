'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBranch(prevState: any, formData: FormData) {
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

  if (!name || name.length < 2) {
    return { error: 'Название филиала должно быть не менее 2 символов' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slug || !slugRegex.test(slug)) {
    return {
      error:
        'Ссылка может содержать только латинские буквы в нижнем регистре, цифры и дефис (например: pokrovka-main)',
    };
  }

  // Получаем или создаем сеть текущего владельца
  let network = await prisma.network.findUnique({
    where: { ownerId: user.id },
  });

  if (!network) {
    network = await prisma.network.create({
      data: {
        ownerId: user.id,
        name: 'Моя Сеть Кофеен',
        targetStamps: 6,
        rewardTitle: 'Бесплатный кофе',
      },
    });
  }

  // Проверяем уникальность slug
  const existingBranch = await prisma.branch.findUnique({
    where: { slug },
  });

  if (existingBranch) {
    return { error: `Филиал со ссылкой /card/${slug} уже зарегистрирован. Выберите другой slug.` };
  }

  await prisma.branch.create({
    data: {
      networkId: network.id,
      name,
      slug,
      address,
    },
  });

  revalidatePath('/branches');
  revalidatePath('/dashboard');
  revalidatePath(`/card/${slug}`);

  return { success: `Филиал «${name}» успешно создан!` };
}
