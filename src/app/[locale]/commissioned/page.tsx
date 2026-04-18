import type { Metadata } from "next";
import CommissionForm from "@/components/commissioned/CommissionForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "أعمال بالطلب" : "Commissioned Work",
    description:
      locale === "ar"
        ? "هل تبحث عن عمل فوتوغرافي فني لمشروع أو مساحة بعينها؟ أتعاون على مشاريع مختارة."
        : "Looking for fine art photography for a specific project or space? I collaborate on select projects.",
    alternates: { canonical: `/${locale}/commissioned` },
    openGraph: { url: `/${locale}/commissioned` },
  };
}

export default async function CommissionedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <>
      <div className="commissioned-page container">
        <div className="commissioned-header">
          <h1 className="page-title">
            {isAr ? "أعمال بالطلب" : "Commissioned Work"}
          </h1>
          <p className="page-subtitle">
            {isAr
              ? "هل تبحث عن عمل فوتوغرافي فني لمشروع أو مساحة بعينها؟ أتعاون على مشاريع مختارة."
              : "Looking for fine art photography for a specific project or space? I collaborate on select projects."}
          </p>
        </div>

        <div className="commissioned-body">
          <CommissionForm />
        </div>
      </div>

      <style>{`
        .commissioned-page {
          padding-top: 3rem;
          padding-bottom: 6rem;
        }

        .commissioned-header {
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
          line-height: 1.7;
          max-width: 560px;
        }

        .commissioned-body {
          max-width: 600px;
        }
      `}</style>
    </>
  );
}
