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

### Menu Update Flow — local filesystem storage

Images and the per-channel manifest live on local disk under `UPLOAD_ROOT/CHANNEL/` (`UPLOAD_ROOT` defaults to `/app/uploads`, bind-mounted in production to `/opt/hermess/data/summer/uploads` so uploads survive redeploys — see `/opt/hermess/CLAUDE.md`). **Not Supabase** — that was fully replaced; `@supabase/supabase-js` is no longer a dependency.

**Upload page** (`/upload`, protected): User uploads images → `POST /api/menu-images` → saved to `UPLOAD_ROOT/CHANNEL/<uuid>.<ext>` → `_manifest.json` in the same directory updated with new entry.

**Home page** (`/`): `PublicMenu` fetches `GET /api/menu-images` on mount → reads the local manifest → builds `MenuBook` from ordered image URLs (`/uploads/<filename>`, served directly by Nginx, not proxied through Node) → renders via `VerticalMenuScroll`.

**Server-side** (`lib/fileStorage.ts`): `readManifest`/`writeManifest` (atomic write-then-rename), `saveImage`, `removeImages`, `getPublicUrl`. Validates filenames against `^[a-zA-Z0-9-]+\.(jpg|jpeg|png|gif|webp|avif)$` before any filesystem call — required because, unlike Supabase Storage keys, these are now real paths (path traversal risk if unvalidated).

**n8n automation** (`n8n/`): An n8n webhook workflow receives a PDF, runs `n8n/pdf_to_png_zip.py` (requires `pypdfium2`) to render at 2x scale. The resulting images can then be uploaded individually to `/api/menu-images`.

### API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/pdf` | Serves `public/menu.pdf` or `public/Summer202026.pdf` with gzip/brotli compression and ETag caching |
| `GET /api/pdf-worker` | Proxies `pdfjs-dist/build/pdf.worker.min.mjs` with immutable caching |
| `GET /api/public-files` | Recursively lists all files under `public/` (used by QR page) |
| `GET /api/menu-images` | Returns ordered image list from the local manifest |
| `POST /api/menu-images` | Upload a single image (`multipart/form-data`, field `image`) to local disk |
| `DELETE /api/menu-images?filename=x` | Remove image from disk and manifest |
| `PATCH /api/menu-images` | Reorder images — body `{ order: string[] }` (array of filenames) |

Note: none of these routes are behind `proxy.ts`'s Basic Auth — that middleware only matches `/edit`, `/upload`, `/split` (the *pages*), not `/api/*`. This was already true before the storage migration; flagged here since it's easy to assume the API inherits the page's auth.

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

Self-hosted on an EC2 instance via Docker + Nginx (not Vercel — `vercel.json` is a leftover from the prior deployment and is unused; harmless to ignore). See `/opt/hermess/CLAUDE.md` for full server context.

Two containers run from the **same image** (`hermess-summer:latest`, built from this directory's `Dockerfile`), differing only by `.env.*` — chiefly `CHANNEL`:

| Host | Container | `CHANNEL` |
|---|---|---|
| `oldsummer.filessecond.com` | `hermess-summer` | `summer` |
| `balcony.filessecond.com` | `hermess-balcony` | `balcony` |

Nginx (in `/opt/hermess/nginx/`) terminates TLS (real Let's Encrypt certs, auto-renewed) and reverse-proxies each subdomain to its container over the `hermess_net` Docker network. Neither app container publishes port 3000 to the host — only Nginx is reachable from outside.

`next.config.mjs` sets `output: "standalone"` for the Docker build. Images are unoptimized (`next.config.mjs`), so `sharp` (present in `pnpm-lock.yaml` for other reasons) is never invoked at runtime.

**Gotcha, already hit once:** several pages (`/upload`, `/edit`, `/split`, `/QR`, `/QR/pdf`, `/menu-replacer`, `/swipe`) are statically prerendered by Next.js. Since one built image is shared by both `CHANNEL`-differentiated containers, anything reading `process.env.CHANNEL` in a component that's part of a static page gets baked in at *build* time — when `CHANNEL` is never set (it's runtime-only, per-container). `app/layout.tsx` does exactly this, so it sets `export const dynamic = "force-dynamic"` to force every route to render per-request instead. If a future change reintroduces a build-time env read in a shared layout/component, expect the same class of bug — it won't show up on `/` (already dynamic for other reasons) or in curl tests against only `/api/*`, only on the statically-generated pages.

Redeploy after a code change (also runs automatically on push to `main` via `.github/workflows/deploy.yml`):
```bash
cd /opt/hermess/apps/summer
docker compose build
docker compose up -d
```
