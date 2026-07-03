"use client";

import { useEffect, useState, useCallback } from "react";
import { BEACHES, OPPOSITE_ORIENTATIONS, WIND_NAMES, distanceKm, type Orientation } from "@/lib/beaches";
import type { DayForecast } from "@/lib/weather";
import BeachFilters, { type FilterState } from "@/components/BeachFilters";
import { TRANSLATIONS, LANG_FLAGS, LANG_LABELS, detectLang, type Lang } from "@/lib/i18n";


const DEFAULT_FILTERS: FilterState = { municipality: null, type: null, services: [], sortBy: "recommended" };
const COMPASS: Record<string, string> = { N:"↓", NE:"↙", E:"←", SE:"↖", S:"↑", SW:"↗", W:"→", NW:"↘" };

// Occupancy estimation: 0-3 (tranquila / moderada / concurrida / llena)
function getOccupancy(dateStr: string): { level: 0|1|2|3; label: string; labelCa: string; labelEn: string; labelFr: string; color: string } {
  const d = new Date(dateStr + "T12:00:00");
  const month = d.getMonth() + 1;   // 1-12
  const dow   = d.getDay();         // 0=Sun 6=Sat
  const isWeekend = dow === 0 || dow === 6;
  const isPeakMonth = month >= 7 && month <= 8;
  const isShoulderMonth = month === 6 || month === 9;

  let score = 0;
  if (isPeakMonth)     score += 2;
  else if (isShoulderMonth) score += 1;
  if (isWeekend)       score += 1;

  const level = Math.min(score, 3) as 0|1|2|3;
  const labels = [
    { label:"Tranquila",  labelCa:"Tranquil·la", labelEn:"Quiet",     labelFr:"Tranquille",  color:"#34d399" },
    { label:"Moderada",   labelCa:"Moderada",    labelEn:"Moderate",  labelFr:"Modérée",     color:"#fbbf24" },
    { label:"Concurrida", labelCa:"Concorreguda",labelEn:"Busy",      labelFr:"Animée",      color:"#fb923c" },
    { label:"Llena",      labelCa:"Plena",       labelEn:"Very busy", labelFr:"Très animée", color:"#f87171" },
  ];
  return { level, ...labels[level] };
}

// Share text generator
function buildShareText(beachName: string, windName: string, windDir: string, dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const days: Record<string, string[]> = {
    es: ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],
    ca: ["diumenge","dilluns","dimarts","dimecres","dijous","divendres","dissabte"],
    en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    fr: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
  };
  const dayName = (days[lang] ?? days.es)[d.getDay()];
  const texts: Record<string, string> = {
    es: `🌊 Este ${dayName} voy a ${beachName} (Menorca)\n💨 Viento ${windName} (${windDir}) → playa protegida del viento\n\n¿Nos vemos allí? 🏝️\n\nRecomendado por Playas de Menorca 👉 https://menorca-wind-fha3.vercel.app`,
    ca: `🌊 Aquest ${dayName} vaig a ${beachName} (Menorca)\n💨 Vent ${windName} (${windDir}) → platja protegida del vent\n\nEns veiem allà? 🏝️\n\nRecomanat per Platges de Menorca 👉 https://menorca-wind-fha3.vercel.app`,
    en: `🌊 This ${dayName} I'm going to ${beachName} (Menorca)\n💨 ${windName} wind (${windDir}) → sheltered beach\n\nSee you there? 🏝️\n\nRecommended by Playas de Menorca 👉 https://menorca-wind-fha3.vercel.app`,
    fr: `🌊 Ce ${dayName} je vais à ${beachName} (Menorca)\n💨 Vent ${windName} (${windDir}) → plage protégée\n\nOn se retrouve là-bas? 🏝️\n\nRecommandé par Playas de Menorca 👉 https://menorca-wind-fha3.vercel.app`,
  };
  return texts[lang] ?? texts.es;
}

interface AgendaEvent { title: string; url: string; category: string; day: string; month: string; time: string; image: string | null; ticketUrl: string | null; }

function openMaps(lat: number, lon: number) {
  window.open(`https://maps.google.com/?q=${lat},${lon}`, "_blank");
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
  const [shareBeach, setShareBeach] = useState<string | null>(null);
  const [selectedBeach, setSelectedBeach] = useState<typeof BEACHES[0] | null>(null);
  const [reportBeach, setReportBeach] = useState<string | null>(null);
  const [beachOverrides, setBeachOverrides] = useState<Record<string,{photo?:string;description?:string}>>({});
  const [reportType, setReportType] = useState("foto");
  const [reportMsg, setReportMsg] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);


  useEffect(() => {
    setLang(detectLang());
    fetch("/api/weather")
      .then(r => r.json())
      .then(d => { setForecast(d.forecast ?? []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/beaches/public")
      .then(r => r.json())
      .then(d => {
        const map: Record<string,{photo?:string;description?:string}> = {};
        (d.beaches ?? []).forEach((b: {name:string;photo?:string;description?:string}) => { map[b.name] = b; });
        setBeachOverrides(map);
      }).catch(() => {});

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

  const subscribePush = async () => {
    if (!("Notification" in window)) {
      alert("Notificaciones no disponibles. Asegúrate de tener la app instalada desde Safari → Añadir a pantalla de inicio.");
      return;
    }
    setPushLoading(true);
    try {
      // Step 1: permission (must be direct from user gesture on iOS)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") alert("Notificaciones bloqueadas. Ve a Ajustes → Playas de Menorca → Notificaciones.");
        setPushLoading(false);
        return;
      }

      // Step 2: register service worker
      if (!("serviceWorker" in navigator)) {
        alert("Tu navegador no soporta notificaciones push.");
        setPushLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // Step 3: VAPID subscription
      const VAPID_PUBLIC = "BF3Y-Pa2F_aE0MoD0G2oRt4wztdYMT4JmwMDs4ukLE9J_IRiuXwcFxwMmd14K6bKIq4ERAbTOjMCx9Ihs1BIii0";
      const urlBase64ToUint8 = (base64: string) => {
        const padding = "=".repeat((4 - base64.length % 4) % 4);
        const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
        const raw = window.atob(b64);
        return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
      };

      let sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe(); // force fresh subscription
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8(VAPID_PUBLIC),
      });

      // Step 4: save to server
      const subJson = sub.toJSON();
      const pushRes = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh ?? "",
          auth: subJson.keys?.auth ?? "",
        }),
      });
      const pushData = await pushRes.json();
      if (pushData.ok) {
        setPushEnabled(true);
      } else {
        alert("Error guardando suscripción: " + JSON.stringify(pushData));
      }
    } catch (e) {
      console.error("Push error:", e);
      alert("Error: " + String(e));
    }
    setPushLoading(false);
  };

  // Check if already subscribed on mount
  useEffect(() => {
    if ("serviceWorker" in navigator && "Notification" in window) {
      if (Notification.permission === "granted") setPushEnabled(true);
    }
  }, []);

  const sendReport = async () => {
    if (!reportBeach || !reportMsg.trim()) return;
    setReportSending(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beach_name: reportBeach, report_type: reportType, message: reportMsg }),
      });
      if ((await res.json()).ok) {
        setReportSent(true);
        setTimeout(() => { setReportBeach(null); setReportSent(false); setReportMsg(""); }, 2000);
      }
    } catch (e) { console.error(e); }
    setReportSending(false);
  };

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
    return list;
  })();

  const windName = day ? (t.windNames[day.windDirectionLabel as keyof typeof t.windNames] ?? day.windDirectionLabel) : "";

  // Check if zero results are due to wind direction vs municipality mismatch
  const emptyReason = (() => {
    if (!day || beachList.length > 0) return null;
    const opposites = OPPOSITE_ORIENTATIONS[day.windDirectionLabel as Orientation] ?? [];
    const allBeaches = BEACHES.filter(b => !filters.municipality || b.municipality === filters.municipality);
    const windFiltered = allBeaches.filter(b => opposites.includes(b.orientation as Orientation));
    if (allBeaches.length > 0 && windFiltered.length === 0) return "wind"; // municipality has no sheltered beaches today
    if (filters.services.length > 0 || filters.type) return "filters"; // too restrictive filters
    return "filters";
  })();
  const activeFilterCount = (filters.municipality ? 1 : 0) + (filters.type ? 1 : 0) + filters.services.length + (filters.sortBy !== "recommended" ? 1 : 0);

  const C = {
    topbar: { background:"#111", borderBottom:"1.5px solid #222", padding:"14px 16px 12px", position:"sticky" as const, top:0, zIndex:10 },
    appName: { fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-.3px", textTransform:"uppercase" as const },
    appClaim: { fontSize:12, color:"#0e9fa8", marginTop:3, fontStyle:"italic" as const },
    langRow: { display:"flex", gap:6, marginTop:12 },
    langBtn: (active:boolean): React.CSSProperties => ({
      flex:1, padding:"9px 0", borderRadius:9,
      border: active ? "2px solid #0e9fa8" : "2px solid #2a2a2a",
      background: active ? "#0e9fa8" : "#1a1a1a",
      color: active ? "#0a0a0a" : "#666",
      fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"center", letterSpacing:".05em",
    }),
    dateBtn: (active:boolean): React.CSSProperties => ({
      flexShrink:0, width:62, borderRadius:12, padding:"10px 6px", textAlign:"center",
      border: active ? "2px solid #0e9fa8" : "1.5px solid #2a2a2a",
      background: active ? "#0e9fa8" : "#161616", cursor:"pointer",
    }),
    compass: { width:58, height:58, borderRadius:"50%", border:"1.5px solid #2a2a2a", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 as const },
    beachCard: { background:"#141414", border:"1.5px solid #2a2a2a", borderRadius:14, padding:"13px", marginBottom:10, display:"flex", gap:10, alignItems:"center" as const },
    beachIcon: { width:42, height:42, borderRadius:11, background:"#071e20", border:"1.5px solid #0e3038", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 as const },
    mapsBtn: { flexShrink:0 as const, width:40, height:40, borderRadius:10, border:"1.5px solid #2a2a2a", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, cursor:"pointer" },
    filterBtn: (active:boolean): React.CSSProperties => ({ display:"flex", alignItems:"center", gap:5, fontSize:13, padding:"8px 14px", borderRadius:99, border: active ? "1.5px solid #0e9fa8" : "1.5px solid #2a2a2a", background: active ? "#071e20" : "#1a1a1a", color: active ? "#0e9fa8" : "#888", cursor:"pointer", fontWeight:600 }),
  };

  return (
    <main style={{ minHeight:"100vh", background:"#0a0a0a", paddingBottom:60 }}>
      {/* Topbar */}
      <div style={C.topbar}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"#0e9fa8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🌊</div>
            <div>
              <div style={C.appName}>Playas de Menorca</div>
              <div style={C.appClaim}>¿Dónde voy según el viento?</div>
            </div>
          </div>
          <div style={C.langRow}>
            {(["ca","es","en","fr"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={C.langBtn(lang === l)} title={LANG_LABELS[l]}>
                {LANG_FLAGS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Push banner — visible immediately on open */}
        {!pushEnabled && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0 2px" }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🔔</span>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:12, color:"#888" }}>
                {lang === "ca" ? "Rep alertes de vent al mòbil" : lang === "en" ? "Get wind alerts on your phone" : lang === "fr" ? "Alertes vent sur votre téléphone" : "Recibe alertas de viento en el móvil"}
              </span>
            </div>
            <button
              onClick={subscribePush}
              disabled={pushLoading}
              style={{ flexShrink:0, padding:"6px 14px", borderRadius:8, border:"1.5px solid #0e9fa8", background:"transparent", color:"#0e9fa8", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              {pushLoading ? "..." : lang === "ca" ? "Activar" : lang === "en" ? "Enable" : lang === "fr" ? "Activer" : "Activar"}
            </button>
          </div>
        )}
        {pushEnabled && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0 2px" }}>
            <span style={{ fontSize:14 }}>✅</span>
            <span style={{ fontSize:12, color:"#34d399", fontWeight:600 }}>
              {lang === "ca" ? "Alertes activades" : lang === "en" ? "Alerts enabled" : lang === "fr" ? "Alertes activées" : "Alertas activadas"}
            </span>
          </div>
        )}
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"18px 14px" }}>

        {/* Date selector */}
        <p className="section-label">{t.chooseDay}</p>
        {loading ? (
          <div style={{ textAlign:"center", padding:"20px", color:"#555", fontSize:15 }}>{t.loading}</div>
        ) : (
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none", marginBottom:20 }}>
            {forecast.map((d, i) => {
              const date = new Date(d.date + "T12:00:00");
              const active = i === selectedIdx;
              return (
                <button key={d.date} onClick={() => setSelectedIdx(i)} style={C.dateBtn(active)}>
                  <span style={{ display:"block", fontSize:11, color: active ? "rgba(0,0,0,.6)" : "#555" }}>
                    {i === 0 ? t.today : t.days[date.getDay()]}
                  </span>
                  <span style={{ display:"block", fontSize:22, fontWeight:800, color: active ? "#0a0a0a" : "#ddd", marginTop:2, lineHeight:1 }}>
                    {date.getDate()}
                  </span>
                  <span style={{ display:"block", fontSize:11, color: active ? "rgba(0,0,0,.5)" : "#555", marginTop:1 }}>
                    {t.months[date.getMonth()]}
                  </span>
                  <span style={{ display:"block", fontSize:14, marginTop:3 }}>
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
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <p className="section-label" style={{ margin:0 }}>{t.forecast}</p>
                <span style={{ fontSize:13, color:"#555" }}>
                  {(() => { const d = new Date(day.date+"T12:00:00"); return `${t.days[d.getDay()]} ${d.getDate()} ${t.months[d.getMonth()]}`; })()}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={C.compass}>{COMPASS[day.windDirectionLabel] ?? "↑"}</div>
                <div>
                  <div style={{ fontSize:19, fontWeight:700, color:"#fff", lineHeight:1.2 }}>
                    {windName} ({day.windDirectionLabel}) · {day.windspeed} km/h
                  </div>
                  <div style={{ fontSize:14, color:"#666", marginTop:4 }}>
                    {day.tempMax}°C · {t.rainLikely.includes("Pl") ? "Pluja" : "Lluvia"} {day.precipitationProbability}%
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:7, marginTop:12, flexWrap:"wrap" }}>
                {day.isRainy && <span className="pill pill-rain">🌧 {t.rainLikely}</span>}
                {!day.isRainy && <span className="pill pill-sun">☀️ {t.goodWeather}</span>}
                {day.windspeed > 25 && <span className="pill pill-wind">💨 {t.strongWind}</span>}
              </div>
            </div>

            {/* Rain plan */}
            {day.isRainy && (
              <div style={{ border:"1.5px solid #152040", borderRadius:16, padding:"1rem 1.2rem", background:"#0a1525", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#60a5fa" }}>🌧 {t.rainPlanTitle}</div>
                  <a href="https://apuntmenorca.com/agenda/" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:"#4a7ab5", textDecoration:"none" }}>apuntmenorca.com →</a>
                </div>
                {agendaLoading ? (
                  <div style={{ fontSize:14, color:"#4a7ab5", textAlign:"center", padding:"12px 0" }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>⏳</div>
                    {t.loadingAgenda}
                  </div>
                ) : agendaEvents.length > 0 ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {agendaEvents.map((ev, i) => (
                      <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", gap:10, alignItems:"center", textDecoration:"none",
                          background:"#0d1e33", border:"1px solid #1a2e4a", borderRadius:12, padding:"10px", overflow:"hidden" }}>
                        {ev.image && (
                          <img src={ev.image} alt={ev.title}
                            style={{ width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0 }} />
                        )}
                        {!ev.image && (
                          <div style={{ width:56, height:56, borderRadius:8, background:"#152040", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
                            {ev.category === "Música" ? "🎵" : ev.category === "Cine" ? "🎬" : ev.category === "Escena" ? "🎭" : ev.category === "Familiar" ? "👨‍👩‍👧" : "📅"}
                          </div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4,
                              background:"#152040", color:"#60a5fa", textTransform:"uppercase", letterSpacing:".05em" }}>
                              {ev.category}
                            </span>
                            {ev.ticketUrl && (
                              <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4,
                                background:"#0e2a1a", color:"#34d399", fontWeight:700 }}>🎟 Entradas</span>
                            )}
                          </div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#fff", lineHeight:1.3,
                            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const }}>
                            {ev.title}
                          </div>
                          <div style={{ fontSize:11, color:"#4a7ab5", marginTop:3 }}>
                            📅 {ev.day} {ev.month} · 🕐 {ev.time}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div>
                    <ul style={{ listStyle:"none", padding:0 }}>
                      {["Casco histórico de Ciutadella","Museo de Menorca (Maó)","Naveta des Tudons","Mercado municipal de Maó","Binibèquer Vell","Fortaleza de La Mola"].map((a,i) => (
                        <li key={i} style={{ fontSize:14, color:"#60a5fa", padding:"7px 0",
                          borderBottom: i<5 ? "1px solid #152040":"none", display:"flex", gap:8, alignItems:"center" }}>
                          <span>📍</span> {a}
                        </li>
                      ))}
                      <a href="https://apuntmenorca.com/agenda/" target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:12, color:"#4a7ab5", display:"block", marginTop:10 }}>{t.fullAgenda}</a>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Beach header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <span style={{ fontSize:17, fontWeight:700, color:"#fff" }}>🏖️ {day.isRainy ? t.beachesRainy : t.beachesTitle}</span>
                <span style={{ fontSize:14, fontWeight:400, color:"#555", marginLeft:6 }}>
                  · {beachList.length} {beachList.length === 1 ? t.results : t.resultsPlural}
                </span>
              </div>
              <button onClick={() => setShowFilters(v => !v)} style={C.filterBtn(activeFilterCount > 0)}>
                🎛 {t.filters}
                {activeFilterCount > 0 && (
                  <span style={{ background:"#0e9fa8", color:"#0a0a0a", borderRadius:99, fontSize:11, padding:"2px 6px", fontWeight:800 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="card" style={{ marginBottom:14 }}>
                {locationError && <div style={{ fontSize:13, color:"#f87171", marginBottom:8 }}>{locationError}</div>}
                <BeachFilters filters={filters} onChange={setFilters} hasLocation={!!userLocation} onRequestLocation={requestLocation} t={t} />
              </div>
            )}

            {/* Beach list — all, vertical scroll */}
            {beachList.length === 0 ? (
              <div className="card" style={{ textAlign:"center", padding:"2rem 1.5rem" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>
                  {emptyReason === "wind" ? "🧭" : "🔍"}
                </div>
                {emptyReason === "wind" ? (
                  <>
                    <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:8 }}>
                      {lang === "ca" ? "Cap platja recomanada" :
                       lang === "en" ? "No recommended beaches" :
                       lang === "fr" ? "Aucune plage recommandée" :
                       "No hay playas recomendadas"}
                    </div>
                    <div style={{ fontSize:13, color:"#666", lineHeight:1.6, marginBottom:14 }}>
                      {lang === "ca"
                        ? `Amb vent de ${windName} (${day.windDirectionLabel}), les platges de ${filters.municipality} queden exposades al vent. Prova un altre municipi o un altre dia.`
                        : lang === "en"
                        ? `With ${windName} wind (${day.windDirectionLabel}), beaches in ${filters.municipality} face into the wind today. Try another municipality or another day.`
                        : lang === "fr"
                        ? `Avec un vent ${windName} (${day.windDirectionLabel}), les plages de ${filters.municipality} sont exposées au vent. Essayez un autre jour ou une autre région.`
                        : `Con viento ${windName} (${day.windDirectionLabel}), las playas de ${filters.municipality} quedan expuestas al viento hoy. Prueba otro municipio u otro día.`
                      }
                    </div>
                    <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                      <button onClick={() => setFilters(f => ({ ...f, municipality: null }))}
                        style={{ padding:"9px 16px", borderRadius:10, background:"#0e9fa8", border:"none", color:"#0a0a0a", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                        {lang === "ca" ? "Veure tots els municipis" :
                         lang === "en" ? "Show all municipalities" :
                         lang === "fr" ? "Voir tous les municipalités" :
                         "Ver todos los municipios"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:8 }}>{t.noResults}</div>
                    <button onClick={() => setFilters(DEFAULT_FILTERS)}
                      style={{ marginTop:4, padding:"9px 16px", borderRadius:10, background:"#1a1a1a", border:"1.5px solid #2a2a2a", color:"#0e9fa8", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      {t.clearFiltersBtn}
                    </button>
                  </>
                )}
              </div>
            ) : (
              beachList.map((b, rank) => {
                const distKm = userLocation ? distanceKm(userLocation.lat, userLocation.lon, b.lat, b.lon) : null;
                const beachTypeTr = t.beachTypes[b.type as keyof typeof t.beachTypes] ?? b.type;
                const beachDesc = lang === "ca" ? b.descriptionCa : lang === "en" ? b.descriptionEn : lang === "fr" ? b.descriptionFr : b.description;
                return (
                  <div key={b.name} style={{ ...C.beachCard, cursor:"pointer" }} onClick={() => setSelectedBeach(b)}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background: rank===0 ? "#0e9fa8":"#1e1e1e", color: rank===0 ? "#0a0a0a":"#555", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>
                      {rank+1}
                    </div>
                    <div style={C.beachIcon}>🏝️</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:6 }}>
                        <div style={{ fontWeight:700, fontSize:15, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</div>
                        {distKm !== null && (
                          <div style={{ fontSize:12, color:"#0e9fa8", fontWeight:700, flexShrink:0 }}>
                            {distKm < 1 ? `${Math.round(distKm*1000)} m` : `${distKm.toFixed(1)} km`}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{b.municipality}</div>
                      <div style={{ fontSize:12, color:"#777", marginTop:5, lineHeight:1.45 }}>{beachDesc}</div>
                      <div style={{ display:"flex", gap:5, marginTop:7, flexWrap:"wrap", alignItems:"center" }}>
                        <span className="tag tag-teal">🧭 {t.orientation} {b.orientation}</span>
                        <span className="tag tag-blue">{beachTypeTr}</span>
                        {b.parking && <span className="tag tag-gray">🅿️</span>}
                        {(() => {
                          const occ = getOccupancy(day.date);
                          const occLabel = lang === "ca" ? occ.labelCa : lang === "en" ? occ.labelEn : lang === "fr" ? occ.labelFr : occ.label;
                          return (
                            <span style={{ fontSize:11, padding:"3px 8px", borderRadius:6, fontWeight:600, border:"1.5px solid transparent", background:"#1a1a1a", color:occ.color, borderColor:"#2a2a2a" }}>
                              {"👥 "}{occLabel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                      <button onClick={() => openMaps(b.lat, b.lon)} style={C.mapsBtn} title={t.openMaps} aria-label={t.openMaps}>📍</button>
                      <button onClick={() => setShareBeach(b.name)} style={{ ...C.mapsBtn, fontSize:17 }} title="Compartir" aria-label="Compartir">📤</button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Jellyfish */}
            <div style={{ background:"#141200", border:"1.5px solid #2a2400", borderRadius:14, padding:"13px", marginTop:8, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:26 }}>🪼</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fbbf24" }}>{t.jellyTitle}</div>
                <div style={{ fontSize:12, color:"#5a4a10", marginTop:3 }}>{t.jellySub}</div>
              </div>
            </div>

            <div style={{ fontSize:12, color:"#333", textAlign:"center", marginTop:12, fontStyle:"italic" }}>
              {t.windExplain.replace("{name}",windName).replace("{dir}",day.windDirectionLabel).replace("{opp}",(OPPOSITE_ORIENTATIONS[day.windDirectionLabel as Orientation]??[]).join(", "))}
            </div>
          </>
        )}
      </div>

      {/* Report error modal */}
      {reportBeach && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:60, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={() => setReportBeach(null)}>
          <div style={{ background:"#141414", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:640, padding:"24px 20px 40px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>⚠️ Notificar error — {reportBeach}</div>
              <button onClick={() => setReportBeach(null)} style={{ background:"none", border:"none", color:"#555", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            {reportSent ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                <div style={{ fontSize:15, color:"#34d399", fontWeight:600 }}>
                  {lang === "ca" ? "Gràcies! Ho revisarem aviat." : lang === "en" ? "Thanks! We'll review it soon." : lang === "fr" ? "Merci! Nous allons vérifier." : "¡Gracias! Lo revisaremos pronto."}
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12, color:"#555", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>
                    {lang === "ca" ? "Tipus d'error" : lang === "en" ? "Error type" : lang === "fr" ? "Type d'erreur" : "Tipo de error"}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[
                      { key:"foto", label: lang === "ca" ? "Foto incorrecta" : lang === "en" ? "Wrong photo" : lang === "fr" ? "Photo incorrecte" : "Foto incorrecta" },
                      { key:"info", label: lang === "ca" ? "Informació errònia" : lang === "en" ? "Wrong info" : lang === "fr" ? "Info incorrecte" : "Información errónea" },
                      { key:"ubicacion", label: lang === "ca" ? "Ubicació incorrecta" : lang === "en" ? "Wrong location" : lang === "fr" ? "Localisation incorrecte" : "Ubicación incorrecta" },
                      { key:"otro", label: lang === "ca" ? "Altre" : lang === "en" ? "Other" : lang === "fr" ? "Autre" : "Otro" },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => setReportType(opt.key)}
                        style={{ padding:"7px 14px", borderRadius:99, border: reportType === opt.key ? "1.5px solid #0e9fa8" : "1.5px solid #2a2a2a", background: reportType === opt.key ? "#071e20" : "transparent", color: reportType === opt.key ? "#0e9fa8" : "#888", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder={lang === "ca" ? "Descriu l'error amb detall..." : lang === "en" ? "Describe the error in detail..." : lang === "fr" ? "Décrivez l'erreur en détail..." : "Describe el error con detalle..."}
                  value={reportMsg}
                  onChange={e => setReportMsg(e.target.value)}
                  rows={4}
                  style={{ width:"100%", padding:"12px", borderRadius:10, border:"1.5px solid #2a2a2a", background:"#1a1a1a", color:"#fff", fontSize:14, outline:"none", resize:"none", marginBottom:14, boxSizing:"border-box" as const }}
                />
                <button onClick={sendReport} disabled={reportSending || !reportMsg.trim()}
                  style={{ width:"100%", padding:"14px", borderRadius:12, border:"none", background: reportMsg.trim() ? "#0e9fa8" : "#2a2a2a", color: reportMsg.trim() ? "#0a0a0a" : "#555", fontSize:15, fontWeight:700, cursor: reportMsg.trim() ? "pointer" : "not-allowed" }}>
                  {reportSending ? "..." : lang === "ca" ? "Enviar reporte" : lang === "en" ? "Send report" : lang === "fr" ? "Envoyer le rapport" : "Enviar reporte"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Beach detail modal */}
      {selectedBeach && (() => {
        const b = selectedBeach;
        const ov = beachOverrides[b.name] ?? {};
        const baseDesc = lang === "ca" ? b.descriptionCa : lang === "en" ? b.descriptionEn : lang === "fr" ? b.descriptionFr : b.description;
        const beachDesc = ov.description || baseDesc;
        const beachTypeTr = t.beachTypes[b.type as keyof typeof t.beachTypes] ?? b.type;
        const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80";
        const beachPhoto = ov.photo || b.photo || DEFAULT_PHOTO;
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
            onClick={() => setSelectedBeach(null)}>
            <div style={{ background:"#141414", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:640, maxHeight:"92vh", overflow:"auto" }}
              onClick={e => e.stopPropagation()}>

              {/* Photo */}
              <div style={{ position:"relative", width:"100%", height:240, overflow:"hidden", borderRadius:"20px 20px 0 0" }}>
                <img
                  src={beachPhoto}
                  alt={b.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  onError={e => { (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Menorca_beach.jpg/1280px-Menorca_beach.jpg"; }}
                />
                {/* Gradient overlay */}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(20,20,20,0.9) 100%)" }} />
                {/* Close button */}
                <button onClick={() => setSelectedBeach(null)}
                  style={{ position:"absolute", top:14, right:14, width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  ✕
                </button>
                {/* Beach name over photo */}
                <div style={{ position:"absolute", bottom:16, left:16, right:16 }}>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff", lineHeight:1.2 }}>{b.name}</div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{b.municipality}</div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding:"20px 20px 40px" }}>
                {/* Tags */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  <span style={{ fontSize:13, padding:"5px 12px", borderRadius:99, background:"#071e20", color:"#0e9fa8", border:"1.5px solid #0e3038", fontWeight:600 }}>
                    🧭 {t.orientation} {b.orientation}
                  </span>
                  <span style={{ fontSize:13, padding:"5px 12px", borderRadius:99, background:"#0a1525", color:"#60a5fa", border:"1.5px solid #152040", fontWeight:600 }}>
                    {beachTypeTr}
                  </span>
                  {b.parking && (
                    <span style={{ fontSize:13, padding:"5px 12px", borderRadius:99, background:"#1a1a1a", color:"#777", border:"1.5px solid #2a2a2a", fontWeight:600 }}>
                      🅿️ Parking
                    </span>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize:16, color:"#ccc", lineHeight:1.65, marginBottom:24 }}>{beachDesc}</p>

                {/* Services */}
                {b.services.length > 0 && b.services[0] !== "Sin servicios" && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#555", marginBottom:10 }}>Servicios</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {b.services.map(s => (
                        <span key={s} style={{ fontSize:13, padding:"5px 12px", borderRadius:99, background:"#1a1a1a", color:"#888", border:"1.5px solid #2a2a2a" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button onClick={() => { window.open(`https://maps.google.com/?q=${b.lat},${b.lon}`, "_blank"); }}
                    style={{ padding:"14px", borderRadius:14, border:"none", background:"#0e9fa8", color:"#0a0a0a", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    📍 {t.openMaps}
                  </button>
                  <button onClick={() => { setSelectedBeach(null); setShareBeach(b.name); }}
                    style={{ padding:"14px", borderRadius:14, border:"1.5px solid #2a2a2a", background:"#1a1a1a", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    📤 {lang === "ca" ? "Compartir" : lang === "en" ? "Share" : lang === "fr" ? "Partager" : "Compartir"}
                  </button>
                </div>

                {/* Report error button */}
                <button
                  onClick={() => { setReportBeach(b.name); setReportMsg(""); setReportType("foto"); }}
                  style={{ marginTop:16, width:"100%", padding:"8px", borderRadius:10, border:"1.5px solid #2a2a2a", background:"transparent", color:"#555", fontSize:12, cursor:"pointer" }}>
                  ⚠️ {lang === "ca" ? "Notificar un error" : lang === "en" ? "Report an error" : lang === "fr" ? "Signaler une erreur" : "Notificar un error"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Share modal */}
      {shareBeach && day && (() => {
        const text = buildShareText(shareBeach, windName, day.windDirectionLabel, day.date, lang);
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        const igText = text;
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 0 0" }} onClick={() => setShareBeach(null)}>
            <div style={{ background:"#141414", border:"1.5px solid #2a2a2a", borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:640 }} onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>📤 Compartir {shareBeach}</div>
                <button onClick={() => setShareBeach(null)} style={{ background:"none", border:"none", color:"#555", fontSize:20, cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ background:"#0a0a0a", border:"1.5px solid #2a2a2a", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ fontSize:13, color:"#aaa", lineHeight:1.6, whiteSpace:"pre-line" }}>{text}</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:12, background:"#075e54", color:"white", textDecoration:"none", fontSize:14, fontWeight:700 }}>
                  <span style={{ fontSize:20 }}>💬</span> WhatsApp
                </a>
                <button onClick={() => { navigator.clipboard?.writeText(igText); setShareBeach(null); }} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:12, background:"#833ab4", color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>📸</span> Copiar para IG
                </button>
                <button onClick={() => { navigator.clipboard?.writeText(igText); setShareBeach(null); }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"12px 14px", borderRadius:12, background:"#1a1a1a", border:"1.5px solid #2a2a2a", color:"#aaa", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  📋 Copiar
                </button>
              </div>
              <div style={{ marginTop:12, textAlign:"center", fontSize:11, color:"#333" }}>
                menorca-wind-fha3.vercel.app
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
