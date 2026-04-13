import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AboutEditor from "@/components/admin/about/AboutEditor";

export const metadata = { title: "عني — لوحة التحكم" };

interface ExperienceItem {
  titleAr: string;
  titleEn: string;
  orgAr: string;
  orgEn: string;
  period: string;
  descAr: string;
  descEn: string;
}

interface AchievementItem {
  titleAr: string;
  titleEn: string;
  year: string;
  descAr: string;
  descEn: string;
}

export default async function AdminAboutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const about = await db.about.findUnique({ where: { id: "main" } });

  return (
    <AboutEditor
      initial={{
        layout: about?.layout ?? "classic",
        imageUrl: about?.imageUrl ?? null,
        nameAr: about?.nameAr ?? null,
        nameEn: about?.nameEn ?? null,
        bioAr: about?.bioAr ?? null,
        bioEn: about?.bioEn ?? null,
        experience: (about?.experience as ExperienceItem[] | null) ?? [],
        achievements: (about?.achievements as AchievementItem[] | null) ?? [],
      }}
    />
  );
}
