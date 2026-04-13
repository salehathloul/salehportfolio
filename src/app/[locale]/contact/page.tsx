import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

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

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <>
      <div className="contact-page container">
        <div className="contact-header">
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>

        <div className="contact-layout">
          <ContactForm />
        </div>
      </div>

      <style>{`
        .contact-page {
          padding-top: 3rem;
          padding-bottom: 6rem;
        }

        .contact-header {
          margin-bottom: 3rem;
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
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .contact-layout {
          max-width: 600px;
        }
      `}</style>
    </>
  );
}
