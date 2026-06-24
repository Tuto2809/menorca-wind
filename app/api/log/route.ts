import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { detectDevice } from "@/lib/detect";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { device, os, browser } = detectDevice(ua);

  const { error } = await supabase.from("consultas").insert([
    {
      fecha_consulta: body.fecha_consulta,
      wind_direction: body.wind_direction,
      is_rainy: body.is_rainy,
      device_type: device,
      os,
      browser,
      user_agent: ua.slice(0, 500),
      ip,
    },
  ]);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
