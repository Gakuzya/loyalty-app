import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Если не авторизован — сразу перенаправляем на страницу входа
  if (!user) {
    redirect('/login');
  }

  // Если авторизован — находим роль и направляем строго в его панель
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (dbUser?.role === 'OWNER') {
    redirect('/dashboard');
  } else if (dbUser?.role === 'BARISTA') {
    redirect('/scan');
  } else {
    redirect('/guest');
  }
}
