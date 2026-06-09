import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

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
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const res = NextResponse.redirect(new URL('/login', request.url), { status: 303 });

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
  return res;
}
