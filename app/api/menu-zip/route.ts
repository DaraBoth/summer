import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const MENU_DIR = path.join(process.cwd(), "public", "menu");

function normalizeZipPath(entryName: string): string {
  return entryName.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

function getStripRootFolder(fileEntryNames: string[]): string | null {
  if (fileEntryNames.length === 0) {
    return null;
  }

  const segmentsList = fileEntryNames.map((name) => normalizeZipPath(name).split("/").filter(Boolean));
  if (segmentsList.some((segments) => segments.length < 2)) {
    return null;
  }

  const firstSegment = segmentsList[0][0];
  const shouldStrip = segmentsList.every((segments) => segments[0] === firstSegment);

  return shouldStrip ? firstSegment : null;
}

async function replaceMenuDirectoryFromZip(zipBuffer: Buffer): Promise<string[]> {
  const zip = new AdmZip(zipBuffer);
  const fileEntries = zip.getEntries().filter((entry) => !entry.isDirectory);
  const stripRootFolder = getStripRootFolder(fileEntries.map((entry) => entry.entryName));

  await fs.rm(MENU_DIR, { recursive: true, force: true });
  await fs.mkdir(MENU_DIR, { recursive: true });

  const writtenFiles: string[] = [];

  for (const entry of fileEntries) {
    const normalizedEntryName = normalizeZipPath(entry.entryName);
    const entrySegments = normalizedEntryName.split("/").filter(Boolean);

    if (stripRootFolder && entrySegments[0] === stripRootFolder) {
      entrySegments.shift();
    }

    if (entrySegments.length === 0) {
      continue;
    }

    const relativePath = entrySegments.join("/");
    const targetPath = path.resolve(MENU_DIR, relativePath);
    const menuRoot = path.resolve(MENU_DIR) + path.sep;

    if (targetPath !== path.resolve(MENU_DIR) && !targetPath.startsWith(menuRoot)) {
      throw new Error(`Blocked unsafe zip path: ${entry.entryName}`);
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, entry.getData());
    writtenFiles.push(`/menu/${relativePath}`);
  }

  writtenFiles.sort((a, b) => a.localeCompare(b));
  return writtenFiles;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const zipFile = formData.get("zipFile");

    if (!(zipFile instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a .zip file named menu.zip or a similar menu archive." },
        { status: 400 }
      );
    }

    if (!zipFile.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { error: "The uploaded file must be a .zip archive." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await zipFile.arrayBuffer());
    const replacedFiles = await replaceMenuDirectoryFromZip(buffer);

    return NextResponse.json({
      ok: true,
      message: `Replaced public/menu with ${replacedFiles.length} file(s).`,
      replacedFiles,
    });
  } catch (error) {
    console.error("Failed to replace public/menu from zip", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to replace public/menu from the uploaded zip file.",
      },
      { status: 500 }
    );
  }
}
