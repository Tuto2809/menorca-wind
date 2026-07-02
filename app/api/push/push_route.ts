import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { detectDevice } from "@/lib/detect";

// POST — register a new push subscription
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { endpoint, p256dh, auth } = body;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const { device, os, browser } = detectDevice(ua);

  // Upsert: if endpoint exists, update last_seen and mark active
  const { error } = await supabase.from("push_subscriptions").upsert(
    [{ endpoint, p256dh, auth, device_type: device, os, browser, active: true, last_seen: new Date().toISOString() }],
    { onConflict: "endpoint" }
  );

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — unsubscribe
export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  await supabase.from("push_subscriptions").update({ active: false }).eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
