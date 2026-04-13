# CLAUDE.md — مشروع موقع صالح الهذلول الفوتوغرافي

## نظرة عامة

موقع شخصي لفنان فوتوغرافي سعودي — معرض أعمال، مدونة، ومنصة اقتناء نسخ محدودة.
الموقع ثنائي اللغة (عربي/إنجليزي)، يدعم الوضع الداكن والفاتح، ومبني ليكون قابلاً للتحويل لاحقاً إلى منتج يُباع للمصورين.

## التقنيات المعتمدة

| التقنية | الغرض |
|---------|-------|
| **Next.js 14+ (App Router)** | إطار العمل الرئيسي |
| **TypeScript** | لغة البرمجة |
| **Tailwind CSS** | التنسيق |
| **Prisma ORM** | طبقة قاعدة البيانات |
| **PostgreSQL (Neon أو Supabase)** | قاعدة البيانات |
| **Cloudinary** | تخزين ومعالجة الصور |
| **NextAuth.js** | مصادقة لوحة التحكم |
| **TipTap (ProseMirror)** | محرر المدونة الغني |
| **Framer Motion** | الحركات والانتقالات |
| **Resend** | البريد الإلكتروني |
| **Vercel** | الاستضافة |

## هيكل المجلدات

```
src/
├── app/
│   ├── [locale]/              # مسارات ثنائية اللغة (ar/en)
│   │   ├── page.tsx           # الصفحة الرئيسية
│   │   ├── portfolio/         # معرض الأعمال
│   │   ├── blog/              # المدونة
│   │   │   └── [slug]/        # صفحة التدوينة
│   │   ├── acquire/           # صفحة الاقتناء
│   │   ├── about/             # المعلومات الشخصية
│   │   └── contact/           # التواصل
│   ├── admin/                 # لوحة التحكم (بدون locale)
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Dashboard
│   │   ├── settings/          # إعدادات عامة
│   │   ├── portfolio/         # إدارة المعرض
│   │   ├── blog/              # إدارة المدونة
│   │   │   └── editor/[id]/   # محرر التدوينة
│   │   ├── acquire/           # إدارة الاقتناء والطلبات
│   │   ├── orders/            # إدارة الطلبات
│   │   ├── about/             # تعديل صفحة About
│   │   └── messages/          # رسائل التواصل
│   └── api/                   # API Routes
│       ├── auth/
│       ├── upload/
│       ├── portfolio/
│       ├── blog/
│       ├── orders/
│       └── contact/
├── components/
│   ├── ui/                    # مكونات عامة (Button, Input, Modal...)
│   ├── layout/                # Header, Footer, Navigation
│   ├── portfolio/             # مكونات المعرض (Grid, Lightbox, Filters)
│   ├── blog/                  # مكونات المدونة (Card, Renderer)
│   ├── acquire/               # مكونات الاقتناء (Form, SizeSelector)
│   └── admin/                 # مكونات لوحة التحكم
├── lib/
│   ├── db.ts                  # Prisma client
│   ├── auth.ts                # NextAuth config
│   ├── cloudinary.ts          # Cloudinary helpers
│   ├── email.ts               # Resend config
│   ├── i18n.ts                # إعدادات الترجمة
│   └── utils.ts               # أدوات مساعدة
├── prisma/
│   └── schema.prisma          # مخطط قاعدة البيانات
├── messages/
│   ├── ar.json                # ترجمات عربية
│   └── en.json                # ترجمات إنجليزية
├── styles/
│   └── globals.css            # Tailwind + CSS Variables
└── types/
    └── index.ts               # TypeScript types
```

## مخطط قاعدة البيانات (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
}

model SiteSettings {
  id              String  @id @default("main")
  logoLight       String? // رابط شعار فاتح
  logoDark        String? // رابط شعار غامق
  titleAr         String?
  titleEn         String?
  descriptionAr   String?
  descriptionEn   String?
  socialInstagram String?
  socialX         String?
  socialBehance   String?
  socialLinkedin  String?
  socialEmail     String?
  heroImageUrl    String?
  heroQuoteAr     String?
  heroQuoteEn     String?
  fontHeadingUrl  String? // رابط خط العناوين
  fontBodyUrl     String? // رابط خط النص
  fontHeadingName String?
  fontBodyName    String?
  updatedAt       DateTime @updatedAt
}

model Category {
  id      String @id @default(cuid())
  nameAr  String
  nameEn  String
  slug    String @unique
  order   Int    @default(0)
  works   Work[]
}

model Work {
  id          String    @id @default(cuid())
  code        String    @unique // FA-001
  titleAr     String
  titleEn     String
  locationAr  String?
  locationEn  String?
  descriptionAr String?
  descriptionEn String?
  imageUrl    String
  width       Int       // أبعاد الصورة الأصلية
  height      Int
  dateTaken   DateTime?
  category    Category? @relation(fields: [categoryId], references: [id])
  categoryId  String?
  order       Int       @default(0)
  isPublished Boolean   @default(true)
  isFeatured  Boolean   @default(false) // للعرض في الصفحة الرئيسية
  acquireItem AcquireItem?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model BlogPost {
  id          String   @id @default(cuid())
  slug        String   @unique
  titleAr     String
  titleEn     String
  coverImage  String?
  contentAr   Json     // TipTap JSON content
  contentEn   Json?
  status      String   @default("draft") // draft, published, hidden
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AcquireItem {
  id        String        @id @default(cuid())
  work      Work          @relation(fields: [workId], references: [id])
  workId    String        @unique
  isActive  Boolean       @default(true)
  sizes     AcquireSize[]
  orders    Order[]
  createdAt DateTime      @default(now())
}

model AcquireSize {
  id            String      @id @default(cuid())
  acquireItem   AcquireItem @relation(fields: [acquireItemId], references: [id])
  acquireItemId String
  label         String      // "50×70 cm", "70×100 cm"
  totalEditions Int         // إجمالي النسخ
  soldEditions  Int         @default(0)
  orders        Order[]
}

model Order {
  id            String      @id @default(cuid())
  acquireItem   AcquireItem @relation(fields: [acquireItemId], references: [id])
  acquireItemId String
  size          AcquireSize @relation(fields: [sizeId], references: [id])
  sizeId        String
  customerName  String
  customerEmail String
  customerPhone String
  message       String?     // سبب الاهتمام
  status        String      @default("new") // new, reviewing, accepted, rejected, completed
  notes         String?     // ملاحظات المالك
  priceSent     Float?      // السعر المرسل للمقتني
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  category  String   // collaboration, inquiry, acquisition, media, other
  message   String
  status    String   @default("new") // new, replied, closed
  createdAt DateTime @default(now())
}
```

## الصفحات — المواصفات التفصيلية

### ١. الصفحة الرئيسية
- صورة غلاف كاملة العرض (full-bleed hero) مع اقتباس/عبارة قابلة للتغيير
- قسم "آخر الأعمال" — يعرض أعمالاً مختارة يدوياً (isFeatured)
- روابط وسائل التواصل في الفوتر والهيدر
- Lazy loading للصور

### ٢. معرض الأعمال
- **ثلاثة أنماط Grid يختار بينها الزائر:**
  - ① Grid متساوٍ منتظم (مربعات أو نسبة ثابتة)
  - ② Grid متسق مع نسب الصور الأصلية (Masonry)
  - ③ عشوائي بأحجام مختلفة (Scattered/Mosaic)
- كل صورة تعرض: الاسم، الرقم (FA-XXX)، موقع التصوير
- زر تبديل لإظهار/إخفاء المعلومات
- Lightbox عند النقر مع تنقل بين الصور
- فلترة حسب التصنيفات

### ٣. المدونة
- قائمة تدوينات: غلاف + عنوان + تاريخ
- صفحة تدوينة كاملة تعرض محتوى TipTap الغني
- المحرر في لوحة التحكم يدعم:
  - تغيير الخط والحجم واللون
  - عناوين H1-H4 وفقرات
  - صور فردية ومجموعات صور (Gallery) بأحجام متحكم بها
  - تضمين فيديو (YouTube/Vimeo embed)
  - اقتباسات، روابط، فواصل بصرية
  - معاينة قبل النشر
  - حالات: مسودة / منشور / مخفي

### ٤. صفحة الاقتناء
- معرض الأعمال المتاحة مع حالة التوفر
- كل عمل يعرض: الصورة + المقاسات المتاحة + النسخ المتبقية
- **السعر لا يظهر أبداً** — يُرسل شخصياً
- نموذج طلب اقتناء:
  - اختيار الحجم
  - الاسم
  - البريد الإلكتروني
  - الجوال
  - رسالة عن سبب الاهتمام
- إشعار بريدي للمالك عند ورود طلب جديد

### ٥. المعلومات الشخصية (About)
- صورة شخصية + نبذة تعريفية بالغتين

### ٦. التواصل (Contact)
- نموذج تواصل: الاسم، الإيميل، الجوال، الرسالة
- تصنيف سبب التواصل (تعاون، استفسار، اقتناء، إعلام، أخرى)
- تأكيد إرسال

## لوحة التحكم — المواصفات

### إعدادات عامة
- رفع شعار بنسختين (فاتح/غامق)
- رفع خطوط مخصصة (.woff2, .otf, .ttf) وتعيينها
- تعديل روابط وسائل التواصل
- تعديل صورة الغلاف والاقتباس
- SEO أساسي (عنوان، وصف، صورة مشاركة)

### إدارة المعرض
- رفع أعمال مع المعلومات (بالغتين): اسم، رقم، موقع، تصنيف، تاريخ، وصف
- ترتيب بالسحب والإفلات (Drag & Drop)
- إدارة التصنيفات
- التحكم بالأنماط المتاحة والنمط الافتراضي

### محرر المدونة
- **محرر غني بمستوى Behance** باستخدام TipTap
- كل ما ذُكر أعلاه في مواصفات المدونة

### إدارة الاقتناء
- ربط عمل من المعرض أو رفع عمل جديد
- إدارة المقاسات والكميات لكل عمل
- تحديث العدد المتبقي

### إدارة الطلبات
- عرض الطلبات الواردة
- حالات: جديد → قيد المراجعة → مقبول/مرفوض → مكتمل
- إرسال رد بالسعر للمقتني
- ملاحظات داخلية

### رسائل التواصل
- عرض الرسائل مصنفة حسب السبب
- حالات: جديد، تم الرد، مغلق

## المتطلبات العامة

### ثنائية اللغة
- next-intl مع مسارات [locale]
- كل محتوى في لوحة التحكم بحقلين (AR/EN)
- تبديل تلقائي RTL/LTR
- اللغة الافتراضية: العربية

### الوضع الداكن/الفاتح
- CSS Variables للألوان
- زر تبديل في الهيدر
- تبديل الشعار تلقائياً
- حفظ التفضيل في localStorage

### التجاوب
- Mobile-first
- نقاط كسر: 640px, 768px, 1024px, 1280px, 1536px
- قائمة تنقل مخصصة للموبايل

### الأداء
- Next.js Image optimization
- Lazy loading لجميع الصور
- أحجام صور متعددة من Cloudinary
- Static generation حيث أمكن

## أسلوب التصميم

- **فنّي وبسيط** — لا تعقيد بصري
- مساحات بيضاء واسعة (أو سوداء في الوضع الداكن)
- الصور هي البطل — التصميم يخدمها لا ينافسها
- حركات انتقالية هادئة وسلسة
- تايبوغرافي مدروسة — خطوط مخصصة عربية وإنجليزية

## ملاحظات للتطوير

- ابدأ بالمرحلة المحددة فقط — لا تبنِ ما لم يُطلب بعد
- اكتب كوداً نظيفاً وموثقاً — المشروع سيُحوَّل لمنتج لاحقاً
- استخدم TypeScript strict mode
- اكتب الـ commits بالإنجليزية بشكل واضح
- كل مكوّن يجب أن يكون قابلاً لإعادة الاستخدام
- لا تضع بيانات وهمية مدمجة (hardcoded) — كل شيء يأتي من قاعدة البيانات أو لوحة التحكم
