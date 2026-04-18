import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "دليل العناية بالطباعة الفنية" : "Fine Art Print Care Guide",
    description:
      locale === "ar"
        ? "كيف تحافظ على طباعتك الفنية لأطول فترة ممكنة"
        : "How to preserve your fine art print for as long as possible",
    alternates: { canonical: `/${locale}/care-guide` },
  };
}

interface Section {
  titleAr: string;
  titleEn: string;
  points: { ar: string; en: string }[];
}

const sections: Section[] = [
  {
    titleAr: "التخزين والحفظ",
    titleEn: "Storage & Preservation",
    points: [
      {
        ar: "احفظ طباعتك بعيداً عن أشعة الشمس المباشرة لمنع التلاشي المبكر للألوان.",
        en: "Store your print away from direct sunlight to prevent premature color fading.",
      },
      {
        ar: "حافظ على رطوبة المكان أقل من ٥٠٪ لتجنب تلف الورق والعفن.",
        en: "Maintain humidity below 50% to avoid paper damage and mould growth.",
      },
      {
        ar: "استخدم مواد خالية من الأحماض (acid-free) عند التغليف أو التخزين.",
        en: "Use acid-free materials for wrapping or storage to prevent chemical degradation.",
      },
      {
        ar: "تجنب تخزين الطباعة في أكياس بلاستيكية مغلقة لفترات طويلة.",
        en: "Avoid storing prints in sealed plastic bags for extended periods.",
      },
    ],
  },
  {
    titleAr: "التأطير والتعليق",
    titleEn: "Framing & Display",
    points: [
      {
        ar: "استخدم زجاجاً واقياً من الأشعة فوق البنفسجية (UV-protective glass) لإطالة عمر الطباعة.",
        en: "Use UV-protective glass or acrylic to extend the life of your print.",
      },
      {
        ar: "احرص على ترك مسافة بين سطح الطباعة والزجاج لمنع الالتصاق والتلف.",
        en: "Ensure a gap between the print surface and the glass to prevent adhesion and damage.",
      },
      {
        ar: "استخدم باسبارتو (mat board) خالياً من الأحماض لتوفير هذه المسافة الواقية.",
        en: "Use an acid-free mat board to provide this protective gap.",
      },
      {
        ar: "اختر موضعاً للتعليق بعيداً عن مصادر الحرارة المباشرة كالمدافئ والمكيفات.",
        en: "Choose a display location away from direct heat sources such as radiators and vents.",
      },
    ],
  },
  {
    titleAr: "التنظيف",
    titleEn: "Cleaning",
    points: [
      {
        ar: "نظّف الطباعة بقماش ناعم وجاف فقط — تجنب أي سوائل أو مواد كيميائية.",
        en: "Clean the print with a soft, dry cloth only — avoid any liquids or chemicals.",
      },
      {
        ar: "لا تلمس سطح الطباعة بأصابعك مباشرةً؛ استخدم قفازات قطنية عند التعامل معها.",
        en: "Do not touch the print surface with bare hands; use cotton gloves when handling.",
      },
      {
        ar: "إذا كانت الطباعة داخل إطار، نظّف الزجاج فقط دون فتح الإطار.",
        en: "If framed, clean only the glass surface without opening the frame.",
      },
    ],
  },
  {
    titleAr: "درجة الحرارة والبيئة",
    titleEn: "Temperature & Environment",
    points: [
      {
        ar: "احتفظ بدرجة حرارة ثابتة بين ١٨ و٢٤ درجة مئوية.",
        en: "Maintain a stable temperature between 18°C and 24°C (64–75°F).",
      },
      {
        ar: "تجنب التغيرات المفاجئة في درجة الحرارة التي قد تتسبب في تمدد وانكماش الورق.",
        en: "Avoid sudden temperature fluctuations that can cause the paper to expand and contract.",
      },
      {
        ar: "لا تعلّق الطباعة بالقرب من المطابخ أو الحمامات حيث يرتفع البخار.",
        en: "Do not hang prints near kitchens or bathrooms where steam is common.",
      },
    ],
  },
];

export default async function CareGuidePage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <>
      <div className="cg-page container" dir={dir}>
        <Breadcrumb
          items={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "دليل العناية" : "Care Guide" },
          ]}
        />

        <header className="cg-header">
          <h1 className="cg-title">
            {isAr ? "دليل العناية بالطباعة الفنية" : "Fine Art Print Care Guide"}
          </h1>
          <p className="cg-subtitle">
            {isAr
              ? "كل طباعة فنية تستحق الحفاظ عليها للأجيال القادمة — اتبع هذه الإرشادات للحصول على أفضل النتائج."
              : "Every fine art print deserves to be preserved for generations — follow these guidelines for the best results."}
          </p>
        </header>

        <div className="cg-sections">
          {sections.map((section, i) => (
            <section key={i} className="cg-section">
              <h2 className="cg-section-title">
                {isAr ? section.titleAr : section.titleEn}
              </h2>
              <ul className="cg-list">
                {section.points.map((point, j) => (
                  <li key={j} className="cg-list-item">
                    <span className="cg-bullet" aria-hidden="true" />
                    <span>{isAr ? point.ar : point.en}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="cg-footer">
          <p className="cg-footer-note">
            {isAr
              ? "هل لديك استفسار حول طباعتك؟"
              : "Have a question about your print?"}
          </p>
          <Link href={`/${locale}/contact`} className="cg-contact-link">
            {isAr ? "تواصل معنا" : "Get in touch"}
          </Link>
        </footer>
      </div>

      <style>{`
        .cg-page {
          padding-top: 2.5rem;
          padding-bottom: 6rem;
          max-width: 720px;
        }

        .cg-header {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .cg-title {
          font-family: var(--font-heading);
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 0.75rem;
        }

        .cg-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0;
        }

        .cg-sections {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .cg-section {
          padding-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .cg-section:last-child {
          border-bottom: none;
        }

        .cg-section-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          letter-spacing: 0.02em;
          margin-bottom: 1.25rem;
        }

        .cg-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .cg-list-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .cg-bullet {
          flex-shrink: 0;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--text-subtle);
          margin-top: 0.6em;
        }

        .cg-footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cg-footer-note {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .cg-contact-link {
          font-size: 0.875rem;
          color: var(--text-primary);
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1px;
          transition: border-color 0.15s, color 0.15s;
        }

        .cg-contact-link:hover {
          border-color: var(--text-primary);
        }
      `}</style>
    </>
  );
}
