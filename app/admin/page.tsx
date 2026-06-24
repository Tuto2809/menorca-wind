"use client";
import { useState } from "react";

interface Stats {
  total: number; today: number; week: number;
  byDevice: Record<string, number>;
  byOS: Record<string, number>;
  byDay: { created_at: string }[];
}

const S = {
  bg: "#0a0a0a", card: "#141414", border: "#252525",
  accent: "#0e9fa8", text: "#fff", muted: "#666", sub: "#444",
};

export default function AdminPage() {
  const [pwd, setPwd] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`/api/stats?pwd=${encodeURIComponent(pwd)}`);
    if (res.ok) { setStats(await res.json()); setAuthed(true); }
    else setError("Contraseña incorrecta");
    setLoading(false);
  }

  if (!authed) return (
    <main style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36 }}>🌊</div>
          <div style={{ fontWeight: 600, fontSize: 18, color: S.text, marginTop: 8 }}>Panel admin</div>
          <div style={{ fontSize: 13, color: S.muted, marginTop: 4 }}>Menorca Wind</div>
        </div>
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Contraseña" value={pwd} onChange={e => setPwd(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${S.border}`, background: "#1a1a1a", color: S.text, fontSize: 15, marginBottom: 10, outline: "none" }} />
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: S.accent, color: "#0a0a0a", border: "none", borderRadius: 10, padding: "10px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "..." : "Entrar"}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a href="/" style={{ fontSize: 13, color: S.muted }}>← Volver a la app</a>
        </div>
      </div>
    </main>
  );

  const totalByDay: Record<string, number> = {};
  (stats?.byDay ?? []).forEach(r => { const d = r.created_at.slice(0, 10); totalByDay[d] = (totalByDay[d] ?? 0) + 1; });
  const dayEntries = Object.entries(totalByDay).slice(-7);
  const maxVal = Math.max(...dayEntries.map(([, v]) => v), 1);

  return (
    <main style={{ minHeight: "100vh", background: S.bg, paddingBottom: 60 }}>
      <div style={{ background: "#0f0f0f", borderBottom: `1px solid ${S.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: S.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🌊</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: S.text }}>Panel admin</div>
        </div>
        <a href="/" style={{ fontSize: 12, color: S.muted, textDecoration: "none" }}>← App</a>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "18px 14px" }}>
        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[{ label: "Hoy", value: stats?.today ?? 0, icon: "📅" }, { label: "Esta semana", value: stats?.week ?? 0, icon: "📆" }, { label: "Total", value: stats?.total ?? 0, icon: "📊" }].map(m => (
            <div key={m.label} style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{m.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: S.accent }}>{m.value}</div>
              <div style={{ fontSize: 11, color: S.muted, marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 14, padding: "1rem 1.1rem", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: S.sub, marginBottom: 12 }}>Consultas por día (últimos 7 días)</div>
          {dayEntries.length === 0 ? (
            <div style={{ fontSize: 13, color: S.muted, textAlign: "center", padding: "16px 0" }}>Sin datos aún</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
              {dayEntries.map(([date, count]) => (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: S.accent }}>{count}</div>
                  <div style={{ width: "100%", borderRadius: 4, height: `${Math.round((count / maxVal) * 64)}px`, background: S.accent, minHeight: 4 }} />
                  <div style={{ fontSize: 10, color: S.muted }}>{date.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device + OS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[{ title: "Dispositivo", data: stats?.byDevice ?? {}, icons: { mobile: "📱", tablet: "📟", desktop: "💻" } as Record<string,string> },
            { title: "Sistema operativo", data: stats?.byOS ?? {}, icons: { Windows: "🪟", macOS: "🍎", iOS: "📱", iPadOS: "📟", Android: "🤖", Linux: "🐧" } as Record<string,string> }
          ].map(panel => (
            <div key={panel.title} style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 14, padding: "1rem 1.1rem" }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: S.sub, marginBottom: 10 }}>{panel.title}</div>
              {Object.entries(panel.data).length === 0 ? (
                <div style={{ fontSize: 13, color: S.muted }}>Sin datos</div>
              ) : Object.entries(panel.data).sort(([,a],[,b]) => b-a).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${S.border}` }}>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{panel.icons[k] ?? "❓"} {k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.accent }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Recent */}
        <RecentTable pwd={pwd} />
      </div>
    </main>
  );
}

function RecentTable({ pwd }: { pwd: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const load = async () => {
    const res = await fetch(`/api/stats/recent?pwd=${encodeURIComponent(pwd)}`);
    if (res.ok) { setRows(await res.json()); setLoaded(true); }
  };
  const S2 = { bg: "#141414", border: "#252525", accent: "#0e9fa8", muted: "#666", sub: "#444" };
  if (!loaded) return (
    <div style={{ background: S2.bg, border: `1.5px solid ${S2.border}`, borderRadius: 14, padding: "1rem 1.1rem" }}>
      <button onClick={load} style={{ fontSize: 13, color: S2.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        Cargar registros recientes →
      </button>
    </div>
  );
  return (
    <div style={{ background: S2.bg, border: `1.5px solid ${S2.border}`, borderRadius: 14, padding: "1rem 1.1rem" }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: S2.sub, marginBottom: 10 }}>Registros recientes</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Fecha", "Viento", "Lluvia", "Dispositivo", "OS", "Navegador", "IP"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500, color: S2.muted, borderBottom: `1px solid ${S2.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${S2.border}` }}>
                <td style={{ padding: "5px 8px", color: "#ccc" }}>{String(r.fecha_consulta ?? "")}</td>
                <td style={{ padding: "5px 8px", color: S2.accent }}>{String(r.wind_direction ?? "")}</td>
                <td style={{ padding: "5px 8px" }}>{r.is_rainy ? "🌧" : "☀️"}</td>
                <td style={{ padding: "5px 8px", color: "#ccc" }}>{String(r.device_type ?? "")}</td>
                <td style={{ padding: "5px 8px", color: "#ccc" }}>{String(r.os ?? "")}</td>
                <td style={{ padding: "5px 8px", color: "#ccc" }}>{String(r.browser ?? "")}</td>
                <td style={{ padding: "5px 8px", color: S2.muted }}>{String(r.ip ?? "").slice(0, 15)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
