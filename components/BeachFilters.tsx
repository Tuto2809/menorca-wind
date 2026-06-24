"use client";

import { MUNICIPALITIES, BEACH_TYPES, ALL_SERVICES, type Municipality, type BeachType } from "@/lib/beaches";
import { type T } from "@/lib/i18n";

export interface FilterState {
  municipality: Municipality | null;
  type: BeachType | null;
  services: string[];
  sortBy: "recommended" | "distance" | "length";
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  hasLocation: boolean;
  onRequestLocation: () => void;
  t: T;
}

const SERVICE_ICONS: Record<string, string> = {
  Chiringuito: "🍹", Salvamento: "🛟", Parking: "🅿️",
  Duchas: "🚿", Accesible: "♿", Kayak: "🚣", "Escuela kite": "🪁",
};

function Chip({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 999,
        border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
        background: active ? "var(--accent)" : "var(--bg-elevated)",
        color: active ? "#0a0a0a" : "var(--text-secondary)",
        fontSize: 12, fontWeight: 500, cursor: "pointer",
        whiteSpace: "nowrap", transition: "all 0.12s",
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
      {active && <span style={{ marginLeft: 2, opacity: 0.7, fontSize: 10 }}>✕</span>}
    </button>
  );
}

const scrollRow: React.CSSProperties = {
  display: "flex", gap: 6, overflowX: "auto",
  paddingBottom: 4, scrollbarWidth: "none",
};

const groupLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "var(--text-muted)",
  marginBottom: 7, marginTop: 14,
};

export default function BeachFilters({ filters, onChange, hasLocation, onRequestLocation, t }: Props) {
  function toggle<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  }
  function toggleService(svc: string) {
    const has = filters.services.includes(svc);
    onChange({ ...filters, services: has ? filters.services.filter(s => s !== svc) : [...filters.services, svc] });
  }
  function setSort(val: FilterState["sortBy"]) {
    if (val === "distance" && !hasLocation) { onRequestLocation(); return; }
    onChange({ ...filters, sortBy: val });
  }

  const hasAnyFilter = filters.municipality !== null || filters.type !== null ||
    filters.services.length > 0 || filters.sortBy !== "recommended";

  const SORT_OPTIONS = [
    { value: "recommended" as const, label: t.sortRecommended, icon: "🏆" },
    { value: "distance" as const, label: t.sortDistance, icon: "📍" },
    { value: "length" as const, label: t.sortLength, icon: "↔️" },
  ];

  return (
    <div>
      <div style={groupLabel}>Ordenar</div>
      <div style={scrollRow}>
        {SORT_OPTIONS.map(o => (
          <Chip key={o.value} label={o.label} icon={o.icon} active={filters.sortBy === o.value} onClick={() => setSort(o.value)} />
        ))}
        {!hasLocation && (
          <button onClick={onRequestLocation} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 999,
            border: "1.5px dashed var(--accent)", background: "var(--accent-dim)",
            color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            📍 {t.enableLocation}
          </button>
        )}
      </div>

      <div style={groupLabel}>{t.municipality}</div>
      <div style={scrollRow}>
        {MUNICIPALITIES.map(m => (
          <Chip key={m} label={m} active={filters.municipality === m} onClick={() => toggle("municipality", m)} />
        ))}
      </div>

      <div style={groupLabel}>{t.beachType}</div>
      <div style={scrollRow}>
        {BEACH_TYPES.map(bt => (
          <Chip key={bt} label={t.beachTypes[bt] ?? bt} active={filters.type === bt} onClick={() => toggle("type", bt)} />
        ))}
      </div>

      <div style={groupLabel}>{t.services}</div>
      <div style={scrollRow}>
        {ALL_SERVICES.map(s => (
          <Chip key={s} label={s} icon={SERVICE_ICONS[s]} active={filters.services.includes(s)} onClick={() => toggleService(s)} />
        ))}
      </div>

      {hasAnyFilter && (
        <button
          onClick={() => onChange({ municipality: null, type: null, services: [], sortBy: "recommended" })}
          style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {t.clearFilters}
        </button>
      )}
    </div>
  );
}
