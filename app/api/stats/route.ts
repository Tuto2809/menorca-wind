import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "280900";

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const stats = await getStats();
  return NextResponse.json(stats);
}
