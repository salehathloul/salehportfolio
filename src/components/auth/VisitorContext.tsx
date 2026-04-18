"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface VisitorSession {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface VisitorCtx {
  visitor: VisitorSession | null;
  loading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<VisitorCtx>({ visitor: null, loading: true, refresh: () => {}, logout: async () => {} });

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const [cookieVisitor, setCookieVisitor] = useState<VisitorSession | null>(null);
  const [cookieLoading, setCookieLoading] = useState(true);

  // Also track NextAuth session for Google-signed-in users
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  const refresh = useCallback(() => {
    fetch("/api/auth/visitor")
      .then((r) => r.json())
      .then((data) => { setCookieVisitor(data); setCookieLoading(false); })
      .catch(() => setCookieLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await fetch("/api/auth/visitor", { method: "DELETE" });
    setCookieVisitor(null);
  }

  // Derive composite visitor:
  // 1. Magic-token cookie visitor takes priority
  // 2. Fall back to NextAuth session (Google sign-in with role="user")
  const loading = cookieLoading || nextAuthStatus === "loading";

  let visitor: VisitorSession | null = cookieVisitor;

  if (!visitor && nextAuthStatus === "authenticated" && nextAuthSession?.user) {
    const u = nextAuthSession.user;
    // Only expose as "visitor" if they are NOT an admin
    if (nextAuthSession.user.role !== "admin" && u.email) {
      visitor = {
        id: nextAuthSession.user.id ?? u.email,
        name: u.name ?? u.email,
        email: u.email,
        phone: null,
      };
    }
  }

  return (
    <Ctx.Provider value={{ visitor, loading, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useVisitor() {
  return useContext(Ctx);
}
