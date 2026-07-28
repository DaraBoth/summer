import { NextResponse } from "next/server";
import { CHANNEL } from "@/lib/fileStorage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ channel: CHANNEL });
}
