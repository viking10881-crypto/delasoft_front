import { useNavigate } from "react-router-dom";
import { useSubscription } from "../context/SubscriptionContext";
import { Lock, Crown, ChevronRight } from "lucide-react";

export function ProtectedFeature({ feature, resource, children, fallback, showUpgrade = true }) {
  const { canUse, hasRoom } = useSubscription();
  const navigate = useNavigate();

  if (feature && !canUse(feature)) {
    if (fallback) return fallback;
    if (!showUpgrade) return null;

    return (
      <div className="relative group">
        <div className="absolute inset-0 z-10 bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center gap-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
            <Lock size={20} className="text-violet-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white text-sm">Función bloqueada</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Actualiza tu plan para acceder a esta funcionalidad
            </p>
          </div>
          <button
            onClick={() => navigate("/subscription")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all active:scale-95"
          >
            <Crown size={12} /> Ver planes <ChevronRight size={12} />
          </button>
        </div>
        <div className="pointer-events-none select-none opacity-30 blur-[1px]">
          {children}
        </div>
      </div>
    );
  }

  if (resource && !hasRoom(resource)) {
    if (fallback) return fallback;
    if (!showUpgrade) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
        <Lock size={13} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 flex-1">
          Límite de {resource} alcanzado
        </p>
        <button
          onClick={() => navigate("/subscription")}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Actualizar
        </button>
      </div>
    );
  }

  return children;
}

export function UsageBar({ resource, label, className = "" }) {
  const { limits } = useSubscription();
  if (!limits?.limits) return null;

  const l = limits.limits[resource];
  if (!l) return null;

  const { max, used } = l;
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / max) * 100));

  const color =
    pct >= 90 ? "bg-red-500" :
    pct >= 70 ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
          {isUnlimited ? `${used} / ∞` : `${used} / ${max}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
