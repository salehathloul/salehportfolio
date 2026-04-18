"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// useSearchParams must be inside Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Show error from URL (e.g. AccessDenied from Google login with non-admin account)
  useEffect(() => {
    if (errorParam === "AccessDenied") {
      setError("هذا الحساب ليس لديه صلاحية الوصول للوحة التحكم");
    } else if (errorParam) {
      setError("حدث خطأ أثناء تسجيل الدخول");
    }
  }, [errorParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/admin" });
  }

  return (
    <div className="login-form-wrap">
      {/* Google sign-in */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="google-btn"
      >
        {googleLoading ? (
          <span>جاري التوجيه...</span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>الدخول عبر Google</span>
          </>
        )}
      </button>

      <div className="login-divider">
        <span>أو</span>
      </div>

      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <div className="field">
          <label htmlFor="email" className="field-label">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
            placeholder="admin@example.com"
            dir="ltr"
          />
        </div>

        <div className="field">
          <label htmlFor="password" className="field-label">كلمة المرور</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
            placeholder="••••••••"
            dir="ltr"
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading || googleLoading} className="login-btn">
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">ص</div>
          <h1 className="login-title">لوحة التحكم</h1>
          <p className="login-subtitle">صالح الهذلول — الموقع الشخصي</p>
        </div>

        <Suspense fallback={<div className="login-loading">جاري التحميل...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      <style>{`
        .login-root {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-secondary);
          padding: 1rem;
          direction: rtl;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2.5rem 2rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          width: 56px;
          height: 56px;
          background: var(--text-primary);
          color: var(--bg-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 500;
          margin: 0 auto 1rem;
          font-family: var(--font-heading);
        }

        .login-title {
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .login-loading {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
          padding: 1rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .field-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.9375rem;
          transition: border-color var(--transition-fast);
          outline: none;
        }

        .field-input:focus { border-color: var(--text-primary); }
        .field-input::placeholder { color: var(--text-subtle); }

        .login-error {
          font-size: 0.875rem;
          color: #e53e3e;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          text-align: center;
        }

        .dark .login-error {
          background: #2d1b1b;
          border-color: #742a2a;
          color: #fc8181;
        }

        .login-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity var(--transition-fast);
          margin-top: 0.25rem;
        }

        .login-btn:hover:not(:disabled) { opacity: 0.85; }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-form-wrap {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.6875rem 1rem;
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background var(--transition-fast), border-color var(--transition-fast);
          direction: rtl;
        }
        .google-btn:hover:not(:disabled) {
          background: var(--bg-secondary);
          border-color: var(--text-muted);
        }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.25rem 0;
          color: var(--text-subtle);
          font-size: 0.8125rem;
        }
        .login-divider::before,
        .login-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }
      `}</style>
    </div>
  );
}
