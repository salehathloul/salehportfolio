import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setVisitorSessionCookie, COOKIE_NAME, MAX_AGE } from "@/lib/visitor-session";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const name = searchParams.get("name") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const source = searchParams.get("source") ?? "nav";

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/?error=invalid_token`);
  }

  // Look up token
  const magic = await db.magicToken.findUnique({ where: { token } });

  if (!magic || magic.usedAt || magic.expiresAt < new Date()) {
    return NextResponse.redirect(`${BASE_URL}/?error=expired_token`);
  }

  // Mark token as used
  await db.magicToken.update({ where: { token }, data: { usedAt: new Date() } });

  // ── Admin flow ────────────────────────────────────────────────────────────
  if (magic.type === "admin") {
    // Redirect to a special page that will sign in via NextAuth credentials
    const res = NextResponse.redirect(`${BASE_URL}/admin/magic-login?verified=${token}`);
    return res;
  }

  // ── Visitor flow ─────────────────────────────────────────────────────────
  const email = magic.email;

  let visitor = await db.visitor.findUnique({ where: { email } });

  if (visitor) {
    // Update last login and optionally phone
    visitor = await db.visitor.update({
      where: { email },
      data: {
        lastLoginAt: new Date(),
        ...(phone && !visitor.phone ? { phone } : {}),
        ...(name && visitor.name !== name ? {} : {}), // keep existing name
      },
    });
  } else {
    // Create new visitor
    visitor = await db.visitor.create({
      data: {
        name: name || email.split("@")[0],
        email,
        phone: phone || null,
        source: source || "nav",
      },
    });
  }

  // Set visitor session cookie
  const sessionValue = await setVisitorSessionCookie({
    id: visitor.id,
    name: visitor.name,
    email: visitor.email,
    phone: visitor.phone,
  });

  const res = NextResponse.redirect(`${BASE_URL}/ar`);
  res.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return res;
}
