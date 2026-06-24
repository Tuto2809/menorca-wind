import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Bini_3668";

export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd");
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("consultas")
    .select("fecha_consulta, wind_direction, is_rainy, device_type, os, browser, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
