"use client";

import { SessionProvider } from "next-auth/react";

/** Wraps the public site with NextAuth SessionProvider so
 *  client components (VisitorContext) can call useSession(). */
export default function PublicSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
