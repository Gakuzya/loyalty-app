'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();

  if (!email || !password) {
    return { error: 'Заполните email и пароль' };
  }

  const supabase = await createClient();

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Если email не подтвержден в Supabase, автоматически подтверждаем его через Admin API и повторяем вход
  if (error && error.message.toLowerCase().includes('email not confirmed')) {
    try {
      const admin = createAdminClient();
      const {
        data: { users },
      } = await admin.auth.admin.listUsers();
      const targetUser = users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (targetUser) {
        await admin.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        });

        // Повторный вход после подтверждения
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = retry.data;
        error = retry.error;
      }
    } catch (adminErr) {
      console.error('Auto-confirm error:', adminErr);
    }
  }

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Неверный email или пароль' };
    }
    return { error: `Ошибка входа: ${error.message}` };
  }

  // Синхронизируем пользователя в Prisma
  let targetPath = '/dashboard';

  if (data?.user?.email) {
    let dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!dbUser) {
      dbUser = await prisma.user.upsert({
        where: { email: data.user.email },
        update: { id: data.user.id },
        create: {
          id: data.user.id,
          email: data.user.email,
          name:
            data.user.user_metadata?.name ||
            data.user.user_metadata?.full_name ||
            data.user.email.split('@')[0],
          role:
            (data.user.user_metadata?.role as 'OWNER' | 'BARISTA' | 'CUSTOMER') ||
            'OWNER',
        },
      });
    }

    if (dbUser.role === 'BARISTA') {
      targetPath = '/scan';
    } else if (dbUser.role === 'CUSTOMER') {
      targetPath = '/guest';
    } else {
      targetPath = '/dashboard';
    }
  }

  redirect(targetPath);
}

export async function signUp(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const role = ((formData.get('role') as string) || 'OWNER') as
    | 'OWNER'
    | 'CUSTOMER'
    | 'BARISTA';

  if (!email || !password) {
    return { error: 'Заполните email и пароль' };
  }

  if (password.length < 6) {
    return { error: 'Пароль должен содержать минимум 6 символов' };
  }

  try {
    const admin = createAdminClient();

    // Создаем пользователя сразу с подтвержденным email, чтобы избежать блокировок
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || email.split('@')[0],
          role,
        },
      });

    if (createError) {
      if (
        createError.message.toLowerCase().includes('already registered') ||
        createError.message.toLowerCase().includes('already exists')
      ) {
        return {
          error:
            'Пользователь с таким email уже существует. Пожалуйста, выполните вход.',
        };
      }
      return { error: `Ошибка регистрации: ${createError.message}` };
    }

    // Создаем запись в Prisma
    if (created.user) {
      await prisma.user.upsert({
        where: { id: created.user.id },
        update: {
          email,
          name: name || email.split('@')[0],
          role,
        },
        create: {
          id: created.user.id,
          email,
          name: name || email.split('@')[0],
          role,
        },
      });
    }

    // Выполняем автоматический вход в сессию
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        success: 'Аккаунт успешно создан! Теперь вы можете войти.',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Ошибка сервера: ${msg}` };
  }

  if (role === 'BARISTA') {
    redirect('/scan');
  } else if (role === 'CUSTOMER') {
    redirect('/guest');
  } else {
    redirect('/dashboard');
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
