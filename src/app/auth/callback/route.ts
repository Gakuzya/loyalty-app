import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const errorMsg =
    searchParams.get('error_description') || searchParams.get('error');

  if (errorMsg) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Синхронизируем пользователя в Prisma при входе через Google
      try {
        const user = data.user;
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
        });

        if (!existing && user.email) {
          await prisma.user.upsert({
            where: { email: user.email },
            update: { id: user.id },
            create: {
              id: user.id,
              email: user.email,
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email.split('@')[0],
              role: next.startsWith('/guest') ? 'CUSTOMER' : 'OWNER',
            },
          });
        }
      } catch (err) {
        console.error('Error syncing OAuth user to Prisma:', err);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Ошибка авторизации через сторонний сервис')}`
  );
}
