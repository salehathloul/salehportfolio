/**
 * seed-content.mjs — uploads photos directly via Cloudinary + Prisma
 * Run: node scripts/seed-content.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// Load env vars from .env.local
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const require = createRequire(import.meta.url);
const { v2: cloudinary } = require("cloudinary");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const sharp = require("sharp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GALLERY = path.join(__dirname, "../Identity/photo gallery");
const SALE    = path.join(__dirname, "../Identity/sale photo");

// ─── Init Cloudinary ──────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Init Prisma ──────────────────────────────────────────────────────────────
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ─── Compress image to under 9MB ─────────────────────────────────────────────
async function compressImage(filePath) {
  const raw = fs.readFileSync(filePath);
  if (raw.length <= 9 * 1024 * 1024) return raw; // already small enough

  // Resize to max 4000px wide and compress
  const compressed = await sharp(raw)
    .rotate() // auto-orient
    .resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toBuffer();

  return compressed;
}

// ─── Upload to Cloudinary ─────────────────────────────────────────────────────
async function uploadToCloudinary(filePath, folder) {
  const buffer = await compressImage(filePath);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", quality: "auto:best", fetch_format: "auto" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

function buildSizes(publicId) {
  const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  return {
    thumbnail: `${base}/f_auto,q_auto,w_300,c_limit/${publicId}`,
    medium:    `${base}/f_auto,q_auto,w_800,c_limit/${publicId}`,
    large:     `${base}/f_auto,q_auto,w_1600,c_limit/${publicId}`,
    original:  `${base}/f_auto,q_auto/${publicId}`,
  };
}

// ─── Content ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { nameAr: "طبيعة وصحراء",   nameEn: "Nature & Desert",              slug: "nature",       order: 1 },
  { nameAr: "عمارة وحضارة",   nameEn: "Architecture & Civilization",  slug: "architecture", order: 2 },
  { nameAr: "تصوير جوي",       nameEn: "Aerial Photography",           slug: "aerial",       order: 3 },
  { nameAr: "بورتريه",          nameEn: "Portrait",                     slug: "portrait",     order: 4 },
  { nameAr: "توثيقية",          nameEn: "Documentary",                  slug: "documentary",  order: 5 },
];

const PORTFOLIO_PHOTOS = [
  // طبيعة
  { file: "045A0116.jpg",     cat: "nature",   titleAr: "نسيج الرمل",         titleEn: "Texture of Sand",           locationAr: "الرياض",         locationEn: "Riyadh",    descAr: "تفاصيل تكسّرات الرمل في الصحراء — خطوط ترسمها الريح بصبر لا نهاية له.",               descEn: "The delicate ridges of desert sand shaped patiently by wind over countless hours.", featured: true },
  { file: "045A9295.jpg",     cat: "nature",   titleAr: "برد في الصحراء",     titleEn: "Cold in the Desert",        locationAr: "القصيم",         locationEn: "Al-Qassim", descAr: "تناقض صارخ — قطعة ثلج تستريح في قلب الصحراء الحمراء.",                               descEn: "A stark contrast — a piece of ice resting quietly in the heart of the red desert.", featured: false },
  { file: "DJI_20251213071002_0205_D.jpg", cat: "nature", titleAr: "النخيل والضباب", titleEn: "Palms and Fog", locationAr: "الرياض", locationEn: "Riyadh", descAr: "فجر ضبابي يلف بساتين النخيل — أشعة الشمس الأولى تشق الضباب كالسيوف.", descEn: "A misty dawn enveloping date palms — the first rays of sun piercing through like blades.", featured: true },
  { file: "045A0273-Pano-2 copy 2.jpg", cat: "nature", titleAr: "أفق بلا حدود", titleEn: "Boundless Horizon", locationAr: "الرياض", locationEn: "Riyadh", descAr: "حين يمتد البصر دون عائق — الأفق يعد بما لا تستطيع العيون الوصول إليه.", descEn: "When the eye extends without barrier — the horizon promises what eyes cannot reach.", featured: false },
  { file: "045A1954-Pano.jpg", cat: "nature",  titleAr: "بانوراما الأرض",     titleEn: "Earth Panorama",            locationAr: "الرياض",         locationEn: "Riyadh",    descAr: "الأرض تتمدد في كل الاتجاهات — بانوراما تضع الإنسان في حجمه الحقيقي.",               descEn: "The land stretches in every direction — a panorama that puts man in his true scale.", featured: false },
  { file: "045A9231.jpg",      cat: "nature",  titleAr: "رسائل الريح",        titleEn: "Messages of the Wind",      locationAr: "الرياض",         locationEn: "Riyadh",    descAr: "الريح تكتب على الرمل ثم تمحو — رسائل زائلة لعالم دائم.",                             descEn: "The wind writes on the sand then erases — fleeting messages for a permanent world.", featured: false },

  // عمارة
  { file: "045A1770-Pano-2.jpg", cat: "architecture", titleAr: "قبة السماء",   titleEn: "Dome of Heaven",          locationAr: "المدينة المنورة", locationEn: "Madinah",   descAr: "سقف يحكي قصة أمة — فسيفساء الذهب والأزرق ترتفع في صمت مهيب.",                      descEn: "A ceiling that tells the story of a civilization — gold and blue mosaic ascending in awe.", featured: true },
  { file: "045A5958.jpg",     cat: "architecture",    titleAr: "الضباب والشاهق","titleEn": "Fog and the Tower",     locationAr: "الرياض",         locationEn: "Riyadh",    descAr: "برج يخترق الضباب — المدينة تختبئ والشاهق وحده يصرّ على الظهور.",                     descEn: "A tower piercing the fog — the city hides while the skyscraper insists on being seen.", featured: false },
  { file: "DJI_0002.jpg",     cat: "architecture",    titleAr: "معمار من الأعلى","titleEn": "Architecture from Above", locationAr: "الطائف",   locationEn: "Taif",      descAr: "زاوية الطائر تكشف ما لا يراه المار — تناسق المعمار يبدو جلياً من السماء.",            descEn: "A bird's eye reveals what the passerby misses — architectural harmony from above.", featured: false },
  { file: "DJI_20250702060100_0172_D-2.jpg", cat: "architecture", titleAr: "موجات الخرسانة", titleEn: "Waves of Concrete", locationAr: "الرياض", locationEn: "Riyadh", descAr: "واجهة ترقص بين الصلابة والمرونة — موجات من الخرسانة تعيد تعريف الجمال المعماري.", descEn: "A facade that dances between rigidity and fluidity — concrete waves redefining beauty.", featured: false },

  // جوية
  { file: "DJI_20250629055203_0628_D.jpg", cat: "aerial", titleAr: "عين المملكة", titleEn: "Eye of the Kingdom", locationAr: "الرياض", locationEn: "Riyadh", descAr: "برج المملكة من خلال مرآة السماء — صورة لمدينة تكتب مستقبلها يوماً بعد يوم.", descEn: "Kingdom Tower framed through the sky — a city writing its future day by day.", featured: true },
  { file: "DJI_20250619172151_0181_D.jpg", cat: "aerial", titleAr: "حقول الشمس", titleEn: "Fields of the Sun", locationAr: "الرياض", locationEn: "Riyadh", descAr: "آلاف الألواح الشمسية تغطي الأرض — طاقة تنتظر أن تولد.", descEn: "Thousands of solar panels blanketing the earth — energy waiting to be born.", featured: false },
  { file: "DJI_20250628180913_0449_D-Pano.jpg", cat: "aerial", titleAr: "الملعب", titleEn: "The Stadium", locationAr: "الرياض", locationEn: "Riyadh", descAr: "ملعب المدينة من السماء — دائرة تحتضن أحلام وصرخات آلاف المشجعين.", descEn: "The city stadium from above — a circle holding the dreams and cries of thousands.", featured: false },
  { file: "DJI_20250710170926_0036_D.jpg", cat: "aerial", titleAr: "قبة الدولة", titleEn: "Dome of the State", locationAr: "الرياض", locationEn: "Riyadh", descAr: "بناء حكومي شامخ من منظور السماء — معمار يعكس هوية وطنية راسخة.", descEn: "A government palace from the sky — architecture reflecting a deep national identity.", featured: false },
  { file: "DJI_20250724174304_0152_D.jpg", cat: "aerial", titleAr: "خيوط الجسر", titleEn: "Threads of the Bridge", locationAr: "الرياض", locationEn: "Riyadh", descAr: "كابلات الجسر تمتد كأوتار موسيقية — والسيارات تعزف عليها لحن الحياة اليومية.", descEn: "Bridge cables stretching like musical strings — cars playing the melody of daily life.", featured: true },
  { file: "DJI_20250816063634_0440_D.jpg", cat: "aerial", titleAr: "موسم التمر", titleEn: "Date Season", locationAr: "الرياض", locationEn: "Riyadh", descAr: "أيدي وأصوات وحركة — موسم التمر يحكي عن أرض وشعب وموروث لا ينتهي.", descEn: "Hands, voices, movement — the date season telling stories of land, people, and legacy.", featured: false },
  { file: "DJI_20250721061224_0236_D.jpg", cat: "aerial", titleAr: "متاهة اللهو", titleEn: "Maze of Play", locationAr: "الرياض", locationEn: "Riyadh", descAr: "حديقة ترفيه من السماء — مساحة اللعب تأخذ شكلاً مختلفاً حين ترتفع.", descEn: "An amusement park from above — the space of play takes a different form when you rise.", featured: false },
  { file: "DJI_0314.jpg",      cat: "aerial",  titleAr: "نسيج الأحياء",   titleEn: "Urban Fabric",          locationAr: "الرياض",         locationEn: "Riyadh",    descAr: "المساجد والمنازل تتداخل — نسيج المدينة يكشف عن روابط لا تراها من الأرض.",            descEn: "Mosques and homes intertwined — the urban fabric reveals connections invisible from the ground.", featured: false },
  { file: "DJI_0581-Best.jpg", cat: "aerial",  titleAr: "مشروع يتشكل",    titleEn: "A Project Taking Shape", locationAr: "الرياض",        locationEn: "Riyadh",    descAr: "الرياض تبني مستقبلها — مشروع عملاق يأخذ شكله ببطء من فوق.",                          descEn: "Riyadh building its future — a massive project slowly taking shape from above.", featured: false },
  { file: "DJI_0595-HDR-Pano-Best.jpg", cat: "aerial", titleAr: "بانوراما المدينة", titleEn: "City Panorama", locationAr: "الرياض", locationEn: "Riyadh", descAr: "الرياض في صورة واحدة — ماضٍ وحاضر ومستقبل في إطار واحد.", descEn: "Riyadh in one frame — past, present, and future within a single border.", featured: false },
  { file: "DJI_20250619182951_0250_D.jpg", cat: "aerial", titleAr: "ذهب المساء", titleEn: "Evening Gold", locationAr: "الرياض", locationEn: "Riyadh", descAr: "الساعة الذهبية تصبّ لونها على المدينة — كل شيء يبدو أجمل في ضوء الغروب.", descEn: "The golden hour pours its color over the city — everything looks more beautiful at dusk.", featured: false },
  { file: "DJI_20250628180731_0423_D.jpg", cat: "aerial", titleAr: "خطوط المدينة", titleEn: "City Lines", locationAr: "الرياض", locationEn: "Riyadh", descAr: "شوارع وأحياء تشكّل شبكة حياة — كل خط يؤدي إلى قصة مختلفة.", descEn: "Streets and neighborhoods forming a web of life — each line leads to a different story.", featured: false },
  { file: "DJI_20250710171037_0076_D.jpg", cat: "aerial", titleAr: "هندسة الفضاء", titleEn: "Spatial Geometry", locationAr: "الرياض", locationEn: "Riyadh", descAr: "أشكال هندسية تتكرر من فوق — الفضاء يكشف نظاماً خفياً في كل زاوية.", descEn: "Geometric shapes repeating from above — the sky reveals a hidden order in every corner.", featured: false },
  { file: "DJI_20250713071137_0855_D-Pano-4.jpg", cat: "aerial", titleAr: "بانوراما الفجر", titleEn: "Dawn Panorama", locationAr: "الرياض", locationEn: "Riyadh", descAr: "الفجر يلوّن الأفق بدرجات لا تتكرر — لحظة تستحق الاستيقاظ مبكراً.", descEn: "Dawn paints the horizon in unrepeatable shades — a moment worth waking up early for.", featured: false },
  { file: "DJI_20250724173108_0073_D.jpg", cat: "aerial", titleAr: "شبكة الطرق", titleEn: "Road Network", locationAr: "الرياض", locationEn: "Riyadh", descAr: "طرق تتقاطع وتتفرق — دماغ المدينة يعمل في ضوء النهار.", descEn: "Roads crossing and diverging — the city's nervous system at work in daylight.", featured: false },
  { file: "20250618-DJI_20250618065106_0112_D-HDR-Pano.jpg", cat: "aerial", titleAr: "الأرض الخضراء", titleEn: "Green Earth", locationAr: "الرياض", locationEn: "Riyadh", descAr: "لقطة جوية تكشف خضرة المدينة في مواجهة الصحراء المحيطة.", descEn: "An aerial shot revealing the city's greenery against the surrounding desert.", featured: false },

  // بورتريه
  { file: "045A3078-Edit-Best.jpg",    cat: "portrait", titleAr: "ضحكة من القلب",  titleEn: "A Laugh from the Heart",   locationAr: "الرياض", locationEn: "Riyadh", descAr: "تلك الضحكة التي لا تحتاج إلى مناسبة — فرح نقي يتجاوز السن والزمان.", descEn: "The laugh that needs no occasion — pure joy that transcends age and time.", featured: false },
  { file: "045A8713-Edit-212 copy.jpg", cat: "portrait", titleAr: "الفرح المضاعف", titleEn: "Double Joy",                locationAr: "الرياض", locationEn: "Riyadh", descAr: "ابتسامتان في إطار واحد — براءة الطفل وفرحة الأب يلتقيان في لحظة أبدية.", descEn: "Two smiles in one frame — a child's innocence and a father's joy in a timeless moment.", featured: false },
  { file: "045A8151.jpg",               cat: "portrait", titleAr: "ملامح الزمن",    titleEn: "Features of Time",         locationAr: "الرياض", locationEn: "Riyadh", descAr: "كل تجعّد يحكي قصة — وجه نقشته السنون بأدقّ التفاصيل.", descEn: "Every wrinkle tells a story — a face etched by years with the finest detail.", featured: false },
  { file: "045A8413.jpg",               cat: "portrait", titleAr: "نظرة صامتة",     titleEn: "Silent Gaze",              locationAr: "الرياض", locationEn: "Riyadh", descAr: "صمت يقول أكثر من الكلام — عيون تحمل عوالم كاملة في لحظة واحدة.", descEn: "Silence that says more than words — eyes carrying entire worlds in a single moment.", featured: false },
  { file: "DSCF0065-1.jpg",            cat: "portrait", titleAr: "نظرة طفولة",     titleEn: "A Child's Gaze",           locationAr: "الرياض", locationEn: "Riyadh", descAr: "عيون تطلع على العالم للمرة الأولى — تساؤل بريء لا يمكن تصنيفه.", descEn: "Eyes discovering the world for the first time — an innocent curiosity impossible to define.", featured: false },
  { file: "DSCF3760.jpg",              cat: "portrait", titleAr: "أصيل وأصيل",     titleEn: "Roots and Origins",        locationAr: "الرياض", locationEn: "Riyadh", descAr: "إنسان وجمل — رفقة قديمة تسبق الذاكرة، جذور متشابكة في أرض الجزيرة.", descEn: "Man and camel — an ancient companionship older than memory, roots entwined in the Arabian soil.", featured: false },
  { file: "DSCF3821_1.jpg",            cat: "portrait", titleAr: "لحظة عابرة",     titleEn: "A Passing Moment",         locationAr: "الرياض", locationEn: "Riyadh", descAr: "اللحظة التي لن تتكرر — المصور يسرقها قبل أن تذهب إلى غير رجعة.", descEn: "The moment that will never repeat — the photographer steals it before it vanishes.", featured: false },
  { file: "Othman-Taha-Main-Photo--045A8918.jpg", cat: "portrait", titleAr: "عثمان طه", titleEn: "Othman Taha", locationAr: "الرياض", locationEn: "Riyadh", descAr: "وجه يحمل تاريخاً — بورتريه لرجل نقش حروفاً لقرآن مليار مسلم.", descEn: "A face that carries history — portrait of the man who calligraphed the Quran for a billion Muslims.", featured: false },

  // وثائقية
  { file: "_DSF9780.jpg",   cat: "documentary", titleAr: "خلف العدسات",   titleEn: "Behind the Lenses",        locationAr: "الرياض", locationEn: "Riyadh", descAr: "لحظة في قلب المصوّرين — العدسات تتزاحم والضوء يمتحن الجميع.", descEn: "A moment at the heart of photographers — lenses competing, light testing everyone.", featured: false },
  { file: "DSCF9764.jpg",   cat: "documentary", titleAr: "ضوء وظل",        titleEn: "Light and Shadow",         locationAr: "الرياض", locationEn: "Riyadh", descAr: "الضوء يرسم ما لا يستطيع الكلام وصفه — ظلال تكمل ما بدأه النور.", descEn: "Light draws what words cannot describe — shadows completing what illumination began.", featured: false },
  { file: "_DSF2698.jpg",   cat: "documentary", titleAr: "لحظة القرار",    titleEn: "The Decisive Moment",      locationAr: "الرياض", locationEn: "Riyadh", descAr: "الصورة التي تحدث مرة واحدة — عقل المصور يجمد الزمن في جزء من الثانية.", descEn: "The photograph that happens once — the photographer's mind freezes time in a fraction of a second.", featured: false },
];

const ACQUIRE_PHOTOS = [
  { file: "4-4.jpg",  titleAr: "حكمة الزمن",       titleEn: "Wisdom of Time",      locationAr: "الرياض", locationEn: "Riyadh", descAr: "بورتريه لوجه يحمل عمراً من الحكمة والصمود — طباعة فنية محدودة على ورق أرشيفي.", descEn: "Portrait of a face carrying a lifetime of wisdom — limited fine art print on archival paper." },
  { file: "4-٨.jpg",  titleAr: "كبرياء",             titleEn: "Pride",               locationAr: "الرياض", locationEn: "Riyadh", descAr: "الكبرياء العربي الأصيل في لحظة صادقة — طباعة فنية محدودة على ورق أرشيفي.", descEn: "Authentic Arabian pride in an honest moment — limited fine art print on archival paper." },
  { file: "4-11.jpg", titleAr: "النخيل في الغروب", titleEn: "Palms at Sunset",     locationAr: "الرياض", locationEn: "Riyadh", descAr: "نخيل يحمل ظلال الغروب في صمت — طباعة فنية محدودة على ورق أرشيفي.", descEn: "Palms carrying the shadows of sunset in silence — limited fine art print on archival paper." },
  { file: "4-16.jpg", titleAr: "صمت النخيل",        titleEn: "Silence of the Palms", locationAr: "الرياض", locationEn: "Riyadh", descAr: "لحظة هدوء تحت ظلال النخيل — طباعة فنية محدودة على ورق أرشيفي.", descEn: "A moment of stillness beneath palm trees — limited fine art print on archival paper." },
];

const SIZES = [
  { label: "50×70 cm",   totalEditions: 10 },
  { label: "70×100 cm",  totalEditions: 7  },
  { label: "100×140 cm", totalEditions: 5  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting content seed...\n");

  // 1. Create categories
  console.log("📁 Creating categories...");
  const catIds = {};
  for (const cat of CATEGORIES) {
    const existing = await db.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      catIds[cat.slug] = existing.id;
      console.log(`  ↩️  Exists: ${cat.nameEn}`);
    } else {
      const created = await db.category.create({ data: cat });
      catIds[cat.slug] = created.id;
      console.log(`  ✅ Created: ${cat.nameEn}`);
    }
  }

  // 2. Upload portfolio works
  console.log("\n🖼  Uploading portfolio works...");
  let order = 1;
  for (const photo of PORTFOLIO_PHOTOS) {
    const filePath = path.join(GALLERY, photo.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Missing: ${photo.file}`);
      continue;
    }

    const code = `FA-${String(order).padStart(3, "0")}`;
    process.stdout.write(`  [${code}] ${photo.titleEn}... `);

    try {
      // Check if already uploaded
      const existing = await db.work.findUnique({ where: { code } });
      if (existing) { console.log("↩️  exists"); order++; continue; }

      const result = await uploadToCloudinary(filePath, "portfolio");
      await db.work.create({
        data: {
          code,
          titleAr: photo.titleAr,
          titleEn: photo.titleEn,
          locationAr: photo.locationAr,
          locationEn: photo.locationEn,
          descriptionAr: photo.descAr,
          descriptionEn: photo.descEn,
          imageUrl: result.secure_url,
          width:    result.width  ?? 1200,
          height:   result.height ?? 800,
          categoryId: catIds[photo.cat],
          order,
          isPublished: true,
          isFeatured: photo.featured ?? false,
        },
      });
      console.log("✅");
      order++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  // 3. Upload acquire items
  console.log("\n🛒 Uploading acquire items...");
  for (const photo of ACQUIRE_PHOTOS) {
    const filePath = path.join(SALE, photo.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Missing: ${photo.file}`);
      continue;
    }

    const code = `FA-${String(order).padStart(3, "0")}`;
    process.stdout.write(`  [${code}] ${photo.titleEn}... `);

    try {
      const existing = await db.work.findUnique({ where: { code } });
      if (existing) {
        console.log("↩️  exists");
        order++;
        continue;
      }

      const result = await uploadToCloudinary(filePath, "acquire");
      const work = await db.work.create({
        data: {
          code,
          titleAr: photo.titleAr,
          titleEn: photo.titleEn,
          locationAr: photo.locationAr,
          locationEn: photo.locationEn,
          descriptionAr: photo.descAr,
          descriptionEn: photo.descEn,
          imageUrl: result.secure_url,
          width:    result.width  ?? 1200,
          height:   result.height ?? 800,
          categoryId: catIds["portrait"],
          order,
          isPublished: true,
          isFeatured: false,
        },
      });

      const acquireItem = await db.acquireItem.create({
        data: { workId: work.id, isActive: true },
      });

      for (const size of SIZES) {
        await db.acquireSize.create({
          data: { acquireItemId: acquireItem.id, label: size.label, totalEditions: size.totalEditions, soldEditions: 0 },
        });
      }

      console.log("✅");
      order++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  const totalWorks = await db.work.count();
  const totalAcquire = await db.acquireItem.count();
  console.log(`\n🎉 Done!`);
  console.log(`   Works in DB:    ${totalWorks}`);
  console.log(`   Acquire items:  ${totalAcquire}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
});
