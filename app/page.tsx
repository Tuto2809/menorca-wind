"use client";

import { useEffect, useState, useCallback } from "react";
import { BEACHES, OPPOSITE_ORIENTATIONS, WIND_NAMES, distanceKm, type Orientation } from "@/lib/beaches";
import type { DayForecast } from "@/lib/weather";
import BeachFilters, { type FilterState } from "@/components/BeachFilters";

const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const COMPASS   = { N:"↓", NE:"↙", E:"←", SE:"↖", S:"↑", SW:"↗", W:"→", NW:"↘" } as Record<string,string>;

const DEFAULT_FILTERS: FilterState = { municipality: null, type: null, services: [], sortBy: "recommended" };

interface AgendaEvent { title: string; url: string; date: string; place: string; }

export default function Home() {
  const [forecast, setForecast]       = useState<DayForecast[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [filters, setFilters]         = useState<FilterState>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => { setForecast(d.forecast ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
        .then((r) => r.json())
        .then((d) => { setAgendaEvents(d.events ?? []); setAgendaLoading(false); })
        .catch(() => setAgendaLoading(false));
    } else {
      setAgendaEvents([]);
    }
  }, [day?.date]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError("Tu navegador no soporta geolocalización"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationError("");
        setFilters((f) => ({ ...f, sortBy: "distance" }));
      },
      () => setLocationError("No se pudo obtener tu ubicación")
    );
  }, []);

  // Build beach list: filter + sort
  const beachList = (() => {
    if (!day) return [];
    const opposites = OPPOSITE_ORIENTATIONS[day.windDirectionLabel as Orientation] ?? [];

    let list = BEACHES
      .filter((b) => opposites.includes(b.orientation as Orientation))
      .filter((b) => !filters.municipality || b.municipality === filters.municipality)
      .filter((b) => !filters.type || b.type === filters.type)
      .filter((b) => filters.services.every((s) => b.services.includes(s)));

    if (filters.sortBy === "distance" && userLocation) {
      list = [...list].sort((a, b) =>
        distanceKm(userLocation.lat, userLocation.lon, a.lat, a.lon) -
        distanceKm(userLocation.lat, userLocation.lon, b.lat, b.lon)
      );
    } else if (filters.sortBy === "length") {
      list = [...list].sort((a, b) => b.lengthM - a.lengthM);
    }

    return filters.sortBy === "recommended" ? list.slice(0, 5) : list;
  })();

  const windName = day ? WIND_NAMES[day.windDirectionLabel as Orientation] ?? day.windDirectionLabel : "";
  const activeFilterCount =
    (filters.municipality ? 1 : 0) + (filters.type ? 1 : 0) + filters.services.length +
    (filters.sortBy !== "recommended" ? 1 : 0);

  return (
    <main style={{ minHeight: "100vh", background: "#f8faf9", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e8e8e8", padding: "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌊</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Menorca Wind</div>
              <div style={{ fontSize: 12, color: "#888" }}>Playas según el viento</div>
            </div>
          </div>
          <a href="/admin" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>Admin →</a>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* Date selector */}
        <p className="section-label">Elige un día</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#888", fontSize: 14 }}>Cargando previsión...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginBottom: 24 }}>
            {forecast.map((d, i) => {
              const date = new Date(d.date + "T12:00:00");
              const isActive = i === selectedIdx;
              return (
                <button key={d.date} onClick={() => setSelectedIdx(i)} style={{
                  border: isActive ? "2px solid #1D9E75" : "1px solid #e8e8e8",
                  borderRadius: 10, padding: "8px 4px", textAlign: "center", cursor: "pointer",
                  background: isActive ? "#1D9E75" : "white", transition: "all 0.12s",
                }}>
                  <span style={{ display: "block", fontSize: 10, color: isActive ? "rgba(255,255,255,0.8)" : "#888" }}>
                    {i === 0 ? "Hoy" : DAYS_ES[date.getDay()]}
                  </span>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: isActive ? "white" : "#1a1a1a", marginTop: 2 }}>
                    {date.getDate()}
                  </span>
                  <span style={{ display: "block", fontSize: 10, color: isActive ? "rgba(255,255,255,0.7)" : "#aaa" }}>
                    {MONTHS_ES[date.getMonth()]}
                  </span>
                  <span style={{ display: "block", fontSize: 14, marginTop: 2 }}>
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
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p className="section-label" style={{ margin: 0 }}>Previsión del tiempo</p>
                <span style={{ fontSize: 13, color: "#888" }}>
                  {(() => { const d = new Date(day.date + "T12:00:00"); return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`; })()}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1.5px solid #e8e8e8", background: "#f8faf9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                  {COMPASS[day.windDirectionLabel] ?? "↑"}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{windName} ({day.windDirectionLabel}) · {day.windspeed} km/h</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Temperatura máx. {day.tempMax}°C · Lluvia {day.precipitationProbability}%</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {day.isRainy && <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: "#E6F1FB", color: "#0C447C", fontWeight: 500 }}>🌧 Lluvia probable</span>}
                {!day.isRainy && <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: "#FAEEDA", color: "#633806", fontWeight: 500 }}>☀️ Buen tiempo</span>}
                {day.windspeed > 25 && <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: "#EAF3DE", color: "#27500A", fontWeight: 500 }}>💨 Viento fuerte</span>}
              </div>
            </div>

            {/* Rain plan */}
            {day.isRainy && (
              <div style={{ border: "1px solid #85B7EB", borderRadius: 14, padding: "1rem 1.25rem", background: "#E6F1FB", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0C447C", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  🌧 Día de lluvia — plan B: pueblos y agenda cultural
                </div>
                {agendaLoading ? (
                  <div style={{ fontSize: 13, color: "#185FA5" }}>Cargando agenda de Menorca...</div>
                ) : agendaEvents.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {agendaEvents.map((ev, i) => (
                      <li key={i} style={{ fontSize: 13, color: "#185FA5", padding: "6px 0", borderBottom: i < agendaEvents.length - 1 ? "1px solid #B5D4F4" : "none" }}>
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none", fontWeight: 500 }}>
                          📍 {ev.title}
                        </a>
                        {ev.place && <span style={{ color: "#378ADD", marginLeft: 6 }}>— {ev.place}</span>}
                      </li>
                    ))}
                    <li style={{ fontSize: 12, padding: "8px 0 0" }}>
                      <a href="https://apuntmenorca.com/agenda/" target="_blank" rel="noopener noreferrer" style={{ color: "#378ADD" }}>Ver agenda completa →</a>
                    </li>
                  </ul>
                ) : (
                  <div>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {["Visita al casco histórico de Ciutadella — calles empedradas y palacetes",
                        "Museo de Menorca (Maó) — historia y arqueología de la isla",
                        "Naveta des Tudons — megalito más famoso de Menorca",
                        "Mercado municipal de Maó — tapas y productos locales",
                        "Caleta de Binibèquer — pueblo de pescadores, arquitectura única",
                        "Fortaleza de La Mola (Maó) — visita guiada al fuerte",
                      ].map((a, i) => (
                        <li key={i} style={{ fontSize: 13, color: "#185FA5", padding: "5px 0", borderBottom: i < 5 ? "1px solid #B5D4F4" : "none" }}>📍 {a}</li>
                      ))}
                    </ul>
                    <a href="https://apuntmenorca.com/agenda/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#378ADD", display: "block", marginTop: 8 }}>Ver agenda completa →</a>
                  </div>
                )}
              </div>
            )}

            {/* Beach section header with filter toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                🏖️ {day.isRainy ? "Playas (consultar antes)" : "Playas recomendadas"}
                <span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}>
                  · {beachList.length} resultado{beachList.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 13, padding: "6px 12px", borderRadius: 999,
                  border: activeFilterCount > 0 ? "1.5px solid #1D9E75" : "1px solid #e0e0e0",
                  background: activeFilterCount > 0 ? "#E1F5EE" : "white",
                  color: activeFilterCount > 0 ? "#0F6E56" : "#444",
                  cursor: "pointer", fontWeight: 500,
                }}
              >
                🎛 Filtros{activeFilterCount > 0 && <span style={{ background: "#1D9E75", color: "white", borderRadius: 999, fontSize: 11, padding: "1px 6px", marginLeft: 2 }}>{activeFilterCount}</span>}
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="card" style={{ marginBottom: 16 }}>
                {locationError && <div style={{ fontSize: 12, color: "#c0392b", marginBottom: 8 }}>{locationError}</div>}
                <BeachFilters
                  filters={filters}
                  onChange={setFilters}
                  hasLocation={!!userLocation}
                  onRequestLocation={requestLocation}
                />
              </div>
            )}

            {/* Beach list */}
            {beachList.length === 0 ? (
              <div className="card" style={{ color: "#888", fontSize: 14, textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                No hay playas con esos filtros para hoy.
                <br />
                <button onClick={() => setFilters(DEFAULT_FILTERS)} style={{ marginTop: 10, fontSize: 13, color: "#1D9E75", background: "none", border: "none", cursor: "pointer" }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {beachList.map((b, rank) => {
                  const distKm = userLocation
                    ? distanceKm(userLocation.lat, userLocation.lon, b.lat, b.lon)
                    : null;
                  return (
                    <div key={b.name} className="card" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      {filters.sortBy === "recommended" && (
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: rank === 0 ? "#1D9E75" : "#f0f0f0", color: rank === 0 ? "white" : "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                          {rank + 1}
                        </div>
                      )}
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        🏝️
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</div>
                          {distKm !== null && (
                            <div style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600, flexShrink: 0 }}>
                              {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{b.municipality} · {b.length}</div>
                        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{b.description}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#EAF3DE", color: "#27500A", fontWeight: 500 }}>🧭 Cara {b.orientation}</span>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#E6F1FB", color: "#185FA5", fontWeight: 500 }}>{b.type}</span>
                          {b.parking && <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#f0f0f0", color: "#555" }}>🅿️ Parking</span>}
                        </div>
                        {b.services.filter(s => s !== "Parking").length > 0 && (
                          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                            {b.services.filter(s => s !== "Parking").join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Jellyfish */}
            <div className="card" style={{ background: "#FFF8E6", border: "1px solid #FAC775", marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#633806", marginBottom: 6 }}>🪼 Aviso de medusas</div>
              <div style={{ fontSize: 13, color: "#633806" }}>Próximamente: estado de medusas en tiempo real para las playas recomendadas.</div>
            </div>

            {/* Logic explanation */}
            <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 4 }}>
              Viento {windName} ({day.windDirectionLabel}) → playas protegidas orientadas al {(OPPOSITE_ORIENTATIONS[day.windDirectionLabel as Orientation] ?? []).join(", ")}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
