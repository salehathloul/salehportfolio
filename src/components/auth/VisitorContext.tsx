"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

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
  const [visitor, setVisitor] = useState<VisitorSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch("/api/auth/visitor")
      .then((r) => r.json())
      .then((data) => { setVisitor(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await fetch("/api/auth/visitor", { method: "DELETE" });
    setVisitor(null);
  }

  return <Ctx.Provider value={{ visitor, loading, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useVisitor() {
  return useContext(Ctx);
}
