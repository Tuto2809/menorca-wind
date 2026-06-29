import { NextResponse } from "next/server";

export interface AgendaEvent {
  title: string;
  url: string;
  category: string;
  day: string;
  month: string;
  time: string;
  image: string | null;
  ticketUrl: string | null;
}

export async function GET() {
  try {
    const res = await fetch("https://apuntmenorca.com/agenda/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });
    const html = await res.text();
    const events = parseEvents(html);
    return NextResponse.json({ events: events.slice(0, 12) });
  } catch (e) {
    return NextResponse.json({ events: [], error: String(e) });
  }
}

function parseEvents(html: string): AgendaEvent[] {
  const events: AgendaEvent[] = [];
  const seen = new Set<string>();

  // Strategy: find all event URLs first (only /eventos-menorca/ paths)
  // Then for each, extract surrounding context
  const eventLinkRegex = /href="(https:\/\/apuntmenorca\.com\/eventos-menorca\/[^"]+)"/g;
  const eventUrls: string[] = [];
  let m;
  while ((m = eventLinkRegex.exec(html)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      eventUrls.push(m[1]);
    }
  }

  // For each URL, find the surrounding block in HTML
  for (const url of eventUrls) {
    // Find position of this URL in HTML
    const pos = html.indexOf(`href="${url}"`);
    if (pos === -1) continue;

    // Look back ~1500 chars for the day heading (# DD\n)
    const lookback = html.substring(Math.max(0, pos - 1500), pos);
    const dayMatch = lookback.match(/# (\d{2})\n\n(\w+) · (\d{1,2}:\d{2}) H (\w+)/);
    if (!dayMatch) continue;

    const day = dayMatch[1];
    const time = dayMatch[3];
    const month = dayMatch[4];

    // Look forward ~500 chars for title (the text inside the link)
    const lookfwd = html.substring(pos, pos + 800);

    // Title: text between >...< after the href
    const titleMatch = lookfwd.match(/>[^<\n]{10,120}</);
    if (!titleMatch) continue;
    const title = titleMatch[0].replace(/^>|<$/g, "").trim();

    // Skip navigation items
    if (["Dónde comer", "Playas y Naturaleza", "Qué hacer", "Arte y cultura", "La guía", "Agenda"].includes(title)) continue;
    if (title.length < 8) continue;

    // Image: look back for wp-content image
    const imgMatch = lookback.match(/https:\/\/apuntmenorca\.com\/wp-content\/uploads\/[^\s"')]+\.(?:jpg|jpeg|webp|png)/g);
    const image = imgMatch ? imgMatch[imgMatch.length - 1] : null;

    // Category: look back for known categories
    const catMatch = lookback.match(/\n(Música|Cine|Escena|Familiar|Arte|Cocina|Literatura|Debate|Deportes)\n/i);
    const category = catMatch ? catMatch[1] : "Agenda";

    // Ticket URL: look for a separate compra-entrada link near this event
    const ticketMatch = lookback.match(/href="(https:\/\/apuntmenorca\.com\/eventos-menorca\/[^"]+)"[^>]*>\s*\[?Compra/i);
    const ticketUrl = ticketMatch ? ticketMatch[1] : null;

    events.push({ title, url, category, day, month, time, image, ticketUrl });
  }

  return events;
}
