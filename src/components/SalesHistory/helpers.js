// src/components/SalesHistory/helpers.js

// ── Mapa de estados de pago ───────────────────────────────────
export const STATUS_MAP = {
  paid: {
    label: "Pagada",
    light: "bg-emerald-50 text-emerald-700",
    dark:  "dark:bg-emerald-500/10 dark:text-emerald-400",
    dot:   "bg-emerald-500",
  },
  pending: {
    label: "Pendiente",
    light: "bg-amber-50 text-amber-700",
    dark:  "dark:bg-amber-500/10 dark:text-amber-400",
    dot:   "bg-amber-400",
  },
  partial: {
    label: "Abonado",
    light: "bg-blue-50 text-blue-700",
    dark:  "dark:bg-blue-500/10 dark:text-blue-400",
    dot:   "bg-blue-500",
  },
  cancelled: {
    label: "Cancelada",
    light: "bg-red-50 text-red-600",
    dark:  "dark:bg-red-500/10 dark:text-red-400",
    dot:   "bg-red-500",
  },
};

// ── Mapa de métodos de pago ───────────────────────────────────
export const PAYMENT_METHOD_MAP = {
  cash:     { label: "Efectivo",      icon: "💵" },
  transfer: { label: "Transferencia", icon: "🏦" },
  credit:   { label: "Tarjeta / Wompi", icon: "💳" },
  check:    { label: "Cheque",        icon: "📄" },
  fiado:    { label: "Crédito (Fiado)", icon: "🤝" },
};

// ── Helpers de fecha ──────────────────────────────────────────
export function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const date  = new Date(dateStr);
  const now   = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1)   return "Hace un momento";
  if (diffMin < 60)  return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)   return "Ayer";
  if (diffD < 7)     return `Hace ${diffD} días`;
  if (diffD < 30)    return `Hace ${Math.floor(diffD / 7)} sem`;
  if (diffD < 365)   return `Hace ${Math.floor(diffD / 30)} meses`;
  return `Hace ${Math.floor(diffD / 365)} año${Math.floor(diffD / 365) > 1 ? "s" : ""}`;
}

export function fullDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function shortDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/** Días que faltan (negativo = vencido) hasta una fecha */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(23, 59, 59, 0); // fin del día
  const diff = Math.round((target - new Date()) / 86400000);
  return diff;
}

/** Formato COP */
export function fmtCOP(n) {
  return Number(n ?? 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}