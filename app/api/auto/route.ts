import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@menorca-wind.app",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

// This route is called by Vercel Cron every morning
// Also callable manually from admin with ?pwd=...&force=1

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Bini_3668";

const OPEN_METEO =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=39.97&longitude=4.07" +
  "&daily=weathercode,windspeed_10m_max,winddirection_10m_dominant,precipitation_probability_max" +
  "&timezone=Europe%2FMadrid&forecast_days=3";

const WIND_NAMES: Record<string, string> = {
  N:"Tramuntana", NE:"Gregal", E:"Llevant", SE:"Xaloc",
  S:"Migjorn", SW:"Llebeig", W:"Ponent", NW:"Mestral",
};

function degreesToCardinal(deg: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd");
  const force = req.nextUrl.searchParams.get("force") === "1";

  // Allow cron (no pwd) or admin with pwd
  const isCron = !pwd;
  const isAdmin = pwd === ADMIN_PASSWORD;
  if (!isCron && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Load config from Supabase
  const { data: configData } = await supabase.from("push_config").select("key, value");
  const cfg = Object.fromEntries((configData ?? []).map(r => [r.key, r.value]));

  if (cfg.auto_enabled !== "true" && !force) {
    return NextResponse.json({ ok: true, message: "Auto-push desactivado" });
  }

  // Check hour (only send at configured hour unless forced)
  const now = new Date();
  const madridHour = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" })).getHours();
  const targetHour = parseInt(cfg.auto_hour ?? "7");
  if (!force && madridHour !== targetHour) {
    return NextResponse.json({ ok: true, message: `Hora actual ${madridHour}h, programado para las ${targetHour}h` });
  }

  // Fetch weather
  const weatherRes = await fetch(OPEN_METEO);
  if (!weatherRes.ok) return NextResponse.json({ error: "Weather fetch failed" }, { status: 500 });
  const weather = await weatherRes.json();

  const today = {
    windspeed: weather.daily.windspeed_10m_max[0] as number,
    winddeg: weather.daily.winddirection_10m_dominant[0] as number,
    precipProb: weather.daily.precipitation_probability_max[0] as number,
    code: weather.daily.weathercode[0] as number,
  };
  const yesterday = {
    winddeg: weather.daily.winddirection_10m_dominant[1] as number, // day[1] = tomorrow, but we use for comparison
  };

  const todayDir = degreesToCardinal(today.winddeg);
  const windName = WIND_NAMES[todayDir] ?? todayDir;

  // Evaluate conditions
  const messages: { title: string; body: string; icon: string }[] = [];

  // Condition 1: strong wind
  const windThreshold = parseInt(cfg.auto_wind_threshold ?? "30");
  if (cfg.auto_wind_strong === "true" && today.windspeed >= windThreshold) {
    const msgTemplate = cfg.auto_msg_wind_strong ?? "💨 Viento fuerte hoy en Menorca ({speed} km/h {dir}).";
    messages.push({
      title: "💨 Viento fuerte en Menorca",
      body: msgTemplate
        .replace("{speed}", Math.round(today.windspeed).toString())
        .replace("{dir}", `${windName} (${todayDir})`),
      icon: "💨",
    });
  }

  // Condition 2: wind direction change
  if (cfg.auto_wind_change === "true") {
    const prevDir = degreesToCardinal(yesterday.winddeg);
    if (prevDir !== todayDir) {
      const msgTemplate = cfg.auto_msg_wind_change ?? "🌀 El viento cambia hoy: de {prev_dir} a {new_dir}.";
      messages.push({
        title: "🌀 Cambio de viento en Menorca",
        body: msgTemplate
          .replace("{prev_dir}", WIND_NAMES[prevDir] ?? prevDir)
          .replace("{new_dir}", `${windName} (${todayDir})`),
        icon: "🌀",
      });
    }
  }

  // Condition 3: rain
  if (cfg.auto_rain === "true" && today.precipProb >= 40 && today.code >= 61) {
    const msgTemplate = cfg.auto_msg_rain ?? "🌧 Lluvia prevista en Menorca hoy. Plan B: pueblos y agenda cultural.";
    messages.push({
      title: "🌧 Lluvia en Menorca hoy",
      body: msgTemplate,
      icon: "🌧",
    });
  }

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, message: "Sin condiciones destacadas hoy", conditions: { windspeed: today.windspeed, dir: todayDir, rain: today.precipProb } });
  }

  // Get real subscribers
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("active", true)
    .neq("p256dh", "phase1")
    .neq("p256dh", "pending");

  const subCount = subs?.length ?? 0;

  // Send each message to all subscribers
  for (const msg of messages) {
    const payload = JSON.stringify({ title: msg.title, body: msg.body, icon: msg.icon, url: "/" });
    let sent = 0;
    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (e: unknown) {
        const err = e as { statusCode?: number };
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").update({ active: false }).eq("endpoint", sub.endpoint);
        }
      }
    }
    await supabase.from("push_messages").insert([{
      title: msg.title, body: msg.body, icon: msg.icon, url: "/",
      status: "sent", sent_at: new Date().toISOString(),
      sent_count: sent, notes: "Envío automático",
    }]);
  }

  return NextResponse.json({
    ok: true,
    sent: messages.length,
    subscribers: subCount,
    messages: messages.map(m => m.title),
    conditions: { windspeed: today.windspeed, dir: todayDir, rain: today.precipProb },
  });
}
