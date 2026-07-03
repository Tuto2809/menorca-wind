import { NextResponse } from "next/server";
import { fetchForecast } from "@/lib/weather";

// Fallback forecast when Open-Meteo is unreachable
function fallbackForecast() {
  const today = new Date();
  return Array.from({ length: 16 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      windspeed: 15,
      windDirectionLabel: "N",
      tempMax: 28,
      precipitationProbability: 0,
      isRainy: false,
      weatherCode: 1,
    };
  });
}

export async function GET() {
  try {
    const forecast = await fetchForecast();
    return NextResponse.json({ forecast });
  } catch (e) {
    console.error("Weather fetch failed:", String(e));
    // Return fallback so the app still works
    return NextResponse.json({ forecast: fallbackForecast(), fallback: true });
  }
}
