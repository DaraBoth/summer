import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const workerPath = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "build",
      "pdf.worker.min.mjs"
    );

    const workerSource = await fs.readFile(workerPath, "utf-8");

    return new NextResponse(workerSource, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Failed to load pdf worker", error);
    return new NextResponse("PDF worker not found", { status: 500 });
  }
}

export const runtime = "nodejs";
