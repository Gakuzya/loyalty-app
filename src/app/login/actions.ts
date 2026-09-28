'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Заполните email и пароль' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Неверный email или пароль: ' + error.message };
  }

  // Проверяем роль пользователя в базе Prisma
  if (data?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (dbUser?.role === 'BARISTA') {
      redirect('/scan');
    }
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
