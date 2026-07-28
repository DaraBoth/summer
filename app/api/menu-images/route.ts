import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  CHANNEL,
  getPublicUrl,
  readManifest,
  writeManifest,
  saveImage,
  removeImages,
  sanitizeExtension,
  ManifestEntry,
} from "@/lib/fileStorage";

export const runtime = "nodejs";

function channelRequired() {
  return NextResponse.json({ error: "CHANNEL env var is not configured." }, { status: 500 });
}

export async function GET() {
  if (!CHANNEL) return channelRequired();

  try {
    const manifest = await readManifest();
    const images = manifest.images.map((entry) => ({
      ...entry,
      url: getPublicUrl(entry.filename),
    }));
    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json(
      {
        images: [],
        error: error instanceof Error ? error.message : "Failed to read menu images",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!CHANNEL) return channelRequired();

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const ext = sanitizeExtension(file.name);
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await saveImage(filename, buffer);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Upload failed" },
        { status: 500 }
      );
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

// Swap one image's file while keeping the page it sits on.
export async function PUT(request: Request) {
  if (!CHANNEL) return channelRequired();

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const target = formData.get("filename");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }
    if (typeof target !== "string" || !target) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const ext = sanitizeExtension(file.name);
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await saveImage(filename, buffer);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Upload failed" },
        { status: 500 }
      );
    }

    // Read as late as possible so the slot lookup reflects the current order.
    const manifest = await readManifest();
    const index = manifest.images.findIndex((e) => e.filename === target);

    if (index === -1) {
      // Nothing to replace — drop the file we just uploaded rather than orphan it.
      await removeImages([filename]);
      return NextResponse.json(
        { error: "That image is no longer in the menu; refresh and try again." },
        { status: 404 }
      );
    }

    const newEntry: ManifestEntry = {
      filename,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    };
    manifest.images[index] = newEntry;
    await writeManifest(manifest);

    // Safe to delete only once the manifest no longer points at it.
    await removeImages([target]);

    return NextResponse.json({
      ...newEntry,
      url: getPublicUrl(filename),
      position: index + 1,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Replace failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!CHANNEL) return channelRequired();

  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");
    const filename = searchParams.get("filename");

    if (all === "true") {
      const manifest = await readManifest();
      const filenames = manifest.images.map((e) => e.filename);
      if (filenames.length > 0) {
        await removeImages(filenames);
      }
      await writeManifest({ images: [] });
      return NextResponse.json({ ok: true, removed: filenames.length });
    }

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    await removeImages([filename]);

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
  if (!CHANNEL) return channelRequired();

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
