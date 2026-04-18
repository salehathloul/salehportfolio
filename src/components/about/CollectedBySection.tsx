import { db } from "@/lib/db";

interface Props {
  locale: "ar" | "en";
}

export default async function CollectedBySection({ locale }: Props) {
  let items: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
  }[] = [];

  try {
    items = await db.collectedBy.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      select: { id: true, nameAr: true, nameEn: true, logoUrl: true, websiteUrl: true },
    });
  } catch {
    return null;
  }

  if (!items.length) return null;

  const dir = locale === "ar" ? "rtl" : "ltr";
  const heading = locale === "ar" ? "اقتُنيت أعماله في" : "Works collected by";

  return (
    <section className="cob-section container" dir={dir}>
      <h2 className="cob-heading">{heading}</h2>
      <div className="cob-grid">
        {items.map((item) => {
          const name = locale === "ar" ? item.nameAr : (item.nameEn ?? item.nameAr);
          const inner = (
            <>
              {item.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.logoUrl} alt={name} className="cob-logo" />
              ) : (
                <span className="cob-name">{name}</span>
              )}
            </>
          );
          return item.websiteUrl ? (
            <a key={item.id} href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="cob-item" title={name}>
              {inner}
            </a>
          ) : (
            <div key={item.id} className="cob-item" title={name}>{inner}</div>
          );
        })}
      </div>

      <style>{`
        .cob-section {
          padding-block: 4rem;
          border-top: 1px solid var(--border-subtle);
        }

        .cob-heading {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-subtle);
          margin-bottom: 2rem;
        }

        .cob-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem 2rem;
          align-items: center;
        }

        .cob-item {
          display: flex;
          align-items: center;
          text-decoration: none;
          opacity: 0.65;
          transition: opacity 200ms ease;
        }

        .cob-item:hover { opacity: 1; }

        .cob-logo {
          height: 36px;
          width: auto;
          object-fit: contain;
          filter: grayscale(1);
          transition: filter 200ms ease;
        }

        .cob-item:hover .cob-logo { filter: grayscale(0); }

        .cob-name {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-weight: 500;
        }
      `}</style>
    </section>
  );
}
