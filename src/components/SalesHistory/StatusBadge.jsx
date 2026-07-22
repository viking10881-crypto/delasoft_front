import { STATUS_MAP } from "./helpers";

/**
 * StatusBadge
 * Muestra una pastilla de color según el estado de pago.
 * Props:
 *   status — "paid" | "pending" | "partial" | "cancelled"
 *   dot    — boolean, mostrar punto de color al inicio
 */
export default function StatusBadge({ status, dot = false }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cfg.light} ${cfg.dark}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      )}
      {cfg.label}
    </span>
  );
}