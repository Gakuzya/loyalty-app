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
  let targetPath = '/guest';

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
          role: 'CUSTOMER', // Любой новый пользователь по умолчанию только CUSTOMER
        },
      });
    }

    if (dbUser.role === 'OWNER') {
      targetPath = '/dashboard';
    } else if (dbUser.role === 'BARISTA') {
      targetPath = '/scan';
    } else {
      targetPath = '/guest';
    }
  }

  redirect(targetPath);
}

// Регистрация ТОЛЬКО для гостей (CUSTOMER). Никакой публичной регистрации под владельца!
export async function signUp(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();

  // Жестко фиксируем роль CUSTOMER: пользователи не могут сами назначить себе роль OWNER
  const role = 'CUSTOMER';

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
          role: 'CUSTOMER',
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

    // Создаем запись пользователя в Prisma со строгой ролью CUSTOMER
    if (created.user) {
      await prisma.user.upsert({
        where: { id: created.user.id },
        update: {
          email,
          name: name || email.split('@')[0],
          // Не перезаписываем роль, если пользователь уже был в БД с другой ролью
        },
        create: {
          id: created.user.id,
          email,
          name: name || email.split('@')[0],
          role: 'CUSTOMER',
        },
      });
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

  redirect('/guest');
}

// Быстрый вход с Google Email:
// Если пользователь уже существует в базе (например, Владелец или Бариста) — сохраняет его роль и перенаправляет в нужный кабинет.
// Если это новый пользователь — создается СТРОГО с ролью CUSTOMER (гость).
export async function quickGoogleLogin(email: string) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Пожалуйста, введите корректный адрес электронной почты' };
  }

  let userRole: 'OWNER' | 'BARISTA' | 'CUSTOMER' = 'CUSTOMER';

  try {
    const admin = createAdminClient();
    const {
      data: { users },
    } = await admin.auth.admin.listUsers();
    let targetUser = users.find((u) => u.email?.toLowerCase() === cleanEmail);

    // Проверяем существующего пользователя в Prisma
    let dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (dbUser) {
      userRole = dbUser.role;
    }

    if (!targetUser) {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: {
            name: cleanEmail.split('@')[0],
            role: userRole,
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

    if (!dbUser) {
      // Новый пользователь создается строго как CUSTOMER!
      dbUser = await prisma.user.create({
        data: {
          id: targetUser.id,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: 'CUSTOMER',
        },
      });
      userRole = 'CUSTOMER';
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

  if (userRole === 'OWNER') {
    redirect('/dashboard');
  } else if (userRole === 'BARISTA') {
    redirect('/scan');
  } else {
    redirect('/guest');
  }
}

// Запрос на сброс пароля по Email
export async function requestPasswordReset(email: string) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Укажите корректный адрес электронной почты' };
  }

  try {
    // 1. Проверяем, существует ли аккаунт
    const dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const admin = createAdminClient();
    const {
      data: { users },
    } = await admin.auth.admin.listUsers();
    const authUser = users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!dbUser && !authUser) {
      return {
        error: `Аккаунт с почтой ${cleanEmail} не найден. Проверьте правильность адреса или зарегистрируйтесь.`,
      };
    }

    // 2. Генерируем ссылку восстановления через Supabase Admin API
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
      });

    if (linkErr) {
      console.warn('generateLink warning:', linkErr.message);
    }

    // 3. Пытаемся отправить официальное письмо через Supabase
    try {
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(cleanEmail);
    } catch (emailErr) {
      console.warn('Supabase resetPasswordForEmail warning:', emailErr);
    }

    return {
      success: true,
      email: cleanEmail,
      directLink: linkData?.properties?.action_link || null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Ошибка: ${msg}` };
  }
}

// Сброс и сохранение нового пароля по Email
export async function resetPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const newPassword = (formData.get('newPassword') as string)?.trim();
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();

  if (!email || !newPassword) {
    return { error: 'Заполните email и новый пароль' };
  }

  if (newPassword.length < 6) {
    return { error: 'Новый пароль должен содержать минимум 6 символов' };
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return { error: 'Пароли не совпадают' };
  }

  let userRole: 'OWNER' | 'BARISTA' | 'CUSTOMER' = 'CUSTOMER';

  try {
    const admin = createAdminClient();
    const {
      data: { users },
    } = await admin.auth.admin.listUsers();
    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return { error: 'Пользователь с таким email не найден' };
    }

    // Обновляем пароль пользователя через Admin API
    const { error: updateErr } = await admin.auth.admin.updateUserById(
      targetUser.id,
      {
        password: newPassword,
        email_confirm: true,
      }
    );

    if (updateErr) {
      return { error: `Не удалось обновить пароль: ${updateErr.message}` };
    }

    // Проверяем роль в Prisma
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });
    if (dbUser) {
      userRole = dbUser.role;
    }

    // Авторизуем пользователя с новым паролем
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Ошибка при сохранении пароля: ${msg}` };
  }

  if (userRole === 'OWNER') {
    redirect('/dashboard');
  } else if (userRole === 'BARISTA') {
    redirect('/scan');
  } else {
    redirect('/guest');
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
