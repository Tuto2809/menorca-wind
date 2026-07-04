import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ConsultaRecord {
  id?: number;
  created_at?: string;
  fecha_consulta: string; // date queried (e.g. 2026-06-24)
  wind_direction: string;
  is_rainy: boolean;
  device_type: string; // mobile | tablet | desktop
  os: string;
  browser: string;
  user_agent: string;
  ip?: string;
}

export async function registrarConsulta(data: Omit<ConsultaRecord, "id" | "created_at">) {
  const { error } = await supabase.from("consultas").insert([data]);
  if (error) console.error("Error registrando consulta:", error.message);
}

export async function getStats() {
  // Use Madrid timezone for day boundaries
  const now = new Date();
  const madridNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const todayStr = madridNow.toISOString().slice(0, 10);
  const weekAgo = new Date(madridNow);
  weekAgo.setDate(now.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);

  const [total, today, week, byDevice, byOS, byDay, pushTotal, pushActive] = await Promise.all([
    supabase.from("consultas").select("id", { count: "exact", head: true }),
    supabase.from("consultas").select("id", { count: "exact", head: true }).gte("created_at", todayStr),
    supabase.from("consultas").select("id", { count: "exact", head: true }).gte("created_at", weekStr),
    supabase.from("consultas").select("device_type"),
    supabase.from("consultas").select("os"),
    supabase.from("consultas").select("created_at").gte("created_at", weekStr).order("created_at"),
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  return {
    total: total.count ?? 0,
    today: today.count ?? 0,
    week: week.count ?? 0,
    byDevice: countBy(byDevice.data ?? [], "device_type"),
    byOS: countBy(byOS.data ?? [], "os"),
    byDay: byDay.data ?? [],
    pushTotal: pushTotal.count ?? 0,
    pushActive: pushActive.count ?? 0,
  };
}

function countBy<T extends Record<string, unknown>>(arr: T[], key: string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const val = String(item[key] ?? "unknown");
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
