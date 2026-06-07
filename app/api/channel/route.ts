import { NextResponse } from "next/server";
import { CHANNEL } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ channel: CHANNEL });
}
