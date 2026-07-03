import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { detectDevice } from "@/lib/detect";

// GET — health check + test insert
export async function GET(req: NextRequest) {
  const test = req.nextUrl.searchParams.get("test");

  if (test === "1") {
    // Test insert to diagnose Supabase connectivity
    const testId = `test-${Date.now()}`;
    const { error } = await supabase.from("push_subscriptions").upsert(
      [{ endpoint: testId, p256dh: "test", auth: "test", device_type: "test", os: "test", browser: "test", active: false }],
      { onConflict: "endpoint" }
    );
    if (error) return NextResponse.json({ ok: false, error: error.message, hint: error.hint });
    // Clean up test row
    await supabase.from("push_subscriptions").delete().eq("endpoint", testId);
    return NextResponse.json({ ok: true, message: "Supabase connection OK" });
  }

  // Normal health check
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  return NextResponse.json({
    ok: !error,
    activeSubscribers: count ?? 0,
    error: error?.message ?? null,
  });
}

// POST — register a new push subscription
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { endpoint, p256dh, auth } = body;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const { device, os, browser } = detectDevice(ua);

  const { error } = await supabase.from("push_subscriptions").upsert(
    [{
      endpoint,
      p256dh,
      auth,
      device_type: device,
      os,
      browser,
      active: true,
      last_seen: new Date().toISOString(),
    }],
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Push insert error:", error);
    return NextResponse.json({ ok: false, error: error.message, hint: error.hint }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — unsubscribe
export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  await supabase.from("push_subscriptions").update({ active: false }).eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
