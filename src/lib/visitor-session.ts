import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const COOKIE_NAME = "visitor_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days
const SECRET = process.env.NEXTAUTH_SECRET ?? "visitor-secret-fallback";

export interface VisitorSession {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

function encode(session: VisitorSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(value: string): VisitorSession | null {
  try {
    const [payload, sig] = value.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

// ── Server-side helpers ───────────────────────────────────────────────────────

export async function getVisitorSession(): Promise<VisitorSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return decode(value);
}

export async function setVisitorSessionCookie(session: VisitorSession): Promise<string> {
  return encode(session);
}

// ── Token generator for magic links ─────────────────────────────────────────

export function generateMagicToken(): string {
  return randomBytes(32).toString("hex");
}

export { COOKIE_NAME, MAX_AGE };
