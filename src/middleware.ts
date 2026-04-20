import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value),
          );
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Використовуємо getUser() замість getSession() для більшої надійності
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // console.log(`MW DEBUG: Шлях: ${pathname}, Юзер: ${user?.email || 'немає'}`);

  if (pathname.startsWith('/admin')) {
    if (!user) {
      // console.log('MW DEBUG: Редирект на логін (немає юзера)');
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      // console.log('MW DEBUG: Редирект на головну (не адмін)');
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
