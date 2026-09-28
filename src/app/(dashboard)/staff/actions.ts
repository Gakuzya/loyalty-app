'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const password = (formData.get('password') as string)?.trim() || 'coffee2026';

  if (!email || !email.includes('@')) {
    return { error: 'Укажите корректный email адрес сотрудника' };
  }

  if (password.length < 6) {
    return { error: 'Пароль бариста должен содержать не менее 6 символов' };
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

  // 1. Создаем или обновляем пользователя в Supabase Auth через Admin API
  let authUserId: string | null = null;
  const admin = createAdminClient();

  try {
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || 'Бариста',
          role: 'BARISTA',
        },
      });

    if (createData?.user) {
      authUserId = createData.user.id;
    } else if (createError) {
      // Если пользователь уже зарегистрирован в Auth, обновляем его пароль и подтверждаем email
      const { data: listData } = await admin.auth.admin.listUsers();
      const existing = listData?.users.find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        authUserId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: {
            name: name || existing.user_metadata?.name || 'Бариста',
            role: 'BARISTA',
          },
        });
      } else {
        return { error: `Ошибка создания аккаунта бариста: ${createError.message}` };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Supabase Auth staff creation error:', msg);
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
    credentials: {
      email,
      password,
      branchName: branch.name,
    },
  };
}
