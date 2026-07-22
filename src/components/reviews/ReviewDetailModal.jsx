// src/components/reviews/ReviewDetailModal.jsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  X, Star, CheckCircle2, XCircle, Trash2, BadgeCheck,
  Flag, User, Calendar, Package, Loader2, ShieldAlert,
} from "lucide-react";

const STATUS_CFG = {
  pending:  { label: "Pendiente", bg: "bg-amber-100 dark:bg-amber-500/15",   text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500"   },
  approved: { label: "Aprobada",  bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  rejected: { label: "Rechazada", bg: "bg-red-100 dark:bg-red-500/15",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500"    },
  flagged:  { label: "Reportada", bg: "bg-orange-100 dark:bg-orange-500/15",   text: "text-orange-700 dark:text-orange-400",   dot: "bg-orange-500"  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={i <= rating ? "text-amber-400 fill-amber-400" : "text-neutral-300 dark:text-slate-700"}
        />
      ))}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReviewDetailModal({ review, onClose, onApprove, onReject, onDelete, busy }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const images  = review.images  ?? review.photos ?? [];
  const reports = review.reports ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-7 py-4 sm:pt-6 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Detalle de reseña
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <StarRating rating={review.rating} />
              <span className="text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
                {review.rating}/5
              </span>
              {review.is_verified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck size={13} /> Verificada
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={review.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: User,     label: "Usuario",  value: review.user?.name ?? review.user?.email ?? "—" },
              { icon: Package,  label: "Producto", value: review.product?.name ?? "—" },
              { icon: Calendar, label: "Fecha",    value: fmtDate(review.created_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={11} style={{ color: "var(--text-muted)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                </div>
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Título */}
          {review.title && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Título
              </p>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {review.title}
              </p>
            </div>
          )}

          {/* Comentario completo */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Comentario
            </p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {review.comment ?? review.body ?? "Sin comentario"}
            </p>
          </div>

          {/* Imágenes */}
          {images.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Imágenes ({images.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => {
                  const src = typeof img === "string" ? img : img.url;
                  return (
                    <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                      <img
                        src={src}
                        alt={`Imagen ${i + 1}`}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border transition-opacity hover:opacity-80"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reportes */}
          {reports.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}
              >
                <ShieldAlert size={14} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                  Reportes ({reports.length})
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {reports.map((r, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag size={11} className="text-orange-500" />
                      <span className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                        {r.reason ?? "Motivo no especificado"}
                      </span>
                    </div>
                    {r.detail && (
                      <p className="text-[12px] ml-5" style={{ color: "var(--text-secondary)" }}>
                        {r.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div
          className="flex gap-2 px-5 sm:px-7 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {busy ? (
            <div className="flex-1 flex items-center justify-center py-3">
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : (
            <>
              {review.status !== "approved" && (
                <button
                  onClick={() => onApprove(review.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                  style={{ background: "#16a34a" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#16a34a")}
                >
                  <CheckCircle2 size={15} /> Aprobar
                </button>
              )}
              {review.status !== "rejected" && (
                <button
                  onClick={() => onReject(review.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                  style={{ background: "#dc2626" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
                >
                  <XCircle size={15} /> Rechazar
                </button>
              )}
              <button
                onClick={() => { onDelete(review.id); onClose(); }}
                className="w-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-95"
                style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                title="Eliminar reseña"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-subtle)";
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
