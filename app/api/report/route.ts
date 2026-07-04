import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface ReportPayload {
  beach_name: string;
  report_type: string; // "foto" | "info" | "ubicacion" | "otro"
  message: string;
}

export async function POST(req: NextRequest) {
  const body: ReportPayload = await req.json();
  const { beach_name, report_type, message } = body;

  if (!beach_name || !message) {
    return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });
  }

  // 1. Save to Supabase
  const { error: dbErr } = await supabase.from("beach_reports").insert([{
    beach_name,
    report_type,
    message,
    status: "pending",
    user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? "",
  }]);

  if (dbErr) return NextResponse.json({ ok: false, error: dbErr.message }, { status: 500 });

  // 2. Send email via Resend (free tier: 3000 emails/month)
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (RESEND_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Playas de Menorca <onboarding@resend.dev>",
        to: ["entuto@gmail.com"],
        subject: `⚠️ Error reportado: ${beach_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#0e9fa8">⚠️ Nuevo reporte de error</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Playa</td><td style="padding:8px">${beach_name}</td></tr>
              <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Tipo</td><td style="padding:8px">${report_type}</td></tr>
              <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Mensaje</td><td style="padding:8px">${message}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px">
              Enviado desde Playas de Menorca · menorca-wind-fha3.vercel.app
            </p>
          </div>
        `,
      }),
    }).catch(e => console.error("Email error:", e));
  }

  return NextResponse.json({ ok: true });
}

// GET — list reports (admin only)
export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd");
  if (pwd !== (process.env.ADMIN_PASSWORD ?? "280900")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("beach_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data });
}

// PATCH — mark report as resolved
export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get("pwd");
  if (pwd !== (process.env.ADMIN_PASSWORD ?? "280900")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id, status } = await req.json();
  await supabase.from("beach_reports").update({ status }).eq("id", id);
  return NextResponse.json({ ok: true });
}
