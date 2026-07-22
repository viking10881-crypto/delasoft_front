export default function KpiCard({ title, value, subtitle, trend, icon: Icon, variant = "default", loading = false }) {
  const variants = {
    success: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    danger:  "bg-red-50    dark:bg-red-500/10     text-red-600    dark:text-red-400    border-red-100    dark:border-red-500/20",
    warning: "bg-amber-50  dark:bg-amber-500/10   text-amber-600  dark:text-amber-400  border-amber-100  dark:border-amber-500/20",
    primary: "bg-blue-50   dark:bg-blue-500/10    text-blue-600   dark:text-blue-400   border-blue-100   dark:border-blue-500/20",
    default: "bg-[--bg-subtle] text-[--text-secondary] border-[--border]",
  };

  if (loading) {
    return (
      <div className="bg-[--bg-card] p-3 sm:p-5 rounded-xl border border-[--border] shadow-sm animate-pulse">
        <div className="h-8 bg-[--bg-subtle] rounded-lg mb-3" />
        <div className="h-3 bg-[--bg-subtle] rounded w-1/2 mb-2" />
        <div className="h-5 bg-[--bg-subtle] rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="bg-[--bg-card] p-3 sm:p-5 rounded-xl border border-[--border] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`p-2 rounded-lg border ${variants[variant]}`}>
          <Icon size={16} className="sm:hidden" />
          <Icon size={18} className="hidden sm:block" />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${
            trend >= 0
              ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
              : "text-red-700  dark:text-red-400  bg-red-50  dark:bg-red-500/10"
          }`}>
            {trend >= 0 ? "+" : ""}{Number(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[9px] sm:text-[10px] font-bold text-[--text-muted] uppercase tracking-wider mb-1 leading-tight">
        {title}
      </p>
      <p className="text-base sm:text-xl font-bold text-[--text-primary] leading-tight truncate">
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] sm:text-xs text-[--text-muted] mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  );
}