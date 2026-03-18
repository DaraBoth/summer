import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface PublicFileEntry {
  name: string;
  path: string;
}

async function walkPublicFiles(
  absoluteDir: string,
  relativeDir = ""
): Promise<PublicFileEntry[]> {
  const dirEntries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const results: PublicFileEntry[] = [];

  for (const entry of dirEntries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absoluteEntryPath = path.join(absoluteDir, entry.name);
    const relativeEntryPath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      const nested = await walkPublicFiles(absoluteEntryPath, relativeEntryPath);
      results.push(...nested);
      continue;
    }

    if (entry.isFile()) {
      results.push({
        name: entry.name,
        path: `/${relativeEntryPath}`,
      });
    }
  }

  return results;
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const files = await walkPublicFiles(publicDir);

    files.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list public files", error);
    return NextResponse.json({ files: [] }, { status: 500 });
  }
}

export const runtime = "nodejs";
