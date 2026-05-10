export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const key = process.env.RESEND_API_KEY;
  const admin = process.env.ADMIN_EMAIL;

  if (!key) return NextResponse.json({ error: "RESEND_API_KEY غير موجود" }, { status: 500 });
  if (!admin) return NextResponse.json({ error: "ADMIN_EMAIL غير موجود" }, { status: 500 });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: admin,
    subject: "اختبار إيميل — موقع صالح الهذلول",
    html: `<div dir="rtl"><p>هذا إيميل تجريبي للتأكد من عمل Resend.</p><p>إذا وصلك هذا، فالإرسال يعمل ✅</p></div>`,
  });

  if (error) {
    return NextResponse.json({ ok: false, error, key_prefix: key.slice(0, 8), to: admin });
  }

  return NextResponse.json({ ok: true, id: data?.id, to: admin });
}
