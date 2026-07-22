// src/components/variants/VariantFormModal.jsx
import { useState } from "react";
import { X, Loader2, CheckCircle, AlertCircle, Package } from "lucide-react";
import AttributeSelector from "./AttributeSelector";

const fmtCOP = (n) =>
  n ? `$${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "";

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#8E8E93] mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 dark:text-[#8E8E93] mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#8E8E93] outline-none transition-all focus:bg-white dark:focus:bg-[#3A3A3C] focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/10";

export default function VariantFormModal({
  variant,
  productPrice,
  attributes,
  onSave,
  onNewAttrValue,
  onClose,
}) {
  const isEdit = Boolean(variant);

  const [form, setForm] = useState({
    sku:        variant?.sku        ?? "",
    sale_price: variant?.sale_price ?? "",
    stock:      variant?.stock      ?? 0,
    is_active:  variant?.is_active  ?? true,
  });

  const [selectedAttrIds, setSelectedAttrIds] = useState(
    () => variant?.attributes?.map((a) => a.attribute_value_id) ?? []
  );

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const validate = () => {
    if (Number(form.stock) < 0)
      return "El stock no puede ser negativo.";
    if (form.sale_price !== "" && Number(form.sale_price) < 0)
      return "El precio no puede ser negativo.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setError(null);
    setSaving(true);
    try {
      await onSave({
        sku:                 form.sku.trim() || undefined,
        sale_price:          form.sale_price !== "" ? Number(form.sale_price) : undefined,
        stock:               Number(form.stock),
        is_active:           form.is_active,
        attribute_value_ids: selectedAttrIds,
      });
      setSuccess(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al guardar la variante.");
    } finally {
      setSaving(false);
    }
  };

  const effectivePrice =
    form.sale_price !== "" ? Number(form.sale_price) : productPrice;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white dark:bg-[#1C1C1E] w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#2C2C2E] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isEdit ? "Editar variante" : "Nueva variante"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-[#8E8E93] mt-0.5">
              {isEdit
                ? `SKU: ${variant.sku ?? "sin SKU"}`
                : "Combina atributos para definir esta variante"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2C2C2E] text-gray-400 dark:text-[#8E8E93] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="variant-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Resumen precio */}
            {effectivePrice > 0 && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                <Package size={18} className="text-blue-500 dark:text-blue-400 shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">Precio de venta: </span>
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-base">{fmtCOP(effectivePrice)}</span>
                  {form.sale_price === "" && productPrice && (
                    <span className="text-xs text-blue-400 dark:text-blue-400/70 ml-2">(heredado del producto)</span>
                  )}
                </div>
              </div>
            )}

            {/* Atributos */}
            <Field label="Atributos de la variante">
              <p className="text-[11px] text-gray-400 dark:text-[#8E8E93] mb-2">
                Selecciona <strong className="text-gray-600 dark:text-[#A1A1A6]">un valor por tipo</strong> (ej: Color: Rojo + Talla: M = una variante).
              </p>
              <AttributeSelector
                attributes={attributes}
                selected={selectedAttrIds}
                onChange={setSelectedAttrIds}
                onNewValue={onNewAttrValue}
                allowMultiPerType={false}
              />
            </Field>

            {/* SKU + Precio */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU (opcional)">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                  placeholder="Ej: CAMISA-ROJO-M"
                  className={inputCls}
                />
              </Field>

              <Field label="Precio de variante" hint="Vacío = usa el precio del producto">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#8E8E93] font-semibold text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={form.sale_price}
                    onChange={(e) => update("sale_price", e.target.value)}
                    placeholder={productPrice ? String(productPrice) : "Precio del producto"}
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </Field>
            </div>

            {/* Stock + Estado */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stock" required>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update("stock", Math.max(0, Number(form.stock) - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] text-gray-600 dark:text-[#A1A1A6] font-bold text-lg flex items-center justify-center transition-colors shrink-0"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => update("stock", e.target.value)}
                    className={`${inputCls} text-center font-bold text-lg`}
                  />
                  <button
                    type="button"
                    onClick={() => update("stock", Number(form.stock) + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] text-gray-600 dark:text-[#A1A1A6] font-bold text-lg flex items-center justify-center transition-colors shrink-0"
                  >
                    +
                  </button>
                </div>
              </Field>

              <Field label="Estado">
                <div className="flex gap-2 h-10">
                  {[
                    { val: true,  label: "✅ Activa"   },
                    { val: false, label: "⏸ Inactiva" },
                  ].map((opt) => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => update("is_active", opt.val)}
                      className={`flex-1 rounded-xl border-2 text-xs font-semibold transition-all ${
                        form.is_active === opt.val
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#2C2C2E] text-gray-500 dark:text-[#8E8E93] hover:border-gray-300 dark:hover:border-[#48484A]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Feedback */}
            {success && (
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-4 py-3 text-green-700 dark:text-green-400 text-sm font-semibold">
                <CheckCircle size={16} className="shrink-0" />
                {isEdit ? "Variante actualizada." : "Variante creada correctamente."}
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-[#2C2C2E] shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl font-semibold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="variant-form"
            disabled={saving || success}
            className="flex-[2] py-3 bg-gray-900 dark:bg-[#0A84FF] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Guardando…</>
              : isEdit ? "Guardar cambios" : "Crear variante"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
