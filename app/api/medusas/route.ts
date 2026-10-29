import { NextRequest, NextResponse } from "next/server";

const MEDUS_API = "https://medusapp.net/medusapi/medusapi.php";
const MEDUS_KEY = process.env.MEDUSAPP_API_KEY ?? "";

// Radio de búsqueda en km alrededor de las coordenadas de la playa
const RADIO_KM = 5;

// Cache simple en memoria (por proceso) — 30 minutos
const cache = new Map<string, { data: MedusaResult; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000;

interface MedusaRaw {
  indice: number;
  fecha: string;
  coordenadas: string;
  abu: number;
  esMedusa: "0" | "1";
  urti: number;
  nombre: string;
}

export interface MedusaResult {
  status: "sin_datos" | "ausencia" | "baja" | "media" | "alta" | "muy_alta" | "error";
  nivel: 0 | 1 | 2 | 3 | 4; // 0=desconocido, 1=ninguna, 2=pocas, 3=bastantes, 4=muchas
  textoES: string;
  textoEN: string;
  textoCA: string;
  textoFR: string;
  ultimaFecha: string | null;
  especie: string | null;
  urticancia: number; // 0-4
  avistamientos: number;
}

function calcNivel(avistamientos: MedusaRaw[]): MedusaResult {
  if (avistamientos.length === 0) {
    return {
      status: "sin_datos", nivel: 0,
      textoES: "Sin datos recientes", textoEN: "No recent data",
      textoCA: "Sense dades recents", textoFR: "Aucune donnée récente",
      ultimaFecha: null, especie: null, urticancia: 0, avistamientos: 0,
    };
  }

  // Separar avisos de ausencia de avistamientos reales
  const reales = avistamientos.filter(a => a.esMedusa === "1");
  const ausencias = avistamientos.filter(a => a.esMedusa === "0");

  if (reales.length === 0 && ausencias.length > 0) {
    const ultima = ausencias[ausencias.length - 1];
    return {
      status: "ausencia", nivel: 1,
      textoES: "Sin medusas confirmado", textoEN: "No jellyfish confirmed",
      textoCA: "Sense meduses confirmat", textoFR: "Absence de méduses confirmée",
      ultimaFecha: ultima.fecha, especie: null, urticancia: 0, avistamientos: 0,
    };
  }

  if (reales.length === 0) {
    return {
      status: "sin_datos", nivel: 0,
      textoES: "Sin datos recientes", textoEN: "No recent data",
      textoCA: "Sense dades recents", textoFR: "Aucune donnée récente",
      ultimaFecha: null, especie: null, urticancia: 0, avistamientos: 0,
    };
  }

  // Tomar la abundancia máxima de los avistamientos reales
  const maxAbu = Math.max(...reales.map(a => a.abu));
  const maxUrti = Math.max(...reales.map(a => a.urti));
  const ultima = reales[reales.length - 1];
  const especie = ultima.nombre || null;

  // Abundancia: 0=N/A, 1=1, 2=2-5, 3=6-10, 4=11-99, 5=100-1000, 6=>1000
  let status: MedusaResult["status"];
  let nivel: MedusaResult["nivel"];
  let textoES: string, textoEN: string, textoCA: string, textoFR: string;

  if (maxAbu === 0 || maxAbu === 1) {
    status = "baja"; nivel = 2;
    textoES = "Alguna medusa (pocos avistamientos)"; textoEN = "A few jellyfish spotted";
    textoCA = "Alguna medusa (pocs avistaments)"; textoFR = "Quelques méduses aperçues";
  } else if (maxAbu <= 3) {
    status = "media"; nivel = 3;
    textoES = "Medusas presentes"; textoEN = "Jellyfish present";
    textoCA = "Meduses presents"; textoFR = "Méduses présentes";
  } else {
    status = "alta"; nivel = 4;
    textoES = "Alta presencia de medusas"; textoEN = "High jellyfish presence";
    textoCA = "Alta presència de meduses"; textoFR = "Forte présence de méduses";
  }

  return {
    status, nivel,
    textoES, textoEN, textoCA, textoFR,
    ultimaFecha: ultima.fecha,
    especie,
    urticancia: maxUrti,
    avistamientos: reales.length,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Faltan coordenadas" }, { status: 400 });
  }

  if (!MEDUS_KEY) {
    return NextResponse.json({ error: "API key no configurada" }, { status: 503 });
  }

  const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lon).toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=1800" },
    });
  }

  // Últimas 48h (máximo que permite la API)
  const fechaIni = Math.floor((Date.now() - 48 * 3600 * 1000) / 1000);

  const url = new URL(MEDUS_API);
  url.searchParams.set("fechaIni", String(fechaIni));
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("radio", String(RADIO_KM));

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${MEDUS_KEY}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[medusas] API error:", res.status, body);
      const result: MedusaResult = {
        status: "error", nivel: 0,
        textoES: "Sin datos disponibles", textoEN: "No data available",
        textoCA: "Sense dades disponibles", textoFR: "Données non disponibles",
        ultimaFecha: null, especie: null, urticancia: 0, avistamientos: 0,
      };
      return NextResponse.json(result);
    }

    const data: MedusaRaw[] = await res.json();
    const result = calcNivel(data);

    cache.set(cacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=1800" },
    });
  } catch (err) {
    console.error("[medusas] fetch error:", err);
    const result: MedusaResult = {
      status: "error", nivel: 0,
      textoES: "Sin datos disponibles", textoEN: "No data available",
      textoCA: "Sense dades disponibles", textoFR: "Données non disponibles",
      ultimaFecha: null, especie: null, urticancia: 0, avistamientos: 0,
    };
    return NextResponse.json(result);
  }
}
