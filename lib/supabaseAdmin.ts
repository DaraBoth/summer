import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const MENU_BUCKET = "menu";
export const CHANNEL = process.env.CHANNEL ?? "";
export const MANIFEST_KEY = `${CHANNEL}/_manifest.json`;

export interface ManifestEntry {
  filename: string;
  originalName: string;
  uploadedAt: string;
}

export interface MenuManifest {
  images: ManifestEntry[];
}

export function getStoragePath(filename: string): string {
  return `${CHANNEL}/${filename}`;
}

export function getPublicUrl(filename: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MENU_BUCKET}/${CHANNEL}/${filename}`;
}

export async function readManifest(): Promise<MenuManifest> {
  if (!CHANNEL) return { images: [] };

  // Deliberately not supabaseAdmin.storage.download(): that path is served by the
  // storage CDN and keeps returning a stale body after a write, so every
  // read-modify-write below would rebase onto an outdated manifest and drop the
  // previous writer's entries. A unique query string bypasses the cache.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const bust = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${MENU_BUCKET}/${MANIFEST_KEY}?cb=${bust}`,
    {
      headers: { Authorization: `Bearer ${key}`, apikey: key, "cache-control": "no-cache" },
      cache: "no-store",
    }
  );

  const text = await res.text();

  // Only a genuinely absent manifest may be treated as empty. Any other failure
  // must surface: callers write this result straight back, so quietly returning
  // an empty manifest on a credentials or network error erases the whole menu.
  if (!res.ok) {
    // Storage answers a missing object with 400 and a not_found payload, not 404.
    let missing = res.status === 404;
    if (!missing && res.status === 400) {
      try {
        const body = JSON.parse(text) as { error?: string; statusCode?: string };
        missing = body.error === "not_found" || body.statusCode === "404";
      } catch {
        missing = false;
      }
    }
    if (missing) return { images: [] };
    throw new Error(`Failed to read manifest: ${res.status} ${text.slice(0, 200)}`);
  }

  try {
    const parsed = JSON.parse(text) as MenuManifest;
    return { images: Array.isArray(parsed.images) ? parsed.images : [] };
  } catch {
    throw new Error("Manifest is not valid JSON; refusing to overwrite it.");
  }
}

export async function writeManifest(manifest: MenuManifest): Promise<void> {
  if (!CHANNEL) throw new Error("CHANNEL env var is not set");

  const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
  const { error } = await supabaseAdmin.storage
    .from(MENU_BUCKET)
    .upload(MANIFEST_KEY, blob, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });

  if (error) throw new Error(`Failed to write manifest: ${error.message}`);
}
