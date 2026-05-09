"use client";

interface MaintenancePageProps {
  msgAr?: string | null;
  msgEn?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
}

export default function MaintenancePage({
  msgAr,
  msgEn,
  logoLight,
  logoDark,
  titleAr,
}: MaintenancePageProps) {
  const messageAr = msgAr || "الموقع يخضع لتحديثات، سنعود قريباً";
  const messageEn = msgEn || "Under maintenance, we'll be back soon";
  const siteName = titleAr || "صالح الهذلول";

  return (
    <>
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.04); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .maint-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          color: var(--text-primary);
          padding: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        /* Decorative background blobs */
        .maint-blob {
          position: absolute;
          border-radius: 50%;
          background: var(--text-primary);
          opacity: 0.04;
          pointer-events: none;
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .maint-blob--1 {
          width: 500px; height: 500px;
          top: -120px; left: -120px;
          animation-delay: 0s;
        }
        .maint-blob--2 {
          width: 350px; height: 350px;
          bottom: -80px; right: -80px;
          animation-delay: 3s;
        }

        .maint-inner {
          position: relative;
          z-index: 1;
          animation: fade-up 0.8s ease both;
          max-width: 560px;
          width: 100%;
        }

        /* Logo / Site Name */
        .maint-logo {
          height: 48px;
          width: auto;
          object-fit: contain;
          margin: 0 auto 2rem;
          display: block;
        }
        .maint-site-name {
          font-size: 1.1rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
        }

        /* Icon */
        .maint-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.75rem;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }

        /* Divider */
        .maint-divider {
          width: 40px;
          height: 1px;
          background: var(--border);
          margin: 0 auto 1.75rem;
        }

        /* Message */
        .maint-msg-ar {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 600;
          line-height: 1.5;
          margin-bottom: 0.75rem;
          direction: rtl;
        }
        .maint-msg-en {
          font-size: clamp(0.875rem, 2vw, 1rem);
          color: var(--text-muted);
          direction: ltr;
          margin-bottom: 2.5rem;
        }

        /* Animated dots */
        .maint-dots {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .maint-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: pulse-slow 1.4s ease-in-out infinite;
        }
        .maint-dot:nth-child(2) { animation-delay: 0.2s; }
        .maint-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div className="maint-root">
        <div className="maint-blob maint-blob--1" />
        <div className="maint-blob maint-blob--2" />

        <div className="maint-inner">
          {/* Logo or site name */}
          {logoLight ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoLight} alt={siteName} className="maint-logo" />
          ) : (
            <p className="maint-site-name">{siteName}</p>
          )}

          {/* Wrench icon */}
          <div className="maint-icon">🔧</div>

          <div className="maint-divider" />

          {/* Messages */}
          <h1 className="maint-msg-ar">{messageAr}</h1>
          <p className="maint-msg-en">{messageEn}</p>

          {/* Animated waiting dots */}
          <div className="maint-dots">
            <span className="maint-dot" />
            <span className="maint-dot" />
            <span className="maint-dot" />
          </div>
        </div>
      </div>
    </>
  );
}
