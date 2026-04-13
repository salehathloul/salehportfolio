/**
 * prisma/seed.ts
 *
 * Seeds the database with initial data from the Identity folder.
 * Run with: npx prisma db seed
 *
 * Requires env vars: DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *                    CLOUDINARY_API_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */

import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import bcrypt from "bcryptjs";
import sharp from "sharp";

// ── Load .env if present ──────────────────────────────────────────────────────

const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Validate env ──────────────────────────────────────────────────────────────

const required = [
  "DATABASE_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Missing required env vars:\n   ${missing.join("\n   ")}\n`);
  process.exit(1);
}

// ── Prisma + Cloudinary ───────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadImageFile(
  filePath: string,
  folder: string,
  publicId: string
): Promise<{ url: string; width: number; height: number }> {
  const buffer = fs.readFileSync(filePath);
  const meta = await sharp(buffer).metadata();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          quality: "auto:best",
          fetch_format: "auto",
          overwrite: false,
        },
        (err, res) => {
          if (err || !res) reject(err ?? new Error("Upload failed"));
          else resolve(res);
        }
      )
      .end(buffer);
  });

  return {
    url: result.secure_url,
    width: meta.width ?? result.width,
    height: meta.height ?? result.height,
  };
}

const IDENTITY = path.join(__dirname, "../Identity");
const GALLERY_DIR = path.join(IDENTITY, "photo gallery");
const SALE_DIR = path.join(IDENTITY, "sale photo");
const BLOG_DIR = path.join(IDENTITY, "blog");
const LOGO_LIGHT = path.join(IDENTITY, "Logo/black/Asset 2.png");
const LOGO_DARK = path.join(IDENTITY, "Logo/white/Asset 1.png");

// ── TipTap JSON builders ──────────────────────────────────────────────────────

function tipTapDoc(...nodes: object[]) {
  return { type: "doc", content: nodes };
}
function para(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
function heading(level: number, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}
function blockquote(text: string) {
  return {
    type: "blockquote",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}
function image(src: string, alt = "") {
  return { type: "image", attrs: { src, alt, title: null } };
}
function horizontalRule() {
  return { type: "horizontalRule" };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Starting seed…\n");

  // ── 1. Logos ────────────────────────────────────────────────────────────────
  console.log("📷  Uploading logos…");
  const [logoLight, logoDark] = await Promise.all([
    uploadImageFile(LOGO_LIGHT, "settings", "logo-light"),
    uploadImageFile(LOGO_DARK, "settings", "logo-dark"),
  ]);

  // ── 2. SiteSettings ─────────────────────────────────────────────────────────
  console.log("⚙️   Upserting SiteSettings…");
  await db.siteSettings.upsert({
    where: { id: "main" },
    update: {
      logoLight: logoLight.url,
      logoDark: logoDark.url,
    },
    create: {
      id: "main",
      logoLight: logoLight.url,
      logoDark: logoDark.url,
      titleAr: "صالح الهذلول",
      titleEn: "Saleh Alhuthloul",
      descriptionAr: "مصوّر فوتوغرافي سعودي متخصص في الفوتوغرافيا الفنية",
      descriptionEn: "Saudi fine art photographer",
      heroQuoteAr: "الضوء يكتب، والعدسة تحفظ",
      heroQuoteEn: "Light writes, the lens preserves",
    },
  });

  // ── 3. Admin user ───────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  console.log(`👤  Creating admin user: ${adminEmail}`);
  const hashed = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed },
    create: {
      email: adminEmail,
      password: hashed,
      name: "Saleh Alhuthloul",
      role: "admin",
    },
  });

  // ── 4. Categories ────────────────────────────────────────────────────────────
  console.log("🗂️   Creating categories…");
  const categoryData = [
    { nameAr: "جوي", nameEn: "Aerial", slug: "aerial", order: 1 },
    { nameAr: "برّي", nameEn: "Landscape", slug: "landscape", order: 2 },
    { nameAr: "تجريدي", nameEn: "Abstract", slug: "abstract", order: 3 },
  ];
  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await db.category.upsert({
      where: { slug: cat.slug },
      update: { nameAr: cat.nameAr, nameEn: cat.nameEn, order: cat.order },
      create: cat,
    });
    categories[cat.slug] = c.id;
  }

  // ── 5. Gallery works (FA-001 … FA-016) ───────────────────────────────────────
  console.log("🖼️   Uploading gallery photos…");

  const galleryMeta: Array<{
    file: string;
    code: string;
    titleAr: string;
    titleEn: string;
    locationAr: string;
    locationEn: string;
    categorySlug: string;
    isFeatured: boolean;
  }> = [
    {
      file: "045A0273-Pano-2 copy 2.jpg",
      code: "FA-001",
      titleAr: "أفق بلا نهاية",
      titleEn: "Endless Horizon",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "landscape",
      isFeatured: true,
    },
    {
      file: "045A3078-Edit-Best.jpg",
      code: "FA-002",
      titleAr: "لحظة صامتة",
      titleEn: "Silent Moment",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "landscape",
      isFeatured: true,
    },
    {
      file: "045A5958.jpg",
      code: "FA-003",
      titleAr: "ضوء الفجر",
      titleEn: "Dawn Light",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "landscape",
      isFeatured: false,
    },
    {
      file: "045A8151.jpg",
      code: "FA-004",
      titleAr: "الأرض والسماء",
      titleEn: "Earth and Sky",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "landscape",
      isFeatured: true,
    },
    {
      file: "045A8413.jpg",
      code: "FA-005",
      titleAr: "تناغم الأشكال",
      titleEn: "Shape Harmony",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "abstract",
      isFeatured: false,
    },
    {
      file: "045A9231.jpg",
      code: "FA-006",
      titleAr: "هدوء المساء",
      titleEn: "Evening Stillness",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "landscape",
      isFeatured: true,
    },
    {
      file: "045A9295.jpg",
      code: "FA-007",
      titleAr: "نسيج الضوء",
      titleEn: "Texture of Light",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "abstract",
      isFeatured: false,
    },
    {
      file: "20250618-DJI_20250618065106_0112_D-HDR-Pano.jpg",
      code: "FA-008",
      titleAr: "بانوراما الفجر",
      titleEn: "Dawn Panorama",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: true,
    },
    {
      file: "DJI_20250619172151_0181_D.jpg",
      code: "FA-009",
      titleAr: "من الأعلى",
      titleEn: "From Above",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: false,
    },
    {
      file: "DJI_20250619182951_0250_D.jpg",
      code: "FA-010",
      titleAr: "ظلال وأضواء",
      titleEn: "Shadows and Light",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: false,
    },
    {
      file: "DJI_20250628180731_0423_D.jpg",
      code: "FA-011",
      titleAr: "خطوط الأرض",
      titleEn: "Earth Lines",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: true,
    },
    {
      file: "DJI_20250628180913_0449_D-Pano.jpg",
      code: "FA-012",
      titleAr: "امتداد الأفق الجوي",
      titleEn: "Aerial Horizon Sweep",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: true,
    },
    {
      file: "DJI_20250710171037_0076_D.jpg",
      code: "FA-013",
      titleAr: "غروب من الأعلى",
      titleEn: "Sunset From Above",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: false,
    },
    {
      file: "DJI_20250713071137_0855_D-Pano-4.jpg",
      code: "FA-014",
      titleAr: "بانوراما الصحراء",
      titleEn: "Desert Panorama",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "aerial",
      isFeatured: true,
    },
    {
      file: "_DSF2698.jpg",
      code: "FA-015",
      titleAr: "التفاصيل الصغيرة",
      titleEn: "Small Details",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "abstract",
      isFeatured: false,
    },
    {
      file: "_DSF9780.jpg",
      code: "FA-016",
      titleAr: "جوهر المكان",
      titleEn: "Essence of Place",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
      categorySlug: "abstract",
      isFeatured: true,
    },
  ];

  const galleryUploaded: Record<string, string> = {}; // code → imageUrl

  for (const item of galleryMeta) {
    const filePath = path.join(GALLERY_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  File not found: ${item.file}`);
      continue;
    }

    process.stdout.write(`  ↑ ${item.code}… `);
    const { url, width, height } = await uploadImageFile(
      filePath,
      "portfolio",
      item.code.toLowerCase()
    );
    galleryUploaded[item.code] = url;
    console.log(`✓ (${width}×${height})`);

    await db.work.upsert({
      where: { code: item.code },
      update: { imageUrl: url, width, height },
      create: {
        code: item.code,
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        locationAr: item.locationAr,
        locationEn: item.locationEn,
        imageUrl: url,
        width,
        height,
        isPublished: true,
        isFeatured: item.isFeatured,
        order: galleryMeta.indexOf(item) + 1,
        categoryId: categories[item.categorySlug],
      },
    });
  }

  // ── 6. Sale works (FA-017 … FA-020) + AcquireItem + AcquireSize ─────────────
  console.log("\n🛒  Uploading sale photos + creating acquire items…");

  const saleMeta: Array<{
    file: string;
    code: string;
    titleAr: string;
    titleEn: string;
    locationAr: string;
    locationEn: string;
  }> = [
    {
      file: "4-4.jpg",
      code: "FA-017",
      titleAr: "إضاءة طبيعية",
      titleEn: "Natural Light",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
    },
    {
      file: "4-٨.jpg",
      code: "FA-018",
      titleAr: "عمق المشهد",
      titleEn: "Scene Depth",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
    },
    {
      file: "4-11.jpg",
      code: "FA-019",
      titleAr: "صمت الطبيعة",
      titleEn: "Nature's Silence",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
    },
    {
      file: "4-16.jpg",
      code: "FA-020",
      titleAr: "سكون الفجر",
      titleEn: "Morning Stillness",
      locationAr: "المملكة العربية السعودية",
      locationEn: "Saudi Arabia",
    },
  ];

  const ACQUIRE_SIZES = [
    { label: "50×70 cm", totalEditions: 10 },
    { label: "70×100 cm", totalEditions: 10 },
    { label: "100×140 cm", totalEditions: 10 },
  ];

  for (const item of saleMeta) {
    const filePath = path.join(SALE_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  File not found: ${item.file}`);
      continue;
    }

    process.stdout.write(`  ↑ ${item.code}… `);
    const { url, width, height } = await uploadImageFile(
      filePath,
      "portfolio",
      item.code.toLowerCase()
    );
    console.log(`✓ (${width}×${height})`);

    const work = await db.work.upsert({
      where: { code: item.code },
      update: { imageUrl: url, width, height },
      create: {
        code: item.code,
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        locationAr: item.locationAr,
        locationEn: item.locationEn,
        imageUrl: url,
        width,
        height,
        isPublished: true,
        isFeatured: true,
        order: 16 + saleMeta.indexOf(item) + 1,
        categoryId: categories["landscape"],
      },
    });

    // AcquireItem
    let acquireItem = await db.acquireItem.findUnique({
      where: { workId: work.id },
    });
    if (!acquireItem) {
      acquireItem = await db.acquireItem.create({
        data: { workId: work.id, isActive: true },
      });
    }

    // AcquireSizes — only create if none exist yet
    const existingSizes = await db.acquireSize.count({
      where: { acquireItemId: acquireItem.id },
    });
    if (existingSizes === 0) {
      for (const size of ACQUIRE_SIZES) {
        await db.acquireSize.create({
          data: {
            acquireItemId: acquireItem.id,
            label: size.label,
            totalEditions: size.totalEditions,
            soldEditions: 0,
          },
        });
      }
    }
  }

  // ── 7. Blog posts ─────────────────────────────────────────────────────────────
  console.log("\n📝  Uploading blog covers + creating posts…");

  const blogFiles = [
    "DJI_20250721061104_0221_D.jpg",
    "DJI_20250724123009_0461_D.jpg",
    "DJI_20250802063840_0155_D.jpg",
  ];
  const blogCovers: string[] = [];

  for (let i = 0; i < blogFiles.length; i++) {
    const filePath = path.join(BLOG_DIR, blogFiles[i]);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  Blog cover not found: ${blogFiles[i]}`);
      blogCovers.push("");
      continue;
    }
    process.stdout.write(`  ↑ blog cover ${i + 1}… `);
    const { url } = await uploadImageFile(filePath, "blog", `blog-cover-${i + 1}`);
    blogCovers.push(url);
    console.log("✓");
  }

  // Use gallery images as embedded images in blog content
  const embeds = Object.values(galleryUploaded).slice(0, 6);
  const getEmbed = (i: number) => embeds[i] ?? blogCovers[0] ?? "";

  const now = new Date();
  const blogPosts = [
    {
      slug: "the-language-of-light",
      titleAr: "لغة الضوء",
      titleEn: "The Language of Light",
      coverImage: blogCovers[0] ?? undefined,
      publishedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      contentAr: tipTapDoc(
        para(
          "الضوء ليس مجرد عامل فيزيائي في التصوير — هو اللغة التي تتحدث بها الصورة. منذ بدأت رحلتي مع التصوير الفوتوغرافي، أدركت أن فهم الضوء هو مفتاح كل شيء."
        ),
        heading(2, "الضوء الطبيعي: الكنز الذي لا ينضب"),
        para(
          "في ساعات الفجر الأولى، حين يلامس الضوء الأرض بلطف، تتحول المشاهد العادية إلى لوحات استثنائية. هذه اللحظات القصيرة — التي لا تتجاوز الدقائق — هي ما يجعل الاستيقاظ الباكر يستحق كل عناء."
        ),
        image(getEmbed(0), "ضوء الفجر على المشهد الطبيعي"),
        para(
          "الساعة الذهبية، كما يسميها المصورون، هي الفترة التي يكون فيها الشمس قريباً من الأفق. الضوء في هذه اللحظة دافئ، ناعم، وخالٍ من الظلال القاسية."
        ),
        blockquote(
          "التصوير هو فن التقاط اللحظة العابرة وتحويلها إلى لحظة خالدة."
        ),
        heading(2, "الضوء الصناعي وإمكانياته"),
        para(
          "لا يعني التقيد بالضوء الطبيعي تجاهل الفرص التي يتيحها الضوء الاصطناعي. في الليل، تتحول المدن والمناطق الصحراوية إلى مسارح من الضوء والظل."
        ),
        image(getEmbed(1), "تأثيرات الضوء الاصطناعي"),
        para(
          "الفيزياء واحدة، لكن الفن هو ما يميز مصوراً عن آخر. تعلّم كيف تقرأ الضوء، وستجد أن كل مكان يخبئ صورة تنتظر من يكتشفها."
        ),
        horizontalRule(),
        para(
          "في المقالات القادمة، سأتحدث عن تقنيات محددة للتعامل مع الضوء في التصوير الجوي والتصوير البري."
        )
      ),
      contentEn: tipTapDoc(
        para(
          "Light is not merely a physical factor in photography — it is the language through which images speak. Since the beginning of my photographic journey, I realized that understanding light is the key to everything."
        ),
        heading(2, "Natural Light: The Inexhaustible Treasure"),
        para(
          "In the early hours of dawn, when light gently touches the earth, ordinary scenes transform into extraordinary compositions. These brief moments — lasting mere minutes — make every early wake worth the effort."
        ),
        image(getEmbed(0), "Dawn light over a natural scene"),
        para(
          "The golden hour, as photographers call it, is the period when the sun sits near the horizon. The light at this moment is warm, soft, and free of harsh shadows."
        ),
        blockquote(
          "Photography is the art of capturing the fleeting moment and transforming it into a timeless one."
        ),
        heading(2, "Artificial Light and Its Possibilities"),
        para(
          "Relying on natural light doesn't mean ignoring the opportunities offered by artificial light. At night, cities and desert landscapes become theaters of light and shadow."
        ),
        image(getEmbed(1), "Artificial light effects"),
        para(
          "Physics is universal, but art is what distinguishes one photographer from another. Learn to read light, and you'll find that every place hides an image waiting to be discovered."
        )
      ),
    },
    {
      slug: "aerial-photography-perspective",
      titleAr: "التصوير الجوي: منظور مختلف للعالم",
      titleEn: "Aerial Photography: A Different Perspective",
      coverImage: blogCovers[1] ?? undefined,
      publishedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      contentAr: tipTapDoc(
        para(
          "حين ترتفع الكاميرا فوق مستوى العيون، يتغير كل شيء. الأرض تكشف عن تفاصيل لا ترى من الأسفل، والمشاهد المألوفة تتحول إلى لوحات تجريدية مبهرة."
        ),
        heading(2, "لماذا التصوير الجوي؟"),
        para(
          "بدأت تجربتي مع الطائرات المسيّرة قبل سنوات، وكان أول ما شدني هو كيف يبدو كل شيء مختلفاً من الأعلى. الطرق تصبح خطوطاً، الحقول تصبح أشكالاً هندسية، والجبال تأخذ بُعداً جديداً."
        ),
        image(getEmbed(2), "منظر جوي يكشف الأنماط الأرضية"),
        heading(2, "التحديات والحلول"),
        para(
          "التصوير الجوي يأتي مع تحدياته الخاصة: الرياح، الإضاءة المتغيرة، والحاجة إلى التخطيط المسبق. لكن هذه التحديات هي في الوقت ذاته ما يجعل الصور الجيدة نادرة وقيّمة."
        ),
        para(
          "التخطيط هو أهم خطوة في التصوير الجوي. أستخدم تطبيقات الطقس، وأدرس الموقع مسبقاً، وأختار أوقات الذهبية بدقة."
        ),
        image(getEmbed(3), "تفاصيل المشهد من الأعلى"),
        blockquote("الطائرة المسيّرة ليست مجرد أداة — إنها عيون ترى ما لم نره من قبل."),
        para(
          "الجمال في التصوير الجوي يكمن في القدرة على كشف الأنماط الخفية. ما يبدو عشوائياً من الأسفل، قد يكشف عن نظام مذهل حين ترى من الأعلى."
        )
      ),
      contentEn: tipTapDoc(
        para(
          "When the camera rises above eye level, everything changes. The earth reveals details invisible from below, and familiar scenes transform into breathtaking abstract compositions."
        ),
        heading(2, "Why Aerial Photography?"),
        para(
          "My experience with drones began years ago, and the first thing that drew me in was how everything looks different from above. Roads become lines, fields become geometric shapes, and mountains take on new dimensions."
        ),
        image(getEmbed(2), "Aerial view revealing ground patterns"),
        heading(2, "Challenges and Solutions"),
        para(
          "Aerial photography comes with its own challenges: wind, changing light, and the need for careful planning. But these challenges are also what makes good aerial images rare and valuable."
        ),
        image(getEmbed(3), "Scene details from above"),
        blockquote("A drone is not just a tool — it's eyes that see what we've never seen before."),
        para(
          "The beauty of aerial photography lies in its ability to reveal hidden patterns. What appears random from below may reveal a stunning order when viewed from above."
        )
      ),
    },
    {
      slug: "patience-in-photography",
      titleAr: "الصبر في التصوير: الانتظار حتى اللحظة المثالية",
      titleEn: "Patience in Photography: Waiting for the Perfect Moment",
      coverImage: blogCovers[2] ?? undefined,
      publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      contentAr: tipTapDoc(
        para(
          "كثيراً ما يسألني الناس عن أصعب ما في التصوير الفوتوغرافي. جوابي دائماً واحد: الصبر. التصوير الفني ليس مجرد ضغط زر — هو قدرة على الانتظار حتى تتكامل العناصر."
        ),
        heading(2, "فن الانتظار"),
        para(
          "هناك فرق بين التقاط صورة وبين صنع صورة. الأول يحدث في لحظة عابرة، والثاني يتطلب رؤية مسبقة وصبراً على انتظار تحقق تلك الرؤية."
        ),
        image(getEmbed(4), "لحظة الانتظار قبل التقاط الصورة"),
        para(
          "أتذكر حين انتظرت ثلاث ساعات كاملة في البرد لالتقاط صورة معينة. حين جاءت اللحظة أخيراً، كانت الصورة تستحق كل لحظة انتظار."
        ),
        blockquote("الصبر ليس مجرد فضيلة في التصوير — هو تقنية أساسية."),
        heading(2, "التخطيط يقلل الانتظار"),
        para(
          "لكن الصبر لا يعني الجلوس والانتظار دون تخطيط. التخطيط الجيد يعني أنك تعرف بالضبط ما تنتظره وكيف ستلتقطه حين يأتي."
        ),
        image(getEmbed(5), "المشهد الطبيعي في حالته المثالية"),
        para(
          "التصوير الفني يعلمك أن بعض اللحظات تستحق الانتظار، وأن الجمال الحقيقي لا يأتي مجاناً — يأتي مقابل الصبر والمثابرة والعمل."
        )
      ),
      contentEn: tipTapDoc(
        para(
          "People often ask me what the hardest part of photography is. My answer is always the same: patience. Fine art photography isn't just pressing a button — it's the ability to wait until all elements align."
        ),
        heading(2, "The Art of Waiting"),
        para(
          "There's a difference between taking a picture and making an image. The former happens in a fleeting moment; the latter requires a vision and the patience to wait for it to materialize."
        ),
        image(getEmbed(4), "The moment of waiting before capturing the shot"),
        para(
          "I remember waiting three full hours in the cold for a particular shot. When the moment finally came, the image was worth every minute of waiting."
        ),
        blockquote("Patience isn't just a virtue in photography — it's an essential technique."),
        heading(2, "Planning Reduces Waiting"),
        para(
          "But patience doesn't mean sitting and waiting without a plan. Good planning means you know exactly what you're waiting for and how you'll capture it when it arrives."
        ),
        image(getEmbed(5), "The natural scene in its perfect state"),
        para(
          "Fine art photography teaches you that some moments are worth waiting for, and that true beauty doesn't come for free — it comes at the cost of patience, perseverance, and work."
        )
      ),
    },
    {
      slug: "composition-rules",
      titleAr: "قواعد التأليف البصري: حين تكون القواعد لتُكسر",
      titleEn: "Composition Rules: When Rules Are Meant to Be Broken",
      coverImage: blogCovers[0] ?? undefined,
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      contentAr: tipTapDoc(
        para(
          "تعلّمنا قاعدة الأثلاث منذ الخطوات الأولى في التصوير. لكن كل مصوّر يكتشف في مرحلة ما أن القواعد موجودة لتُفهم أولاً — ثم لتُكسر بوعي."
        ),
        heading(2, "القواعد الأساسية وسبب وجودها"),
        para(
          "قاعدة الأثلاث، الخطوط الموجهة، التناظر، والتباين — هذه القواعد ليست تعسفية. إنها مبنية على كيفية عمل الدماغ البشري وكيف يدرك الجمال والنظام."
        ),
        image(getEmbed(0), "مثال على قاعدة الأثلاث في التصوير"),
        heading(2, "متى تكسر القواعد؟"),
        para(
          "الكسر الواعي للقواعد يخلق توتراً بصرياً يجذب العين ويحفز التساؤل. حين تضع الأفق في المنتصف تماماً، أو تملأ الإطار بشكل لا يترك نفساً — أنت تخلق إيقاعاً مختلفاً."
        ),
        image(getEmbed(1), "تكوين يخرج عن القواعد التقليدية"),
        blockquote(
          "القاعدة الحقيقية الوحيدة في الفن: هل تعمل الصورة؟ هل تشعر أنها صحيحة؟"
        ),
        para(
          "المصوّر الناضج هو من يعرف القواعد جيداً، فيختار متى يطبقها ومتى يتجاوزها. هذه الحرية هي ما يميز الصورة الفنية عن الصورة التقنية."
        )
      ),
      contentEn: tipTapDoc(
        para(
          "We learned the rule of thirds in our very first steps in photography. But every photographer discovers at some point that rules exist to be understood first — then broken consciously."
        ),
        heading(2, "The Basic Rules and Why They Exist"),
        para(
          "The rule of thirds, leading lines, symmetry, and contrast — these rules aren't arbitrary. They're built on how the human brain works and how it perceives beauty and order."
        ),
        image(getEmbed(0), "Example of the rule of thirds in photography"),
        heading(2, "When to Break the Rules"),
        para(
          "Consciously breaking rules creates visual tension that draws the eye and provokes questions. When you place the horizon exactly in the center, or fill the frame with a shape that leaves no breathing room — you're creating a different rhythm."
        ),
        image(getEmbed(1), "A composition that departs from traditional rules"),
        blockquote(
          "The only true rule in art: does the image work? Does it feel right?"
        ),
        para(
          "A mature photographer is one who knows the rules well enough to choose when to apply them and when to transcend them. This freedom is what distinguishes the artistic image from the technical one."
        )
      ),
    },
    {
      slug: "post-processing-philosophy",
      titleAr: "فلسفة المعالجة: الحقيقة والتحسين",
      titleEn: "Post-Processing Philosophy: Truth and Enhancement",
      coverImage: blogCovers[1] ?? undefined,
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      contentAr: tipTapDoc(
        para(
          "النقاش حول المعالجة الرقمية في التصوير لا ينتهي: هل تعديل الصورة يمثل غشاً؟ هل هو مقبول؟ وأين تقع الحدود؟ موقفي واضح وقد تطور عبر السنين."
        ),
        heading(2, "الكاميرا لا ترى كما يرى العين"),
        para(
          "أول ما يجب أن نفهمه هو أن الكاميرا لا تلتقط الواقع كما نراه. المستشعر الرقمي لديه حدود في التعامل مع التباين الديناميكي — وهو ما يفوق قدرات العين البشرية."
        ),
        image(getEmbed(2), "مقارنة بين الصورة الخام والصورة بعد المعالجة"),
        heading(2, "المعالجة كامتداد للرؤية"),
        para(
          "أنا أرى المعالجة الرقمية كامتداد لما كان يفعله المصورون في غرفة التحميض تاريخياً. التحميض الزائد، حجب الضوء، تعزيز بعض المناطق — كل هذا كان جزءاً من العمل الفوتوغرافي."
        ),
        image(getEmbed(3), "تفاصيل المشهد بعد المعالجة الدقيقة"),
        blockquote(
          "المعالجة الجيدة هي التي لا تُرى — تشعر بأن الصورة صحيحة دون أن تعرف لماذا."
        ),
        heading(2, "حدودي الشخصية"),
        para(
          "لكل مصوّر فلسفته الخاصة. أنا شخصياً لا أضيف عناصر لم تكن في المشهد، ولا أحذف ما كان موجوداً. المعالجة عندي هي تعزيز ما التقطته — لا خلق ما لم يكن."
        ),
        para(
          "في النهاية، الصورة هي تعبير عن رؤيتك للعالم. والمعالجة هي الخطوة الأخيرة في إيصال تلك الرؤية للمشاهد بأكبر قدر من الوضوح والصدق."
        )
      ),
      contentEn: tipTapDoc(
        para(
          "The debate about digital processing in photography never ends: does editing a photo constitute deception? Is it acceptable? And where are the boundaries? My position is clear and has evolved over the years."
        ),
        heading(2, "The Camera Doesn't See Like the Eye"),
        para(
          "The first thing to understand is that the camera doesn't capture reality as we see it. The digital sensor has limitations in handling dynamic range — something that surpasses the capabilities of the human eye."
        ),
        image(getEmbed(2), "Comparison between raw and processed image"),
        heading(2, "Processing as an Extension of Vision"),
        para(
          "I see digital processing as an extension of what photographers historically did in the darkroom. Over-exposure, dodging, burning, enhancing certain areas — all of this was always part of photographic work."
        ),
        image(getEmbed(3), "Scene details after careful processing"),
        blockquote(
          "Good processing is invisible — you feel the image is right without knowing why."
        ),
        heading(2, "My Personal Boundaries"),
        para(
          "Every photographer has their own philosophy. Personally, I don't add elements that weren't in the scene, nor do I remove what was there. Processing for me is enhancing what I captured — not creating what wasn't."
        ),
        para(
          "Ultimately, a photograph is an expression of your vision of the world. And processing is the final step in conveying that vision to the viewer with the greatest clarity and honesty."
        )
      ),
    },
  ];

  for (const post of blogPosts) {
    const existing = await db.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`  ↳ skipping existing post: ${post.slug}`);
      continue;
    }
    await db.blogPost.create({
      data: {
        slug: post.slug,
        titleAr: post.titleAr,
        titleEn: post.titleEn,
        coverImage: post.coverImage ?? null,
        contentAr: post.contentAr,
        contentEn: post.contentEn,
        status: "published",
        publishedAt: post.publishedAt,
      },
    });
    console.log(`  ✓ created: ${post.slug}`);
  }

  // ── 8. Update SiteSettings with hero image ────────────────────────────────────
  if (Object.keys(galleryUploaded).length > 0) {
    const heroUrl = galleryUploaded["FA-008"] ?? galleryUploaded["FA-001"] ?? "";
    if (heroUrl) {
      await db.siteSettings.update({
        where: { id: "main" },
        data: { heroImageUrl: heroUrl },
      });
      console.log("\n🏠  Hero image set to:", heroUrl);
    }
  }

  console.log("\n✅  Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("\n❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
