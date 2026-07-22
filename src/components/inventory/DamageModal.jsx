// src/components/inventory/DamageModal.jsx
import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";

const inputCls = `
  w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm
  bg-slate-100 dark:bg-white/[0.06] border border-transparent
  text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-red-500 dark:focus:border-red-500/60
  focus:ring-2 focus:ring-red-500/10
`;

export default function DamageModal({ item, onClose, onSuccess }) {
  const { showNotice } = useNotice();
  const [qty,    setQty]    = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const stockActual = item.stock_fisico ?? item.stock ?? 0;
  const qtyNum      = parseInt(qty, 10);
  const preview     = isNaN(qtyNum) ? null : stockActual - qtyNum;

  const validate = () => {
    if (!qty.trim() || isNaN(qtyNum) || qtyNum < 1)
      return "La cantidad debe ser al menos 1";
    if (qtyNum > stockActual)
      return `No puedes dar de baja más unidades de las que hay en stock (${stockActual})`;
    if (reason.trim().length < 3)
      return "El motivo debe tener al menos 3 caracteres";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);
    try {
      // F-05: enviar product_id y variant_id separados
      // Por:
      await api.post("/inventory/damage", {
        productId: item.product_id ?? item.id,    // ✅ camelCase
        variantId: item.variant_id ?? undefined,
        quantity:  qtyNum,
        reason:    reason.trim(),
      });
      showNotice(`Merma registrada: ${qtyNum} unidad${qtyNum !== 1 ? "es" : ""} dada${qtyNum !== 1 ? "s" : ""} de baja`, "success");
      onSuccess();
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al registrar merma", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#161b27]">

        {/* Header — rojo/destructivo */}
        <div className="px-6 py-5 border-b border-red-100 dark:border-red-500/20 flex items-center justify-between bg-red-50 dark:bg-red-500/10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                Baja de inventario
              </span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Registrar merma</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate max-w-[260px]">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border bg-white dark:bg-white/[0.06] border-red-200 dark:border-red-500/30 text-gray-400 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stock actual */}
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
                  <p className={`text-2xl font-black mt-0.5 ${preview < 0 ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                    {preview}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 pt-3">
          {/* Aviso destructivo */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              Esta acción reduce el stock físico y queda registrada en el historial. No se puede deshacer automáticamente.
            </p>
          </div>

          {/* Cantidad */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Cantidad dañada / perdida * <span className="font-normal normal-case">(mín. 1, máx. {stockActual})</span>
            </label>
            <input
              type="number"
              min={1}
              max={stockActual}
              value={qty}
              onChange={e => { setQty(e.target.value); if (error) setError(""); }}
              placeholder={`1 – ${stockActual}`}
              className={inputCls}
              required
            />
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Motivo * <span className="font-normal normal-case">(mín. 3 caracteres)</span>
            </label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); if (error) setError(""); }}
              placeholder="Ej: Producto caducado, rotura en almacén, pérdida…"
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
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Guardando…</> : <><AlertTriangle size={16} /> Registrar merma</>}
          </button>
        </form>
      </div>
    </div>
  );
}
