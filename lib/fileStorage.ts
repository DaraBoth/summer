import { promises as fs } from "fs";
import path from "path";

export const CHANNEL = process.env.CHANNEL ?? "";

// Bind-mounted to a persistent host directory in production — see
// docker-compose.yml. Must never be a path inside the image itself, or
// uploads would be wiped on every redeploy.
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || "/app/uploads";

const MANIFEST_FILENAME = "_manifest.json";

// Generated filenames are always `${uuid}.${ext}`, but DELETE/PUT also take
// a filename straight from the request, and this now touches a real
// filesystem (unlike the old Supabase Storage API, where the "path" was
// just an object key). Reject anything that isn't exactly that shape before
// it ever reaches fs.* to rule out path traversal.
const SAFE_FILENAME = /^[a-zA-Z0-9-]+\.(jpg|jpeg|png|gif|webp|avif)$/;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);

export function sanitizeExtension(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

function assertSafeFilename(filename: string): void {
  if (!SAFE_FILENAME.test(filename)) {
    throw new Error("Invalid filename.");
  }
}

export interface ManifestEntry {
  filename: string;
  originalName: string;
  uploadedAt: string;
}

export interface MenuManifest {
  images: ManifestEntry[];
}

function channelDir(): string {
  return path.join(UPLOAD_ROOT, CHANNEL);
}

function manifestPath(): string {
  return path.join(channelDir(), MANIFEST_FILENAME);
}

function imagePath(filename: string): string {
  assertSafeFilename(filename);
  return path.join(channelDir(), filename);
}

async function ensureChannelDir(): Promise<void> {
  await fs.mkdir(channelDir(), { recursive: true });
}

export function getPublicUrl(filename: string): string {
  assertSafeFilename(filename);
  return `/uploads/${filename}`;
}

export async function readManifest(): Promise<MenuManifest> {
  if (!CHANNEL) return { images: [] };

  try {
    const text = await fs.readFile(manifestPath(), "utf8");
    const parsed = JSON.parse(text) as MenuManifest;
    return { images: Array.isArray(parsed.images) ? parsed.images : [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { images: [] };
    throw new Error("Manifest is not valid JSON; refusing to overwrite it.");
  }
}

export async function writeManifest(manifest: MenuManifest): Promise<void> {
  if (!CHANNEL) throw new Error("CHANNEL env var is not set");

  await ensureChannelDir();
  // Write-then-rename so a reader never observes a half-written manifest —
  // rename is atomic on the same filesystem, unlike writing in place.
  const tmpPath = path.join(channelDir(), `.${MANIFEST_FILENAME}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmpPath, JSON.stringify(manifest), "utf8");
  await fs.rename(tmpPath, manifestPath());
}

export async function saveImage(filename: string, buffer: Buffer): Promise<void> {
  await ensureChannelDir();
  await fs.writeFile(imagePath(filename), buffer, { flag: "wx" });
}

export async function removeImages(filenames: string[]): Promise<void> {
  await Promise.all(
    filenames.map(async (filename) => {
      try {
        await fs.unlink(imagePath(filename));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    })
  );
}
