import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "280900";

function authCheck(req: NextRequest): boolean {
  const pwd = req.nextUrl.searchParams.get("pwd") ?? req.headers.get("x-admin-pwd");
  return pwd === ADMIN_PASSWORD;
}

// GET — get all config
export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase.from("push_config").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Convert array to object for easier use
  const config = Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
  return NextResponse.json({ config });
}

// POST — update config keys
export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { updates } = await req.json(); // { key: value, ... }
  const rows = Object.entries(updates).map(([key, value]) => ({
    key, value: String(value), updated_at: new Date().toISOString()
  }));
  const { error } = await supabase
    .from("push_config")
    .upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
