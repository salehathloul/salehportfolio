# Saleh Alhuthloul — Portfolio

Personal portfolio website for a Saudi fine art photographer. Built with Next.js 16 App Router, bilingual (Arabic/English), dark/light mode, and a full admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS Variables |
| Database | PostgreSQL via Prisma ORM (`@prisma/adapter-pg`) |
| Auth | NextAuth.js v4 |
| Images | Cloudinary |
| Rich text | TipTap (ProseMirror) |
| Animations | Framer Motion |
| Email | Resend |
| i18n | next-intl v4 |
| Hosting | Vercel |

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud — Neon / Supabase recommended)
- Cloudinary account
- Resend account (for contact/order emails)

### 1. Clone and install

```bash
git clone <repo-url>
cd saleh-portfolio
npm install
```

### 2. Environment variables

Copy `.env.production` to `.env` and fill in all values:

```bash
cp .env.production .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Full site URL (e.g. `http://localhost:3000` locally) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Verified sender email in Resend |
| `RESEND_TO` | Your email for receiving notifications |
| `NEXT_PUBLIC_SITE_URL` | Full public URL of the site |
| `SEED_ADMIN_EMAIL` | Admin account email (used by seed script only) |
| `SEED_ADMIN_PASSWORD` | Admin account password (used by seed script only) |

### 3. Database setup

```bash
# Apply migrations
npx prisma migrate deploy

# (Optional) Generate Prisma client manually
npx prisma generate
```

### 4. Seed initial data

The seed script uploads all Identity assets (logos, gallery, sale photos, blog covers) to Cloudinary and populates the database.

```bash
npm run db:seed
```

What the seed creates:
- Admin user (using `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
- Site settings (logos, hero image, site name/description, hero quote)
- 3 portfolio categories (Aerial, Landscape, Abstract)
- 16 gallery works (FA-001–FA-016)
- 4 sale works (FA-017–FA-020) with acquisition items (3 sizes × 10 editions each)
- 5 published blog posts with embedded images

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Public routes (ar / en)
│   │   ├── page.tsx       # Home
│   │   ├── portfolio/     # Photography gallery
│   │   ├── blog/          # Blog listing + post pages
│   │   ├── acquire/       # Limited-edition print acquisition
│   │   ├── about/         # About page
│   │   └── contact/       # Contact form
│   ├── admin/             # Admin panel (no locale prefix)
│   │   ├── settings/      # Site settings, logo, fonts
│   │   ├── portfolio/     # Manage works + categories
│   │   ├── blog/          # Blog CRUD + TipTap editor
│   │   ├── acquire/       # Manage acquire items + sizes
│   │   ├── orders/        # Manage acquisition orders
│   │   └── messages/      # Contact messages
│   ├── api/               # API routes
│   ├── sitemap.ts         # Auto-generated sitemap.xml
│   └── robots.ts          # robots.txt
├── components/
│   ├── layout/            # Header, Footer, Navigation, PageTransition
│   ├── home/              # HeroSection, FeaturedWorks
│   ├── portfolio/         # Grid, Lightbox, Filters
│   ├── blog/              # BlogCard, TipTapRenderer
│   ├── acquire/           # AcquireClient, OrderModal
│   ├── contact/           # ContactForm
│   ├── about/             # AboutClient
│   └── admin/             # Admin UI components
├── lib/
│   ├── db.ts              # Prisma client (singleton)
│   ├── auth.ts            # NextAuth configuration
│   ├── cloudinary.ts      # Upload helpers
│   ├── email.ts           # Resend helpers
│   └── i18n.ts            # next-intl config
├── messages/
│   ├── ar.json            # Arabic translations
│   └── en.json            # English translations
└── styles/
    └── globals.css        # Tailwind + CSS variables + fonts
```

---

## Admin Panel

Access: `/admin` — requires authenticated session.

| Section | Description |
|---|---|
| **Settings** | Logo, hero image, hero quote, social links, site name/description |
| **Portfolio** | Upload works, set title/location/category, drag-and-drop reorder |
| **Blog** | TipTap rich editor — headings, images, galleries, blockquotes, YouTube |
| **Acquire** | Link portfolio works to acquisition, manage sizes/editions |
| **Orders** | Review print requests, update status, send price quote via email |
| **Messages** | View and manage contact form submissions |

---

## Fonts

Fonts are served from `public/fonts/` — no external requests.

| Font | Usage |
|---|---|
| `itfWathiq` Regular/Bold | All body text + English headings |
| `FatimahArabicITF` Regular/Light | Arabic headings (`[dir="rtl"] h1–h6`) |

---

## Deployment (Vercel)

1. Push code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all env variables from `.env.production` in the Vercel project settings
4. Vercel auto-detects Next.js — `vercel.json` handles `prisma generate` pre-build
5. After the first deploy, run the seed script locally pointing to the production DB:

```bash
DATABASE_URL="postgres://..." \
CLOUDINARY_CLOUD_NAME="..." \
CLOUDINARY_API_KEY="..." \
CLOUDINARY_API_SECRET="..." \
SEED_ADMIN_EMAIL="admin@yourdomain.com" \
SEED_ADMIN_PASSWORD="strong-password" \
npm run db:seed
```

---

## Database Management

```bash
# Open Prisma Studio (visual DB browser)
npm run db:studio

# Create a new migration after schema changes
npx prisma migrate dev --name describe-your-change

# Apply migrations in production
npm run db:migrate
```

---

## Notes

- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are only needed for the seed script, not at runtime.
- `NEXTAUTH_URL` must match the deployed URL exactly (including `https://`, no trailing slash).
- The site builds without a database connection — safe for Vercel's build step.
- The seed script uses `overwrite: false` on Cloudinary uploads — safe to re-run.
