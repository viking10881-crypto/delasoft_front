const COLOR_MAP = {
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber:   "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  violet:  "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
  slate:   "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400",
};

export default function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-[#131B2A] rounded-xl border border-gray-100 dark:border-white/[0.06] p-3.5 flex items-center gap-3 transition-colors duration-300">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-base font-black text-gray-900 dark:text-white leading-none truncate">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}