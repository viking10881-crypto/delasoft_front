// src/pages/tools/discounts/components/DiscountCard.jsx
import { Percent, DollarSign, Calendar, Edit3, Trash2, Monitor, ShoppingBag, Globe } from 'lucide-react';
import { getDiscountStatus, STATUS_STYLES } from '../../../utils/DiscountUtils';
import { ToggleSwitch, StatusBadge } from './DiscountUI'; // misma carpeta, sin cambios

export default function DiscountCard({
  discount,
  categories,
  isToggling,
  onToggle,
  onEdit,
  onDelete,
}) {
  const d         = discount;
  const status    = getDiscountStatus(d);
  const styles    = STATUS_STYLES[status.key];
  const switchOn  = d.active !== false;

  const startStr = d.starts_at ? new Date(d.starts_at).toLocaleDateString('es-CO') : '—';
  const endStr   = d.ends_at   ? new Date(d.ends_at).toLocaleDateString('es-CO')   : '—';

  // Compute target label
  const targets = Array.isArray(d.targets) ? d.targets : [];
  let targetLabel = null;
  if (targets.length) {
    const first = targets[0];
    if (first.target_type === 'category') {
      const cat = categories.find(c => c.id.toString() === first.target_id?.toString());
      targetLabel = cat ? `Categoría: ${cat.name}` : `Categoría #${first.target_id}`;
    } else {
      targetLabel = `${targets.length} producto${targets.length !== 1 ? 's' : ''}`;
    }
  }

  return (
    <div className={`bg-white dark:bg-white/[0.03] border rounded-2xl p-4 sm:p-5
      transition-all duration-200 hover:shadow-md dark:hover:shadow-black/20 ${styles.card}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
          {d.type === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badge + value */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                  {d.name}
                </h4>
                <StatusBadge status={status} />
              </div>

              <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500 text-xs mb-0.5">
                <Calendar size={11} />
                <span>{startStr} → {endStr}</span>
              </div>

              {targetLabel && (
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{targetLabel}</p>
              )}

              {/* Badge de canal (scope) */}
              {(() => {
                const scopeCfg = {
                  web: { label: 'Web',   Icon: Monitor,     cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' },
                  pos: { label: 'POS',   Icon: ShoppingBag, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
                  all: { label: 'Todos', Icon: Globe,        cls: 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-400 border-gray-200 dark:border-white/[0.08]' },
                };
                const { label, Icon, cls } = scopeCfg[d.scope] ?? scopeCfg.all;
                return (
                  <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${cls}`}>
                    <Icon size={9} />
                    {label}
                  </span>
                );
              })()}

              {/* Contextual hints */}
              {switchOn && status.key === 'expired' && (
                <p className="text-[10px] text-red-400 mt-0.5">Campaña vencida — actualiza las fechas</p>
              )}
              {switchOn && status.key === 'scheduled' && (
                <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5">Se activará en la fecha de inicio</p>
              )}
              {!switchOn && (
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Desactivada manualmente</p>
              )}
            </div>

            {/* Value pill */}
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-black ${
              status.key === 'active'
                ? d.type === 'percentage'
                  ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                  : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-slate-500'
            }`}>
              {d.type === 'percentage' ? `-${d.value}%` : `-$${d.value}`}
            </span>
          </div>

          {/* Footer: toggle + actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                {isToggling ? '...' : switchOn ? 'Activo' : 'Inactivo'}
              </span>
              <ToggleSwitch
                checked={switchOn}
                loading={isToggling}
                onChange={(val) => onToggle(d, val)}
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(d)}
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => onDelete(d.id)}
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}