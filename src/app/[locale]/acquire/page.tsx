export const dynamic = "force-dynamic";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import AcquireClient from "@/components/acquire/AcquireClient";
import Breadcrumb from "@/components/ui/Breadcrumb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "اقتناء" : "Acquire",
    description: locale === "ar" ? "نسخ محدودة — فوتوغرافيا فنية" : "Limited editions — Fine art photography",
    alternates: { canonical: `/${locale}/acquire` },
    openGraph: { url: `/${locale}/acquire` },
  };
}

async function getItems() {
  try {
    return await db.acquireItem.findMany({
      where: { isActive: true },
      include: {
        // shippingAvailable included automatically (scalar field)
        work: {
          select: {
            id: true,
            code: true,
            titleAr: true,
            titleEn: true,
            locationAr: true,
            locationEn: true,
            descriptionAr: true,
            descriptionEn: true,
            imageUrl: true,
            width: true,
            height: true,
            images: {
              select: { id: true, url: true, order: true },
              orderBy: { order: "asc" as const },
            },
          },
        },
        sizes: {
          select: {
            id: true,
            label: true,
            totalEditions: true,
            soldEditions: true,
          },
          orderBy: { label: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function AcquirePage() {
  const [t, locale] = await Promise.all([getTranslations("acquire"), getLocale()]);
  const items = await getItems();

  return (
    <>
      <div className="page-header container">
        <Breadcrumb
          items={[
            { label: locale === "ar" ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: locale === "ar" ? "اقتناء" : "Acquire" },
          ]}
        />
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      {/* Certificate of Authenticity — moved above steps */}
      <div className="aq-cert container">
        <div className="aq-cert-inner">
          <div className="aq-cert-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M8.56 14.67L7 22l5-3 5 3-1.56-7.34"/>
            </svg>
          </div>
          <div className="aq-cert-text">
            <h3 className="aq-cert-title">{locale === "ar" ? "شهادة أصالة مُرقَّمة" : "Numbered Certificate of Authenticity"}</h3>
            <p className="aq-cert-desc">
              {locale === "ar"
                ? "كل طبعة محدودة الإصدار تُرفق بشهادة أصالة موقّعة يدوياً من الفنان، تحمل رقم الإصدار من المجموع الكلي، واسم العمل، وتاريخ الطباعة."
                : "Every limited-edition print comes with a hand-signed certificate of authenticity bearing the edition number, work title, and print date."}
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="aq-how container" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="aq-how-steps">
          {[
            {
              n: "01",
              ar: "اختر العمل",
              en: "Choose the work",
              arDesc: "تصفّح الأعمال المتاحة واختر المقاسك",
              enDesc: "Browse works and pick your size",
            },
            {
              n: "02",
              ar: "أرسل طلبك",
              en: "Send your request",
              arDesc: "سؤالك الأول لا يُلزمك بشيء",
              enDesc: "No commitment at this stage",
            },
            {
              n: "03",
              ar: "نرد خلال ٢٤ ساعة",
              en: "Reply within 24h",
              arDesc: "السعر والطباعة وخيارات الشحن",
              enDesc: "Pricing, specs, and shipping",
            },
            {
              n: "04",
              ar: "توقيع وشهادة",
              en: "Signed & certified",
              arDesc: "نسخة موقّعة مع شهادة مرقّمة",
              enDesc: "Hand-signed numbered certificate",
            },
          ].map((step) => (
            <div key={step.n} className="aq-step">
              <span className="aq-step-n">{step.n}</span>
              <strong className="aq-step-title">{locale === "ar" ? step.ar : step.en}</strong>
              <p className="aq-step-desc">{locale === "ar" ? step.arDesc : step.enDesc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AcquireClient items={items as any} />

      <style>{`
        .page-header {
          padding-top: 3rem;
          padding-bottom: 2.5rem;
        }

        .page-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        /* How It Works */
        .aq-how {
          padding-block: 0;
          margin-bottom: 2.5rem;
        }

        .aq-how-steps {
          display: flex;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .aq-step {
          flex: 1;
          padding: 1.1rem 1.25rem;
          border-inline-start: 1px solid var(--border-subtle);
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .aq-step:first-child {
          border-inline-start: none;
        }

        .aq-step-n {
          font-size: 0.58rem;
          color: var(--text-subtle);
          letter-spacing: 0.12em;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        .aq-step-title {
          font-size: 0.96rem;
          font-weight: 500;
          color: var(--text-primary);
          font-family: var(--font-heading);
          line-height: 1.3;
        }

        .aq-step-desc {
          font-size: 0.864rem;
          color: var(--text-subtle);
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 700px) {
          .aq-how-steps {
            display: grid;
            grid-template-columns: 1fr 1fr;
            flex-direction: unset;
          }
          .aq-step {
            border-inline-start: none;
            border-top: 1px solid var(--border-subtle);
            flex-direction: column;
            padding: 0.9rem 1rem;
          }
          /* first 2 steps — no top border */
          .aq-step:first-child,
          .aq-step:nth-child(2) { border-top: none; }
          /* left column: add inline separator on desktop */
          .aq-step:nth-child(odd) {
            border-inline-end: 1px solid var(--border-subtle);
          }
        }

        /* Certificate */
        .aq-cert {
          margin-bottom: 3rem;
        }

        .aq-cert-inner {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
        }

        .aq-cert-icon {
          flex-shrink: 0;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .aq-cert-title {
          font-size: 1.08rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-family: var(--font-heading);
        }

        .aq-cert-desc {
          font-size: 0.96rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }
      `}</style>
    </>
  );
}
