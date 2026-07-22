// src/components/inventory/AdjustmentModal.jsx
import { useState } from "react";
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";

const inputCls = `
  w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm
  bg-slate-100 dark:bg-white/[0.06] border border-transparent
  text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-amber-500 dark:focus:border-amber-500/60
  focus:ring-2 focus:ring-amber-500/10
`;

/**
 * AdjustmentModal
 *
 * Props del item aceptados:
 *   item.product_id  — ID del producto (preferido)
 *   item.id          — fallback si no viene product_id
 *   item.variant_id  — ID de variante (opcional, undefined si es producto simple)
 *   item.name        — nombre para mostrar
 *   item.stock_fisico — stock físico real (F-02: base para preview y validación)
 *   item.reservado   — unidades reservadas (informativo)
 *   item.safety_stock — safety stock (informativo)
 */
export default function AdjustmentModal({ item, onClose, onSuccess }) {
  const { showNotice } = useNotice();
  const [delta,  setDelta]  = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  // F-02: usar stock_fisico como base, no disponible
  const stockActual = item.stock_fisico ?? item.stock ?? 0;
  const deltaNum    = parseInt(delta, 10);
  const preview     = isNaN(deltaNum) ? null : stockActual + deltaNum;

  const reservado    = item.reservado    ?? 0;
  const safetyStock  = item.safety_stock ?? 0;
  const hasContext   = reservado > 0 || safetyStock > 0;

  const validate = () => {
    if (!delta.trim() || isNaN(deltaNum) || deltaNum === 0)
      return "El ajuste no puede ser cero ni vacío";
    if (reason.trim().length < 3)
      return "La razón debe tener al menos 3 caracteres";
    // F-02: validar negativos sobre stock_fisico, no sobre disponible
    if (preview !== null && preview < 0)
      return "El ajuste resultaría en stock físico negativo";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);
    try {
      await api.post("/inventory/adjustment", {
        productId: item.product_id ?? item.id,
        variantId: item.variant_id ?? undefined,
        delta:     deltaNum,
        reason:    reason.trim(),
      });
      showNotice(`Stock ajustado: ${deltaNum > 0 ? "+" : ""}${deltaNum} unidades`, "success");
      onSuccess();
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al registrar ajuste", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#161b27]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between bg-gray-50 dark:bg-white/[0.03]">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Ajuste manual de stock</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-[260px]">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stock actual (F-02: base = stock_fisico) */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Stock físico</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{stockActual}</p>
            </div>
            {preview !== null && (
              <>
                <div className="text-gray-300 dark:text-slate-600 font-bold text-xl">→</div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Resultado</p>
                  <p className={`text-2xl font-black mt-0.5 ${preview < 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {preview}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* F-02: contexto de reservas y safety stock */}
          {hasContext && (
            <div className="flex gap-4 mt-2 px-1">
              {reservado > 0 && (
                <span className="text-[11px] text-gray-400 dark:text-slate-500">
                  Reservado: <strong className="text-gray-600 dark:text-slate-300">{reservado}</strong>
                </span>
              )}
              {safetyStock > 0 && (
                <span className="text-[11px] text-gray-400 dark:text-slate-500">
                  Safety stock: <strong className="text-gray-600 dark:text-slate-300">{safetyStock}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 pt-3">
          {/* Delta */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Cantidad a ajustar *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDelta(v => String(-(Math.abs(parseInt(v, 10) || 0))))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  deltaNum < 0
                    ? "bg-red-500 text-white border-red-500"
                    : "border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-slate-400 hover:border-red-300"
                }`}
              >
                <TrendingDown size={12} /> Salida
              </button>
              <button
                type="button"
                onClick={() => setDelta(v => String(Math.abs(parseInt(v, 10) || 0)))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  deltaNum > 0
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-slate-400 hover:border-emerald-300"
                }`}
              >
                <TrendingUp size={12} /> Entrada
              </button>
            </div>
            <input
              type="number"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              placeholder="Ej: 10 (entrada) o -5 (salida)"
              className={inputCls}
              required
            />
            <p className="text-[10px] text-gray-400 dark:text-slate-600">
              Positivo = entrada de stock. Negativo = salida. Base: stock físico ({stockActual}).
            </p>
          </div>

          {/* Razón */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Razón * <span className="font-normal normal-case">(mín. 3 caracteres)</span>
            </label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); if (error) setError(""); }}
              placeholder="Ej: Conteo físico, devolución de cliente, corrección de sistema…"
              rows={3}
              className={`${inputCls} resize-none`}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Guardando…</> : "Registrar ajuste"}
          </button>
        </form>
      </div>
    </div>
  );
}
