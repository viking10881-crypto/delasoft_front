// src/pages/tools/discounts/discountUtils.js

export const safeDate = (v) => (v ? String(v).split('T')[0] : '');

export const EMPTY_FORM = {
  name:        '',
  type:        'percentage',
  value:       '',
  starts_at:   '',
  ends_at:     '',
  target_type: 'product',
  category_id: '',
  scope:       'all',   // ← nuevo
};

/**
 * Devuelve el estado visual de un descuento según fechas y flag `active`.
 */
export function getDiscountStatus(d) {
  const now   = new Date(); now.setHours(0, 0, 0, 0);
  const start = d.starts_at ? new Date(d.starts_at) : null;
  const end   = d.ends_at   ? new Date(d.ends_at)   : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end)   end.setHours(0, 0, 0, 0);

  if (d.active === false)   return { key: 'inactive',  label: 'Inactiva',   color: 'slate'   };
  if (start && start > now) return { key: 'scheduled', label: 'Programada', color: 'amber'   };
  if (end   && end   < now) return { key: 'expired',   label: 'Expirada',   color: 'red'     };
  return                           { key: 'active',    label: 'Activa',     color: 'emerald' };
}

export const STATUS_STYLES = {
  active: {
    badge: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    card:  'border-gray-100 dark:border-white/[0.07]',
    icon:  'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  scheduled: {
    badge: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    card:  'border-amber-200/60 dark:border-amber-500/20',
    icon:  'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400',
  },
  expired: {
    badge: 'bg-red-100 dark:bg-red-500/15 text-red-500 dark:text-red-400',
    card:  'border-red-100 dark:border-red-500/20 opacity-50',
    icon:  'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-500',
  },
  inactive: {
    badge: 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-500',
    card:  'border-gray-100 dark:border-white/[0.07] opacity-50',
    icon:  'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-500',
  },
};

// Clase compartida para inputs del formulario
export const inputCls = `
  w-full px-4 py-3 rounded-xl text-sm outline-none transition-all
  bg-gray-100 dark:bg-white/[0.06]
  border border-gray-200 dark:border-white/[0.08]
  text-gray-900 dark:text-white
  placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-blue-500 dark:focus:border-blue-500/60
  focus:ring-2 focus:ring-blue-500/10
`;