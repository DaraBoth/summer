import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  supabaseAdmin,
  MENU_BUCKET,
  getPublicUrl,
  readManifest,
  writeManifest,
  ManifestEntry,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const manifest = await readManifest();
    const images = manifest.images.map((entry) => ({
      ...entry,
      url: getPublicUrl(entry.filename),
    }));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(MENU_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type || "image/png",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const manifest = await readManifest();
    const newEntry: ManifestEntry = {
      filename,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    };
    manifest.images.push(newEntry);
    await writeManifest(manifest);

    return NextResponse.json({
      filename,
      originalName: file.name,
      url: getPublicUrl(filename),
      uploadedAt: newEntry.uploadedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    await supabaseAdmin.storage.from(MENU_BUCKET).remove([filename]);

    const manifest = await readManifest();
    manifest.images = manifest.images.filter((e) => e.filename !== filename);
    await writeManifest(manifest);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { order: string[] };

    if (!Array.isArray(body.order)) {
      return NextResponse.json({ error: "order must be an array of filenames" }, { status: 400 });
    }

    const manifest = await readManifest();
    const entryMap = new Map(manifest.images.map((e) => [e.filename, e]));
    manifest.images = body.order
      .filter((f) => entryMap.has(f))
      .map((f) => entryMap.get(f)!);

    await writeManifest(manifest);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reorder failed" },
      { status: 500 }
    );
  }
}
