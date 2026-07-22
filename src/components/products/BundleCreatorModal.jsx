// src/components/products/BundleCreatorModal.jsx
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Gift, Package, Search, ChevronDown } from "lucide-react";
import api from "../../services/api";

function ProductSearchRow({ product, variants, onAddItem }) {
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [isGift, setIsGift] = useState(false);

  const variantOptions = variants[product.id] || [];
  const price = Number(product.sale_price || product.price || 0);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-gray-500">
          {product.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
          <p className="text-xs text-gray-400">${price.toLocaleString("es-CO")}</p>
        </div>
      </div>

      {/* Si tiene variantes, selector */}
      {product.has_variants && variantOptions.length > 0 && (
        <div className="relative">
          <select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none">
            <option value="">Sin variante específica (cualquiera)</option>
            {variantOptions.map(v => (
              <option key={v.id} value={v.id}>
                {(v.attributes || []).map(a => a.value).join(" / ")} — Stock: {v.stock}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Cant.</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))}
            className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center outline-none" />
        </div>

        {/* Toggle obsequio */}
        <button type="button"
          onClick={() => setIsGift(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all ${
            isGift ? "border-pink-500 bg-pink-50 text-pink-700" : "border-gray-200 text-gray-500"
          }`}>
          <Gift size={11} />
          {isGift ? "Obsequio" : "Normal"}
        </button>

        <button type="button"
          onClick={() => onAddItem({ product_id: product.id, variant_id: selectedVariantId || null, quantity: qty, is_gift: isGift })}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-all">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function BundleCreatorModal({ isOpen, onClose, onCreated, categories, showNotice }) {
  const [step, setStep] = useState(1); // 1: info, 2: items
  const [form, setForm] = useState({ name: "", description: "", category_id: "", bundle_price: "" });
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) loadProducts();
    else reset();
  }, [isOpen]);

  const reset = () => {
    setStep(1); setForm({ name: "", description: "", category_id: "", bundle_price: "" });
    setItems([]); setSearchTerm(""); setImages([]); setPreviews([]); setError(null);
  };

  const loadProducts = async () => {
    try {
      const res = await api.get("/products?limit=500");
      const data = res.data?.data ?? res.data;
      const arr = Array.isArray(data) ? data : [];
      const simple = arr.filter(p => !p.is_bundle);
      setProducts(simple);

      // Cargar variantes de los productos que las tienen
      const withVariants = simple.filter(p => p.has_variants);
      const varMap = {};
      await Promise.all(withVariants.map(async p => {
        try {
          const vRes = await api.get(`/products/${p.id}/variants`);
          varMap[p.id] = vRes.data?.data || [];
        } catch {}
      }));
      setVariants(varMap);
    } catch (e) { console.error(e); }
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    setImages(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  // F-07: fusionar cantidades si product_id + variant_id ya existe en el bundle
  const addItem = (item) => {
    setItems(prev => {
      const idx = prev.findIndex(
        i => i.product_id === item.product_id &&
             (i.variant_id ?? null) === (item.variant_id ?? null)
      );
      if (idx !== -1) {
        // Ya existe: sumar cantidad
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
        return updated;
      }
      return [...prev, { ...item, _key: Date.now() }];
    });
  };

  const removeItem = (key) => setItems(prev => prev.filter(i => i._key !== key));

  const getItemLabel = (item) => {
    const p = products.find(x => x.id === item.product_id);
    if (!p) return "Producto";
    if (item.variant_id) {
      const v = (variants[p.id] || []).find(x => x.id == item.variant_id);
      if (v) return `${p.name} — ${(v.attributes || []).map(a => a.value).join("/")}`;
    }
    return p.name;
  };

  const submit = async () => {
    if (items.length < 2) return setError("Agrega al menos 2 productos al bundle");
    if (!form.bundle_price || form.bundle_price <= 0) return setError("Define el precio del bundle");
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("category_id", form.category_id || "");
      fd.append("bundle_price", form.bundle_price);
      fd.append("items", JSON.stringify(items.map(({ _key, ...rest }) => rest)));
      images.forEach(img => fd.append("images", img));

      await api.post("/bundles", fd, { headers: { "Content-Type": "multipart/form-data" } });
      showNotice("Bundle creado exitosamente 🎁", "success");
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Error al crear bundle");
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOriginal = items.reduce((sum, item) => {
    const p = products.find(x => x.id === item.product_id);
    return sum + (p ? Number(p.sale_price || 0) * item.quantity : 0);
  }, 0);

  const bundleSaving = totalOriginal - Number(form.bundle_price || 0);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[95vh]">

        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <Gift size={18} className="text-pink-500" />
              Crear Bundle / Combo
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Paso {step} de 2 — {step === 1 ? "Información" : "Productos"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Nombre del bundle *</label>
                <input placeholder="Ej: Kit Gaming Pro"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm outline-none"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Descripción</label>
                <textarea rows={3} placeholder="Describe el combo..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm outline-none resize-none"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Precio del bundle *</label>
                  <input type="number" placeholder="$0" min="0"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm font-black text-emerald-600 outline-none"
                    value={form.bundle_price} onChange={e => setForm({ ...form, bundle_price: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Categoría</label>
                  <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 text-sm outline-none"
                    value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Imágenes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Imágenes (máx. 4)</label>
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={src} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button type="button" onClick={() => { setPreviews(p => p.filter((_,j) => j!==i)); setImages(p => p.filter((_,j) => j!==i)); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {previews.length < 4 && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                      <Plus size={18} className="text-gray-400" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Items ya agregados */}
              {items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Productos en el bundle ({items.length})</p>
                  {items.map(item => (
                    <div key={item._key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        item.is_gift ? "bg-pink-50 border-pink-200" : "bg-white border-gray-200"
                      }`}>
                      {item.is_gift && <Gift size={12} className="text-pink-500 flex-shrink-0" />}
                      <p className="text-xs font-semibold text-gray-800 flex-1 truncate">{getItemLabel(item)}</p>
                      <span className="text-[10px] text-gray-400">×{item.quantity}</span>
                      {item.is_gift && <span className="text-[9px] font-bold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">REGALO</span>}
                      <button onClick={() => removeItem(item._key)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {/* Resumen de ahorro */}
                  {form.bundle_price && totalOriginal > 0 && (
                    <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                      <p className="text-xs text-emerald-700">
                        <span className="font-bold">Precio normal:</span> ${totalOriginal.toLocaleString("es-CO")} →{" "}
                        <span className="font-bold">Bundle:</span> ${Number(form.bundle_price).toLocaleString("es-CO")}{" "}
                        {bundleSaving > 0 && <span className="text-emerald-600 font-black">(Ahorro: ${bundleSaving.toLocaleString("es-CO")})</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Búsqueda y lista de productos */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input placeholder="Buscar producto para agregar..."
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                {filteredProducts.slice(0, 20).map(p => (
                  <ProductSearchRow key={p.id} product={p} variants={variants} onAddItem={addItem} />
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">Sin resultados</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          {step === 2 && (
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">
              ← Atrás
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={() => {
                if (!form.name.trim()) return setError("El nombre es requerido");
                if (!form.bundle_price) return setError("Define el precio");
                setError(null); setStep(2);
              }}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all active:scale-95">
              Siguiente → Agregar productos
            </button>
          ) : (
            <button onClick={submit} disabled={saving || items.length < 2}
              className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-sm transition-all active:scale-95">
              {saving ? "Creando..." : `🎁 Crear Bundle (${items.length} productos)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}   