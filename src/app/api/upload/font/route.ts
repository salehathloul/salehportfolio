export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFont } from "@/lib/cloudinary";

const MAX_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ["woff2", "otf", "ttf", "woff"];
const ALLOWED_MIME = [
  "font/woff2",
  "font/woff",
  "font/otf",
  "font/ttf",
  "application/font-woff",
  "application/font-woff2",
  "application/vnd.ms-fontobject",
  "application/octet-stream", // some browsers send this for fonts
];

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse form ────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── Validate extension ────────────────────────────────
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `امتداد الملف غير مدعوم. المقبول: ${ALLOWED_EXTENSIONS.join(", ")}` },
      { status: 422 }
    );
  }

  // ── Validate MIME (permissive — browsers vary) ────────
  if (file.type && !ALLOWED_MIME.includes(file.type) && file.type !== "") {
    return NextResponse.json(
      { error: "نوع الملف غير مدعوم" },
      { status: 422 }
    );
  }

  // ── Validate size ─────────────────────────────────────
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `حجم الملف يتجاوز ${MAX_SIZE_MB}MB` },
      { status: 422 }
    );
  }

  // ── Upload to Cloudinary ──────────────────────────────
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFont(buffer, file.name);

    return NextResponse.json({
      success: true,
      publicId: result.publicId,
      url: result.url,
      format: result.format,
      bytes: result.bytes,
      name: file.name.replace(/\.[^.]+$/, ""), // base name without ext
    });
  } catch (err) {
    console.error("[upload/font] Cloudinary error:", err);
    return NextResponse.json(
      { error: "فشل رفع الخط" },
      { status: 500 }
    );
  }
}
