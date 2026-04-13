import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "noreply@salehalhuthloul.com";
const ADMIN = process.env.ADMIN_EMAIL ?? "";

// ── Order: notify owner ───────────────────────────────────────────────────────

export async function sendNewOrderNotification(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  workTitle: string;
  workCode: string;
  size: string;
  message?: string;
}) {
  if (!ADMIN) return;
  return resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `طلب اقتناء جديد — ${data.workTitle} (${data.workCode})`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="border-bottom: 2px solid #111; padding-bottom: 0.5rem;">طلب اقتناء جديد</h2>
        <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
          <tr><td style="padding: 0.5rem 0; color: #555; width: 140px;">العمل</td><td><strong>${data.workTitle}</strong> — ${data.workCode}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">المقاس</td><td>${data.size}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">الاسم</td><td>${data.customerName}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">البريد</td><td dir="ltr">${data.customerEmail}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">الجوال</td><td dir="ltr">${data.customerPhone}</td></tr>
          ${data.message ? `<tr><td style="padding: 0.5rem 0; color: #555; vertical-align: top;">الرسالة</td><td>${data.message}</td></tr>` : ""}
        </table>
        <p style="color: #555; font-size: 0.875rem;">رقم الطلب: <code>${data.orderId}</code></p>
      </div>
    `,
  });
}

// ── Order: confirm receipt to customer ───────────────────────────────────────

export async function sendOrderConfirmation(data: {
  customerName: string;
  customerEmail: string;
  workTitle: string;
  size: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `تم استلام طلبك — ${data.workTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2>شكراً لاهتمامك</h2>
        <p>مرحباً ${data.customerName}،</p>
        <p>تم استلام طلبك لاقتناء <strong>${data.workTitle}</strong> بمقاس <strong>${data.size}</strong>.</p>
        <p>سيتم التواصل معك قريباً بالسعر وتفاصيل الاقتناء.</p>
        <br>
        <p style="color: #555; font-size: 0.875rem;">صالح الهذلول</p>
      </div>
    `,
  });
}

// ── Order: send price to customer ────────────────────────────────────────────

export async function sendPriceQuote(data: {
  customerName: string;
  customerEmail: string;
  workTitle: string;
  size: string;
  price: number;
  currency?: string;
  notes?: string;
}) {
  const currency = data.currency ?? "SAR";
  return resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `عرض سعر — ${data.workTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2>عرض سعر لاقتناء عمل فوتوغرافي</h2>
        <p>مرحباً ${data.customerName}،</p>
        <p>يسعدني مشاركتك سعر اقتناء <strong>${data.workTitle}</strong> بمقاس <strong>${data.size}</strong>:</p>
        <div style="background: #f8f8f8; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; text-align: center;">
          <span style="font-size: 2rem; font-weight: 600;">${data.price.toLocaleString("ar-SA")} ${currency}</span>
        </div>
        ${data.notes ? `<p>${data.notes}</p>` : ""}
        <p>للمتابعة أو الاستفسار، تواصل معي مباشرة عبر الرد على هذا البريد.</p>
        <br>
        <p style="color: #555; font-size: 0.875rem;">صالح الهذلول</p>
      </div>
    `,
  });
}

// ── Contact: notify owner ────────────────────────────────────────────────────

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone?: string;
  category: string;
  message: string;
}) {
  if (!ADMIN) return;
  const categoryLabels: Record<string, string> = {
    collaboration: "تعاون",
    inquiry: "استفسار",
    acquisition: "اقتناء",
    media: "إعلام",
    other: "أخرى",
  };
  return resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `رسالة جديدة — ${categoryLabels[data.category] ?? data.category}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="border-bottom: 2px solid #111; padding-bottom: 0.5rem;">رسالة جديدة من الموقع</h2>
        <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
          <tr><td style="padding: 0.5rem 0; color: #555; width: 120px;">التصنيف</td><td>${categoryLabels[data.category] ?? data.category}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">الاسم</td><td>${data.name}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">البريد</td><td dir="ltr">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding: 0.5rem 0; color: #555;">الجوال</td><td dir="ltr">${data.phone}</td></tr>` : ""}
          <tr><td style="padding: 0.5rem 0; color: #555; vertical-align: top;">الرسالة</td><td>${data.message}</td></tr>
        </table>
      </div>
    `,
  });
}
