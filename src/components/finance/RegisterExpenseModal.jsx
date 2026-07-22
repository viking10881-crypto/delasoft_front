// src/components/finance/RegisterExpenseModal.jsx
import { useState, useEffect, useRef } from "react";
import { X, Loader2, Plus, Trash2, CheckCircle, AlertCircle, Package, ChevronRight, Camera, Upload, Image } from "lucide-react";
import api from "../../services/api";

const TIPOS = [
  { value: "purchase", icon: "📦", label: "Compra",            sub: "Productos de proveedor",        color: "emerald", requiresProvider: true,  requiresItems: true  },
  { value: "service",  icon: "📄", label: "Servicio / Factura", sub: "Luz, internet, alquiler…",       color: "blue",    requiresProvider: false, requiresItems: false },
  { value: "salary",   icon: "👤", label: "Nómina",             sub: "Salarios y pagos al personal",   color: "violet",  requiresProvider: false, requiresItems: false },
  { value: "tax",      icon: "🏛️", label: "Impuesto",           sub: "DIAN, ICA, retenciones…",        color: "rose",    requiresProvider: false, requiresItems: false },
  { value: "other",    icon: "📎", label: "Otro gasto",         sub: "Cualquier egreso general",       color: "gray",    requiresProvider: false, requiresItems: false },
];

const PAYMENT_METHODS = [
  { value: "cash",     label: "💵 Efectivo" },
  { value: "transfer", label: "🏦 Transferencia" },
  { value: "credit",   label: "💳 Crédito (queda como deuda)" },
  { value: "check",    label: "📝 Cheque" },
];

const EMPTY_ITEM = { product_id: "", variant_id: "", quantity: 1, unit_price: "", _variants: [] };

const fmtCOP = (n) =>
  n ? `$${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "";

function Label({ text, required }) {
  return (
    <label className="block text-xs font-bold text-[--text-muted] uppercase tracking-wider mb-1.5">
      {text}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

const inputCls = (extra = "") =>
  `w-full px-3.5 py-2.5
   bg-[--bg-subtle] border border-[--border]
   text-[--text-primary] placeholder:text-[--text-muted]
   rounded-xl text-sm font-medium outline-none transition-all
   focus:bg-[--bg-card] focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20
   ${extra}`;

export default function RegisterExpenseModal({ products = [], providers = [], onClose, onSuccess }) {
  const [step,    setStep]    = useState("type");
  const [tipo,    setTipo]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [form, setForm] = useState({
    description:    "",
    provider_id:    "",
    invoice_number: "",
    invoice_date:   new Date().toISOString().split("T")[0],
    due_date:       "",
    total_amount:   "",
    payment_method: "cash",
    notes:          "",
  });

  const [invoiceImage, setInvoiceImage] = useState(null);
  const [invoiceImagePreview, setInvoiceImagePreview] = useState(null);

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  // Manejar selección de imagen (cámara o archivo)
  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setInvoiceImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setInvoiceImage(null);
    setInvoiceImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  useEffect(() => {
    if (tipo?.requiresItems) {
      const total = items.reduce(
        (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0),
        0
      );
      setForm((f) => ({ ...f, total_amount: total > 0 ? String(total) : "" }));
    }
  }, [items, tipo]);

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addItem    = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => items.length > 1 && setItems((p) => p.filter((_, j) => j !== i));
  const updateItem = (i, field, value) =>
    setItems((p) => p.map((item, j) => (j === i ? { ...item, [field]: value } : item)));

  const handleProductChange = async (i, productId) => {
    const prod = products.find((p) => String(p.id) === String(productId));
    updateItem(i, "product_id", productId);
    updateItem(i, "variant_id", "");
    if (prod?.purchase_price && Number(prod.purchase_price) > 0)
      updateItem(i, "unit_price", prod.purchase_price);
    if (prod?.has_variants) {
      try {
        const { data } = await api.get(`/products/${productId}/variants`);
        updateItem(i, "_variants", data.data || []);
      } catch {}
    } else {
      updateItem(i, "_variants", []);
    }
  };

  const validate = () => {
    if (!form.description.trim()) return "La descripción es obligatoria.";
    if (tipo?.requiresProvider && !form.provider_id) return "Debes seleccionar un proveedor.";
    if (tipo?.requiresItems) {
      const valid = items.filter(
        (i) => i.product_id && Number(i.quantity) > 0 && Number(i.unit_price) > 0
      );
      if (!valid.length) return "Agrega al menos un producto con cantidad y precio.";
    }
    if (!form.total_amount || Number(form.total_amount) <= 0)
      return "El monto debe ser mayor a $0.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null); setSaving(true);
    try {
      // Preparar items de compra si aplica
      let items_to_send = [];
      if (tipo?.requiresItems) {
        items_to_send = items
          .filter((i) => i.product_id && Number(i.quantity) > 0 && Number(i.unit_price) > 0)
          .map((i) => {
            const quantity = Number(i.quantity);
            const unit_price = Number(i.unit_price);
            const subtotal = quantity * unit_price;
            
            const item = {
              product_id: Number(i.product_id),
              quantity:   quantity,
              unit_price: unit_price,
              subtotal:   subtotal,
            };
            
            if (i.variant_id) {
              item.variant_id = Number(i.variant_id);
            }
            
            return item;
          });
      }
      
      // Crear FormData si hay imagen
      if (["salary", "tax", "other"].includes(tipo.value)) {
        const expenseData = {
          expense_type:   tipo.value,
          description:    form.description,
          amount:         Number(form.total_amount),
          payment_method: form.payment_method,
          expense_date:   form.invoice_date,
        };
        if (form.provider_id) expenseData.provider_id = Number(form.provider_id);
        if (form.notes) expenseData.notes = form.notes;
        
        if (invoiceImage) {
          const formData = new FormData();
          Object.entries(expenseData).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append("invoice_image", invoiceImage);
          await api.post("/finance/expenses", formData);
        } else {
          await api.post("/finance/expenses", expenseData);
        }
      } else {
        // Para invoice (purchase/service)
        const invoiceData = {
          invoice_type:   tipo.value === "purchase" ? "purchase" : "service",
          description:    form.description,
          invoice_date:   form.invoice_date,
          total_amount:   Number(form.total_amount),
          payment_method: form.payment_method,
        };
        if (form.provider_id) invoiceData.provider_id = Number(form.provider_id);
        if (form.invoice_number) invoiceData.invoice_number = form.invoice_number;
        if (form.due_date) invoiceData.due_date = form.due_date;
        if (form.notes) invoiceData.notes = form.notes;
        if (items_to_send.length > 0) invoiceData.items = items_to_send;
        
        if (invoiceImage) {
          const formData = new FormData();
          Object.entries(invoiceData).forEach(([key, value]) => {
            if (key === "items" && Array.isArray(value)) {
              // Enviar items como array indexado
              value.forEach((item, idx) => {
                Object.entries(item).forEach(([itemKey, itemValue]) => {
                  formData.append(`items[${idx}][${itemKey}]`, itemValue);
                });
              });
            } else if (key !== "items") {
              formData.append(key, value);
            }
          });
          formData.append("invoice_image", invoiceImage);
          await api.post("/finance/invoices", formData);
        } else {
          await api.post("/finance/invoices", invoiceData);
        }
      }
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); removeImage(); onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const tipoActual  = TIPOS.find((t) => t.value === tipo?.value);
  const totalItems  = items.reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-[--bg-card] w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[--border] flex flex-col"
        style={{ maxHeight: "94vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[--border] shrink-0">
          <div className="flex items-center gap-3">
            {step === "form" && (
              <button
                type="button"
                onClick={() => { setStep("type"); setTipo(null); setError(null); removeImage(); }}
                className="p-1.5 rounded-lg hover:bg-[--bg-subtle] text-[--text-muted] transition-colors"
              >
                ←
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-[--text-primary]">
                {step === "type" ? "¿Qué deseas registrar?" : `Registrar ${tipoActual?.label}`}
              </h2>
              {step === "type" && (
                <p className="text-xs text-[--text-muted] mt-0.5">Selecciona el tipo de movimiento</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[--bg-subtle] text-[--text-muted] hover:text-[--text-primary] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* PASO 1: Selector de tipo */}
          {step === "type" && (
            <div className="space-y-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setTipo(t); setStep("form"); }}
                  className="w-full flex items-center gap-4 p-4
                    bg-[--bg-subtle] hover:bg-[--border]
                    border border-[--border] hover:border-[--text-muted]
                    rounded-2xl text-left transition-all group"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-[--text-primary] text-sm">{t.label}</p>
                    <p className="text-xs text-[--text-muted] mt-0.5">{t.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-[--text-muted] group-hover:text-[--text-secondary] transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* PASO 2: Formulario */}
          {step === "form" && (
            <form id="registro-form" onSubmit={handleSubmit} className="space-y-4">

              {/* Proveedor */}
              {(tipoActual?.requiresProvider || !tipoActual?.requiresItems) && (
                <div>
                  <Label text="Proveedor" required={tipoActual?.requiresProvider} />
                  <select
                    value={form.provider_id}
                    onChange={(e) => updateForm("provider_id", e.target.value)}
                    required={tipoActual?.requiresProvider}
                    className={inputCls()}
                  >
                    <option value="">
                      {tipoActual?.requiresProvider ? "Seleccionar proveedor…" : "Sin proveedor (opcional)"}
                    </option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Descripción */}
              <div>
                <Label text="Descripción" required />
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  required
                  placeholder={
                    tipo?.value === "purchase" ? "Ej: Compra de mercancía enero"
                    : tipo?.value === "service" ? "Ej: Factura energía eléctrica – enero"
                    : tipo?.value === "salary"  ? "Ej: Nómina enero 2025"
                    : "Descripción del gasto…"
                  }
                  className={inputCls()}
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label text="Fecha" required />
                  <input
                    type="date"
                    value={form.invoice_date}
                    onChange={(e) => updateForm("invoice_date", e.target.value)}
                    required
                    className={inputCls()}
                  />
                </div>
                <div>
                  <Label text="N° Factura" />
                  <input
                    type="text"
                    value={form.invoice_number}
                    onChange={(e) => updateForm("invoice_number", e.target.value)}
                    placeholder="Opcional"
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Items de compra */}
              {tipoActual?.requiresItems && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Package size={14} /> Productos incluidos
                    </p>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={11} /> Agregar
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_52px_104px_28px] gap-2 px-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Producto</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center">Cant.</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center">Precio/u</span>
                    <span />
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-[--bg-card] rounded-xl p-2 border border-[--border]">
                      <div className="grid grid-cols-[1fr_52px_104px_28px] gap-2 items-center">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="px-2 py-2 bg-[--bg-subtle] border border-[--border] text-[--text-primary] rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400/30"
                        >
                          <option value="">Seleccionar…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input
                          type="number" min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="px-1 py-2 bg-[--bg-subtle] border border-[--border] text-[--text-primary] rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[--text-muted] text-xs">$</span>
                          <input
                            type="number" step="0.01" min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                            className="w-full pl-5 pr-1 py-2 bg-[--bg-subtle] border border-[--border] text-[--text-primary] rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="p-1 text-red-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {item._variants?.length > 0 && (
                        <select
                          value={item.variant_id || ""}
                          onChange={(e) => updateItem(idx, "variant_id", e.target.value)}
                          className="w-full px-2 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-[--text-primary] rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400/30"
                        >
                          <option value="">— Seleccionar variante * —</option>
                          {item._variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.attributes?.map(a => a.value).join(" / ") || v.sku || `Variante #${v.id}`}
                              {" · Stock actual: "}{v.stock}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}

                  {totalItems > 0 && (
                    <p className="text-right text-xs font-bold text-emerald-800 dark:text-emerald-300 pr-8">
                      Total: {fmtCOP(totalItems)}
                    </p>
                  )}
                </div>
              )}

              {/* Monto manual */}
              {!tipoActual?.requiresItems && (
                <div>
                  <Label text="Monto total" required />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-sm">$</span>
                    <input
                      type="number" step="0.01" min="0.01"
                      value={form.total_amount}
                      onChange={(e) => updateForm("total_amount", e.target.value)}
                      required
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3
                        bg-blue-50 dark:bg-blue-500/10
                        border-2 border-blue-200 dark:border-blue-500/30
                        text-blue-700 dark:text-blue-400
                        rounded-xl font-bold text-lg
                        outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              )}

              {/* Total calculado para compras */}
              {tipoActual?.requiresItems && (
                <div>
                  <Label text="Total de la compra" />
                  <div className="px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30 rounded-xl font-bold text-blue-700 dark:text-blue-400 text-lg">
                    {fmtCOP(totalItems) || "$0"}
                    <span className="text-xs font-normal text-blue-400 dark:text-blue-500 ml-2">calculado automáticamente</span>
                  </div>
                </div>
              )}

              {/* Método de pago */}
              <div>
                <Label text="Método de pago" />
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => updateForm("payment_method", m.value)}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold text-left transition-all ${
                        form.payment_method === m.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : "border-[--border] bg-[--bg-subtle] text-[--text-secondary] hover:border-[--text-muted]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {form.payment_method === "credit" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2">
                    ⚠️ Quedará registrado como deuda con el proveedor
                  </p>
                )}
              </div>

              {/* Notas */}
              <div>
                <Label text="Notas (opcional)" />
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  rows={2}
                  placeholder="Cualquier información adicional…"
                  className={inputCls("resize-none")}
                />
              </div>

              {/* Captura de Factura */}
              <div>
                <Label text="Factura / Comprobante (opcional)" />
                {!invoiceImagePreview ? (
                  <div className="space-y-2">
                    {/* Botón para capturar con cámara */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 
                        bg-purple-50 dark:bg-purple-500/10 border-2 border-dashed border-purple-300 dark:border-purple-500/30
                        rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors
                        text-purple-700 dark:text-purple-400 font-semibold text-sm"
                    >
                      <Camera size={16} />
                      Capturar con cámara
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                    
                    {/* Separador */}
                    <div className="flex items-center gap-2 text-[--text-muted] text-xs">
                      <div className="flex-1 h-px bg-[--border]" />
                      <span>o</span>
                      <div className="flex-1 h-px bg-[--border]" />
                    </div>
                    
                    {/* Botón para subir archivo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 
                        bg-blue-50 dark:bg-blue-500/10 border-2 border-dashed border-blue-300 dark:border-blue-500/30
                        rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors
                        text-blue-700 dark:text-blue-400 font-semibold text-sm"
                    >
                      <Upload size={16} />
                      Subir archivo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.jpg,.jpeg,.png"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-[--border] bg-[--bg-subtle]">
                    <img 
                      src={invoiceImagePreview} 
                      alt="Vista previa de factura" 
                      className="w-full h-auto max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Mensajes */}
              {success && (
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-4 py-3 text-green-700 dark:text-green-400 text-sm font-semibold">
                  <CheckCircle size={16} className="shrink-0" />
                  ¡Registro guardado exitosamente!
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="px-6 pb-6 pt-4 border-t border-[--border] shrink-0 flex gap-3">
            <button
              type="button"
              onClick={() => { removeImage(); onClose(); }}
              className="flex-1 py-3 bg-[--bg-subtle] rounded-2xl font-semibold text-[--text-secondary] hover:bg-[--border] transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="registro-form"
              disabled={saving || success}
              className="flex-[2] py-3
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                rounded-2xl font-bold text-sm flex items-center justify-center gap-2
                hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Registrando…</>
              ) : (
                `Registrar ${tipoActual?.label}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}