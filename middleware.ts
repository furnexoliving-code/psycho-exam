import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and guards the private
 * areas. Admin pages are checked again on the server inside the page itself —
 * middleware is a convenience redirect, never the only gate.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without configuration the site still runs; only the signed-in areas are off.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getSession reads the cookie and refreshes the token only when it has
  // expired, so a valid session costs no round trip to the auth server here.
  // getUser would verify it with the auth server on EVERY request — and every
  // page then verifies it again for real inside requireUser. This redirect is
  // a courtesy; the page's own check is the gate, so the cheaper read is fine.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const path = request.nextUrl.pathname;

  // The front door goes straight to the right place, without a page render
  // whose only job was to decide this.
  if (path === "/") {
    const to = request.nextUrl.clone();
    to.pathname = user ? "/dashboard" : "/login";
    to.search = "";
    return NextResponse.redirect(to);
  }

  // Everything a candidate does needs an account: there is no public paper.
  // The pages check again on the server; this only saves the round trip.
  const isPrivate =
    path.startsWith("/admin") ||
    path.startsWith("/staff") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/tests") ||
    path.startsWith("/watch-table");

  if (isPrivate && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg)$).*)"],
};
