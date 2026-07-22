// components/dashboard/DashboardShared.jsx
// Primitivos compartidos entre todos los sub-componentes del dashboard

export const fmt    = (n, d = 0) => Number(n ?? 0).toLocaleString("es-CO", { maximumFractionDigits: d, minimumFractionDigits: d });
export const fmtCOP = (n) => `$${fmt(n)}`;
export const pct    = (a, b) => (b === 0 ? 0 : (((a - b) / b) * 100).toFixed(1));

export const COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444",
  "#3b82f6","#8b5cf6","#06b6d4","#f97316",
];

// ── Tooltip compartido ───────────────────────────────────────────
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "10px 14px", fontSize: 12,
    }}>
      <p style={{ fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, margin: "2px 0" }}>
          {p.name}: {fmtCOP(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 20, padding: "20px", ...style,
    }}>
      {children}
    </div>
  );
}

// ── SectionTitle ─────────────────────────────────────────────────
export function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{sub}</p>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{title}</h2>
    </div>
  );
}

// ── ChartLegend ──────────────────────────────────────────────────
export function ChartLegend({ items }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {items.map(([color, label]) => (
        <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block", flexShrink: 0 }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────────
export function EmptyState({ msg = "Sin datos disponibles" }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontWeight: 700, fontSize: 13 }}>
      {msg}
    </div>
  );
}