import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const MENU_BUCKET = "menu";
export const MANIFEST_KEY = "_manifest.json";

export interface ManifestEntry {
  filename: string;
  originalName: string;
  uploadedAt: string;
}

export interface MenuManifest {
  images: ManifestEntry[];
}

export function getPublicUrl(filename: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MENU_BUCKET}/${filename}`;
}

export async function readManifest(): Promise<MenuManifest> {
  const { data, error } = await supabaseAdmin.storage
    .from(MENU_BUCKET)
    .download(MANIFEST_KEY);

  if (error || !data) return { images: [] };

  try {
    const text = await data.text();
    return JSON.parse(text) as MenuManifest;
  } catch {
    return { images: [] };
  }
}

export async function writeManifest(manifest: MenuManifest): Promise<void> {
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
  const { error } = await supabaseAdmin.storage
    .from(MENU_BUCKET)
    .upload(MANIFEST_KEY, blob, { upsert: true, contentType: "application/json" });

  if (error) throw new Error(`Failed to write manifest: ${error.message}`);
}
