"use client";

import { MUNICIPALITIES, BEACH_TYPES, ALL_SERVICES, type Municipality, type BeachType } from "@/lib/beaches";

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
}

const chipBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 13px",
  borderRadius: 999,
  border: "1px solid #e0e0e0",
  background: "white",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 0.12s",
  userSelect: "none",
};

const chipActive: React.CSSProperties = {
  ...chipBase,
  background: "#1D9E75",
  border: "1px solid #1D9E75",
  color: "white",
};

function Chip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button style={active ? chipActive : chipBase} onClick={onClick}>
      {icon && <span>{icon}</span>}
      {label}
      {active && <span style={{ marginLeft: 2, opacity: 0.8, fontSize: 11 }}>✕</span>}
    </button>
  );
}

const SORT_OPTIONS: { value: FilterState["sortBy"]; label: string; icon: string }[] = [
  { value: "recommended", label: "Recomendadas", icon: "🏆" },
  { value: "distance",    label: "Más cercanas",  icon: "📍" },
  { value: "length",      label: "Más grandes",   icon: "↔️" },
];

const SERVICE_ICONS: Record<string, string> = {
  Chiringuito: "🍹",
  Salvamento: "🛟",
  Parking: "🅿️",
  Duchas: "🚿",
  Accesible: "♿",
  Kayak: "🚣",
  "Escuela kite": "🪁",
};

export default function BeachFilters({ filters, onChange, hasLocation, onRequestLocation }: Props) {
  function toggle<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  }

  function toggleService(svc: string) {
    const has = filters.services.includes(svc);
    onChange({
      ...filters,
      services: has ? filters.services.filter((s) => s !== svc) : [...filters.services, svc],
    });
  }

  function setSort(val: FilterState["sortBy"]) {
    if (val === "distance" && !hasLocation) {
      onRequestLocation();
      return;
    }
    onChange({ ...filters, sortBy: val });
  }

  const hasAnyFilter =
    filters.municipality !== null ||
    filters.type !== null ||
    filters.services.length > 0 ||
    filters.sortBy !== "recommended";

  const scrollRow: React.CSSProperties = {
    display: "flex",
    gap: 7,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  };

  const groupLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#aaa",
    marginBottom: 7,
    marginTop: 14,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Ordenar */}
      <div style={groupLabel}>Ordenar por</div>
      <div style={scrollRow}>
        {SORT_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            icon={o.icon}
            active={filters.sortBy === o.value}
            onClick={() => setSort(o.value)}
          />
        ))}
        {!hasLocation && (
          <button
            onClick={onRequestLocation}
            style={{ ...chipBase, color: "#1D9E75", border: "1px dashed #1D9E75" }}
          >
            📍 Activar ubicación
          </button>
        )}
      </div>

      {/* Municipio */}
      <div style={groupLabel}>Municipio</div>
      <div style={scrollRow}>
        {MUNICIPALITIES.map((m) => (
          <Chip
            key={m}
            label={m}
            active={filters.municipality === m}
            onClick={() => toggle("municipality", m)}
          />
        ))}
      </div>

      {/* Tipo */}
      <div style={groupLabel}>Tipo de playa</div>
      <div style={scrollRow}>
        {BEACH_TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            active={filters.type === t}
            onClick={() => toggle("type", t)}
          />
        ))}
      </div>

      {/* Servicios */}
      <div style={groupLabel}>Servicios</div>
      <div style={scrollRow}>
        {ALL_SERVICES.map((s) => (
          <Chip
            key={s}
            label={s}
            icon={SERVICE_ICONS[s]}
            active={filters.services.includes(s)}
            onClick={() => toggleService(s)}
          />
        ))}
      </div>

      {/* Clear all */}
      {hasAnyFilter && (
        <button
          onClick={() => onChange({ municipality: null, type: null, services: [], sortBy: "recommended" })}
          style={{ marginTop: 10, fontSize: 12, color: "#999", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Limpiar todos los filtros ✕
        </button>
      )}
    </div>
  );
}
