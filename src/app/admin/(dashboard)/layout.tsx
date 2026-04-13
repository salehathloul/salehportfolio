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
          .admin-main {
            padding: 1rem;
          }
        }
      `}</style>
    </AdminSessionProvider>
  );
}
