export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[999] bg-[#F8FAFC] dark:bg-[#0B1220] flex flex-col items-center justify-center">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-2 rounded-full bg-brand/10 blur-2xl animate-pulse" />
        <img
          src="/brand/delasoft-d.png"
          alt="Delasoft"
          className="relative w-32 h-32 object-contain drop-shadow-xl animate-pulse"
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400 text-[10px] tracking-[0.4em] uppercase font-semibold">
          Cargando
        </span>
        <div className="w-16 h-[2px] bg-blue-100 dark:bg-blue-950 overflow-hidden relative rounded-full">
          <div className="absolute inset-0 bg-brand animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
