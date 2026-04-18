import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminSessionProvider from "@/components/admin/SessionProvider";

export const metadata = {
  title: "لوحة التحكم — صالح الهذلول",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  // Only admins may access the dashboard
  if (session.user.role !== "admin") {
    redirect("/admin/login?error=AccessDenied");
  }

  return (
    <AdminSessionProvider session={session}>
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100dvh;
          background: var(--bg-secondary);
        }

        .admin-main {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .admin-shell {
            /* mobile: no flex row — main fills full width */
            display: block;
          }
          .admin-main {
            padding: 1rem;
            /* clear the fixed 54px top bar */
            padding-top: calc(54px + 1.25rem);
            min-height: 100dvh;
          }
        }
      `}</style>
    </AdminSessionProvider>
  );
}
