import { X } from "lucide-react";

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, color, bg }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      background: "var(--bg-page)", borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: accent + "18", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} color={accent} />
      </div>
      <div>
        <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 20px", color: "#cbd5e1" }}>
      <Icon size={28} />
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, textAlign: "center" }}>{text}</p>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div>
      <label style={{
        fontSize: 11, fontWeight: 700, color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.05em",
        display: "block", marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── ModalWrapper ─────────────────────────────────────────────────────────────
export function ModalWrapper({ onClose, title, subtitle, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg-page)", width: "100%", maxWidth: 560,
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        margin: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 14px", borderBottom: "1px solid #f1f5f9",
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexShrink: 0, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            width: 36, height: 4, borderRadius: 99, background: "var(--border)",
          }} />
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-page)", border: "none", borderRadius: 8,
              padding: 8, cursor: "pointer", color: "var(--text-muted)", marginTop: 4,
            }}
          >
            <X size={17} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "16px 20px 24px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}