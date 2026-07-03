import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Bini_3668";

function authCheck(req: NextRequest): boolean {
  const pwd = req.nextUrl.searchParams.get("pwd") ?? req.headers.get("x-admin-pwd");
  return pwd === ADMIN_PASSWORD;
}

// GET — list all messages
export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase
    .from("push_messages")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

// POST — create new message
export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const { title, body: msgBody, icon, url, status, notes } = body;
  const { data, error } = await supabase
    .from("push_messages")
    .insert([{ title, body: msgBody, icon: icon ?? "🌊", url: url ?? "/", status: status ?? "draft", notes }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}

// PUT — update message
export async function PUT(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const { id, title, body: msgBody, icon, url, status, notes } = body;
  const { data, error } = await supabase
    .from("push_messages")
    .update({ title, body: msgBody, icon, url, status, notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}

// DELETE — delete message
export async function DELETE(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await req.json();
  const { error } = await supabase.from("push_messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
