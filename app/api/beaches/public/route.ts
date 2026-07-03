import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Public endpoint — no auth needed, just reads beach overrides
export async function GET() {
  const { data } = await supabase
    .from("beach_overrides")
    .select("name, photo, description");
  return NextResponse.json({ beaches: data ?? [] });
}
