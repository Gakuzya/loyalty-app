'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addStaffMember(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user: ownerUser },
  } = await supabase.auth.getUser();

  if (!ownerUser) {
    return { error: 'Пользователь не авторизован' };
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const name = (formData.get('name') as string)?.trim();
  const branchId = formData.get('branchId') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Укажите корректный email адрес сотрудника' };
  }

  if (!branchId) {
    return { error: 'Выберите филиал для привязки сотрудника' };
  }

  // Проверяем, что филиал принадлежит сети текущего владельца
  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      network: {
        ownerId: ownerUser.id,
      },
    },
  });

  if (!branch) {
    return { error: 'Выбранный филиал не найден или не принадлежит вашей сети' };
  }

  // 1. Создаем или приглашаем пользователя в Supabase Auth через Service Role
  let authUserId: string | null = null;
  const adminSupabase = getServiceSupabase();

  try {
    // Пробуем пригласить пользователя по email
    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: name || 'Бариста',
          role: 'BARISTA',
        },
      });

    if (inviteData?.user) {
      authUserId = inviteData.user.id;
    } else if (inviteError) {
      // Если пользователь уже зарегистрирован в Auth, получаем его ID
      const { data: listData } = await adminSupabase.auth.admin.listUsers();
      const existing = listData?.users.find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        authUserId = existing.id;
      }
    }
  } catch (err) {
    console.warn('Supabase Auth invite fallback:', err);
  }

  // 2. Создаем или обновляем пользователя в Prisma
  await prisma.user.upsert({
    where: { email },
    update: {
      name: name || undefined,
      role: 'BARISTA',
      branchId: branch.id,
      ...(authUserId ? { id: authUserId } : {}),
    },
    create: {
      ...(authUserId ? { id: authUserId } : {}),
      email,
      name: name || 'Бариста',
      role: 'BARISTA',
      branchId: branch.id,
    },
  });

  revalidatePath('/staff');
  revalidatePath('/branches');
  revalidatePath('/dashboard');

  return {
    success: `Сотрудник ${email} успешно добавлен в филиал «${branch.name}»!`,
  };
}
