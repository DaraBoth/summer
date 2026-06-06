# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Run production build locally
pnpm lint       # ESLint via next lint
```

No test suite is configured.

## Architecture

This is a **Next.js 16 App Router** project (React 19, TypeScript, Tailwind CSS, pnpm) for an interactive digital restaurant menu.

### Pages

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Public vertical scroll menu (`VerticalMenuScroll`) | Public |
| `/swipe` | Book-flip viewer (`BookViewer`) | Public |
| `/edit` | WYSIWYG menu editor (`BookViewer` + `EditPanel`) | Basic Auth |
| `/upload` | PDF→images importer + ZIP replacer | Basic Auth |
| `/QR` | QR code generator for any app URL | Public |
| `/QR/pdf` | QR specifically for the PDF endpoint | Public |
| `/menu-replacer` | Step-by-step guide for the ZIP workflow | Public |
| `/split` | PDF split tool | Basic Auth |

### Authentication

`proxy.ts` is a Next.js middleware that enforces HTTP Basic Auth on `/edit`, `/upload`, and `/split`. Credentials come from env vars `EDIT_USERNAME` / `EDIT_PASSWORD` (defaults: `admin` / `change-this-password`).

### State Management — `useMenuStore`

`hooks/useMenuStore.ts` is the central state hook. It persists `MenuBook` to IndexedDB via **localforage** (key: `food-menu-v3`, instance: `summer-menu-storage`). On first load it calls `/api/public-files` to discover which `/public/menu/menu-{N}.png` files exist and builds a dynamic default menu from them. A migration function (`migrateLegacyPageBackgrounds`) handles v2→v3 schema upgrades.

### Menu Update Flow — Supabase Storage

Images are stored in a Supabase Storage bucket named `menu`. Order is tracked in a `_manifest.json` file inside the same bucket.

**Upload page** (`/upload`, protected): User uploads images → `POST /api/menu-images` → stored in Supabase with UUID filename → `_manifest.json` updated with new entry.

**Home page** (`/`): `PublicMenu` fetches `GET /api/menu-images` on mount → reads manifest from Supabase → builds `MenuBook` from ordered image URLs → renders via `VerticalMenuScroll`. Always shows the latest images regardless of local browser state.

**Server-side** (`lib/supabaseAdmin.ts`): `supabaseAdmin` uses the service role key. `readManifest` / `writeManifest` download/upload `_manifest.json` as JSON. `getPublicUrl` constructs public CDN URLs.

**n8n automation** (`n8n/`): An n8n webhook workflow receives a PDF, runs `n8n/pdf_to_png_zip.py` (requires `pypdfium2`) to render at 2x scale. The resulting images can then be uploaded individually to `/api/menu-images`.

### API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/pdf` | Serves `public/menu.pdf` or `public/Summer202026.pdf` with gzip/brotli compression and ETag caching |
| `GET /api/pdf-worker` | Proxies `pdfjs-dist/build/pdf.worker.min.mjs` with immutable caching |
| `GET /api/public-files` | Recursively lists all files under `public/` (used by QR page) |
| `GET /api/menu-images` | Returns ordered image list from Supabase manifest |
| `POST /api/menu-images` | Upload a single image (`multipart/form-data`, field `image`) to Supabase |
| `DELETE /api/menu-images?filename=x` | Remove image from Supabase bucket and manifest |
| `PATCH /api/menu-images` | Reorder images — body `{ order: string[] }` (array of filenames) |

All API routes use `runtime = "nodejs"`.

### Data Model (`types/menu.ts`)

```
MenuBook
  restaurantName / restaurantNameKh / tagline
  pages: MenuPage[]
    id, type ("cover" | "content" | "back-cover")
    elements: PageElement[]
      type: "text" | "image" | "item" | "ornament"
      position: { x, y, width, height, zIndex } (percent-based 0-100)
      imageUrl? / content? / itemId?
  inventory: MenuItem[]   ← global item list; pages reference by itemId
  sourcePdf?              ← metadata from last PDF import
```

Background images on content pages follow the pattern: full-width element with `id: bg-{N}`, `imageUrl: /menu/menu-{N}.png`, position `{x:0,y:0,width:100,height:100}`.

### Design System

CSS variables are defined in `app/globals.css`:
- `--bg-primary` / `--bg-secondary` — near-black backgrounds
- `--accent-olive` / `--accent-forest` / `--accent-dark` — gold/amber palette
- `--text-main` / `--text-muted` / `--border-light`

Custom font utility classes (CSS, not Tailwind): `.font-menu-title` (Playfair Display), `.font-menu-khmer` (Noto Serif Khmer), `.font-body` (Lato), `.font-decorative` (IM Fell English SC).

### Deployment

Deployed to Vercel. `vercel.json` sets framework to `nextjs`, install via `pnpm install --frozen-lockfile`, build via `pnpm build`. Images are unoptimized (`next.config.mjs`). The `/menu.pdf` URL rewrites to `/api/pdf`.
