export const CATEGORIES = [
  { value: "Productos Terminados", label: "Productos Terminados", emoji: "📦" },
  { value: "Materia Prima",        label: "Materia Prima",        emoji: "🏗️" },
  { value: "Servicios",            label: "Servicios",            emoji: "⚡" },
];

export const PAYMENT_METHODS = [
  { value: "cash",     label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "credit",   label: "Crédito" },
  { value: "check",    label: "Cheque" },
];

export const STATUS_CONFIG = {
  pending:   { label: "Pendiente", color: "#b45309", bg: "#fef3c7" },
  received:  { label: "Recibida",  color: "#065f46", bg: "#d1fae5" },
  draft:     { label: "Borrador",  color: "#374151", bg: "#f3f4f6" },
  cancelled: { label: "Cancelada", color: "#991b1b", bg: "#fee2e2" },
};

export const PAYMENT_STATUS_CONFIG = {
  paid:    { label: "Pagado",    color: "#065f46", bg: "#d1fae5" },
  pending: { label: "Pendiente", color: "#b45309", bg: "#fef3c7" },
  partial: { label: "Parcial",   color: "#1e40af", bg: "#dbeafe" },
};

export const fmtCOP = (n) =>
  Number(n || 0).toLocaleString("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  });

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

export const inputStyle = (extra = {}) => ({
  width: "100%", background: "var(--bg-page)", border: "1px solid var(--border)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box", ...extra,
});

export const primaryBtn = {
  width: "100%", background: "var(--bg-card)", color: "var(--text-primary)",
  border: "none", borderRadius: 12, padding: "14px",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};

export const quickLink = (bg, color) => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 36, height: 36, borderRadius: 10, background: bg, color,
  textDecoration: "none",
});