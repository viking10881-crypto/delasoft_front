// src/components/products/CreateProductModal.jsx
import { useState, useEffect } from "react";
import { X, Upload, ChevronDown, Layers, Package, Plus, Info, Truck, Clock, DollarSign } from "lucide-react";
import api from "../../services/api";

const EMPTY_FORM = {
  name:                    "",
  sale_price:              "",
  stock:                   "0",
  purchase_price:          "",
  initial_reason:          "",
  category_id:             "",
  description:             "",
  default_supplier_id:     "",
  supplier_lead_time_days: "",
  supplier_cost_estimate:  "",
  requires_advance_payment: false,
  auto_send_to_supplier:   false,
};


function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute z-50 left-5 -top-1 w-56 bg-gray-950 text-white text-[11px] font-normal leading-relaxed rounded-xl px-3 py-2.5 shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {text}
        </span>
      )}
    </span>
  );
}

export default function CreateProductModal({
  isOpen,
  onClose,
  onCreated,
  categories,
  showNotice,
  initialHasVariants = false,
}) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [hasVariants, setHasVariants] = useState(initialHasVariants);
  const [preview,     setPreview]     = useState([]);
  const [images,      setImages]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [suppliers,   setSuppliers]   = useState([]);

  useEffect(() => {
    if (isOpen) {
      setHasVariants(initialHasVariants);
      setForm(EMPTY_FORM);
      setPreview([]);
      setImages([]);
      api.get("/providers?is_active=true").then(r => setSuppliers(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    } else {
      preview.forEach(u => URL.revokeObjectURL(u));
    }
  }, [isOpen, initialHasVariants]);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    if (images.length + files.length > 6) return showNotice("Máximo 6 imágenes", "error");
    setImages(p => [...p, ...files]);
    setPreview(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(preview[i]);
    setPreview(p => p.filter((_, j) => j !== i));
    setImages(p  => p.filter((_, j) => j !== i));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())                  return showNotice("El nombre es requerido", "error");
    if (!form.category_id)                  return showNotice("Selecciona una categoría", "error");
    if (!hasVariants && images.length === 0) return showNotice("Agrega al menos una imagen", "error");

    const price = parseFloat(form.sale_price);
    if (isNaN(price) || price <= 0)         return showNotice("Precio inválido", "error");

    const stock = parseInt(form.stock, 10) || 0;
    if (stock < 0)                          return showNotice("Stock debe ser 0 o más", "error");

    // Validar campos de stock inicial cuando stock > 0
    if (!hasVariants && stock > 0) {
      const pp = parseFloat(form.purchase_price);
      if (isNaN(pp) || pp <= 0) return showNotice("El precio de compra es requerido cuando hay stock inicial", "error");
      if (!form.initial_reason.trim() || form.initial_reason.trim().length < 3)
        return showNotice("La razón del stock inicial debe tener al menos 3 caracteres", "error");
    }

    setLoading(true);
    try {
      // Siempre crear el producto con stock=0 para que el ledger sea consistente
      const data = new FormData();
      data.append("name",             form.name.trim());
      data.append("sale_price",       price.toString());
      data.append("description",      form.description.trim());
      data.append("stock",            "0");
      data.append("category_id",      form.category_id);
      data.append("has_variants",     hasVariants.toString());
      data.append("fulfillment_mode", "hybrid");
      if (form.default_supplier_id)     data.append("default_supplier_id",     form.default_supplier_id);
      if (form.supplier_lead_time_days) data.append("supplier_lead_time_days", form.supplier_lead_time_days);
      if (form.supplier_cost_estimate)  data.append("supplier_cost_estimate",  form.supplier_cost_estimate);
      data.append("requires_advance_payment", String(form.requires_advance_payment));
      data.append("auto_send_to_supplier",    String(form.auto_send_to_supplier));
      images.forEach(img => data.append("images", img));

      const res = await api.post("/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const productId = res.data?.data?.id ?? res.data?.id;

      // Si hay stock inicial, registrarlo en inventario (queda en ledger Y en contabilidad)
      if (!hasVariants && stock > 0 && productId) {
        await api.post("/inventory/initial-stock", {
          productId,
          quantity:      stock,
          purchasePrice: parseFloat(form.purchase_price),
          reason:        form.initial_reason.trim(),
        });
      }

      showNotice(res.data?.message || "Producto creado ✓");
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      if (import.meta.env.DEV) {
        // Mostrar el body completo de la respuesta para debug rápido en desarrollo
        // (permite ver message, code, detail, etc.)
        console.error("CREATE PRODUCT ERROR:", err.response?.data ?? err);
      }
      showNotice(err.response?.data?.message || "Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stockHint =
    "Unidades que tienes ahora mismo. Si aún no tienes stock, deja en 0 — se irá sumando con cada compra que registres en Finanzas.";

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] w-full sm:max-w-xl sm:rounded-[28px] rounded-t-[28px] shadow-2xl flex flex-col max-h-[92vh] border border-gray-200/50 dark:border-[#2C2C2E] overflow-hidden transform transition-all animate-in slide-in-from-bottom-8 duration-300 ease-out">
        
        {/* Barra superior de arrastre en móviles */}
        <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-[#2C2C2E] rounded-full mx-auto mt-3 flex-shrink-0" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-[#2C2C2E] flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">
              {hasVariants ? "Nuevo producto con variantes" : "Nuevo producto simple"}
            </h3>
            <p className="text-xs text-gray-400 dark:text-[#8E8E93] mt-0.5">
              Define los atributos principales de tu artículo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center text-gray-500 dark:text-[#8E8E93] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Cuerpo del Formulario ── */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5 custom-scrollbar">

          {/* Selector Tipo Segmentado (Estilo iOS) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-[#2C2C2E] rounded-[14px]">
            {[
              { val: false, Icon: Package, label: "Simple" },
              { val: true,  Icon: Layers,  label: "Con variantes" },
            ].map(({ val, Icon, label }) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setHasVariants(val)}
                className={`flex items-center justify-center gap-2 py-2 rounded-[11px] text-xs font-semibold transition-all ${
                  hasVariants === val
                    ? "bg-white dark:bg-[#3A3A3C] shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <Icon
                  size={13}
                  className={hasVariants === val ? "text-orange-500" : "text-gray-400"}
                  strokeWidth={2}
                />
                {label}
              </button>
            ))}
          </div>

          {/* Banner informativo premium */}
          <div className="bg-gray-50 dark:bg-[#2C2C2E]/50 border border-gray-100 dark:border-[#2C2C2E] rounded-2xl px-4 py-3.5 text-xs text-gray-600 dark:text-[#8E8E93] space-y-0.5">
            <p className="font-bold text-gray-800 dark:text-gray-200">
              {hasVariants ? "Estructura de Variantes" : "Gestión de Inventario Coherente"}
            </p>
            <p className="leading-normal">
              {hasVariants 
                ? "Crearás el producto base. El stock no se asigna aquí, sino individualmente a cada variante (talla, color, etc.) más adelante."
                : "Configura el stock real. Los registros de compras en tu sección de finanzas sumarán unidades de forma automática."}
            </p>
          </div>

          {/* Campo: Nombre */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
              Nombre del Producto *
            </label>
            <input
              placeholder="Ej: Camisa Black Origami"
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder-[#48484A] focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* Campo: Descripción */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
              Descripción Corta
            </label>
            <textarea
              rows={3}
              placeholder="Detalles sobre materiales, horma o especificaciones técnicas…"
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder-[#48484A] focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none resize-none transition-all"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={1000}
            />
          </div>

          {/* Campo: Categoría */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
              Categoría Asignada *
            </label>
            <div className="relative">
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full appearance-none px-4 py-3 pr-10 bg-gray-50/50 dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent text-gray-900 dark:text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all dark:[color-scheme:dark]"
                required
              >
                <option value="" className="dark:bg-[#1C1C1E]">Seleccionar categoría…</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id} className="dark:bg-[#1C1C1E]">
                    {cat.full_path || cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#8E8E93] pointer-events-none" />
            </div>
          </div>

          {/* ── Proveedor (opcional) ── */}
          <div className="space-y-3 pt-1 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Datos del proveedor
                </p>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Truck size={10} /> Proveedor predeterminado
                  </label>
                  <div className="relative">
                    <select
                      value={form.default_supplier_id}
                      onChange={e => setForm(f => ({ ...f, default_supplier_id: e.target.value }))}
                      className="w-full appearance-none px-4 py-2.5 pr-10 bg-white dark:bg-[#2C2C2E] rounded-xl border border-blue-200 dark:border-blue-500/30 text-gray-900 dark:text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all dark:[color-scheme:dark]"
                    >
                      <option value="">Sin proveedor asignado</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Clock size={10} /> Lead time
                      <InfoTip text="Días que se demora tu proveedor en enviarte el producto. Se muestra al cliente como 'entrega en X días' al vender bajo pedido." />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.supplier_lead_time_days}
                        onChange={e => setForm(f => ({ ...f, supplier_lead_time_days: e.target.value }))}
                        className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-[#2C2C2E] rounded-xl border border-blue-200 dark:border-blue-500/30 text-gray-900 dark:text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">días</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <DollarSign size={10} /> Costo estimado
                      <InfoTip text="Cuánto te cuesta comprarle este producto al proveedor. Sirve para calcular tu ganancia. Es estimado; el costo real se actualiza al recibir la orden de compra." />
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.supplier_cost_estimate}
                        onChange={e => setForm(f => ({ ...f, supplier_cost_estimate: e.target.value }))}
                        className="w-full pl-7 pr-4 py-2.5 bg-white dark:bg-[#2C2C2E] rounded-xl border border-blue-200 dark:border-blue-500/30 text-gray-900 dark:text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Requiere pago anticipado</span>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Actívalo si el cliente debe pagar antes de pedir al proveedor. Útil para evitar pérdidas si cancela.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.requires_advance_payment}
                      onChange={e => setForm(f => ({ ...f, requires_advance_payment: e.target.checked }))}
                      className="w-4 h-4 rounded accent-orange-500 flex-shrink-0 mt-0.5"
                    />
                  </label>
                  <label className="flex items-start justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Auto-enviar al proveedor</span>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">La orden de compra se manda automáticamente sin tu aprobación. Solo para proveedores muy confiables.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.auto_send_to_supplier}
                      onChange={e => setForm(f => ({ ...f, auto_send_to_supplier: e.target.checked }))}
                      className="w-4 h-4 rounded accent-orange-500 flex-shrink-0 mt-0.5"
                    />
                  </label>
                </div>
          </div>

          {/* Grid de Precio e Inventario */}
          <div className={`grid gap-4 ${hasVariants ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
                Precio de Venta *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#8E8E93] text-sm font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  min="0.01"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50/50 dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent text-gray-900 dark:text-white font-semibold focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all"
                  value={form.sale_price}
                  onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                  required
                />
              </div>
            </div>

            {!hasVariants && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 flex items-center">
                  Stock Inicial
                  <InfoTip text={stockHint} />
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent text-gray-900 dark:text-white font-semibold focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-sm outline-none transition-all"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
                <p className="text-[10px] text-gray-400 dark:text-[#636366] mt-1.5 pl-0.5">
                  {!form.stock || form.stock === "0"
                    ? "Inicia vacío — añade stock con ajustes o compras"
                    : `Inicia con ${form.stock} unidades`}
                </p>
              </div>
            )}
          </div>

          {/* ── Campos extra para stock inicial > 0 ── */}
          {!hasVariants && parseInt(form.stock, 10) > 0 && (
            <div className="space-y-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Datos del stock inicial — quedarán en el ledger y en contabilidad
              </p>

              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
                  Precio de compra por unidad *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-[#2C2C2E] rounded-xl border border-amber-200 dark:border-amber-500/30 text-gray-900 dark:text-white font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-none transition-all"
                    value={form.purchase_price}
                    onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
                  Razón del stock inicial * <span className="font-normal normal-case">(mín. 3 caracteres)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Stock de apertura, primera compra a proveedor…"
                  className="w-full px-4 py-3 bg-white dark:bg-[#2C2C2E] rounded-xl border border-amber-200 dark:border-amber-500/30 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-none resize-none transition-all"
                  value={form.initial_reason}
                  onChange={e => setForm(f => ({ ...f, initial_reason: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          {/* Sección de Carga de Imágenes */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider mb-2 block">
              Imágenes {!hasVariants ? "*" : "(Opcional)"}
            </label>
            <label
              className={`flex flex-col items-center justify-center py-7 border border-dashed rounded-2xl cursor-pointer transition-all
                ${images.length >= 6
                  ? "opacity-40 pointer-events-none border-gray-200 dark:border-[#2C2C2E]"
                  : "border-gray-300 dark:border-[#3A3A3C] hover:border-orange-500 dark:hover:border-orange-500/50 hover:bg-gray-50/50 dark:hover:bg-[#2C2C2E]/30"
                }`}
            >
              <Upload size={18} className="text-gray-400 dark:text-[#8E8E93] mb-2" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {images.length === 0 ? "Seleccionar archivos" : `${images.length} de 6 añadidos`}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImages}
                disabled={images.length >= 6}
              />
            </label>

            {preview.length > 0 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2 scrollbar-none">
                {preview.map((src, i) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <img
                      src={src}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200 dark:border-[#2C2C2E]"
                      alt="Vista previa"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold tracking-tight shadow-sm">
                        PORTADA
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-red-500 transition-colors shadow"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <label className="w-16 h-16 border border-dashed border-gray-300 dark:border-[#3A3A3C] rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-500 text-gray-400 hover:text-orange-500 flex-shrink-0 transition-colors">
                    <Plus size={16} />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                  </label>
                )}
              </div>
            )}
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="px-6 sm:px-8 py-5 border-t border-gray-100 dark:border-[#2C2C2E] bg-gray-50/50 dark:bg-[#1C1C1E] flex-shrink-0 space-y-2.5">
          <button
            type="submit"
            onClick={submit}
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] text-white dark:text-gray-950 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white dark:border-gray-950 border-t-transparent rounded-full animate-spin" />
                Registrando artículo…
              </>
            ) : hasVariants ? (
              "Crear producto base y definir variantes →"
            ) : (
              "Crear producto"
            )}
          </button>
          
          {hasVariants && (
            <p className="text-center text-[11px] text-gray-400 dark:text-[#636366] leading-normal px-4">
              Una vez guardado, el sistema te redirigirá a la ficha del producto para ingresar combinaciones y stocks específicos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}