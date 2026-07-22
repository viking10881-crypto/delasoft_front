// src/components/inventory/ReservationsModal.jsx
import { useState, useEffect, useCallback } from "react";
import { X, Loader2, ShoppingCart, Clock, AlertTriangle, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function TimeRemaining({ expiresAt }) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return <span className="text-xs font-bold text-red-500">Expirada</span>;
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return (
    <span className="text-xs font-bold text-amber-500">
      {min}:{String(sec).padStart(2, "0")} min
    </span>
  );
}

export default function ReservationsModal({ item, onClose, onReleased }) {
  const { showNotice }   = useNotice();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(null); // id being released

  const productId = item.product_id ?? item.id;
  const title     = item.variant_sku ? `${item.name} — ${item.variant_sku}` : item.name;

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/inventory/reservations/active?productId=${productId}`)
      .then(({ data }) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch(() => showNotice("Error al cargar reservas", "error"))
      .finally(() => setLoading(false));
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const releaseOne = async (id) => {
    setReleasing(id);
    try {
      await api.delete(`/inventory/reservations/${id}`);
      showNotice("Reserva liberada", "success");
      load();
      onReleased?.();
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al liberar reserva", "error");
    } finally {
      setReleasing(null);
    }
  };

  const releaseAll = async () => {
    setReleasing("all");
    try {
      const expired = rows.filter(r => r.is_expired);
      await Promise.all(expired.map(r => api.delete(`/inventory/reservations/${r.id}`)));
      showNotice(`${expired.length} reserva${expired.length !== 1 ? "s" : ""} liberada${expired.length !== 1 ? "s" : ""}`, "success");
      load();
      onReleased?.();
    } catch (err) {
      showNotice("Error al liberar reservas", "error");
    } finally {
      setReleasing(null);
    }
  };

  const expiredCount = rows.filter(r => r.is_expired).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#161b27] flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between bg-indigo-50 dark:bg-indigo-500/10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShoppingCart size={13} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Reservas activas</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">{title}</h2>
            {!loading && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {rows.length} reserva{rows.length !== 1 ? "s" : ""} activa{rows.length !== 1 ? "s" : ""}
                {expiredCount > 0 && ` · ${expiredCount} expirada${expiredCount !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full border bg-white dark:bg-white/[0.06] border-indigo-200 dark:border-indigo-500/30 text-gray-400 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Acción global */}
        {expiredCount > 0 && (
          <div className="px-6 pt-4 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {expiredCount} reserva{expiredCount !== 1 ? "s han" : " ha"} expirado — el stock sigue bloqueado hasta que el cron las limpie
                </p>
              </div>
              <button
                onClick={releaseAll}
                disabled={!!releasing}
                className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-60"
              >
                {releasing === "all" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Liberar expiradas
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-indigo-500" size={26} />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">Sin reservas activas para este producto</p>
          ) : rows.map((r) => (
            <div key={r.id} className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              r.is_expired
                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                : "bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.06]"
            }`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {r.quantity} ud{r.quantity !== 1 ? "s" : ""}
                  </span>
                  {r.user_name ? (
                    <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[150px]">{r.user_name}</span>
                  ) : r.session_id ? (
                    <span className="text-xs font-mono text-gray-400 dark:text-slate-500 truncate max-w-[120px]">{r.session_id.slice(0, 12)}…</span>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-slate-600">anónimo</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500">
                    <Clock size={10} /> {fmtDate(r.created_at)}
                  </span>
                  <span className="text-[11px] text-gray-300 dark:text-slate-600">·</span>
                  {r.is_expired
                    ? <span className="text-xs font-bold text-red-500">Expirada</span>
                    : <TimeRemaining expiresAt={r.expires_at} />
                  }
                </div>
              </div>
              <button
                onClick={() => releaseOne(r.id)}
                disabled={!!releasing}
                className="ml-3 flex-shrink-0 p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 transition-all disabled:opacity-50"
                title="Liberar esta reserva"
              >
                {releasing === r.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
