import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const ADMIN = process.env.ADMIN_EMAIL ?? "";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

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
  return getResend().emails.send({
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
  return getResend().emails.send({
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
  return getResend().emails.send({
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

// ── Commission: notify owner ─────────────────────────────────────────────────

export async function sendCommissionNotification(data: {
  name: string;
  email: string;
  phone?: string;
  projectTypeAr: string;
  projectTypeEn?: string;
  descriptionAr: string;
  budgetRange?: string;
  timelineWeeks?: number;
  referenceUrls?: string;
}) {
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? ADMIN;
  if (!CONTACT_EMAIL) return;

  const budgetLabel: Record<string, string> = {
    "< 5000": "أقل من 5,000 ريال",
    "5000-15000": "5,000 – 15,000 ريال",
    "15000+": "أكثر من 15,000 ريال",
    "undecided": "لم يحدد بعد",
  };
  const timelineLabel: Record<number, string> = {
    2: "1–2 أسبوع",
    4: "3–4 أسابيع",
    8: "1–2 شهر",
    12: "+شهرين",
  };

  return getResend().emails.send({
    from: FROM,
    to: CONTACT_EMAIL,
    subject: `طلب عمل بالطلب — ${data.name}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="border-bottom: 2px solid #111; padding-bottom: 0.5rem;">طلب عمل بالطلب جديد</h2>
        <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
          <tr><td style="padding: 0.5rem 0; color: #555; width: 140px;">الاسم</td><td>${data.name}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">البريد</td><td dir="ltr">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding: 0.5rem 0; color: #555;">الجوال</td><td dir="ltr">${data.phone}</td></tr>` : ""}
          <tr><td style="padding: 0.5rem 0; color: #555;">نوع المشروع</td><td>${data.projectTypeAr}${data.projectTypeEn ? ` / ${data.projectTypeEn}` : ""}</td></tr>
          ${data.budgetRange ? `<tr><td style="padding: 0.5rem 0; color: #555;">الميزانية</td><td>${budgetLabel[data.budgetRange] ?? data.budgetRange}</td></tr>` : ""}
          ${data.timelineWeeks ? `<tr><td style="padding: 0.5rem 0; color: #555;">الجدول الزمني</td><td>${timelineLabel[data.timelineWeeks] ?? `${data.timelineWeeks} أسابيع`}</td></tr>` : ""}
          <tr><td style="padding: 0.5rem 0; color: #555; vertical-align: top;">الوصف</td><td style="white-space: pre-wrap;">${data.descriptionAr}</td></tr>
          ${data.referenceUrls ? `<tr><td style="padding: 0.5rem 0; color: #555; vertical-align: top;">الروابط</td><td style="white-space: pre-wrap; direction: ltr;">${data.referenceUrls}</td></tr>` : ""}
        </table>
      </div>
    `,
  });
}

// ── Comment: notify owner ────────────────────────────────────────────────────

export async function sendNewCommentNotification(data: {
  postTitleAr: string;
  postSlug: string;
  commenterName: string;
  commenterEmail: string;
  content: string;
}) {
  if (!ADMIN) return;
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://salehalhuthloul.com";
  const postUrl = `${siteUrl}/ar/blog/${data.postSlug}`;
  const adminUrl = `${siteUrl}/admin/comments`;

  return getResend().emails.send({
    from: FROM,
    to: ADMIN,
    subject: `تعليق جديد — ${data.postTitleAr}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="border-bottom: 2px solid #111; padding-bottom: 0.5rem;">تعليق جديد على المدونة</h2>
        <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
          <tr><td style="padding: 0.5rem 0; color: #555; width: 120px;">التدوينة</td><td><a href="${postUrl}" style="color:#111;">${data.postTitleAr}</a></td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">الاسم</td><td>${data.commenterName}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555;">البريد</td><td dir="ltr">${data.commenterEmail}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555; vertical-align: top;">التعليق</td><td style="white-space: pre-wrap;">${data.content}</td></tr>
        </table>
        <p style="margin-top: 1.5rem;">
          <a href="${adminUrl}" style="background:#111; color:#fff; padding: 0.5rem 1.25rem; border-radius: 6px; text-decoration: none; font-size: 0.875rem;">
            عرض التعليقات في لوحة التحكم
          </a>
        </p>
      </div>
    `,
  });
}

// ── Contact: notify owner ────────────────────────────────────────────────────

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone: string;
  category: string;
  message: string;
  attachmentUrl?: string;
  downloadUrl?: string;
}) {
  if (!ADMIN) return;
  const categoryLabels: Record<string, string> = {
    collaboration: "تعاون",
    inquiry: "استفسار",
    acquisition: "اقتناء",
    media: "إعلام",
    other: "أخرى",
  };
  return getResend().emails.send({
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
          <tr><td style="padding: 0.5rem 0; color: #555;">الجوال</td><td dir="ltr">${data.phone}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #555; vertical-align: top;">الرسالة</td><td>${data.message}</td></tr>
          ${data.downloadUrl ? `<tr><td style="padding: 0.5rem 0; color: #555;">رابط تحميل</td><td dir="ltr"><a href="${data.downloadUrl}" target="_blank" style="color: #111;">${data.downloadUrl}</a></td></tr>` : ""}
          ${data.attachmentUrl ? `<tr><td style="padding: 0.5rem 0; color: #555;">المرفق</td><td><a href="${data.attachmentUrl}" target="_blank" style="color: #111;">عرض المرفق</a></td></tr>` : ""}
        </table>
      </div>
    `,
  });
}
