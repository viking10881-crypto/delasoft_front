import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Edit2, Save, Package, Layers, Gift, ArrowUpDown,
  ChevronDown, Loader2, AlertTriangle, CheckCircle2, Upload, X,
  SlidersHorizontal, Wrench, History, Truck, Clock, DollarSign,
  ImagePlus, Images,
} from "lucide-react";
import api from "../../services/api";
import { showStockUI } from "../../utils/fulfillment";
import { VariantsManager } from "../variants";
import { TabLedger } from "../providers/ProviderTabs";
import AdjustmentModal from "../inventory/AdjustmentModal";
import DamageModal from "../inventory/DamageModal";
import { useNotice } from "../../context/NoticeContext";

// Umbral de scroll (px) a partir del cual el header interno pasa a su
// estado "sólido" (sombra + nombre del producto visible en mobile).
const HEADER_SOLID_THRESHOLD = 24;

// ─── Helper ───────────────────────────────────────────────────────────────────
const getAttrType = (a) => a?.attribute_type ?? a?.type ?? "";

// ─────────────────────────────────────────────────────────────────────────────
// VariantImagesSection — fotos por color de cada variante (traída de
// ProductDetailModal.jsx para que también esté disponible en la vista de
// página completa).
// ─────────────────────────────────────────────────────────────────────────────
function VariantImagesSection({ productId, variants, showNotice, onVariantsUpdated }) {
  const [localVariants, setLocalVariants] = useState(variants ?? []);
  const [uploading, setUploading] = useState(null);
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => { setLocalVariants(variants ?? []); }, [variants]);

  const colorGroups = useMemo(() => {
    const groups = new Map();
    (localVariants || []).forEach(variant => {
      const attrs = variant.attributes ?? [];
      const colorAttr =
        attrs.find(a => getAttrType(a).toLowerCase().includes("color")) ?? attrs[0];
      const key = colorAttr ? String(colorAttr.attribute_value_id) : `v${variant.id}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: colorAttr?.display_value ?? colorAttr?.value ?? `Variante #${variant.id}`,
          hexColor: colorAttr?.hex_color ?? null,
          primaryVariantId: variant.id,
          variantIds: [],
          images: [],
          _seen: new Set(),
        });
      }
      const g = groups.get(key);
      g.variantIds.push(variant.id);
      (variant.images ?? []).forEach(img => {
        if (!g._seen.has(img.url)) {
          g._seen.add(img.url);
          g.images.push({ ...img, _variantId: variant.id });
        }
      });
    });
    return [...groups.values()].map(({ _seen, ...g }) => g);
  }, [localVariants]);

  useEffect(() => {
    if (colorGroups.length > 0 && (!activeKey || !colorGroups.find(g => g.key === activeKey))) {
      setActiveKey(colorGroups[0].key);
    }
  }, [colorGroups]);

  const activeGroup = colorGroups.find(g => g.key === activeKey);
  const missingCount = colorGroups.filter(g => g.images.length === 0).length;
  const allHaveImages = missingCount === 0 && colorGroups.length > 0;

  const handleUpload = async (group, files) => {
    if (!files?.length) return;
    setUploading(group.key);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append("images", f));
      const { data } = await api.post(
        `/products/${productId}/variants/${group.primaryVariantId}/images`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setLocalVariants(prev =>
        prev.map(v =>
          v.id === group.primaryVariantId
            ? { ...v, images: [...(v.images ?? []), ...(data?.data ?? [])] }
            : v
        )
      );
      showNotice("Imágenes subidas ✓", "success");
      onVariantsUpdated?.();
    } catch (e) {
      showNotice(e.response?.data?.message ?? "Error al subir imágenes", "error");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (img) => {
    try {
      await api.delete(
        `/products/${productId}/variants/${img._variantId}/images/${img.id}`
      );
      setLocalVariants(prev =>
        prev.map(v =>
          v.id === img._variantId
            ? { ...v, images: (v.images ?? []).filter(i => i.id !== img.id) }
            : v
        )
      );
      showNotice("Imagen eliminada", "success");
      onVariantsUpdated?.();
    } catch {
      showNotice("Error al eliminar imagen", "error");
    }
  };

  if (!colorGroups.length) return (
    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/[0.06]">
      <div className="flex flex-col items-center py-8 gap-2 text-center">
        <Images size={24} className="text-gray-300 dark:text-slate-700" />
        <p className="text-sm font-bold text-gray-400 dark:text-slate-500">Sin variantes aún</p>
        <p className="text-xs text-gray-400 dark:text-slate-600 max-w-[240px] leading-relaxed">
          Crea las variantes de color arriba y luego sube aquí las fotos de cada color.
        </p>
      </div>
    </div>
  );

  return (
    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/[0.06] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images size={14} className="text-gray-400 dark:text-slate-500" />
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Fotos por color
          </p>
        </div>
        {allHaveImages ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
            <CheckCircle2 size={11} /> Todo listo
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
            <AlertTriangle size={11} />
            {missingCount} {missingCount === 1 ? "color sin fotos" : "colores sin fotos"}
          </span>
        )}
      </div>

      {missingCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/[0.07] border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-0.5">
            ¿Por qué subir fotos por color?
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-500/80 leading-relaxed">
            Cuando el cliente elige un color en la tienda, el carrusel cambiará automáticamente
            a las fotos de ese color. Sin fotos aquí, siempre verá la imagen base del producto.
          </p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {colorGroups.map(group => {
          const isActive = activeKey === group.key;
          const hasImages = group.images.length > 0;
          return (
            <button
              key={group.key}
              onClick={() => setActiveKey(group.key)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold
                transition-all flex-shrink-0
                ${isActive
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]"
                }`}
            >
              {group.hexColor && (
                <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: group.hexColor }} />
              )}
              {group.label}
              {hasImages ? (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black leading-none
                  ${isActive ? "bg-white/20 text-white dark:text-gray-900 dark:bg-black/20" : "bg-gray-200 dark:bg-white/[0.12] text-gray-600 dark:text-slate-400"}`}>
                  {group.images.length}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {activeGroup && (
        <div className="bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {activeGroup.hexColor && (
                <span className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: activeGroup.hexColor }} />
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{activeGroup.label}</p>
                {activeGroup.variantIds.length > 1 && (
                  <p className="text-[10px] text-gray-400 dark:text-slate-600">
                    {activeGroup.variantIds.length} tallas comparten estas fotos
                  </p>
                )}
              </div>
            </div>
            {activeGroup.images.length > 0 && (
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                transition-all select-none
                ${uploading === activeGroup.key
                  ? "bg-gray-100 dark:bg-white/[0.04] text-gray-400 cursor-not-allowed"
                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer"
                }`}
              >
                {uploading === activeGroup.key
                  ? <Loader2 size={12} className="animate-spin" />
                  : <ImagePlus size={12} />
                }
                Añadir fotos
                <input type="file" accept="image/*" multiple className="hidden"
                  disabled={!!uploading}
                  onChange={e => { handleUpload(activeGroup, e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>

          {activeGroup.images.length === 0 ? (
            <label className={`flex flex-col items-center justify-center gap-3 py-10
              border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${uploading === activeGroup.key
                ? "opacity-50 pointer-events-none border-gray-200 dark:border-white/[0.08]"
                : "border-gray-200 dark:border-white/[0.1] hover:border-blue-400 dark:hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-500/[0.05]"
              }`}
            >
              {uploading === activeGroup.key
                ? <Loader2 size={28} className="animate-spin text-blue-500" />
                : (
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                    <ImagePlus size={22} className="text-gray-400 dark:text-slate-500" />
                  </div>
                )
              }
              <div className="text-center px-4">
                <p className="text-sm font-bold text-gray-600 dark:text-slate-400">
                  {uploading === activeGroup.key ? "Subiendo imágenes…" : `Subir fotos para ${activeGroup.label}`}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 leading-relaxed">
                  El cliente las verá al seleccionar este color.<br/>Soporta JPG, PNG y WebP.
                </p>
              </div>
              {uploading !== activeGroup.key && (
                <span className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
                  Seleccionar archivos
                </span>
              )}
              <input type="file" accept="image/*" multiple className="hidden"
                disabled={!!uploading}
                onChange={e => { handleUpload(activeGroup, e.target.files); e.target.value = ""; }} />
            </label>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {activeGroup.images.map(img => (
                <div key={`${img._variantId}-${img.id}`} className="relative group">
                  <img src={img.url}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-white/[0.08]"
                    alt="" />
                  {img.is_main && (
                    <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[7px] px-1 py-0.5 rounded font-black leading-none">
                      PORTADA
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer shadow">
                      <Upload size={12} />
                      <input type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            await api.delete(`/products/${productId}/variants/${img._variantId}/images/${img.id}`);
                            const fd = new FormData();
                            fd.append("images", file);
                            const { data } = await api.post(
                              `/products/${productId}/variants/${img._variantId}/images`,
                              fd, { headers: { "Content-Type": "multipart/form-data" } }
                            );
                            setLocalVariants(prev =>
                              prev.map(v => {
                                if (v.id !== img._variantId) return v;
                                return {
                                  ...v,
                                  images: [
                                    ...(v.images ?? []).filter(i => i.id !== img.id),
                                    ...(data?.data ?? []),
                                  ],
                                };
                              })
                            );
                            showNotice("Imagen reemplazada ✓", "success");
                            onVariantsUpdated?.();
                          } catch {
                            showNotice("Error al reemplazar imagen", "error");
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button type="button" onClick={() => handleDelete(img)}
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600">
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotice } = useNotice();

  const [product, setProduct] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerOffset, setLedgerOffset] = useState(0);
  const LEDGER_LIMIT = 30;

  const [invData, setInvData] = useState(null);
  const [invLoading, setInvLoading] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", sale_price: "",
    safety_stock: "", min_stock: "", max_stock: "",
    category_id: "", category_name: "",
    fulfillment_mode: "stock",
    default_supplier_id: "", supplier_lead_time_days: "", supplier_cost_estimate: "",
    requires_advance_payment: false, auto_send_to_supplier: false,
  });
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagesPreview, setNewImagesPreview] = useState([]);

  // ── Header scroll state ──
  const [scrolled, setScrolled] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > HEADER_SOLID_THRESHOLD);
        tickingRef.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Cargar producto + categorías + proveedores ──
  const loadProduct = useCallback(async () => {
    setPageLoading(true);
    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get("/categories/flat"),
        api.get("/providers?is_active=true"),
      ]);
      const data = prodRes?.data?.data ?? prodRes?.data;
      setProduct(data);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
      setSuppliers(Array.isArray(supRes?.data) ? supRes.data : []);

      setFormData({
        name: data.name ?? "",
        description: data.description ?? "",
        sale_price: data.sale_price ?? data.price ?? "",
        safety_stock: data.safety_stock ?? data.min_stock ?? "",
        min_stock: data.min_stock ?? "",
        max_stock: data.max_stock ?? "",
        category_id: data.category_id ?? "",
        category_name: data.category_name ?? "",
        fulfillment_mode: data.fulfillment_mode ?? "stock",
        default_supplier_id: data.default_supplier_id ?? "",
        supplier_lead_time_days: data.supplier_lead_time_days ?? "",
        supplier_cost_estimate: data.supplier_cost_estimate ?? "",
        requires_advance_payment: data.requires_advance_payment ?? false,
        auto_send_to_supplier: data.auto_send_to_supplier ?? false,
      });

      const imgs = Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : data.main_image ? [{ id: "main_image", url: data.main_image, is_main: true }] : [];
      setExistingImages(imgs);
      setDeletedImageIds([]);
      setNewImages([]);
      setNewImagesPreview([]);
      setActiveImageIdx(0);
      setActiveTab(data.is_bundle ? "bundle" : data.has_variants ? "variants" : "info");
    } catch {
      showNotice("No se pudo cargar el producto", "error");
      navigate(-1);
    } finally {
      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  // ── Inventario ──
  useEffect(() => {
    if (!product?.id || product.has_variants) return;
    let cancelled = false;
    setInvLoading(true);
    api.get(`/inventory/products`, { params: { productId: product.id } })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setInvData(rows.find(r => r.id === product.id) ?? rows[0] ?? null);
      })
      .catch(() => { if (!cancelled) setInvData(null); })
      .finally(() => { if (!cancelled) setInvLoading(false); });
    return () => { cancelled = true; };
  }, [product?.id, product?.has_variants]);

  // ── Variantes ──
  const loadVariants = useCallback(() => {
    if (!product?.has_variants || !product?.id) return;
    setVariantsLoading(true);
    api.get(`/products/${product.id}/variants`)
      .then(({ data }) => setVariants(data?.data ?? []))
      .catch(() => setVariants([]))
      .finally(() => setVariantsLoading(false));
  }, [product?.id, product?.has_variants]);

  useEffect(() => { if (activeTab === "variants") loadVariants(); }, [activeTab, loadVariants]);

  // ── Conteo de colores sin imágenes (badge en la pestaña Variantes) ──
  const variantsMissingImages = useMemo(() => {
    if (!variants.length) return 0;
    const groups = new Map();
    variants.forEach(v => {
      const attrs = v.attributes ?? [];
      const colorAttr = attrs.find(a => getAttrType(a).toLowerCase().includes("color")) ?? attrs[0];
      const key = colorAttr ? String(colorAttr.attribute_value_id) : `v${v.id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(v);
    });
    let missing = 0;
    groups.forEach(group => {
      const hasAnyImg = group.some(v => (v.images ?? []).length > 0);
      if (!hasAnyImg) missing++;
    });
    return missing;
  }, [variants]);

  // ── Ledger ──
  const loadLedger = useCallback(async (offset = 0, append = false) => {
    if (!product?.id) return;
    setLedgerLoading(true);
    try {
      const { data } = await api.get(`/inventory/ledger`, {
        params: { productId: product.id, limit: LEDGER_LIMIT, offset },
      });
      setLedger(prev => append ? [...prev, ...(data.data ?? [])] : (data.data ?? []));
      setLedgerTotal(data.total ?? 0);
      setLedgerOffset(offset);
    } finally { setLedgerLoading(false); }
  }, [product?.id]);

  useEffect(() => {
    if (activeTab === "ledger" && ledger.length === 0) loadLedger(0);
  }, [activeTab, loadLedger]);

  useEffect(() => () => newImagesPreview.forEach(u => URL.revokeObjectURL(u)), [newImagesPreview]);

  // ── Imágenes ──
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    setNewImages(p => [...p, ...files]);
    setNewImagesPreview(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };
  const removeNewImage = (i) => {
    URL.revokeObjectURL(newImagesPreview[i]);
    setNewImages(p => p.filter((_, j) => j !== i));
    setNewImagesPreview(p => p.filter((_, j) => j !== i));
  };
  const markForDeletion = (imgId) => {
    const remaining = existingImages.length - deletedImageIds.length - 1 + newImages.length;
    if (!product.has_variants && remaining < 1) {
      showNotice("El producto debe tener al menos una imagen", "error");
      return;
    }
    if (imgId === "main_image") {
      setExistingImages(p => p.filter(img => img.id !== "main_image"));
      return;
    }
    setDeletedImageIds(p => [...p, imgId]);
  };

  const visibleImages = existingImages.filter(img => !deletedImageIds.includes(img.id));
  const galleryImages = useMemo(
    () => [...visibleImages.map(i => i.url), ...newImagesPreview],
    [visibleImages, newImagesPreview]
  );
  const mainImage = galleryImages[activeImageIdx] ?? galleryImages[0] ?? null;

  // ── Guardar ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const price = parseFloat(formData.sale_price);
    if (isNaN(price) || price <= 0) return showNotice("Precio inválido", "error");

    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("description", formData.description.trim());
      data.append("sale_price", price.toString());
      data.append("category_id", formData.category_id);
      if (formData.safety_stock !== "") data.append("safety_stock", formData.safety_stock);
      if (formData.min_stock !== "") data.append("min_stock", formData.min_stock);
      if (formData.max_stock !== "") data.append("max_stock", formData.max_stock);
      if (deletedImageIds.length) data.append("deleted_image_ids", JSON.stringify(deletedImageIds));
      newImages.forEach(f => data.append("images", f));
      data.append("fulfillment_mode", formData.fulfillment_mode);
      if (formData.fulfillment_mode !== "stock") {
        if (formData.default_supplier_id) data.append("default_supplier_id", formData.default_supplier_id);
        if (formData.supplier_lead_time_days) data.append("supplier_lead_time_days", formData.supplier_lead_time_days);
        if (formData.supplier_cost_estimate) data.append("supplier_cost_estimate", formData.supplier_cost_estimate);
        data.append("requires_advance_payment", String(formData.requires_advance_payment));
        data.append("auto_send_to_supplier", String(formData.auto_send_to_supplier));
      }

      await api.put(`/products/${product.id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      showNotice("Producto actualizado ✓", "success");
      setIsEditing(false);
      loadProduct();
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-[#0D1117] text-gray-400 dark:text-slate-600">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm font-medium">Cargando producto…</p>
      </div>
    );
  }

  const TABS = [
    { key: "info", label: "Información", icon: Package },
    ...(product.has_variants ? [{
      key: "variants", label: "Variantes", icon: Layers,
      badge: variantsMissingImages > 0 ? variantsMissingImages : null,
    }] : []),
    ...(product.is_bundle ? [{ key: "bundle", label: "Contenido", icon: Gift }] : []),
    { key: "ledger", label: "Movimientos", icon: ArrowUpDown },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] pb-24 lg:pb-10">

      {/* ══════════════════════════════════════════════════════════
          Encabezado del producto — FIJO (fixed), no sticky.
      ═══════════════════════════════════════════════════════════ */}
      <header
        style={{
          top: "var(--header-height, 64px)",
          left: "var(--sidebar-width, 0px)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
        className={`fixed right-0 z-40 h-14 lg:h-16 flex items-center justify-between px-3 lg:px-8 bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.06] transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_10px_rgba(0,0,0,0.04)]" : ""
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 rounded-full transition-colors flex-shrink-0 active:scale-90 lg:active:scale-100 w-9 h-9 justify-center bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 lg:w-auto lg:h-auto lg:bg-transparent lg:px-0 lg:justify-start lg:text-gray-500 lg:dark:text-slate-400 lg:hover:text-gray-900 lg:dark:hover:text-white"
        >
          <ChevronLeft size={17} strokeWidth={2.5} />
          <span className="hidden lg:inline text-sm font-semibold">Volver a productos</span>
        </button>

        <span
          className={`lg:hidden absolute left-1/2 -translate-x-1/2 max-w-[52%] truncate text-[13px] font-bold text-gray-900 dark:text-white transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {product.name}
        </span>

        {activeTab === "info" && (
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-full font-bold flex-shrink-0 active:scale-90 lg:active:scale-100 w-9 h-9 justify-center bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-slate-200 text-xs lg:w-auto lg:h-auto lg:px-4 lg:py-2 lg:bg-blue-50 lg:dark:bg-blue-500/10 lg:text-blue-600 lg:dark:text-blue-400 lg:hover:bg-blue-100 lg:dark:hover:bg-blue-500/20 transition-colors"
            >
              <Edit2 size={15} className="lg:hidden" />
              <Edit2 size={13} className="hidden lg:block" />
              <span className="hidden lg:inline">Editar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="hidden lg:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-info-form"
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 lg:px-4 py-2 rounded-full lg:rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all"
              >
                {saving
                  ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Save size={13} />}
                <span className="hidden lg:inline">{saving ? "Guardando…" : "Guardar"}</span>
              </button>
            </div>
          )
        )}
      </header>

      <div className="h-14 lg:h-16" aria-hidden="true" />

      {/* ══ Hero móvil — estilo App Store ══ */}
      <div className="lg:hidden">
        <div className="relative h-[38vh] w-full overflow-hidden bg-gray-200 dark:bg-white/[0.04]">
          {mainImage ? (
            <img src={mainImage} className="w-full h-full object-cover" alt={product.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-700">
              {product.is_bundle ? <Gift size={40} /> : <Package size={40} />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 pointer-events-none" />

          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImageIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative -mt-7 rounded-t-[28px] bg-white dark:bg-[#0D1117] px-5 pt-4 pb-2 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-end gap-3">
            <div className="w-16 h-16 -mt-9 rounded-2xl overflow-hidden border-4 border-white dark:border-[#0D1117] shadow-lg flex-shrink-0 bg-gray-100 dark:bg-white/5">
              {mainImage
                ? <img src={mainImage} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={22} /></div>}
            </div>
            <div className="flex-1 min-w-0 pb-0.5">
              <h1 className="font-black text-lg text-gray-900 dark:text-white leading-tight truncate">{product.name}</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{formData.category_name || "Sin categoría"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="text-center">
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                ${Number(formData.sale_price || 0).toLocaleString("es-CO")}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Precio</p>
            </div>
            <div className="text-center border-x border-gray-100 dark:border-white/[0.06]">
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {invData?.disponible ?? product.stock ?? "—"}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Disponible</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">{product.sku ?? "—"}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">SKU</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Cuerpo — compartido, con galería sticky en desktop ══ */}
      <div className="max-w-6xl mx-auto lg:px-8 lg:py-8">
        <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-10">

          <div
            className="hidden lg:block lg:sticky self-start space-y-3"
            style={{
              top: "calc(var(--header-height, 64px) + 4rem)",
              willChange: "transform",
            }}
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] flex items-center justify-center">
              {mainImage
                ? <img src={mainImage} className="w-full h-full object-cover" alt={product.name} />
                : <Package size={48} className="text-gray-300 dark:text-slate-700" />}
            </div>
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                      i === activeImageIdx ? "border-orange-500" : "border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    }`}
                  >
                    <img src={src} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}

            <div className="pt-3">
              <h1 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                {product.is_bundle && <Gift size={16} className="text-pink-500" />}
                {product.has_variants && <Layers size={16} className="text-violet-500" />}
                {product.name}
              </h1>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formData.category_name || "Sin categoría"}</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
                ${Number(formData.sale_price || 0).toLocaleString("es-CO")}
              </p>
            </div>
          </div>

          {/* ── Contenido: tabs + paneles ── */}
          <div className="px-5 lg:px-0 mt-3 lg:mt-0">

            {TABS.length > 1 && (
              <div
                className="sticky z-20 -mx-5 px-5 lg:mx-0 lg:px-0 bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-md flex border-b border-gray-100 dark:border-white/[0.06] overflow-x-auto no-scrollbar mb-2"
                style={{
                  top: "calc(var(--header-height, 64px) + 3.5rem)",
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
              >
                {TABS.map(({ key, label, icon: Icon, badge }) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setIsEditing(false); }}
                    className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all mr-1 flex-shrink-0 ${
                      activeTab === key
                        ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                        : "border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Icon size={13} /> {label}
                    {badge != null && (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-white text-[8px] font-black flex items-center justify-center ml-0.5">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Tab: Info ── */}
            {activeTab === "info" && (
              <form id="product-info-form" onSubmit={handleSubmit} className="py-4 space-y-5">

                {isEditing && (
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-4">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Imágenes</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {visibleImages.map(img => (
                        <div key={img.id} className="relative flex-shrink-0 w-16 h-16">
                          <img src={img.url} className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-white/[0.08]" alt="" />
                          <button type="button" onClick={() => markForDeletion(img.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {newImagesPreview.map((src, i) => (
                        <div key={`new-${i}`} className="relative flex-shrink-0 w-16 h-16">
                          <img src={src} className="w-full h-full object-cover rounded-xl border-2 border-blue-300 dark:border-blue-500/50" alt="" />
                          <button type="button" onClick={() => removeNewImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-600">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <label className="flex-shrink-0 w-16 h-16 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer border-gray-300 dark:border-white/20 text-gray-400 hover:border-slate-700 dark:hover:border-white hover:text-slate-700 dark:hover:text-white transition-colors">
                        <Upload size={16} />
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleNewImages} />
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
                  {isEditing
                    ? <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20" required />
                    : <p className="hidden lg:block font-bold text-gray-900 dark:text-white text-lg">{formData.name}</p>}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Descripción</label>
                  {isEditing
                    ? <textarea rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20" />
                    : <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-white/[0.03] px-4 py-3 rounded-xl">
                        {formData.description || "Sin descripción"}
                      </p>}
                </div>

                <div className="lg:hidden">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Precio de venta</label>
                  {isEditing
                    ? <input type="number" step="0.01" min="0.01" value={formData.sale_price}
                        onChange={e => setFormData(p => ({ ...p, sale_price: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm font-black outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/30" required />
                    : <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ${Number(formData.sale_price || 0).toLocaleString("es-CO")}
                      </p>}
                </div>
                {isEditing && (
                  <div className="hidden lg:block">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Precio de venta</label>
                    <input type="number" step="0.01" min="0.01" value={formData.sale_price}
                      onChange={e => setFormData(p => ({ ...p, sale_price: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm font-black outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/30" required />
                  </div>
                )}

                {showStockUI(product) && !product.has_variants && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Inventario</span>
                      {!isEditing && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setAdjustOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                            <SlidersHorizontal size={11} /> Ajustar
                          </button>
                          <button type="button" onClick={() => setDamageOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                            <Wrench size={11} /> Merma
                          </button>
                          <button type="button" onClick={() => setActiveTab("ledger")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all">
                            <History size={11} /> Historial
                          </button>
                        </div>
                      )}
                    </div>

                    {invLoading ? (
                      <div className="h-16 flex items-center gap-2 text-xs text-gray-400">
                        <Loader2 size={14} className="animate-spin" /> Cargando stock…
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "Físico", value: invData?.stock_fisico ?? product.stock ?? "—" },
                          { label: "Reservado", value: invData?.reservado ?? 0 },
                          { label: "Safety stock", value: invData?.safety_stock ?? product.min_stock ?? "—" },
                          { label: "Disponible", value: invData?.disponible ?? product.stock ?? "—", bold: true },
                        ].map(({ label, value, bold }) => (
                          <div key={label} className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-xl p-3 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</p>
                            <p className={`text-lg ${bold ? "font-black text-gray-900 dark:text-white" : "font-bold text-gray-600 dark:text-slate-300"}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEditing && (
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        {[
                          { field: "safety_stock", label: "Safety stock" },
                          { field: "min_stock", label: "Stock mínimo" },
                          { field: "max_stock", label: "Stock máximo" },
                        ].map(({ field, label }) => (
                          <div key={field}>
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
                            <input type="number" min="0" value={formData[field]}
                              onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                              placeholder="—"
                              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Categoría</label>
                  {isEditing ? (
                    <div className="relative">
                      <select value={formData.category_id} onChange={e => setFormData(p => ({ ...p, category_id: e.target.value }))}
                        className="w-full appearance-none px-4 py-3 pr-9 rounded-xl text-sm outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20" required>
                        <option value="">Seleccionar…</option>
                        {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.full_path ?? cat.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 rounded-xl">
                      {formData.category_name || "Sin categoría"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Truck size={10} /> Abastecimiento
                  </label>
                  {isEditing ? (
                    <div className="space-y-3">
                      {[
                        { value: "stock", label: "Desde stock", desc: "Se despacha con inventario disponible" },
                        { value: "on_demand", label: "Bajo pedido", desc: "Se compra al proveedor tras la venta" },
                        { value: "hybrid", label: "Híbrido", desc: "Stock si hay disponible, pedido si no" },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.fulfillment_mode === opt.value ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        }`}>
                          <input type="radio" name="fulfillment_mode" value={opt.value}
                            checked={formData.fulfillment_mode === opt.value}
                            onChange={e => setFormData(p => ({ ...p, fulfillment_mode: e.target.value }))}
                            className="mt-0.5 accent-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{opt.label}</p>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-white/[0.03] px-4 py-3 rounded-xl">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        formData.fulfillment_mode === "on_demand" ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
                        : formData.fulfillment_mode === "hybrid" ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        : "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300"
                      }`}>
                        <Truck size={10} />
                        {formData.fulfillment_mode === "on_demand" ? "Bajo pedido" : formData.fulfillment_mode === "hybrid" ? "Híbrido" : "Desde stock"}
                      </span>
                    </div>
                  )}

                  {formData.fulfillment_mode !== "stock" && (
                    <div className="space-y-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Datos del proveedor</p>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 block">
                          <Truck size={9} /> Proveedor predeterminado
                        </label>
                        <div className="relative">
                          <select value={formData.default_supplier_id} onChange={e => setFormData(p => ({ ...p, default_supplier_id: e.target.value }))}
                            disabled={!isEditing}
                            className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl text-sm outline-none bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 disabled:opacity-60">
                            <option value="">Sin proveedor asignado</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 block">
                            <Clock size={9} /> Lead time (días)
                          </label>
                          <input type="number" min="1" value={formData.supplier_lead_time_days}
                            onChange={e => setFormData(p => ({ ...p, supplier_lead_time_days: e.target.value }))}
                            disabled={!isEditing} placeholder="Ej: 5"
                            className="w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 disabled:opacity-60" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 block">
                            <DollarSign size={9} /> Costo estimado
                          </label>
                          <input type="number" min="0" value={formData.supplier_cost_estimate}
                            onChange={e => setFormData(p => ({ ...p, supplier_cost_estimate: e.target.value }))}
                            disabled={!isEditing} placeholder="Ej: 45000"
                            className="w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 disabled:opacity-60" />
                        </div>
                      </div>
                      {isEditing && (
                        <div className="space-y-2.5">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={formData.requires_advance_payment}
                              onChange={e => setFormData(p => ({ ...p, requires_advance_payment: e.target.checked }))}
                              className="w-4 h-4 rounded accent-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-slate-300">Requiere anticipo al proveedor</span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={formData.auto_send_to_supplier}
                              onChange={e => setFormData(p => ({ ...p, auto_send_to_supplier: e.target.checked }))}
                              className="w-4 h-4 rounded accent-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-slate-300">Auto-enviar al proveedor</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <button type="button" onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all">
                      {saving
                        ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando…</>
                        : <><Save size={15} />Guardar cambios</>}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ── Tab: Variantes ── */}
            {activeTab === "variants" && (
              <div className="py-4">
                <VariantsManager
                  productId={product.id}
                  productPrice={product.sale_price}
                  productName={product.name}
                  hasSupplier={!!product.default_supplier_id}
                  fulfillmentMode={product.fulfillment_mode}
                  onVariantsChange={loadVariants}
                />
                {variantsLoading ? (
                  <div className="flex justify-center py-8 mt-4 border-t border-gray-100 dark:border-white/[0.06]">
                    <Loader2 size={20} className="animate-spin text-gray-400 dark:text-slate-500" />
                  </div>
                ) : (
                  <VariantImagesSection
                    productId={product.id}
                    variants={variants}
                    showNotice={showNotice}
                    onVariantsUpdated={loadVariants}
                  />
                )}
              </div>
            )}

            {/* ── Tab: Bundle ── */}
            {activeTab === "bundle" && (
              <div className="py-4 space-y-3">
                <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/30 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-pink-800 dark:text-pink-300 mb-0.5">Bundle / Combo</p>
                  <p className="text-xs text-pink-600 dark:text-pink-400">
                    Precio: <span className="font-black">${Number(product.bundle_price ?? product.sale_price).toLocaleString("es-CO")}</span>
                  </p>
                </div>
                {!(product.bundle_items?.length) ? (
                  <p className="text-center py-8 text-sm text-gray-400 dark:text-slate-500">Sin items registrados</p>
                ) : (
                  <div className="space-y-2">
                    {product.bundle_items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.06]">
                        {item.product_image
                          ? <img src={item.product_image} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" alt="" />
                          : <div className="w-10 h-10 bg-gray-100 dark:bg-white/[0.04] rounded-lg flex items-center justify-center flex-shrink-0"><Package size={16} className="text-gray-400" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.product_name}</p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500">×{item.quantity}</span>
                        {item.is_gift && (
                          <span className="text-[9px] font-black bg-pink-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Gift size={8} /> REGALO
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Ledger ── */}
            {activeTab === "ledger" && (
              <div className="py-4">
                <TabLedger
                  data={ledger}
                  loading={ledgerLoading}
                  hasMore={ledger.length < ledgerTotal}
                  onLoadMore={() => loadLedger(ledgerOffset + LEDGER_LIMIT, true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {adjustOpen && (
        <AdjustmentModal
          item={{ id: product.id, name: product.name, disponible: invData?.disponible ?? product.stock }}
          onClose={() => setAdjustOpen(false)}
          onSuccess={() => { setAdjustOpen(false); setInvData(null); loadProduct(); }}
        />
      )}
      {damageOpen && (
        <DamageModal
          item={{ id: product.id, name: product.name, stock_fisico: invData?.stock_fisico ?? product.stock }}
          onClose={() => setDamageOpen(false)}
          onSuccess={() => { setDamageOpen(false); setInvData(null); loadProduct(); }}
        />
      )}
    </div>
  );
}