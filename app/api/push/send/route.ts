import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import webpush from "web-push";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "280900";

webpush.setVapidDetails(
  "mailto:admin@menorca-wind.app",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

export async function POST(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd") ?? req.headers.get("x-admin-pwd");
  if (pwd !== ADMIN_PASSWORD) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { messageId, title, body, icon, url } = await req.json();

  // Get all active subscribers with real VAPID keys
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("active", true)
    .neq("p256dh", "phase1")  // only real subscriptions
    .neq("p256dh", "pending");

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No hay suscriptores con notificaciones reales activadas" });
  }

  const payload = JSON.stringify({ title, body, icon: icon ?? "🌊", url: url ?? "/" });
  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string };
      console.error("Push send error:", err);
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired — mark inactive
        await supabase.from("push_subscriptions").update({ active: false }).eq("endpoint", sub.endpoint);
      }
      errors.push(err.message ?? String(e));
    }
  }

  // Update message record
  if (messageId) {
    await supabase.from("push_messages").update({
      status: "sent", sent_at: new Date().toISOString(),
      sent_count: sent, updated_at: new Date().toISOString(),
    }).eq("id", messageId);
  } else if (title) {
    await supabase.from("push_messages").insert([{
      title, body, icon: icon ?? "🌊", url: url ?? "/",
      status: "sent", sent_at: new Date().toISOString(),
      sent_count: sent, notes: "Envío manual desde admin",
    }]);
  }

  return NextResponse.json({ ok: true, sent, total: subs.length, errors: errors.length > 0 ? errors : undefined });
}
