import { db } from "@/lib/db";

interface Props {
  locale: "ar" | "en";
}

export default async function TestimonialsSection({ locale }: Props) {
  let items: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    roleAr: string | null;
    roleEn: string | null;
    textAr: string;
    textEn: string | null;
    imageUrl: string | null;
  }[] = [];

  try {
    items = await db.testimonial.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      select: { id: true, nameAr: true, nameEn: true, roleAr: true, roleEn: true, textAr: true, textEn: true, imageUrl: true },
    });
  } catch {
    return null;
  }

  if (!items.length) return null;

  const dir = locale === "ar" ? "rtl" : "ltr";
  const heading = locale === "ar" ? "ماذا يقول المقتنون" : "What collectors say";

  return (
    <section className="tst-section container" dir={dir}>
      <h2 className="tst-heading">{heading}</h2>
      <div className="tst-grid">
        {items.map((item) => {
          const name = locale === "ar" ? item.nameAr : (item.nameEn ?? item.nameAr);
          const role = locale === "ar" ? item.roleAr : (item.roleEn ?? item.roleAr);
          const text = locale === "ar" ? item.textAr : (item.textEn ?? item.textAr);
          return (
            <div key={item.id} className="tst-card">
              <p className="tst-text">❝ {text} ❞</p>
              <div className="tst-author">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={name} className="tst-avatar" />
                )}
                <div>
                  <strong className="tst-name">{name}</strong>
                  {role && <span className="tst-role">{role}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .tst-section {
          padding-block: 5rem;
          border-top: 1px solid var(--border-subtle);
        }

        .tst-heading {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-subtle);
          margin-bottom: 2.5rem;
        }

        .tst-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .tst-card {
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tst-text {
          font-size: 0.9rem;
          line-height: 1.75;
          color: var(--text-secondary);
          margin: 0;
          flex: 1;
          font-style: italic;
        }

        .tst-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .tst-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .tst-name {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .tst-role {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }
      `}</style>
    </section>
  );
}
