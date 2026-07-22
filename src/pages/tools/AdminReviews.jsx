import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, CheckCircle2, XCircle, Trash2, Eye,
  RefreshCw, Loader2, BadgeCheck, Flag, ChevronDown,
  Sparkles, MessageSquare
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import useRealtimeData from "../../hooks/useRealtimeData";
import ConfirmModal from "../../components/ConfirmModal";
import ReviewDetailModal from "../../components/reviews/ReviewDetailModal";

const LIMIT = 20;

// ── Helper de tema para toasts ────────────────────────────────────────────────
// react-hot-toast no conoce el tema, así que lo leemos del <html> al vuelo.
const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const toastStyle = () =>
  isDark()
    ? { background: "#171717", color: "#fff", border: "1px solid #333" }
    : { background: "#ffffff", color: "#0a0a0a", border: "1px solid #e5e5e5" };

// ── Configuraciones de Estado (adaptables a tema) ─────────────────────────────
const STATUS_CFG = {
  pending: {
    label: "Pendiente",
    color: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_15px_rgba(251,191,36,0.15)]",
    dot: "bg-amber-500 dark:bg-amber-400",
    bar: "bg-amber-500/60 dark:bg-amber-400/50",
  },
  approved: {
    label: "Aprobada",
    color: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_15px_rgba(52,211,153,0.15)]",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    bar: "bg-emerald-500/60 dark:bg-emerald-400/50",
  },
  rejected: {
    label: "Rechazada",
    color: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    glow: "shadow-[0_0_15px_rgba(251,113,133,0.15)]",
    dot: "bg-rose-500 dark:bg-rose-400",
    bar: "bg-rose-500/60 dark:bg-rose-400/50",
  },
  flagged: {
    label: "Reportada",
    color: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    glow: "shadow-[0_0_15px_rgba(192,132,252,0.15)]",
    dot: "bg-purple-500 dark:bg-purple-400",
    bar: "bg-purple-500/60 dark:bg-purple-400/50",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.glow} backdrop-blur-md transition-all duration-300`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div key={i} whileHover={{ scale: 1.2, rotate: 15 }} className="cursor-default">
          <Star
            size={12}
            className={
              i <= rating
                ? "text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]"
                : "text-neutral-300 dark:text-white/10"
            }
          />
        </motion.div>
      ))}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Animaciones ───────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const rowVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } }
};

// ── Skeleton Loaders (Efecto Escáner) ─────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl h-16 mb-3 block w-full">
      <td colSpan={7} style={{ position: "relative", overflow: "hidden", display: "block", height: "100%" }}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.06] to-transparent w-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl h-32">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.06] to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </div>
  );
}

// ── Estado vacío (reutilizable en tabla y tarjetas) ───────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center relative backdrop-blur-md">
          <CheckCircle2 size={24} className="text-indigo-500/60 dark:text-indigo-400/50" />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-[14px] font-medium text-neutral-700 dark:text-white/70">Bandeja Despejada</p>
        <p className="text-[11px] font-mono text-neutral-400 dark:text-white/30">No se detectan anomalías ni pendientes.</p>
      </div>
    </div>
  );
}

// ── Fila de tabla (escritorio) ────────────────────────────────────────────────
function ReviewRow({ review, busy, onApprove, onReject, onView, onDelete }) {
  const thumb = review.product?.thumbnail ?? review.product?.image_url;
  const cfg = STATUS_CFG[review.status] ?? STATUS_CFG.pending;

  return (
    <motion.tr
      variants={rowVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="group relative bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] backdrop-blur-md transition-all duration-300"
    >
      {/* Borde izquierdo iluminado */}
      <td className="w-1 p-0 relative overflow-hidden rounded-l-2xl">
        <div className={`absolute inset-y-0 left-0 w-1 ${cfg.bar} transition-colors duration-300`} />
      </td>

      {/* Producto */}
      <td className="px-5 py-4 w-64">
        <div className="flex items-center gap-4">
          <div className="relative group-hover:scale-105 transition-transform duration-300">
            {thumb ? (
              <>
                <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src={thumb} alt="product" className="relative w-11 h-11 rounded-xl object-cover border border-black/10 dark:border-white/10" />
              </>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                <Sparkles size={16} className="text-neutral-400 dark:text-white/30" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{review.product?.name ?? "Desconocido"}</span>
            <span className="text-[11px] text-neutral-500 dark:text-white/40 truncate">{review.user?.name ?? review.user?.email ?? "Usuario Anónimo"}</span>
          </div>
        </div>
      </td>

      {/* Rating */}
      <td className="px-5 py-4 w-32">
        <div className="flex flex-col gap-1.5">
          <StarRating rating={review.rating} />
          <span className="text-[10px] font-mono text-neutral-500 dark:text-white/40">{Number(review.rating).toFixed(1)} / 5.0</span>
        </div>
      </td>

      {/* Comentario */}
      <td className="px-5 py-4 max-w-xs">
        <div className="relative">
          <p className="text-[12px] text-neutral-600 dark:text-white/70 line-clamp-2 leading-relaxed font-light">
            {review.comment ?? review.body ?? <span className="italic opacity-50">Sin comentario...</span>}
          </p>
          {review.is_verified && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <BadgeCheck size={12} /> Compra Verificada
            </span>
          )}
        </div>
      </td>

      {/* Estado & Reportes */}
      <td className="px-5 py-4 w-40">
        <div className="flex flex-col gap-2 items-start">
          <StatusBadge status={review.status} />
          {(review.reports_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <Flag size={10} /> {review.reports_count} Reportes
            </span>
          )}
        </div>
      </td>

      {/* Fecha */}
      <td className="px-5 py-4 w-28">
        <span className="text-[11px] font-mono text-neutral-500 dark:text-white/40">{fmtDate(review.created_at)}</span>
      </td>

      {/* Acciones */}
      <td className="px-5 py-4 rounded-r-2xl w-48 text-right">
        {busy ? (
          <div className="flex justify-end pr-4">
            <Loader2 size={18} className="animate-spin text-indigo-500 dark:text-indigo-400" />
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
            {review.status !== "approved" && (
              <ActionBtn tooltip="Aprobar" color="text-emerald-600 dark:text-emerald-400" hoverBg="hover:bg-emerald-500/20" border="hover:border-emerald-500/50" onClick={onApprove}>
                <CheckCircle2 size={16} />
              </ActionBtn>
            )}
            {review.status !== "rejected" && (
              <ActionBtn tooltip="Rechazar" color="text-rose-600 dark:text-rose-400" hoverBg="hover:bg-rose-500/20" border="hover:border-rose-500/50" onClick={onReject}>
                <XCircle size={16} />
              </ActionBtn>
            )}
            <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" /> {/* Separador */}
            <ActionBtn tooltip="Inspeccionar" color="text-indigo-600 dark:text-indigo-400" hoverBg="hover:bg-indigo-500/20" border="hover:border-indigo-500/50" onClick={onView}>
              <Eye size={16} />
            </ActionBtn>
            <ActionBtn tooltip="Purgar" color="text-neutral-500 dark:text-neutral-400" hoverBg="hover:bg-red-500/20" border="hover:border-red-500/50" hoverColor="hover:text-red-500 dark:hover:text-red-400" onClick={onDelete}>
              <Trash2 size={16} />
            </ActionBtn>
          </div>
        )}
      </td>
    </motion.tr>
  );
}

// ── Tarjeta (móvil / pantallas pequeñas) ──────────────────────────────────────
function ReviewCard({ review, busy, onApprove, onReject, onView, onDelete }) {
  const thumb = review.product?.thumbnail ?? review.product?.image_url;
  const cfg = STATUS_CFG[review.status] ?? STATUS_CFG.pending;

  return (
    <motion.div
      variants={rowVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="group relative overflow-hidden rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-md p-4"
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${cfg.bar}`} />

      <div className="flex items-start gap-3">
        {thumb ? (
          <img src={thumb} alt="product" className="w-12 h-12 rounded-xl object-cover border border-black/10 dark:border-white/10 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-neutral-400 dark:text-white/30" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{review.product?.name ?? "Desconocido"}</p>
              <p className="text-[11px] text-neutral-500 dark:text-white/40 truncate">{review.user?.name ?? review.user?.email ?? "Usuario Anónimo"}</p>
            </div>
            <StatusBadge status={review.status} />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={review.rating} />
            <span className="text-[10px] font-mono text-neutral-500 dark:text-white/40">{Number(review.rating).toFixed(1)}/5.0</span>
          </div>
        </div>
      </div>

      <p className="text-[12px] text-neutral-600 dark:text-white/70 line-clamp-3 leading-relaxed font-light mt-3">
        {review.comment ?? review.body ?? <span className="italic opacity-50">Sin comentario...</span>}
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {review.is_verified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <BadgeCheck size={12} /> Verificada
          </span>
        )}
        {(review.reports_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
            <Flag size={10} /> {review.reports_count} Reportes
          </span>
        )}
        <span className="text-[10px] font-mono text-neutral-400 dark:text-white/30 ml-auto">{fmtDate(review.created_at)}</span>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
        {busy ? (
          <div className="flex-1 flex justify-center py-1">
            <Loader2 size={18} className="animate-spin text-indigo-500 dark:text-indigo-400" />
          </div>
        ) : (
          <>
            {review.status !== "approved" && (
              <button
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-transform"
              >
                <CheckCircle2 size={14} /> Aprobar
              </button>
            )}
            {review.status !== "rejected" && (
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 active:scale-95 transition-transform"
              >
                <XCircle size={14} /> Rechazar
              </button>
            )}
            <button
              onClick={onView}
              aria-label="Inspeccionar"
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 active:scale-95 transition-transform"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={onDelete}
              aria-label="Eliminar"
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 active:scale-95 transition-transform"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({ tooltip, color, hoverBg, border, hoverColor, onClick, children }) {
  return (
    <div className="relative group/btn flex items-center justify-center">
      <button
        onClick={onClick}
        aria-label={tooltip}
        className={`w-8 h-8 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 border border-transparent ${color} ${hoverColor || color} ${hoverBg} ${border} transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg`}
      >
        {children}
      </button>
      <span className="absolute -top-8 bg-neutral-900 dark:bg-black/80 backdrop-blur-md border border-neutral-700 dark:border-white/10 text-[10px] font-bold text-white px-2 py-1 rounded-md opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
        {tooltip}
      </span>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, flagged: 0, total: 0 });
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [detailReview, setDetailReview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Normaliza las columnas planas del backend a la forma que espera la UI ──
  const normalize = (r) => ({
    ...r,
    product:       { name: r.product_name },
    user:          { name: r.user_name },
    is_verified:   r.is_verified_purchase,
    reports_count: r.report_count,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setReviews([]);
    setPage(1);
    try {
      const params = { page: 1, limit: LIMIT, status: tab };
      const { data } = await api.get("/reviews/admin/pending", { params });
      const rows = (data.reviews ?? data.data ?? []).map(normalize);
      setReviews(rows);
      setHasMore(rows.length === LIMIT);
      if (data.counts) setCounts(data.counts);
      else setCounts((prev) => ({ ...prev, total: data.meta?.total ?? data.total ?? rows.length }));
    } catch {
      toast.error("Error en la matriz de datos.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useRealtimeData(["reviews"], fetchReviews);

  // ── Cargar más ────────────────────────────────────────────────────────────
  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = { page: nextPage, limit: LIMIT, status: tab };
      const { data } = await api.get("/reviews/admin/pending", { params });
      const rows = (data.reviews ?? data.data ?? []).map(normalize);
      setReviews((prev) => [...prev, ...rows]);
      setHasMore(rows.length === LIMIT);
      setPage(nextPage);
    } catch {
      toast.error("Anomalía detectada al expandir registros.");
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    setActionId(id);
    try {
      await api.patch(`/reviews/${id}/status`, { status });
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (detailReview?.id === id) setDetailReview((prev) => ({ ...prev, status }));
      toast.success(status === "approved" ? "Autorización concedida." : "Registro denegado.", {
        icon: status === "approved" ? "🟢" : "🔴",
        style: toastStyle(),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Fallo en la anulación.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setActionId(id);
    try {
      const { data } = await api.delete(`/reviews/${id}`);
      const publicIds = data?.publicIds ?? data?.public_ids ?? [];
      if (publicIds.length) {
        try { await api.post("/upload/delete", { publicIds }); } catch (_) {}
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (detailReview?.id === id) setDetailReview(null);
      setConfirmDelete(null);
      toast.success("Datos purgados del sistema.", {
        icon: "🗑️", style: toastStyle(),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error de eliminación.");
    } finally {
      setActionId(null);
    }
  };

  const tabs = [
    { key: "pending", label: "Pendientes", count: counts.pending, icon: <Loader2 size={14} /> },
    { key: "flagged", label: "Críticas", count: counts.flagged, icon: <Flag size={14} /> },
    { key: "all",     label: "Archivo Total", count: counts.total, icon: <MessageSquare size={14} /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-white transition-colors duration-300">
      {/* Elementos de fondo (Glows abstractos) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] dark:opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Terminal de Moderación</p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-neutral-900/40 dark:from-white dark:via-white/80 dark:to-white/40">
              Análisis de Reseñas
            </h1>
            <p className="text-[13px] mt-2 font-light text-neutral-500 dark:text-white/50 max-w-md">
              Monitorea, filtra y depura la retroalimentación de los usuarios en tiempo real.
              Hay <strong className="text-neutral-900 dark:text-white">{counts.pending} módulos</strong> requiriendo atención.
            </p>
          </div>

          <button
            onClick={fetchReviews}
            disabled={loading}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-md overflow-hidden relative shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <RefreshCw size={14} className={`text-indigo-600 dark:text-indigo-400 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            <span className="text-[12px] font-bold tracking-wide">Sincronizar</span>
          </button>
        </div>

        {/* Navegación Segmentada (scroll horizontal en móvil) */}
        <div className="mb-8 -mx-1 px-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.02] p-1.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.05] w-max backdrop-blur-md">
            {tabs.map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors duration-300 z-10 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 dark:text-white/40 hover:text-neutral-700 dark:hover:text-white/70"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-black/[0.06] dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.04)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {t.icon}
                    {t.label}
                    {t.count > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono ${
                        isActive
                          ? "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/30"
                          : "bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-white/50"
                      }`}>
                        {t.count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Vista escritorio: tabla ─── */}
        <div className="hidden md:block overflow-x-auto pb-10 scrollbar-hide">
          <table className="w-full text-sm border-separate border-spacing-y-2 min-w-[900px]">
            <thead>
              <tr>
                {["", "Entidad", "Calificación", "Registro Vocal", "Estatus", "Marca Temporal", "Directivas"].map((h, i) => (
                  <th
                    key={i}
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-400 dark:text-white/30 border-b border-black/[0.06] dark:border-white/5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
              {loading && [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}

              <AnimatePresence mode="popLayout">
                {!loading && reviews.length === 0 && (
                  <motion.tr
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <td colSpan={7}>
                      <EmptyState />
                    </td>
                  </motion.tr>
                )}

                {!loading && reviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    busy={actionId === review.id}
                    onApprove={() => handleStatusChange(review.id, "approved")}
                    onReject={() => handleStatusChange(review.id, "rejected")}
                    onView={() => setDetailReview(review)}
                    onDelete={() => setConfirmDelete({ id: review.id })}
                  />
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>

        {/* ─── Vista móvil: tarjetas ─── */}
        <div className="md:hidden pb-10">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && reviews.length === 0 && <EmptyState />}

          {!loading && reviews.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    busy={actionId === review.id}
                    onApprove={() => handleStatusChange(review.id, "approved")}
                    onReject={() => handleStatusChange(review.id, "rejected")}
                    onView={() => setDetailReview(review)}
                    onDelete={() => setConfirmDelete({ id: review.id })}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Botón Cargar Más */}
        {hasMore && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group relative overflow-hidden flex items-center gap-3 text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-500 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 transition-all duration-300 active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform text-indigo-500 dark:text-indigo-400" />
                  <span>Extraer Más Registros</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Modales */}
      {detailReview && (
        <ReviewDetailModal
          review={detailReview}
          onClose={() => setDetailReview(null)}
          onApprove={(id) => handleStatusChange(id, "approved")}
          onReject={(id) => handleStatusChange(id, "rejected")}
          onDelete={(id) => setConfirmDelete({ id })}
          busy={actionId === detailReview.id}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Protocolo de Eliminación"
        message="ADVERTENCIA: Esta acción desintegrará el registro de la base de datos de forma irreversible. ¿Confirmas la purga?"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}