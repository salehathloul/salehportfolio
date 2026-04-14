import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMagicToken } from "@/lib/visitor-session";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── POST /api/auth/magic — request magic link ─────────────────────────────────

export async function POST(req: NextRequest) {
  const { name, email, phone, source } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "الإيميل مطلوب" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if this is an admin email
  const adminUser = await db.user.findUnique({ where: { email: normalizedEmail } });
  const isAdmin = Boolean(adminUser);

  // For visitors, name is required on first registration
  if (!isAdmin) {
    const existing = await db.visitor.findUnique({ where: { email: normalizedEmail } });
    if (!existing && !name?.trim()) {
      return NextResponse.json({ error: "الاسم مطلوب للتسجيل" }, { status: 400 });
    }
  }

  // Clean up old unused tokens for this email
  await db.magicToken.deleteMany({
    where: { email: normalizedEmail, usedAt: null, expiresAt: { lt: new Date() } },
  });

  // Create new token (expires in 15 min)
  const token = generateMagicToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.magicToken.create({
    data: {
      email: normalizedEmail,
      token,
      type: isAdmin ? "admin" : "visitor",
      expiresAt,
    },
  });

  // Build verify URL — embed name/phone for new visitor registration
  const params = new URLSearchParams({ token });
  if (!isAdmin) {
    if (name?.trim()) params.set("name", name.trim());
    if (phone?.trim()) params.set("phone", phone.trim());
    if (source?.trim()) params.set("source", source.trim());
  }
  const verifyUrl = `${BASE_URL}/api/auth/magic/verify?${params.toString()}`;

  // Send email via Resend
  const subject = isAdmin ? "رابط دخول لوحة التحكم" : "رابط دخولك للموقع";
  const greeting = isAdmin ? (adminUser?.name ?? "مرحباً") : (name?.trim() ?? "مرحباً");

  try {
    await resend.emails.send({
      from: "noreply@salehalhathoul.com",
      to: normalizedEmail,
      subject,
      html: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem; color: #1a1a1a;">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">مرحباً ${greeting}،</p>
          <p style="color: #555; margin-bottom: 2rem;">اضغط الزر أدناه للدخول. الرابط صالح لمدة <strong>١٥ دقيقة</strong> فقط.</p>
          <a href="${verifyUrl}"
            style="display: inline-block; background: #1a1a1a; color: #fff; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-size: 1rem;">
            دخول للموقع
          </a>
          <p style="margin-top: 2rem; font-size: 0.8rem; color: #999;">
            إذا لم تطلب هذا الرابط، يمكنك تجاهل هذا الإيميل بأمان.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "فشل إرسال الإيميل" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, isAdmin });
}
