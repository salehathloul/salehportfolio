import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { locales, defaultLocale } from "@/lib/i18n";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes protection ───────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── API routes — skip i18n ────────────────────────────
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ── Public routes — apply i18n ────────────────────────
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
