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
        "User-Agent": "Mozilla/5.0 (compatible; MenorcaWind/1.0)",
        Accept: "text/html",
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

const CATEGORY_ICONS: Record<string, string> = {
  "música": "🎵", "music": "🎵", "musica": "🎵",
  "cine": "🎬", "cinema": "🎬",
  "escena": "🎭", "teatro": "🎭", "teatre": "🎭", "danza": "💃", "dansa": "💃",
  "familiar": "👨‍👩‍👧", "arte": "🎨", "art": "🎨",
  "cocina": "🍽️", "cuina": "🍽️",
  "literatura": "📚", "debate": "🗣️", "deportes": "⚽",
};

function getCategoryIcon(cat: string): string {
  return CATEGORY_ICONS[cat.toLowerCase().trim()] ?? "📅";
}

function parseEvents(html: string): AgendaEvent[] {
  const events: AgendaEvent[] = [];
  const seen = new Set<string>();

  // Pattern: each event block has a day number header, then image link, then category, then title link
  // Structure: # DD\n\n...\n\n[![title](img)](url)\n\n[Compra la entrada](ticketUrl)\n\nCategory\n\n[Title](url)\n\ndescription
  
  // Split by event blocks — each starts with a day number heading
  const blocks = html.split(/(?=# \d{2}\n)/);

  for (const block of blocks) {
    // Extract day and month
    const dayMatch = block.match(/^# (\d{2})\n\n(\w+) · (\d{1,2}:\d{2}) H (\w+)/m);
    if (!dayMatch) continue;

    const day = dayMatch[1];
    const weekday = dayMatch[2];
    const time = dayMatch[3];
    const month = dayMatch[4];

    // Extract image
    const imgMatch = block.match(/!\[([^\]]*)\]\((https:\/\/apuntmenorca\.com\/wp-content\/[^)]+)\)/);
    const image = imgMatch ? imgMatch[2] : null;

    // Extract ticket URL
    const ticketMatch = block.match(/\[Compra la entrada\]\((https:\/\/apuntmenorca\.com\/eventos-menorca\/[^)]+)\)/);
    const ticketUrl = ticketMatch ? ticketMatch[1] : null;

    // Extract category (line after ticket or after image block)
    const catMatch = block.match(/\n\n(Música|Cine|Escena|Familiar|Arte|Cocina|Literatura|Debate|Deportes|Más)\n\n/i);
    const category = catMatch ? catMatch[1] : "Agenda";

    // Extract title and URL — the main event link
    const titleMatch = block.match(/\n\[([^\]]{10,})\]\((https:\/\/apuntmenorca\.com\/eventos-menorca\/[^)]+)\)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const url = titleMatch[2];

    if (seen.has(url)) continue;
    seen.add(url);

    events.push({ title, url, category, day, month, time, image, ticketUrl });
  }

  return events;
}
