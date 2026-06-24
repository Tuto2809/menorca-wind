"use client";

import { useState } from "react";

interface Stats {
  total: number;
  today: number;
  week: number;
  byDevice: Record<string, number>;
  byOS: Record<string, number>;
  byDay: { created_at: string }[];
}

const DEVICE_ICONS: Record<string, string> = { mobile: "📱", tablet: "📟", desktop: "💻" };
const OS_ICONS: Record<string, string> = { Windows: "🪟", macOS: "🍎", iOS: "📱", iPadOS: "📟", Android: "🤖", Linux: "🐧" };

export default function AdminPage() {
  const [pwd, setPwd] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/stats?pwd=${encodeURIComponent(pwd)}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data);
      setAuthed(true);
    } else {
      setError("Contraseña incorrecta");
    }
    setLoading(false);
  }

  async function refreshStats() {
    const res = await fetch(`/api/stats?pwd=${encodeURIComponent(pwd)}`);
    if (res.ok) setStats(await res.json());
  }

  if (!authed) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8faf9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="card" style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36 }}>🌊</div>
            <div style={{ fontWeight: 600, fontSize: 18, marginTop: 8 }}>Panel de administración</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Menorca Wind</div>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Contraseña"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e0e0e0", fontSize: 15, marginBottom: 10, outline: "none" }}
            />
            {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a href="/" style={{ fontSize: 13, color: "#888" }}>← Volver a la app</a>
          </div>
        </div>
      </main>
    );
  }

  const totalByDay: Record<string, number> = {};
  (stats?.byDay ?? []).forEach((r) => {
    const d = r.created_at.slice(0, 10);
    totalByDay[d] = (totalByDay[d] ?? 0) + 1;
  });
  const dayEntries = Object.entries(totalByDay).slice(-7);
  const maxVal = Math.max(...dayEntries.map(([, v]) => v), 1);

  return (
    <main style={{ minHeight: "100vh", background: "#f8faf9", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e8e8e8", padding: "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌊</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Panel de administración</div>
              <div style={{ fontSize: 12, color: "#888" }}>Menorca Wind</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={refreshStats} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "white", cursor: "pointer" }}>
              🔄 Actualizar
            </button>
            <a href="/" style={{ fontSize: 13, color: "#888" }}>← App</a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Consultas hoy", value: stats?.today ?? 0, icon: "📅" },
            { label: "Esta semana", value: stats?.week ?? 0, icon: "📆" },
            { label: "Total histórico", value: stats?.total ?? 0, icon: "📊" },
          ].map((m) => (
            <div key={m.label} style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{m.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1D9E75", lineHeight: 1.2 }}>{m.value}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart — consultas por día */}
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-label">Consultas por día (últimos 7 días)</p>
          {dayEntries.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", padding: "20px 0", textAlign: "center" }}>Sin datos aún</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {dayEntries.map(([date, count]) => (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#1D9E75" }}>{count}</div>
                  <div style={{
                    width: "100%", borderRadius: 4,
                    height: `${Math.round((count / maxVal) * 72)}px`,
                    background: "#1D9E75",
                    minHeight: 4,
                  }} />
                  <div style={{ fontSize: 10, color: "#888" }}>{date.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By device + by OS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div className="card">
            <p className="section-label">Por dispositivo</p>
            {Object.entries(stats?.byDevice ?? {}).length === 0 ? (
              <div style={{ fontSize: 13, color: "#aaa" }}>Sin datos</div>
            ) : (
              Object.entries(stats?.byDevice ?? {}).sort(([, a], [, b]) => b - a).map(([device, count]) => (
                <div key={device} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 14 }}>{DEVICE_ICONS[device] ?? "❓"} <span style={{ fontSize: 13, color: "#444" }}>{device}</span></span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{count}</span>
                </div>
              ))
            )}
          </div>
          <div className="card">
            <p className="section-label">Por sistema operativo</p>
            {Object.entries(stats?.byOS ?? {}).length === 0 ? (
              <div style={{ fontSize: 13, color: "#aaa" }}>Sin datos</div>
            ) : (
              Object.entries(stats?.byOS ?? {}).sort(([, a], [, b]) => b - a).map(([os, count]) => (
                <div key={os} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 14 }}>{OS_ICONS[os] ?? "❓"} <span style={{ fontSize: 13, color: "#444" }}>{os}</span></span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent queries table */}
        <div className="card">
          <p className="section-label">Actividad reciente (últimas entradas)</p>
          <RecentTable pwd={pwd} />
        </div>

      </div>
    </main>
  );
}

function RecentTable({ pwd }: { pwd: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    // We fetch the raw consultas via stats endpoint — in production add a dedicated endpoint
    const res = await fetch(`/api/stats/recent?pwd=${encodeURIComponent(pwd)}`);
    if (res.ok) { setRows(await res.json()); setLoaded(true); }
  };

  if (!loaded) {
    return (
      <button onClick={load} style={{ fontSize: 13, color: "#1D9E75", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        Cargar registros recientes →
      </button>
    );
  }

  if (rows.length === 0) return <div style={{ fontSize: 13, color: "#aaa" }}>Sin registros aún</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#888", borderBottom: "1px solid #f0f0f0" }}>
            {["Fecha consulta", "Viento", "Lluvia", "Dispositivo", "OS", "Navegador", "IP"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f8f8f8" }}>
              <td style={{ padding: "5px 8px" }}>{String(r.fecha_consulta ?? "")}</td>
              <td style={{ padding: "5px 8px" }}>{String(r.wind_direction ?? "")}</td>
              <td style={{ padding: "5px 8px" }}>{r.is_rainy ? "🌧" : "☀️"}</td>
              <td style={{ padding: "5px 8px" }}>{String(r.device_type ?? "")}</td>
              <td style={{ padding: "5px 8px" }}>{String(r.os ?? "")}</td>
              <td style={{ padding: "5px 8px" }}>{String(r.browser ?? "")}</td>
              <td style={{ padding: "5px 8px", color: "#aaa" }}>{String(r.ip ?? "").slice(0, 15)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
