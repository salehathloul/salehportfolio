export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

const MAX_SIZE_MB = 50;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/svg+xml"];

function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const key  = process.env.CLOUDINARY_API_KEY ?? "";
  return name && key && name !== "your-cloud-name" && key !== "your-api-key";
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Parse form ────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = (formData.get("folder") as string) ?? "portfolio";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── Validate ──────────────────────────────────────────
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `نوع الملف غير مدعوم. المقبول: ${ALLOWED_TYPES.join(", ")}` },
      { status: 422 }
    );
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `حجم الملف يتجاوز ${MAX_SIZE_MB}MB` },
      { status: 422 }
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary غير مفعّل — أضف متغيرات البيئة في Vercel" },
      { status: 500 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  try {
    const result = await uploadImage(inputBuffer, { folder });
    return NextResponse.json({
      success: true,
      url: result.url,
      width: result.width,
      height: result.height,
      publicId: result.publicId,
      bytes: result.bytes,
      sizes: result.sizes,
    });
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json({ error: "فشل رفع الصورة" }, { status: 500 });
  }
}
