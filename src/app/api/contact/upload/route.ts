export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

// Allowed MIME types for contact attachments
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// POST /api/contact/upload — public endpoint (no auth) for contact form attachments
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "نوع الملف غير مسموح — يُقبل فقط: صور (JPG, PNG, WebP, GIF) و PDF" },
      { status: 415 }
    );
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: `حجم الملف يتجاوز ${MAX_MB}MB` },
      { status: 413 }
    );
  }

  const isPdf = file.type === "application/pdf";
  const buffer = Buffer.from(bytes);

  try {
    const result = await uploadImage(buffer, {
      folder: "contact-attachments",
      resource_type: isPdf ? "raw" : "image",
      quality: "auto:good",
    });
    return NextResponse.json({ url: result.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
