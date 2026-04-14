"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function MagicLoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (!verified) { setStatus("error"); return; }

    signIn("credentials", {
      magicToken: verified,
      redirect: false,
    }).then((result) => {
      if (result?.ok) {
        router.replace("/admin");
      } else {
        setStatus("error");
      }
    });
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "sans-serif",
    }}>
      {status === "loading" ? (
        <p style={{ color: "var(--text-muted)" }}>جاري تسجيل الدخول...</p>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#e53e3e", marginBottom: "1rem" }}>رابط الدخول غير صالح أو منتهي.</p>
          <a href="/admin/login" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>
            العودة لتسجيل الدخول
          </a>
        </div>
      )}
    </div>
  );
}

export default function AdminMagicLoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p>جاري التحميل...</p>
      </div>
    }>
      <MagicLoginInner />
    </Suspense>
  );
}
