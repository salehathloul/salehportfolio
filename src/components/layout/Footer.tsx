import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

interface SiteSettings {
  socialInstagram?: string | null;
  socialX?: string | null;
  socialBehance?: string | null;
  socialLinkedin?: string | null;
  socialEmail?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
}

interface FooterProps {
  settings: SiteSettings | null;
}

// Social icons
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BehanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.72zm-7.726-3h3.578c-.114-1.826-1.062-2.226-1.756-2.226-.784 0-1.69.443-1.822 2.226zM7.25 12.5c.847 0 1.571-.326 2.033-.869.462-.543.717-1.358.717-2.381 0-1-.266-1.858-.73-2.425-.467-.567-1.154-.825-2.02-.825H3.04v6.5h4.21zm-.62-5c.437 0 .773.087 1.012.266.239.179.358.476.358.891 0 .413-.107.71-.32.891-.213.18-.554.269-1.025.269H5.04v-2.317h1.59zm.688 3.029c.521 0 .907.1 1.159.3.252.2.378.548.378 1.046 0 .407-.131.7-.394.88-.263.179-.672.27-1.227.27H5.04v-2.496h2.278z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,14 22,4" />
    </svg>
  );
}

// Server component — uses next-intl server functions
export default async function Footer({ settings }: FooterProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("nav")]);
  const year = new Date().getFullYear();

  const siteName =
    locale === "ar"
      ? (settings?.titleAr ?? "صالح الهذلول")
      : (settings?.titleEn ?? "Saleh Alhuthloul");

  const socialLinks = [
    settings?.socialInstagram && {
      href: settings.socialInstagram,
      label: "Instagram",
      icon: <InstagramIcon />,
    },
    settings?.socialX && {
      href: settings.socialX,
      label: "X",
      icon: <XIcon />,
    },
    settings?.socialBehance && {
      href: settings.socialBehance,
      label: "Behance",
      icon: <BehanceIcon />,
    },
    settings?.socialLinkedin && {
      href: settings.socialLinkedin,
      label: "LinkedIn",
      icon: <LinkedinIcon />,
    },
    settings?.socialEmail && {
      href: `mailto:${settings.socialEmail}`,
      label: "Email",
      icon: <EmailIcon />,
    },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-left">
          <span className="footer-name">{siteName}</span>
          <span className="footer-copy">
            © {year}
          </span>
        </div>

        {socialLinks.length > 0 && (
          <div className="footer-social">
            {socialLinks.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                className="footer-social-link"
              >
                {icon}
              </a>
            ))}
          </div>
        )}

        <div className="footer-right">
          <Link href={`/${locale}/contact`} className="footer-contact-link">
            {t("contact")}
          </Link>
        </div>
      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--border-subtle);
          padding: 2rem 0;
          margin-top: auto;
        }

        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .footer-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          font-family: var(--font-heading);
        }

        .footer-copy {
          font-size: 0.8rem;
          color: var(--text-subtle);
        }

        .footer-social {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .footer-social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          transition: color var(--transition-fast), background var(--transition-fast);
          text-decoration: none;
        }

        .footer-social-link:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .footer-right {
          font-size: 0.875rem;
        }

        .footer-contact-link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .footer-contact-link:hover {
          color: var(--text-primary);
        }

        @media (max-width: 640px) {
          .footer-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .footer-right {
            display: none;
          }
        }
      `}</style>
    </footer>
  );
}
