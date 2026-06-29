export interface DayForecast {
  date: string;
  weathercode: number;
  windspeed: number;
  windDirection: number;       // degrees 0-360
  windDirectionLabel: string;  // N, NE, E, SE, S, SW, W, NW
  precipitationProbability: number;
  tempMax: number;
  isRainy: boolean;
}

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=39.97&longitude=4.07" +
  "&daily=weathercode,windspeed_10m_max,winddirection_10m_dominant,precipitation_probability_max,temperature_2m_max" +
  "&timezone=Europe%2FMadrid&forecast_days=16";

function degreesToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

function isRainyCode(code: number, precipProb: number): boolean {
  // WMO codes: 61+ = rain, 71+ = snow, 80+ = showers, 95+ = thunderstorm
  // Require BOTH a significant weather code AND meaningful precip probability
  const significantCode = code >= 61;
  const significantProb = precipProb >= 40;
  return significantCode && significantProb;
}

export async function fetchForecast(): Promise<DayForecast[]> {
  const res = await fetch(OPEN_METEO_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Error fetching weather data");
  const json = await res.json();

  const daily = json.daily;
  return (daily.time as string[]).map((date: string, i: number) => {
    const wdeg: number = daily.winddirection_10m_dominant[i] ?? 0;
    const precipProb: number = daily.precipitation_probability_max[i] ?? 0;
    const code: number = daily.weathercode[i] ?? 0;
    return {
      date,
      weathercode: code,
      windspeed: Math.round(daily.windspeed_10m_max[i] ?? 0),
      windDirection: wdeg,
      windDirectionLabel: degreesToCardinal(wdeg),
      precipitationProbability: precipProb,
      tempMax: Math.round(daily.temperature_2m_max[i] ?? 0),
      isRainy: isRainyCode(code, precipProb),
    };
  });
}
