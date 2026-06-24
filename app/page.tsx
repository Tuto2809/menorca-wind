"use client";

import { useEffect, useState, useCallback } from "react";
import { BEACHES, OPPOSITE_ORIENTATIONS, distanceKm, type Orientation } from "@/lib/beaches";
import type { DayForecast } from "@/lib/weather";
import BeachFilters, { type FilterState } from "@/components/BeachFilters";
import { TRANSLATIONS, LANG_FLAGS, LANG_LABELS, detectLang, type Lang } from "@/lib/i18n";

const DEFAULT_FILTERS: FilterState = { municipality: null, type: null, services: [], sortBy: "recommended" };
const COMPASS: Record<string, string> = { N:"↓", NE:"↙", E:"←", SE:"↖", S:"↑", SW:"↗", W:"→", NW:"↘" };

interface AgendaEvent { title: string; url: string; date: string; place: string; }

function openMaps(lat: number, lon: number, name: string) {
  // This format works on both mobile (opens app) and desktop
  const url = `https://www.google.com/maps?q=${lat},${lon}&z=16&label=${encodeURIComponent(name)}`;
  window.open(url, "_blank");
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ca");
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLang(detectLang());
    fetch("/api/weather")
      .then(r => r.json())
      .then(d => { setForecast(d.forecast ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const t = TRANSLATIONS[lang];
  const day = forecast[selectedIdx];

  useEffect(() => {
    if (!day) return;
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha_consulta: day.date, wind_direction: day.windDirectionLabel, is_rainy: day.isRainy }),
    }).catch(() => {});
    if (day.isRainy) {
      setAgendaLoading(true);
      fetch("/api/agenda")
        .then(r => r.json())
        .then(d => { setAgendaEvents(d.events ?? []); setAgendaLoading(false); })
        .catch(() => setAgendaLoading(false));
    } else {
      setAgendaEvents([]);
    }
  }, [day?.date]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError("GPS no disponible"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocationError(""); setFilters(f => ({ ...f, sortBy: "distance" })); },
      () => setLocationError("No se pudo obtener la ubicación")
    );
  }, []);

  const beachList = (() => {
    if (!day) return [];
    const opposites = OPPOSITE_ORIENTATIONS[day.windDirectionLabel as Orientation] ?? [];
    let list = BEACHES
      .filter(b => opposites.includes(b.orientation as Orientation))
      .filter(b => !filters.municipality || b.municipality === filters.municipality)
      .filter(b => !filters.type || b.type === filters.type)
      .filter(b => filters.services.every(s => b.services.includes(s)));
    if (filters.sortBy === "distance" && userLocation)
      list = [...list].sort((a, b) => distanceKm(userLocation.lat, userLocation.lon, a.lat, a.lon) - distanceKm(userLocation.lat, userLocation.lon, b.lat, b.lon));
    else if (filters.sortBy === "length")
      list = [...list].sort((a, b) => b.lengthM - a.lengthM);
    return filters.sortBy === "recommended" ? list.slice(0, 5) : list;
  })();

  const windName = day ? (t.windNames[day.windDirectionLabel as keyof typeof t.windNames] ?? day.windDirectionLabel) : "";
  const activeFilterCount = (filters.municipality ? 1 : 0) + (filters.type ? 1 : 0) + filters.services.length + (filters.sortBy !== "recommended" ? 1 : 0);

  const S = {
    topbar: { background: "var(--bg-topbar)", borderBottom: "1px solid #2a2a2a", padding: "14px 16px", position: "sticky" as const, top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" },
    logoIcon: { width: 34, height: 34, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
    flagBtn: (active: boolean): React.CSSProperties => ({ fontSize: 17, opacity: active ? 1 : 0.3, cursor: "pointer", padding: "3px 5px", borderRadius: 6, border: active ? "1.5px solid #2a2a2a" : "1.5px solid transparent", background: active ? "#1a1a1a" : "transparent", transition: "all .12s" }),
    dateBtn: (active: boolean): React.CSSProperties => ({ borderRadius: 10, padding: "7px 3px", textAlign: "center", border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", background: active ? "var(--accent)" : "var(--bg-elevated)", cursor: "pointer", transition: "all .12s" }),
    compass: { width: 54, height: 54, borderRadius: "50%", border: "1.5px solid #2a2a2a", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 as const },
    beachCard: { background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "11px 12px", marginBottom: 8, display: "flex", gap: 9, alignItems: "center" },
    beachIcon: { width: 36, height: 36, borderRadius: 9, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 as const },
    mapsBtn: { flexShrink: 0 as const, width: 34, height: 34, borderRadius: 9, border: "1.5px solid var(--border)", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, cursor: "pointer", transition: "all .12s" },
    filterBtn: (active: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 12px", borderRadius: 999, border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", background: active ? "var(--accent-dim)" : "var(--bg-elevated)", color: active ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", fontWeight: 500 }),
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 60 }}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.logoIcon}>🌊</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>Menorca Wind</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{t.appSub}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {(["ca","es","en","fr"] as Lang[]).map(l => (
            <button key={l} title={LANG_LABELS[l]} onClick={() => setLang(l)} style={S.flagBtn(lang === l)}>
              {LANG_FLAGS[l]}
            </button>
          ))}
          <a href="/admin" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none", marginLeft: 8 }}>{t.admin}</a>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "18px 14px" }}>

        {/* Date selector */}
        <p className="section-label">{t.chooseDay}</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: 14 }}>{t.loading}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 5, marginBottom: 18 }}>
            {forecast.map((d, i) => {
              const date = new Date(d.date + "T12:00:00");
              const active = i === selectedIdx;
              return (
                <button key={d.date} onClick={() => setSelectedIdx(i)} style={S.dateBtn(active)}>
                  <span style={{ display: "block", fontSize: 9, color: active ? "rgba(0,0,0,.6)" : "var(--text-muted)" }}>
                    {i === 0 ? t.today : t.days[date.getDay()]}
                  </span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? "#0a0a0a" : "#ccc", marginTop: 1 }}>
                    {date.getDate()}
                  </span>
                  <span style={{ display: "block", fontSize: 10, color: active ? "rgba(0,0,0,.5)" : "var(--text-muted)" }}>
                    {t.months[date.getMonth()]}
                  </span>
                  <span style={{ display: "block", fontSize: 11, marginTop: 2 }}>
                    {d.isRainy ? "🌧" : d.windspeed > 25 ? "💨" : "☀️"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {day && (
          <>
            {/* Weather card */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p className="section-label" style={{ margin: 0 }}>{t.forecast}</p>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {(() => { const d = new Date(day.date + "T12:00:00"); return `${t.days[d.getDay()]} ${d.getDate()} ${t.months[d.getMonth()]}`; })()}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={S.compass}>{COMPASS[day.windDirectionLabel] ?? "↑"}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                    {windName} ({day.windDirectionLabel}) · {day.windspeed} km/h
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                    {t.forecast.includes("Prev") ? "Temp. màx." : "Temp. max."} {day.tempMax}°C · {day.precipitationProbability}%
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {day.isRainy && <span className="pill pill-rain">🌧 {t.rainLikely}</span>}
                {!day.isRainy && <span className="pill pill-sun">☀️ {t.goodWeather}</span>}
                {day.windspeed > 25 && <span className="pill pill-wind">💨 {t.strongWind}</span>}
              </div>
            </div>

            {/* Rain plan */}
            {day.isRainy && (
              <div style={{ border: "1.5px solid #152040", borderRadius: 14, padding: "1rem 1.1rem", background: "#0a1525", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa", marginBottom: 10 }}>
                  🌧 {t.rainPlanTitle}
                </div>
                {agendaLoading ? (
                  <div style={{ fontSize: 13, color: "#4a7ab5" }}>{t.loadingAgenda}</div>
                ) : agendaEvents.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {agendaEvents.map((ev, i) => (
                      <li key={i} style={{ fontSize: 13, color: "#60a5fa", padding: "6px 0", borderBottom: i < agendaEvents.length - 1 ? "1px solid #152040" : "none" }}>
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>
                          📍 {ev.title}
                        </a>
                        {ev.place && <span style={{ color: "#4a7ab5", marginLeft: 6 }}>— {ev.place}</span>}
                      </li>
                    ))}
                    <li style={{ fontSize: 12, padding: "8px 0 0" }}>
                      <a href="https://apuntmenorca.com/agenda/" target="_blank" rel="noopener noreferrer" style={{ color: "#4a7ab5" }}>{t.fullAgenda}</a>
                    </li>
                  </ul>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {["Visita al casco histórico de Ciutadella", "Museo de Menorca (Maó)", "Naveta des Tudons", "Mercado municipal de Maó", "Binibèquer Vell", "Fortaleza de La Mola"].map((a, i) => (
                      <li key={i} style={{ fontSize: 13, color: "#60a5fa", padding: "5px 0", borderBottom: i < 5 ? "1px solid #152040" : "none" }}>📍 {a}</li>
                    ))}
                    <a href="https://apuntmenorca.com/agenda/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4a7ab5", display: "block", marginTop: 8 }}>{t.fullAgenda}</a>
                  </ul>
                )}
              </div>
            )}

            {/* Beach header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                🏖️ {day.isRainy ? t.beachesRainy : t.beachesTitle}
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>
                  · {beachList.length} {beachList.length === 1 ? t.results : t.resultsPlural}
                </span>
              </div>
              <button onClick={() => setShowFilters(v => !v)} style={S.filterBtn(activeFilterCount > 0)}>
                🎛 {t.filters}
                {activeFilterCount > 0 && (
                  <span style={{ background: "var(--accent)", color: "#0a0a0a", borderRadius: 999, fontSize: 10, padding: "1px 5px", fontWeight: 700 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="card" style={{ marginBottom: 14 }}>
                {locationError && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{locationError}</div>}
                <BeachFilters filters={filters} onChange={setFilters} hasLocation={!!userLocation} onRequestLocation={requestLocation} t={t} />
              </div>
            )}

            {/* Beach list */}
            {beachList.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14 }}>{t.noResults}</div>
                <button onClick={() => setFilters(DEFAULT_FILTERS)} style={{ marginTop: 10, fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                  {t.clearFiltersBtn}
                </button>
              </div>
            ) : (
              beachList.map((b, rank) => {
                const distKm = userLocation ? distanceKm(userLocation.lat, userLocation.lon, b.lat, b.lon) : null;
                const beachTypeTr = t.beachTypes[b.type as keyof typeof t.beachTypes] ?? b.type;
                return (
                  <div key={b.name} style={S.beachCard}>
                    {/* Rank */}
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: rank === 0 ? "var(--accent)" : "#222", color: rank === 0 ? "#0a0a0a" : "#666", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {rank + 1}
                    </div>
                    {/* Icon */}
                    <div style={S.beachIcon}>🏝️</div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                        {distKm !== null && (
                          <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, flexShrink: 0 }}>
                            {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{b.municipality} · {b.length}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                        <span className="tag tag-teal">🧭 {t.orientation} {b.orientation}</span>
                        <span className="tag tag-blue">{beachTypeTr}</span>
                        {b.parking && <span className="tag tag-gray">🅿️</span>}
                      </div>
                    </div>
                    {/* Maps button */}
                    <button
                      onClick={() => openMaps(b.lat, b.lon, b.name)}
                      style={S.mapsBtn}
                      title={t.openMaps}
                      aria-label={t.openMaps}
                    >
                      📍
                    </button>
                  </div>
                );
              })
            )}

            {/* Jellyfish */}
            <div style={{ background: "#141200", border: "1.5px solid #2a2400", borderRadius: 14, padding: "11px 12px", marginTop: 4, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22 }}>🪼</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>{t.jellyTitle}</div>
                <div style={{ fontSize: 11, color: "#5a4a10", marginTop: 2 }}>{t.jellySub}</div>
              </div>
            </div>

            {/* Wind logic explanation */}
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 12 }}>
              {t.windExplain.replace("{name}", windName).replace("{dir}", day.windDirectionLabel).replace("{opp}", (OPPOSITE_ORIENTATIONS[day.windDirectionLabel as Orientation] ?? []).join(", "))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
