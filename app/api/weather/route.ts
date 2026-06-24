import { NextResponse } from "next/server";
import { fetchForecast } from "@/lib/weather";

export async function GET() {
  try {
    const forecast = await fetchForecast();
    return NextResponse.json({ forecast });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
