import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// ─── Types ────────────────────────────────────────────────

export interface UploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  sizes: ImageSizes;
}

export interface ImageSizes {
  thumbnail: string; // 300px wide
  medium: string;    // 800px wide
  large: string;     // 1600px wide
  original: string;  // full quality, auto format
}

export interface FontUploadResult {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
}

// ─── Upload image from Buffer ──────────────────────────────

export async function uploadImage(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    isSvg?: boolean;
    resource_type?: "image" | "raw" | "auto";
    quality?: string;
    fetch_format?: string;
  } = {}
): Promise<UploadResult> {
  const { folder = "portfolio", publicId, tags = [], isSvg = false, resource_type = "image" } = options;

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        tags,
        resource_type,
        ...(resource_type === "image" && !isSvg
          ? { quality: options.quality ?? "auto:best", fetch_format: options.fetch_format ?? "auto" }
          : {}),
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    sizes: buildImageSizes(result.public_id),
  };
}

// ─── Upload font from Buffer ──────────────────────────────

export async function uploadFont(
  buffer: Buffer,
  originalName: string
): Promise<FontUploadResult> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "woff2";
  const baseName = originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]/gi, "_");

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "fonts",
        public_id: baseName,
        resource_type: "raw",
        format: ext,
        tags: ["font"],
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Font upload failed"));
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format,
    bytes: result.bytes,
  };
}

// ─── Delete asset ─────────────────────────────────────────

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "raw" = "image"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

// ─── URL helpers ──────────────────────────────────────────

function buildImageSizes(publicId: string): ImageSizes {
  return {
    thumbnail: buildUrl(publicId, { width: 300, crop: "limit" }),
    medium: buildUrl(publicId, { width: 800, crop: "limit" }),
    large: buildUrl(publicId, { width: 1600, crop: "limit" }),
    original: buildUrl(publicId, {}),
  };
}

function buildUrl(
  publicId: string,
  opts: { width?: number; height?: number; crop?: string }
): string {
  const parts: string[] = ["f_auto", "q_auto"];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.crop) parts.push(`c_${opts.crop}`);

  const transformation = parts.join(",");
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
}

// Named export for backward compat
export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number | "auto"; format?: string } = {}
): string {
  const { width, height, quality = "auto", format = "auto" } = options;
  return buildUrl(publicId, { width, height, crop: "limit" })
    .replace("q_auto", `q_${quality}`)
    .replace("f_auto", `f_${format}`);
}
