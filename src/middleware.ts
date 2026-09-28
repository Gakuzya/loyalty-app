import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Проверка активной сессии
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Закрытые маршруты для персонала
  const isStaffProtectedPath =
    path.startsWith('/dashboard') ||
    path.startsWith('/branches') ||
    path.startsWith('/staff') ||
    path.startsWith('/kpi') ||
    path.startsWith('/guests') ||
    path.startsWith('/settings') ||
    path.startsWith('/scan') ||
    path.startsWith('/action');

  // Если неавторизованный пользователь пытается зайти в закрытый персонал-раздел
  if (isStaffProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Если уже авторизованный пользователь заходит на /login — отправляем в дашборд
  if (path === '/login' && user) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Применяем middleware ко всем маршрутам, кроме:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация картинок)
     * - favicon.ico и файлы ассетов
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
