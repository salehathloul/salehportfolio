"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// useSearchParams must be inside Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
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

      <button type="submit" disabled={loading} className="login-btn">
        {loading ? "جاري الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
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
      `}</style>
    </div>
  );
}
