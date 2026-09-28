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
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const role = ((formData.get('role') as string) || 'OWNER') as
    | 'OWNER'
    | 'CUSTOMER'
    | 'BARISTA';

  if (!email || !password) {
    return { error: 'Пожалуйста, укажите email и пароль' };
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: 'Введенные пароли не совпадают' };
  }

  if (password.length < 6) {
    return { error: 'Пароль должен содержать не менее 6 символов' };
  }

  try {
    const admin = createAdminClient();

    // Создаем пользователя сразу с подтвержденным email, чтобы не требовать перехода по письму
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
            'Пользователь с таким email уже зарегистрирован. Переключитесь на «Вход».',
        };
      }
      return { error: `Ошибка регистрации: ${createError.message}` };
    }

    // Создаем запись пользователя в Prisma
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

      // Если регистрируется владелец, сразу создаем для него сеть и первый филиал
      if (role === 'OWNER') {
        const slug = `branch-${created.user.id.slice(0, 6)}`;
        await prisma.network.upsert({
          where: { ownerId: created.user.id },
          update: {},
          create: {
            ownerId: created.user.id,
            name: name ? `Сеть ${name}` : 'Моя Сеть Кофеен',
            targetStamps: 6,
            rewardTitle: 'Бесплатный напиток на выбор',
            branches: {
              create: {
                name: 'Главный филиал',
                slug,
                address: 'ул. Главная, д. 1',
              },
            },
          },
        });
      }
    }

    // Выполняем мгновенную авторизацию в Next.js сессию
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        success: 'Аккаунт успешно создан! Теперь вы можете войти со своим паролем.',
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

// Быстрый вход с Google Email без паролей и ожидания активации провайдера
export async function quickGoogleLogin(
  email: string,
  role: 'OWNER' | 'CUSTOMER' = 'OWNER'
) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Пожалуйста, введите корректный адрес электронной почты' };
  }

  try {
    const admin = createAdminClient();
    const {
      data: { users },
    } = await admin.auth.admin.listUsers();
    let targetUser = users.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!targetUser) {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: {
            name: cleanEmail.split('@')[0],
            role,
          },
        });
      if (createErr) {
        return { error: createErr.message };
      }
      targetUser = created.user;
    } else {
      if (!targetUser.email_confirmed_at) {
        await admin.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        });
      }
    }

    if (!targetUser) {
      return { error: 'Не удалось инициализировать профиль' };
    }

    // Синхронизируем в Prisma
    let dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: targetUser.id,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role,
        },
      });
    }

    if (role === 'OWNER') {
      const existingNetwork = await prisma.network.findUnique({
        where: { ownerId: dbUser.id },
      });
      if (!existingNetwork) {
        await prisma.network.create({
          data: {
            ownerId: dbUser.id,
            name: `Сеть ${dbUser.name}`,
            targetStamps: 6,
            rewardTitle: 'Бесплатный напиток на выбор',
            branches: {
              create: {
                name: 'Главный филиал',
                slug: `branch-${dbUser.id.slice(0, 6)}`,
                address: 'ул. Главная, д. 1',
              },
            },
          },
        });
      }
    }

    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
      });

    if (linkErr || !linkData?.properties?.hashed_token) {
      return { error: 'Не удалось сгенерировать сессионный токен' };
    }

    const supabase = await createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (otpError) {
      return { error: `Ошибка сессии: ${otpError.message}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Ошибка входа: ${msg}` };
  }

  if (role === 'CUSTOMER') {
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
