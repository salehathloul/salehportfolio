export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const MAX_SIZE_MB = 50;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/svg+xml"];
const SVG_TYPE = "image/svg+xml";

// Local fallback: saves to public/uploads/<folder>/ when Cloudinary isn't configured
function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const key  = process.env.CLOUDINARY_API_KEY ?? "";
  return name && key && name !== "your-cloud-name" && key !== "your-api-key";
}

async function saveLocally(
  buffer: Buffer,
  folder: string,
  ext: string
): Promise<{ url: string; bytes: number }> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buffer);
  return { url: `/uploads/${folder}/${filename}`, bytes: buffer.length };
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
  const preserveFormat = formData.get("preserveFormat") === "true";

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

  // ── SVG: save as-is (no sharp processing) ────────────
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  if (file.type === SVG_TYPE) {
    try {
      const local = await saveLocally(inputBuffer, folder, "svg");
      return NextResponse.json({
        success: true,
        url: local.url,
        width: 0,
        height: 0,
        publicId: null,
        bytes: local.bytes,
        sizes: { thumbnail: local.url, medium: local.url, large: local.url, original: local.url },
      });
    } catch (err) {
      console.error("[upload] SVG save error:", err);
      return NextResponse.json({ error: "فشل حفظ الملف" }, { status: 500 });
    }
  }

  // ── Process with Sharp ────────────────────────────────
  let processedBuffer: Buffer;
  let width: number | undefined;
  let height: number | undefined;

  try {
    const sharpInstance = sharp(inputBuffer);
    const meta = await sharpInstance.metadata();
    width = meta.width;
    height = meta.height;

    if (preserveFormat && meta.format === "png") {
      processedBuffer = await sharpInstance.rotate().png({ quality: 95 }).toBuffer();
    } else {
      processedBuffer = await sharpInstance.rotate().jpeg({ quality: 95, progressive: true }).toBuffer();
    }
  } catch {
    return NextResponse.json({ error: "فشل معالجة الصورة — تأكد أن الملف صورة صحيحة" }, { status: 422 });
  }

  const ext = preserveFormat ? "png" : "jpg";

  // ── Upload ─────────────────────────────────────────────
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadImage(processedBuffer, { folder });
      return NextResponse.json({
        success: true,
        url: result.url,
        width: width ?? result.width,
        height: height ?? result.height,
        publicId: result.publicId,
        bytes: result.bytes,
        sizes: result.sizes,
      });
    } catch (err) {
      console.error("[upload] Cloudinary error:", err);
      // Fall through to local save
    }
  }

  // ── Local fallback ─────────────────────────────────────
  try {
    const local = await saveLocally(processedBuffer, folder, ext);
    return NextResponse.json({
      success: true,
      url: local.url,
      width: width ?? 0,
      height: height ?? 0,
      publicId: null,
      bytes: local.bytes,
      sizes: { thumbnail: local.url, medium: local.url, large: local.url, original: local.url },
    });
  } catch (err) {
    console.error("[upload] Local save error:", err);
    return NextResponse.json({ error: "فشل حفظ الملف" }, { status: 500 });
  }
}
