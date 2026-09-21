import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
  "EDITOR",
]);

async function readToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  // On HTTPS (Vercel) the session cookie is `__Secure-authjs.session-token`.
  // Without secureCookie: true, getToken looks at the wrong name and returns null
  // → infinite /admin ↔ /login redirects (stuck on loading).
  return getToken({
    req,
    secret,
    secureCookie: req.nextUrl.protocol === "https:",
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = await readToken(req);
    const role = token?.role as string | undefined;
    const isAdmin = Boolean(token?.id) && Boolean(role && ADMIN_ROLES.has(role));

    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account")) {
    const token = await readToken(req);
    if (!token?.id) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
