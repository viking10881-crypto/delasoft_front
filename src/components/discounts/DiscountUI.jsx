// src/pages/tools/discounts/components/DiscountUI.jsx
import { Clock, AlertTriangle } from 'lucide-react';
import { STATUS_STYLES } from '../../../utils/DiscountUtils';
// ── Toggle switch ────────────────────────────────────────────────────────────
export function ToggleSwitch({ checked, onChange, loading }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
        border-2 border-transparent transition-all duration-300 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/[0.12]'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg
        transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status.key];
  const Icon   = status.key === 'scheduled' ? Clock
               : status.key === 'expired'   ? AlertTriangle
               : null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${styles.badge}`}>
      {Icon && <Icon size={9} />}
      {status.label}
    </span>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ label = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-gray-200 dark:border-white/[0.08] rounded-full" />
        <div className="absolute inset-0 border-4 border-slate-900 dark:border-white rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-gray-400 dark:text-slate-500 animate-pulse">{label}</p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ onAction }) {
  return (
    <div className="bg-white dark:bg-white/[0.03] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.08] p-12 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
        {/* Tag icon inline to avoid extra import */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-gray-400 dark:text-slate-500">
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41z" />
          <circle cx="7" cy="7" r="1" />
        </svg>
      </div>
      <p className="font-bold text-gray-900 dark:text-white mb-1">Sin descuentos</p>
      <p className="text-sm text-gray-400 dark:text-slate-500 mb-5">
        Crea tu primera oferta para incentivar ventas
      </p>
      <button
        onClick={onAction}
        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
      >
        Crear oferta
      </button>
    </div>
  );
}