import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Bini_3668";

export async function POST(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd") ?? req.headers.get("x-admin-pwd");
  if (pwd !== ADMIN_PASSWORD) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { messageId, title, body, icon, url } = await req.json();

  // Get all active subscribers
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("active", true);

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0, message: "No hay suscriptores activos" });

  // Phase 1: log the send (real VAPID sending in phase 2)
  // For now we record the send and return success
  // In production this would use web-push library with VAPID keys
  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    try {
      // Phase 1: simulate send — in Phase 2 replace with web-push.sendNotification()
      // web-push.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
      sent++;
    } catch (e) {
      errors.push(String(e));
      // Mark subscription as inactive if endpoint is gone
      await supabase.from("push_subscriptions").update({ active: false }).eq("endpoint", sub.endpoint);
    }
  }

  // Update message as sent if messageId provided
  if (messageId) {
    await supabase.from("push_messages").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
      updated_at: new Date().toISOString(),
    }).eq("id", messageId);
  }

  // Log to push_messages if no messageId (ad-hoc send)
  if (!messageId && title) {
    await supabase.from("push_messages").insert([{
      title, body, icon: icon ?? "🌊", url: url ?? "/",
      status: "sent", sent_at: new Date().toISOString(), sent_count: sent,
      notes: "Envío manual desde admin"
    }]);
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
}
