"use client";
import { useState, useEffect } from "react";

interface Stats {
  total: number; today: number; week: number;
  byDevice: Record<string, number>;
  byOS: Record<string, number>;
  byDay: { created_at: string }[];
  pushTotal: number;
  pushActive: number;
}

interface PushMessage {
  id: number; title: string; body: string; icon: string; url: string;
  status: "draft" | "template" | "sent"; sent_at: string | null;
  sent_count: number; notes: string | null; updated_at: string;
}

interface PushConfig { [key: string]: string; }
interface BeachReport { id: number; beach_name: string; report_type: string; message: string; status: string; created_at: string; }
interface BeachEdit { name: string; description: string; photo: string; lat: number; lon: number; }
interface BeachOverride { name: string; photo: string; description: string; updated_at: string; }

const S = {
  bg: "#0a0a0a", card: "#141414", border: "#2a2a2a",
  accent: "#0e9fa8", text: "#fff", muted: "#666", sub: "#444",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Borrador",  color: "#fbbf24", bg: "#1a1500" },
  template: { label: "Plantilla", color: "#60a5fa", bg: "#0a1525" },
  sent:     { label: "Enviado",   color: "#34d399", bg: "#0e2a1a" },
};

type Tab = "stats" | "messages" | "auto" | "reports" | "beaches";

export default function AdminPage() {
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<PushMessage[]>([]);
  const [config, setConfig] = useState<PushConfig>({});
  const [editMsg, setEditMsg] = useState<Partial<PushMessage> | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [autoTestResult, setAutoTestResult] = useState<string | null>(null);
  const [reports, setReports] = useState<BeachReport[]>([]);
  const [beachEdit, setBeachEdit] = useState<BeachEdit | null>(null);
  const [overrides, setOverrides] = useState<BeachOverride[]>([]);
  const [editOverride, setEditOverride] = useState<{name:string;photo:string;description:string} | null>(null);
  const [overrideSaving, setOverrideSaving] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pwd");
    if (saved) loadAll(saved).then(ok => { if (ok) { setPwd(saved); setAuthed(true); } });
  }, []);

  async function loadAll(p: string) {
    const [statsRes, msgsRes, cfgRes, repsRes] = await Promise.all([
      fetch(`/api/stats?pwd=${encodeURIComponent(p)}`),
      fetch(`/api/push/messages?pwd=${encodeURIComponent(p)}`),
      fetch(`/api/push/config?pwd=${encodeURIComponent(p)}`),
      fetch(`/api/report?pwd=${encodeURIComponent(p)}`),
    ]);
    if (!statsRes.ok) return false;
    const [s, m, c, r] = await Promise.all([statsRes.json(), msgsRes.json(), cfgRes.json(), repsRes.json()]);
    setStats(s);
    setMessages(m.messages ?? []);
    setConfig(c.config ?? {});
    setReports(r.reports ?? []);
    const ov = await fetch(`/api/beaches?pwd=${encodeURIComponent(p)}`).then(r=>r.json()).catch(()=>({beaches:[]}));
    setOverrides(ov.beaches ?? []);
    return true;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const ok = await loadAll(pwd);
    if (ok) { setAuthed(true); sessionStorage.setItem("admin_pwd", pwd); }
    else setError("Contraseña incorrecta");
    setLoading(false);
  }

  function logout() { sessionStorage.removeItem("admin_pwd"); setAuthed(false); setPwd(""); }

  async function saveMessage(status: "draft" | "template" | "sent") {
    if (!editMsg?.title || !editMsg?.body) return;
    const method = editMsg.id ? "PUT" : "POST";
    const res = await fetch(`/api/push/messages?pwd=${encodeURIComponent(pwd)}`, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editMsg, status }),
    });
    if (!res.ok) return;
    const saved = await res.json();

    // If sending, also trigger real push
    if (status === "sent") {
      const msg = saved.message ?? { ...editMsg, id: editMsg.id };
      if (!confirm(`¿Enviar "${msg.title}" a todos los suscriptores?`)) {
        setEditMsg(null);
        await loadAll(pwd);
        return;
      }
      const sendRes = await fetch(`/api/push/send?pwd=${encodeURIComponent(pwd)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, title: msg.title, body: msg.body, icon: msg.icon, url: msg.url }),
      });
      const sendData = await sendRes.json();
      alert(sendData.ok ? `✅ Enviado a ${sendData.sent} suscriptores` : `❌ Error: ${sendData.error}`);
    }
    setEditMsg(null);
    await loadAll(pwd);
  }

  async function deleteMessage(id: number) {
    if (!confirm("¿Eliminar este mensaje?")) return;
    await fetch(`/api/push/messages?pwd=${encodeURIComponent(pwd)}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadAll(pwd);
  }

  async function sendMessage(msg: PushMessage) {
    if (!confirm(`¿Enviar "${msg.title}" a todos los suscriptores?`)) return;
    setSendingId(msg.id);
    const res = await fetch(`/api/push/send?pwd=${encodeURIComponent(pwd)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg.id, title: msg.title, body: msg.body, icon: msg.icon, url: msg.url }),
    });
    const data = await res.json();
    alert(data.ok ? `✅ Enviado a ${data.sent} suscriptores` : `❌ Error: ${data.error}`);
    setSendingId(null);
    await loadAll(pwd);
  }

  async function saveConfig() {
    setConfigSaving(true);
    await fetch(`/api/push/config?pwd=${encodeURIComponent(pwd)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: config }),
    });
    setConfigSaving(false);
    alert("✅ Configuración guardada");
  }

  async function testAuto() {
    setAutoTestResult("Ejecutando...");
    const res = await fetch(`/api/auto?pwd=${encodeURIComponent(pwd)}&force=1`);
    const data = await res.json();
    setAutoTestResult(JSON.stringify(data, null, 2));
    await loadAll(pwd);
  }

  // PIN Login screen
  if (!authed) {
    const handlePin = (digit: string) => { if (pwd.length < 6) setPwd(p => p + digit); };
    const handleDel = () => setPwd(p => p.slice(0, -1));
    const handleSubmit = () => { if (pwd.length > 0) handleLogin({ preventDefault: () => {} } as React.FormEvent); };
    return (
      <main style={{ minHeight:"100vh", background:S.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ background:S.card, border:`1.5px solid ${S.border}`, borderRadius:20, padding:"2rem 1.5rem", width:"100%", maxWidth:300 }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:S.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 12px" }}>🌊</div>
            <div style={{ fontWeight:700, fontSize:18, color:S.text }}>Panel admin</div>
            <div style={{ fontSize:13, color:S.muted, marginTop:4 }}>Playas de Menorca</div>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:24 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: i < pwd.length ? S.accent : "#2a2a2a" }} />
            ))}
          </div>
          {error && <div style={{ color:"#f87171", fontSize:13, textAlign:"center", marginBottom:12 }}>{error}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, idx) => (
              <button key={idx} onClick={() => k === "⌫" ? handleDel() : k !== "" ? handlePin(k) : undefined}
                style={{ padding:"16px 0", borderRadius:12, fontSize: k === "⌫" ? 20 : 22, fontWeight:600,
                  border:`1.5px solid ${k === "" ? "transparent" : S.border}`,
                  background: k === "" ? "transparent" : "#1a1a1a",
                  color: k === "⌫" ? "#f87171" : S.text,
                  cursor: k === "" ? "default" : "pointer" }}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading || pwd.length === 0}
            style={{ width:"100%", background: pwd.length > 0 ? S.accent : "#2a2a2a", color: pwd.length > 0 ? "#0a0a0a" : S.muted,
              border:"none", borderRadius:12, padding:"14px", fontSize:16, fontWeight:700, cursor: pwd.length > 0 ? "pointer" : "default" }}>
            {loading ? "..." : "Entrar"}
          </button>
          <div style={{ marginTop:16, textAlign:"center" }}>
            <a href="/" style={{ fontSize:13, color:S.muted }}>← Volver a la app</a>
          </div>
        </div>
      </main>
    );
  }

  // Compute bar chart data
  const totalByDay: Record<string, number> = {};
  (stats?.byDay ?? []).forEach(r => { const d = r.created_at.slice(0,10); totalByDay[d] = (totalByDay[d]??0)+1; });
  const dayEntries = Object.entries(totalByDay).slice(-7);
  const maxVal = Math.max(...dayEntries.map(([,v])=>v), 1);

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding:"8px 10px", borderRadius:"10px 10px 0 0", whiteSpace:"nowrap" as const, flexShrink:0, border:`1.5px solid ${S.border}`,
    borderBottom: tab === t ? "none" : `1.5px solid ${S.border}`,
    background: tab === t ? S.card : "transparent",
    color: tab === t ? S.text : S.muted,
    fontSize:11, fontWeight:600, cursor:"pointer",
  });

  return (
    <main style={{ minHeight:"100vh", background:S.bg, paddingBottom:60 }}>
      {/* Header */}
      <div style={{ background:"#0f0f0f", borderBottom:`1px solid ${S.border}`, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:S.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🌊</div>
          <div style={{ fontWeight:600, fontSize:15, color:S.text }}>Panel admin</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => loadAll(pwd)} style={{ fontSize:13, padding:"6px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:S.card, color:S.accent, cursor:"pointer", fontWeight:600 }}>
            🔄 Actualizar
          </button>
          <button onClick={logout} style={{ fontSize:12, padding:"6px 10px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"transparent", color:S.muted, cursor:"pointer" }}>
            Salir
          </button>
          <a href="/" style={{ fontSize:12, color:S.muted, textDecoration:"none" }}>← App</a>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"10px 8px" }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:0, borderBottom:`1.5px solid ${S.border}`, overflowX:"auto", scrollbarWidth:"none" as const }}>
          <button style={tabStyle("stats")}   onClick={() => setTab("stats")}>📊 Estadísticas</button>
          <button style={tabStyle("messages")} onClick={() => setTab("messages")}>📨 Mensajes</button>
          <button style={tabStyle("auto")}    onClick={() => setTab("auto")}>⚙️ Automático</button>
          <button style={tabStyle("reports")} onClick={() => setTab("reports")}>⚠️ Reportes{reports.filter(r=>r.status==="pending").length > 0 ? ` (${reports.filter(r=>r.status==="pending").length})` : ""}</button>
          <button style={tabStyle("beaches")} onClick={() => setTab("beaches")}>🏖️ Playas</button>
        </div>

        <div style={{ background:S.card, border:`1.5px solid ${S.border}`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"1.2rem", marginBottom:16 }}>

          {/* ── STATS TAB ── */}
          {tab === "stats" && (
            <div>
              {/* Push subscribers */}
              <div style={{ background:"#071e20", border:`1.5px solid #0e3038`, borderRadius:12, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24 }}>🔔</span>
                  <div>
                    <div style={{ fontSize:12, color:S.accent, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Suscriptores push</div>
                    <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>Usuarios con alertas activadas</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:34, fontWeight:800, color:S.accent, lineHeight:1 }}>{stats?.pushActive ?? 0}</div>
                  <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>activos · {stats?.pushTotal ?? 0} total</div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                {[{ label:"Hoy", value:stats?.today??0, icon:"📅" }, { label:"Esta semana", value:stats?.week??0, icon:"📆" }, { label:"Total", value:stats?.total??0, icon:"📊" }].map(m => (
                  <div key={m.label} style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"12px", textAlign:"center" }}>
                    <div style={{ fontSize:18 }}>{m.icon}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:S.accent }}>{m.value}</div>
                    <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", color:S.sub, marginBottom:10 }}>Consultas por día (últimos 7 días)</div>
                {dayEntries.length === 0 ? (
                  <div style={{ fontSize:13, color:S.muted, textAlign:"center", padding:"16px 0" }}>Sin datos aún</div>
                ) : (
                  <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80 }}>
                    {dayEntries.map(([date, count]) => (
                      <div key={date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                        <div style={{ fontSize:10, fontWeight:600, color:S.accent }}>{count}</div>
                        <div style={{ width:"100%", borderRadius:4, height:`${Math.round((count/maxVal)*60)}px`, background:S.accent, minHeight:3 }} />
                        <div style={{ fontSize:9, color:S.muted }}>{date.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Device + OS */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { title:"Dispositivo", data:stats?.byDevice??{}, icons:{ mobile:"📱", tablet:"📟", desktop:"💻" } as Record<string,string> },
                  { title:"Sistema operativo", data:stats?.byOS??{}, icons:{ Windows:"🪟", macOS:"🍎", iOS:"📱", iPadOS:"📟", Android:"🤖", Linux:"🐧" } as Record<string,string> },
                ].map(panel => (
                  <div key={panel.title} style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", color:S.sub, marginBottom:8 }}>{panel.title}</div>
                    {Object.entries(panel.data).length === 0 ? <div style={{ fontSize:12, color:S.muted }}>Sin datos</div>
                      : Object.entries(panel.data).sort(([,a],[,b])=>b-a).map(([k,v]) => (
                        <div key={k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${S.border}` }}>
                          <span style={{ fontSize:12, color:"#ccc" }}>{panel.icons[k]??'❓'} {k}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:S.accent }}>{v}</span>
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MESSAGES TAB ── */}
          {tab === "messages" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, color:S.text }}>Mensajes y plantillas</div>
                <button onClick={() => setEditMsg({ title:"", body:"", icon:"🌊", url:"/", status:"draft" })}
                  style={{ padding:"7px 14px", borderRadius:9, border:"none", background:S.accent, color:"#0a0a0a", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  + Nuevo mensaje
                </button>
              </div>

              {/* Editor */}
              {editMsg !== null && (
                <div style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:S.text, marginBottom:12 }}>
                    {editMsg.id ? "✏️ Editar mensaje" : "✨ Nuevo mensaje"}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, marginBottom:8 }}>
                    <input placeholder="Título *" value={editMsg.title??""} onChange={e => setEditMsg(m => ({...m!, title:e.target.value}))}
                      style={{ padding:"8px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:14, outline:"none" }} />
                    <input placeholder="🌊" value={editMsg.icon??""} onChange={e => setEditMsg(m => ({...m!, icon:e.target.value}))}
                      style={{ width:48, padding:"8px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:18, textAlign:"center", outline:"none" }} />
                  </div>
                  <textarea placeholder="Cuerpo del mensaje *" value={editMsg.body??""} onChange={e => setEditMsg(m => ({...m!, body:e.target.value}))}
                    rows={3} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13, outline:"none", resize:"vertical", marginBottom:8, boxSizing:"border-box" as const }} />
                  <input placeholder="URL destino (ej: /)" value={editMsg.url??""} onChange={e => setEditMsg(m => ({...m!, url:e.target.value}))}
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13, outline:"none", marginBottom:8, boxSizing:"border-box" as const }} />
                  <input placeholder="Notas internas (opcional)" value={editMsg.notes??""} onChange={e => setEditMsg(m => ({...m!, notes:e.target.value}))}
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13, outline:"none", marginBottom:12, boxSizing:"border-box" as const }} />
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button onClick={() => saveMessage("draft")} style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid #2a2400`, background:"#1a1500", color:"#fbbf24", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      💾 Guardar borrador
                    </button>
                    <button onClick={() => saveMessage("template")} style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid #152040`, background:"#0a1525", color:"#60a5fa", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      📋 Guardar plantilla
                    </button>
                    <button onClick={() => saveMessage("sent")} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:S.accent, color:"#0a0a0a", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      📤 Enviar ahora
                    </button>
                    <button onClick={() => setEditMsg(null)} style={{ padding:"7px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"transparent", color:S.muted, fontSize:13, cursor:"pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.length === 0 ? (
                <div style={{ textAlign:"center", padding:"2rem", color:S.muted, fontSize:13 }}>
                  No hay mensajes aún. Crea uno con el botón de arriba.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {messages.map(msg => {
                    const st = STATUS_LABELS[msg.status] ?? STATUS_LABELS.draft;
                    return (
                      <div key={msg.id} style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:18 }}>{msg.icon}</span>
                              <span style={{ fontSize:14, fontWeight:700, color:S.text }}>{msg.title}</span>
                              <span style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background:st.bg, color:st.color, fontWeight:600 }}>{st.label}</span>
                            </div>
                            <div style={{ fontSize:12, color:S.muted, marginBottom:4 }}>{msg.body}</div>
                            <div style={{ fontSize:10, color:S.sub }}>
                              {msg.sent_at ? `Enviado ${new Date(msg.sent_at).toLocaleDateString("es")} · ${msg.sent_count} destinatarios` : `Actualizado ${new Date(msg.updated_at).toLocaleDateString("es")}`}
                              {msg.notes && <span style={{ marginLeft:8 }}>· {msg.notes}</span>}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                            <button onClick={() => setEditMsg(msg)} style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${S.border}`, background:"transparent", color:S.muted, fontSize:12, cursor:"pointer" }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); sendMessage(msg); }} disabled={sendingId === msg.id}
                              style={{ padding:"5px 10px", borderRadius:7, border:"none", background:S.accent, color:"#0a0a0a", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              {sendingId === msg.id ? "..." : "📤"}
                            </button>
                            <button onClick={() => deleteMessage(msg.id)} style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid #2a1515`, background:"#1a0a0a", color:"#f87171", fontSize:12, cursor:"pointer" }}>🗑</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── BEACHES TAB ── */}
          {tab === "beaches" && (
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:S.text, marginBottom:6 }}>🏖️ Editar fotos y descripciones</div>
              <div style={{ fontSize:12, color:S.muted, marginBottom:14 }}>
                Pega la URL de cualquier foto (Google Fotos, Dropbox, Imgur, etc.) para reemplazar la imagen de una playa.
              </div>

              {/* Edit form */}
              {editOverride !== null && (
                <div style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:S.text, marginBottom:12 }}>✏️ {editOverride.name}</div>
                  <div style={{ fontSize:11, color:S.muted, marginBottom:6 }}>URL de la foto</div>
                  <input value={editOverride.photo} onChange={e => setEditOverride(o => ({...o!, photo:e.target.value}))}
                    placeholder="https://ejemplo.com/foto.jpg"
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13, outline:"none", marginBottom:10, boxSizing:"border-box" as const }} />
                  {editOverride.photo && (
                    <img src={editOverride.photo} alt="preview"
                      style={{ width:"100%", height:140, objectFit:"cover", borderRadius:8, marginBottom:10 }}
                      onError={e => (e.target as HTMLImageElement).style.display="none"} />
                  )}
                  <div style={{ fontSize:11, color:S.muted, marginBottom:6 }}>Descripción (opcional — deja vacío para usar la predeterminada)</div>
                  <textarea value={editOverride.description} onChange={e => setEditOverride(o => ({...o!, description:e.target.value}))}
                    rows={2} placeholder="Descripción personalizada..."
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13, outline:"none", resize:"none", marginBottom:12, boxSizing:"border-box" as const }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={async () => {
                      setOverrideSaving(true);
                      await fetch(`/api/beaches?pwd=${encodeURIComponent(pwd)}`, {
                        method:"POST", headers:{"Content-Type":"application/json"},
                        body: JSON.stringify(editOverride),
                      });
                      setEditOverride(null);
                      setOverrideSaving(false);
                      await loadAll(pwd);
                    }} disabled={overrideSaving}
                      style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:S.accent, color:"#0a0a0a", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                      {overrideSaving ? "..." : "💾 Guardar"}
                    </button>
                    <button onClick={() => setEditOverride(null)}
                      style={{ padding:"9px 14px", borderRadius:9, border:`1.5px solid ${S.border}`, background:"transparent", color:S.muted, fontSize:13, cursor:"pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Beach list — show overrides first, then all beaches */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  "Arenal d'en Castell","Binigaus","Binidalí","Cala Blanca","Cala en Blanes",
                  "Cala en Porter","Cala Galdana","Cala Macarella","Cala Macarelleta",
                  "Cala Mesquida","Cala Morell","Cala Pregonda","Cala Tirant","Cala Turqueta",
                  "Es Grau","Punta Prima","Sa Mesquida","Son Bou","Son Parc","Son Saura",
                  "Santo Tomàs","Santandria","Binibèquer","Cala Llucalari","Cala Mitjana",
                ].map(name => {
                  const ov = overrides.find(o => o.name === name);
                  return (
                    <div key={name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#0f0f0f", border:`1.5px solid ${ov ? "#0e3038" : S.border}`, borderRadius:10, gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:13, color:S.text, fontWeight:600 }}>{name}</span>
                        {ov && <span style={{ fontSize:10, marginLeft:8, padding:"2px 6px", borderRadius:4, background:"#071e20", color:S.accent }}>Foto personalizada</span>}
                      </div>
                      <button onClick={() => setEditOverride({ name, photo: ov?.photo ?? "", description: ov?.description ?? "" })}
                        style={{ padding:"5px 12px", borderRadius:7, border:`1.5px solid ${S.border}`, background:"transparent", color:S.muted, fontSize:12, cursor:"pointer", flexShrink:0 }}>
                        ✏️ Editar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── REPORTS TAB ── */}
          {tab === "reports" && (
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:S.text, marginBottom:14 }}>⚠️ Reportes de usuarios</div>
              {reports.length === 0 ? (
                <div style={{ textAlign:"center", padding:"2rem", color:S.muted, fontSize:13 }}>No hay reportes aún</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {reports.map(r => (
                    <div key={r.id} style={{ background:"#0f0f0f", border:`1.5px solid ${r.status==="pending" ? "#2a2400" : S.border}`, borderRadius:10, padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:S.text }}>{r.beach_name}</span>
                            <span style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background: r.status==="pending" ? "#1a1500" : "#0e2a1a", color: r.status==="pending" ? "#fbbf24" : "#34d399", fontWeight:600 }}>
                              {r.status === "pending" ? "Pendiente" : "Resuelto"}
                            </span>
                            <span style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background:"#1a1a1a", color:"#777" }}>{r.report_type}</span>
                          </div>
                          <div style={{ fontSize:13, color:S.muted, marginBottom:4 }}>{r.message}</div>
                          <div style={{ fontSize:10, color:S.sub }}>{new Date(r.created_at).toLocaleString("es")}</div>
                        </div>
                        {r.status === "pending" && (
                          <button onClick={async () => {
                            await fetch(`/api/report?pwd=${encodeURIComponent(pwd)}`, {
                              method:"PATCH", headers:{"Content-Type":"application/json"},
                              body: JSON.stringify({ id: r.id, status: "resolved" }),
                            });
                            await loadAll(pwd);
                          }} style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid #1a3a2a`, background:"#0e2a1a", color:"#34d399", fontSize:12, cursor:"pointer", flexShrink:0 }}>
                            ✓ Resolver
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── AUTO TAB ── */}
          {tab === "auto" && (
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:S.text, marginBottom:14 }}>⚙️ Configuración del envío automático</div>

              {/* Enable + hour */}
              <div style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:S.text }}>Envío automático</div>
                    <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>Comprueba el tiempo cada hora y envía si hay condiciones destacadas</div>
                  </div>
                  <button onClick={() => setConfig(c => ({ ...c, auto_enabled: c.auto_enabled === "true" ? "false" : "true" }))}
                    style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${config.auto_enabled === "true" ? "#0e3038" : S.border}`, background:config.auto_enabled === "true" ? "#071e20" : "transparent", color:config.auto_enabled === "true" ? S.accent : S.muted, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {config.auto_enabled === "true" ? "✅ Activo" : "⭕ Inactivo"}
                  </button>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:13, color:S.muted }}>Hora de envío:</span>
                  <select value={config.auto_hour ?? "7"} onChange={e => setConfig(c => ({ ...c, auto_hour: e.target.value }))}
                    style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13 }}>
                    {Array.from({ length:24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2,"0")}:00 h</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", color:S.sub, marginBottom:10 }}>Condiciones que activan el envío</div>
                {[
                  { key:"auto_wind_strong", label:"💨 Viento fuerte", desc:"Umbral (km/h):", threshKey:"auto_wind_threshold" },
                  { key:"auto_wind_change", label:"🌀 Cambio de dirección", desc:null, threshKey:null },
                  { key:"auto_rain",        label:"🌧 Lluvia prevista",    desc:null, threshKey:null },
                ].map(cond => (
                  <div key={cond.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${S.border}` }}>
                    <button onClick={() => setConfig(c => ({ ...c, [cond.key]: c[cond.key] === "true" ? "false" : "true" }))}
                      style={{ width:22, height:22, borderRadius:6, border:`1.5px solid ${config[cond.key]==="true" ? S.accent : S.border}`, background:config[cond.key]==="true" ? S.accent : "transparent", cursor:"pointer", flexShrink:0 }}>
                      {config[cond.key] === "true" && <span style={{ color:"#0a0a0a", fontSize:12, fontWeight:700 }}>✓</span>}
                    </button>
                    <span style={{ flex:1, fontSize:13, color:S.text }}>{cond.label}</span>
                    {cond.threshKey && config[cond.key] === "true" && (
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:11, color:S.muted }}>{cond.desc}</span>
                        <input type="number" value={config[cond.threshKey]??30} onChange={e => setConfig(c => ({ ...c, [cond.threshKey!]: e.target.value }))}
                          style={{ width:56, padding:"4px 8px", borderRadius:6, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:13 }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message templates for auto */}
              <div style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", color:S.sub, marginBottom:10 }}>Mensajes automáticos</div>
                <div style={{ fontSize:11, color:S.muted, marginBottom:10 }}>Variables: {"{speed}"} = velocidad, {"{dir}"} = dirección, {"{prev_dir}"} = dirección anterior</div>
                {[
                  { key:"auto_msg_wind_strong", label:"💨 Viento fuerte" },
                  { key:"auto_msg_wind_change", label:"🌀 Cambio de dirección" },
                  { key:"auto_msg_rain",         label:"🌧 Lluvia" },
                ].map(msg => (
                  <div key={msg.key} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:11, color:S.muted, marginBottom:3 }}>{msg.label}</div>
                    <textarea value={config[msg.key]??""} onChange={e => setConfig(c => ({ ...c, [msg.key]: e.target.value }))}
                      rows={2} style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.text, fontSize:12, outline:"none", resize:"vertical", boxSizing:"border-box" as const }} />
                  </div>
                ))}
              </div>

              {/* Save + test buttons */}
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                <button onClick={saveConfig} disabled={configSaving}
                  style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:S.accent, color:"#0a0a0a", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  {configSaving ? "Guardando..." : "💾 Guardar configuración"}
                </button>
                <button onClick={testAuto}
                  style={{ padding:"10px 16px", borderRadius:9, border:`1.5px solid ${S.border}`, background:"#1a1a1a", color:S.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  🧪 Test
                </button>
              </div>

              {autoTestResult && (
                <div style={{ background:"#0f0f0f", border:`1.5px solid ${S.border}`, borderRadius:10, padding:"12px", fontSize:12, color:"#34d399", fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
                  {autoTestResult}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent queries table — only in stats tab */}
        {tab === "stats" && <RecentTable pwd={pwd} />}
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
  if (!loaded) return (
    <div style={{ background:"#141414", border:`1.5px solid #2a2a2a`, borderRadius:14, padding:"1rem 1.1rem" }}>
      <button onClick={load} style={{ fontSize:13, color:"#0e9fa8", background:"none", border:"none", cursor:"pointer", padding:0 }}>
        Cargar registros recientes →
      </button>
    </div>
  );
  return (
    <div style={{ background:"#141414", border:`1.5px solid #2a2a2a`, borderRadius:14, padding:"1rem 1.1rem" }}>
      <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", color:"#444", marginBottom:10 }}>Registros recientes</div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
          <thead>
            <tr>{["Fecha","Viento","Lluvia","Dispositivo","OS","Navegador"].map(h => (
              <th key={h} style={{ textAlign:"left", padding:"4px 8px", fontWeight:500, color:"#666", borderBottom:"1px solid #2a2a2a" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom:"1px solid #1a1a1a" }}>
                <td style={{ padding:"5px 8px", color:"#ccc" }}>{String(r.fecha_consulta??'')}</td>
                <td style={{ padding:"5px 8px", color:"#0e9fa8" }}>{String(r.wind_direction??'')}</td>
                <td style={{ padding:"5px 8px" }}>{r.is_rainy ? "🌧" : "☀️"}</td>
                <td style={{ padding:"5px 8px", color:"#ccc" }}>{String(r.device_type??'')}</td>
                <td style={{ padding:"5px 8px", color:"#ccc" }}>{String(r.os??'')}</td>
                <td style={{ padding:"5px 8px", color:"#ccc" }}>{String(r.browser??'')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
