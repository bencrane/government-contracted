import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Magic-link / OAuth callback: exchange the auth code for a session, then send the
 * browser to its destination.
 *
 * Redirects use a RELATIVE Location, never `new URL(path, request.url)`. Behind
 * Railway's proxy the standalone server's `request.url` carries the internal bind
 * address (https://0.0.0.0:3000), so an absolute redirect built from it points the
 * browser at a dead host — the same failure mode fixed in app/auth/signout/route.ts.
 * A relative Location is resolved by the browser against the real public origin.
 *
 * `next` is caller-supplied, so it is additionally constrained to a same-app absolute
 * path (single leading slash, not protocol-relative "//host") to avoid an open redirect.
 */
function redirectTo(location: string): NextResponse {
  // Mirror app/auth/signout/route.ts: emit the relative Location directly rather than
  // letting NextResponse.redirect derive an absolute URL from the request origin.
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}

function safeRelative(next: string | null): string {
  // Accept only in-app absolute paths: "/...". Reject "//evil.com", "https://...", etc.
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/';
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const next = safeRelative(params.get('next'));

  if (!code) {
    return redirectTo('/login?error=missing_code');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return redirectTo(`/login?error=${encodeURIComponent(error.message)}`);
  }

  return redirectTo(next);
}
