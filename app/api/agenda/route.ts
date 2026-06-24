import { NextResponse } from "next/server";

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

    // Extract event entries from the agenda page
    // apuntmenorca.com uses standard WordPress/plugin event markup
    const events: { title: string; date: string; place: string; url: string }[] = [];

    // Match event cards — adapt selectors if the site changes
    const articleRegex = /<article[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let match;
    while ((match = articleRegex.exec(html)) !== null) {
      const block = match[1];
      const titleMatch = block.match(/<h[23][^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i);
      const dateMatch = block.match(/datetime="([^"T]+)/i) ?? block.match(/(\d{4}-\d{2}-\d{2})/);
      const placeMatch = block.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)</i);

      if (titleMatch) {
        events.push({
          title: titleMatch[2].trim(),
          url: titleMatch[1],
          date: dateMatch ? dateMatch[1] : "",
          place: placeMatch ? placeMatch[1].trim() : "Menorca",
        });
      }
    }

    // Fallback: try extracting from list items / links with event-like context
    if (events.length === 0) {
      const linkRegex = /<a[^>]*href="(https:\/\/apuntmenorca\.com\/[^"]*)"[^>]*>([^<]{10,80})<\/a>/gi;
      const seen = new Set<string>();
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1];
        const title = match[2].trim();
        if (!seen.has(url) && !url.includes("/categoria/") && !url.includes("/tag/")) {
          seen.add(url);
          events.push({ title, url, date: "", place: "Menorca" });
          if (events.length >= 10) break;
        }
      }
    }

    return NextResponse.json({ events: events.slice(0, 10) });
  } catch (e) {
    return NextResponse.json({ events: [], error: String(e) });
  }
}
