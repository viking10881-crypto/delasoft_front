export default function QuickAction({
  icon,
  label,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl shadow p-4 flex flex-col items-center justify-center gap-2 transition-colors hover:bg-[var(--bg-subtle)]"
      style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
    >
      {icon}
      <span className="text-sm font-medium">
        {label}
      </span>
    </button>
  );
}
