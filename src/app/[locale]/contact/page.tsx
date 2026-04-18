import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import { db } from "@/lib/db";
import Breadcrumb from "@/components/ui/Breadcrumb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "تواصل" : "Contact",
    description: locale === "ar" ? "تواصل مع صالح الهذلول" : "Get in touch with Saleh Alhuthloul",
    alternates: { canonical: `/${locale}/contact` },
    openGraph: { url: `/${locale}/contact` },
  };
}

function getContactIcon(type: string): string {
  switch (type) {
    case "whatsapp":  return "💬";
    case "email":     return "✉️";
    case "phone":     return "📞";
    case "calendly":  return "📅";
    default:          return "🔗";
  }
}

interface ContactLink { id: string; type: string; url: string; labelAr: string; labelEn: string; }

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("contact");

  let contactLinks: ContactLink[] = [];
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "main" },
      select: { contactLinks: true },
    });
    if (settings?.contactLinks) {
      contactLinks = JSON.parse(settings.contactLinks) as ContactLink[];
    }
  } catch { /* ignore */ }

  return (
    <>
      <div className="contact-page container">
        <Breadcrumb
          items={[
            { label: locale === "ar" ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: locale === "ar" ? "تواصل" : "Contact" },
          ]}
        />
        <div className="contact-header">
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>

        <div className="contact-body">
          {contactLinks.length > 0 && (
            <div className="contact-links">
              {contactLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.type !== "phone" && link.type !== "email" ? "_blank" : undefined}
                  rel={link.type !== "phone" && link.type !== "email" ? "noopener noreferrer" : undefined}
                  className="contact-link-item"
                >
                  <span className="contact-link-icon">{getContactIcon(link.type)}</span>
                  <span className="contact-link-label">
                    {locale === "ar" ? (link.labelAr || link.labelEn) : (link.labelEn || link.labelAr)}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Response time promise */}
          <div className="ct-response-promise" dir={locale === "ar" ? "rtl" : "ltr"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{locale === "ar" ? "نرد على رسائلك خلال ٢٤ ساعة" : "We reply to all messages within 24 hours"}</span>
          </div>

          <div className="contact-form-wrap">
            <ContactForm />
          </div>

          {/* Commission CTA */}
          <div className="contact-commission-cta" dir={locale === "ar" ? "rtl" : "ltr"}>
            <span className="cta-text">
              {locale === "ar"
                ? "هل تبحث عن عمل فوتوغرافي فني بالطلب لمشروعك؟"
                : "Looking for fine art photography commissioned for your project?"}
            </span>
            <a href={`/${locale}/commissioned`} className="cta-link">
              {locale === "ar" ? "أعمال بالطلب ←" : "Commissioned Work →"}
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .contact-page {
          padding-top: 3rem;
          padding-bottom: 6rem;
        }
        .contact-header { margin-bottom: 3rem; }
        .page-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin-bottom: 0.5rem;
        }
        .page-subtitle { font-size: 0.95rem; color: var(--text-muted); }
        .contact-body {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          max-width: 600px;
        }
        .contact-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .contact-link-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.1rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          text-decoration: none;
          font-size: 0.85rem;
          transition: border-color 0.15s, background 0.15s;
        }
        .contact-link-item:hover {
          border-color: var(--text-primary);
          background: color-mix(in srgb, var(--text-primary) 6%, transparent);
        }
        .contact-link-icon { font-size: 1rem; line-height: 1; }
        .contact-form-wrap { width: 100%; }
        .ct-response-promise {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .contact-commission-cta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }
        .cta-text { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; }
        .cta-link {
          font-size: 0.875rem; font-weight: 500;
          color: var(--text-primary); text-decoration: none;
          transition: opacity 0.15s;
        }
        .cta-link:hover { opacity: 0.7; }
      `}</style>
    </>
  );
}
