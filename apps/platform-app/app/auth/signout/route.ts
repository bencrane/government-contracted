import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { TENANT_COOKIE_NAME } from '@/lib/auth/tenant-cookie';

/**
 * Sign-out endpoint — a native POST target, deliberately NOT a server action.
 *
 * The sidebar lives in a "use client" component. A server action bound there
 * renders the form with React's `action="javascript:throw …"` guard, so sign-out
 * only works once the (heavy) dashboard has hydrated — click before hydration and
 * nothing happens. This route removes that dependency entirely: the sidebar posts a
 * plain HTML <form action="/auth/signout" method="post">, which works with or without
 * JS, hydrated or not.
 *
 * Cookies are written directly onto the redirect response (the canonical @supabase/ssr
 * route-handler pattern) so the cleared session is guaranteed to reach the browser.
 */
export async function POST() {
  const cookieStore = await cookies();
  // Relative Location ('/login'), NOT new URL('/login', request.url): behind
  // Railway's proxy request.url is the internal bind address (https://0.0.0.0:3000),
  // so an absolute redirect sends the browser to a dead host. A relative Location
  // is resolved by the browser against the real public origin.
  const res = new NextResponse(null, { status: 303, headers: { Location: '/login' } });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_GC_SUPABASE_URL,
    env.NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) =>
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );

  await supabase.auth.signOut();
  res.cookies.delete(TENANT_COOKIE_NAME);
  return res;
}
