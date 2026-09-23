import { Loader2 } from "lucide-react";

// Colores por variante, usando los mismos tokens CSS que ya define index.css
// (--brand, --bg-subtle, --text-primary...) para que cualquier botón respete
// el tema claro/oscuro automáticamente, sin importar en qué pantalla se use.
const VARIANT_STYLES = {
  primary: {
    color: "#fff",
    backgroundColor: "var(--brand)",
  },
  secondary: {
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-subtle)",
  },
  danger: {
    color: "#fff",
    backgroundColor: "#ef4444",
  },
  ghost: {
    color: "var(--text-muted)",
    backgroundColor: "transparent",
  },
};

const SIZE_CLASSES = {
  sm: "px-3 py-2 text-xs rounded-xl",
  md: "px-4 py-3 text-sm rounded-2xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  style = {},
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${SIZE_CLASSES[size]} ${className}`}
      style={{ ...VARIANT_STYLES[variant], ...style }}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}
