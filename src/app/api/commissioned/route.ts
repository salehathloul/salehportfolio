export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCommissionNotification } from "@/lib/email";

// ── POST /api/commissioned — submit commission request (public) ───────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    email,
    phone,
    projectTypeAr,
    projectTypeEn,
    descriptionAr,
    budgetRange,
    timelineWeeks,
    referenceUrls,
  } = body;

  if (!name || !email || !projectTypeAr || !descriptionAr) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, projectType, description" },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    const record = await db.commissionRequest.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        projectTypeAr,
        projectTypeEn: projectTypeEn ?? null,
        descriptionAr,
        budgetRange: budgetRange ?? null,
        timelineWeeks: typeof timelineWeeks === "number" ? timelineWeeks : null,
        referenceUrls: referenceUrls ?? null,
        status: "new",
      },
    });

    sendCommissionNotification({
      name,
      email,
      phone,
      projectTypeAr,
      projectTypeEn,
      descriptionAr,
      budgetRange,
      timelineWeeks,
      referenceUrls,
    }).catch(console.error);

    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (err) {
    console.error("Commission create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
