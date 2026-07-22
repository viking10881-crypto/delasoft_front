/**
 * SkeletonCard
 * Placeholder animado que se muestra mientras cargan las ventas.
 */
export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#131B2A] rounded-xl border border-gray-100 dark:border-white/[0.06] p-3.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-24" />
            <div className="h-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-full w-14" />
          </div>
          <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded-full w-36" />
        </div>
        <div className="h-4 bg-gray-100 dark:bg-white/[0.06] rounded-full w-16 flex-shrink-0" />
      </div>
    </div>
  );
}