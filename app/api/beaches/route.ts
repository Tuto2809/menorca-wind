import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Bini_3668";

function auth(req: NextRequest) {
  return req.nextUrl.searchParams.get("pwd") === ADMIN_PASSWORD;
}

// GET — list all beach overrides
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data } = await supabase.from("beach_overrides").select("*").order("name");
  return NextResponse.json({ beaches: data ?? [] });
}

// POST — save/update a beach override
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const { name, photo, description } = body;
  const { error } = await supabase.from("beach_overrides").upsert(
    [{ name, photo, description, updated_at: new Date().toISOString() }],
    { onConflict: "name" }
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
