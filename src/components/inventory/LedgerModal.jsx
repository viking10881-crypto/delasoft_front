// src/components/inventory/LedgerModal.jsx
import { useState, useEffect } from "react";
import { X, Loader2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import api from "../../services/api";

const MOVEMENT_CFG = {
  initial_stock:        { label: "Stock inicial",    color: "text-blue-500",    sign: "+" },
  purchase_received:    { label: "Compra recibida",  color: "text-emerald-500", sign: "+" },
  return:               { label: "Devolución",       color: "text-emerald-500", sign: "+" },
  manual_adjustment:    { label: "Ajuste manual",    color: "text-amber-500",   sign: null },
  sale_confirmed:       { label: "Venta",            color: "text-red-500",     sign: "-" },
  sale_cancelled:       { label: "Cancelación",      color: "text-emerald-500", sign: "+" },
  damage_loss:          { label: "Merma/daño",       color: "text-red-500",     sign: "-" },
  reservation_created:  { label: "Reserva",          color: "text-indigo-500",  sign: null },
  reservation_released: { label: "Res. liberada",    color: "text-gray-400",    sign: null },
  reservation_confirmed:{ label: "Res. confirmada",  color: "text-red-500",     sign: "-" },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function LedgerModal({ item, onClose }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const productId = item.product_id ?? item.id;
  const title     = item.variant_sku ? `${item.name} — ${item.variant_sku}` : item.name;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/inventory/ledger?productId=${productId}&limit=100`)
      .then(({ data }) => {
        if (!cancelled) setRows(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => { if (!cancelled) setError("Error al cargar historial"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#161b27] flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between bg-gray-50 dark:bg-white/[0.03] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Clock size={13} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Historial</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Movimientos de stock</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-[320px]">{title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-indigo-500" size={28} />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500 py-10">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-10">Sin movimientos registrados</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#1a2033]">
                <tr>
                  {["Fecha", "Tipo", "Delta", "Antes", "Después", "Notas"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {rows.map((r) => {
                  const cfg = MOVEMENT_CFG[r.movement_type] ?? { label: r.movement_type, color: "text-gray-400", sign: null };
                  const delta = Number(r.qty_delta ?? 0);
                  const isPos = delta > 0;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-black ${isPos ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {isPos ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : null}
                          {isPos ? "+" : ""}{delta}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">{r.qty_before ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white">{r.qty_after ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-slate-500 max-w-[180px] truncate" title={r.notes ?? ""}>{r.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
