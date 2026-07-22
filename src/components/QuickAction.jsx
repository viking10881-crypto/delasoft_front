export default function QuickAction({
  icon,
  label,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition"
    >
      {icon}
      <span className="text-sm font-medium">
        {label}
      </span>
    </button>
  );
}
