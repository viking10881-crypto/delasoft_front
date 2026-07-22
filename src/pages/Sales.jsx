// src/pages/Sales.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import {
  ShoppingCart, Plus, Minus, Search, User,
  CreditCard, CheckCircle2, X, Loader2, Package,
  Hash, ChevronDown, Layers, Tag, Banknote,
  ArrowRightLeft, Handshake, Calendar, AlertCircle,
  RefreshCw, Clock, Sparkles, TrendingUp, AlertTriangle,
} from "lucide-react";
import { useAuth }         from "../context/AuthContext";
import api                 from "../services/api";
import { useNotice }       from "../context/NoticeContext";
import { fmtCOP }          from "../components/SalesHistory/helpers";
import useRealtimeData     from "../hooks/useRealtimeData";
import { buildSchedule }  from "../utils/creditSchedule";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const cartKey  = (productId, variantId) =>
  variantId ? `${productId}-v${variantId}` : `${productId}`;

const getPrice = (item) =>
  Number(item.variantPrice ?? item.sale_price ?? item.price ?? 0);

const getStockValue = (item) => {
  const raw = item?.disponible_inmediato ?? item?.stock ?? item?.available ?? item?.disponible ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const isOnDemandSale = (item) =>
  item?.is_on_demand === true ||
  item?.sale_mode === "on_demand";

const canOrderOnDemand = (item) =>
  isOnDemandSale(item) ||
  item?.can_order_on_demand === true;

const canSellItem = (item) => {
  if (item?.is_sellable === false) return false;
  if (canOrderOnDemand(item)) return true;
  const requiresStock = item?.fulfillment_mode === "stock" || item?.fulfillment_mode == null || item?.fulfillment_mode === undefined;
  if (!requiresStock) return true;
  return getStockValue(item) > 0;
};

/* ── Opciones de método de pago ─────────────── */
const PAYMENT_OPTIONS = [
  { value: "cash",     label: "Efectivo",    Icon: Banknote,       color: "emerald" },
  { value: "transfer", label: "Transf.",     Icon: ArrowRightLeft, color: "blue"    },
  { value: "credit",   label: "Tarjeta",     Icon: CreditCard,     color: "violet"  },
  { value: "fiado",    label: "Fiado",       Icon: Handshake,      color: "amber"   },
];

const COLOR = {
  emerald: {
    active: "bg-emerald-600 text-white border-emerald-600",
    idle:   "border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:border-emerald-400 bg-white dark:bg-white/[0.02]",
  },
  blue: {
    active: "bg-blue-600 text-white border-blue-600",
    idle:   "border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:border-blue-400 bg-white dark:bg-white/[0.02]",
  },
  violet: {
    active: "bg-violet-600 text-white border-violet-600",
    idle:   "border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:border-violet-400 bg-white dark:bg-white/[0.02]",
  },
  amber: {
    active: "bg-amber-500 text-white border-amber-500",
    idle:   "border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:border-amber-400 bg-white dark:bg-white/[0.02]",
  },
};

/* ── Frecuencias de pago fiado ──────────────── */
const FREQ_OPTIONS = [
  { value: "unico",    label: "Pago único",   days: null },
  { value: "semanal",  label: "Semanal",      days: 7    },
  { value: "quincenal",label: "Quincenal",    days: 15   },
  { value: "mensual",  label: "Mensual",      days: 30   },
];

/* ─────────────────────────────────────────────
   VariantPicker
───────────────────────────────────────────── */
function VariantPicker({ product, onSelect, onClose }) {
  const [variants,  setVariants]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState({});
  const [activeVar, setActiveVar] = useState(null);

  useEffect(() => {
    api.get(`/products/${product.id}/variants`)
      .then(r => setVariants((r.data?.data ?? []).filter(v => v.is_active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [product.id]);

  useEffect(() => {
    if (!Object.keys(selected).length) { setActiveVar(null); return; }
    const sel = new Set(Object.values(selected));
    const match = variants.find(v => {
      const ids = new Set((v.attributes ?? []).map(a => a.attribute_value_id));
      return [...sel].every(id => ids.has(id));
    });
    setActiveVar(match ?? null);
  }, [selected, variants]);

  const attrGroups = (() => {
    const map = new Map();
    variants.forEach(v =>
      (v.attributes ?? []).forEach(a => {
        if (!map.has(a.attribute_slug))
          map.set(a.attribute_slug, { slug: a.attribute_slug, name: a.attribute_type, icon: a.attribute_icon, values: new Map() });
        map.get(a.attribute_slug).values.set(a.attribute_value_id, {
          id: a.attribute_value_id, label: a.display_value ?? a.value, hex: a.hex_color,
        });
      })
    );
    return [...map.values()].map(g => ({ ...g, values: [...g.values.values()] }));
  })();

  const isAvailable = (slug, valueId) => {
    const test = { ...selected, [slug]: valueId };
    const ids  = new Set(Object.values(test));
    return variants.some(v => {
      const vIds = new Set((v.attributes ?? []).map(a => a.attribute_value_id));
      return [...ids].every(id => vIds.has(id)) && canSellItem(v);
    });
  };

  const outOfStock = activeVar ? !canSellItem(activeVar) : false;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#131B2A] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Seleccionar variante</p>
            <h3 className="font-black text-gray-900 dark:text-white leading-tight truncate">{product.name}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-gray-100 dark:bg-white/[0.08] rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 transition-colors">
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
          ) : attrGroups.map(group => (
            <div key={group.slug}>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                {group.icon} {group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.values.map(val => {
                  const isSel = selected[group.slug] === val.id;
                  const avail = isAvailable(group.slug, val.id);
                  if (val.hex) {
                    return (
                      <button key={val.id} disabled={!avail} onClick={() => setSelected(p => ({ ...p, [group.slug]: val.id }))}
                        title={val.label}
                        className={`relative w-9 h-9 rounded-full border-2 transition-all active:scale-90 ${isSel ? "border-slate-900 dark:border-white shadow-[0_0_0_3px_white,0_0_0_5px_#0f172a]" : "border-transparent hover:border-gray-300"} ${!avail ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ backgroundColor: val.hex }}
                      />
                    );
                  }
                  return (
                    <button key={val.id} disabled={!avail} onClick={() => setSelected(p => ({ ...p, [group.slug]: val.id }))}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${isSel ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900" : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300"} ${!avail ? "opacity-30 cursor-not-allowed line-through" : ""}`}
                    >{val.label}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-white/[0.06] px-5 py-4 space-y-3">
          {activeVar ? (
            <div className={`flex items-center justify-between bg-gray-50 dark:bg-white/[0.04] rounded-xl px-4 py-3 ${outOfStock ? "border border-red-200" : ""}`}>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Precio</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">${fmtCOP(activeVar.sale_price ?? product.sale_price ?? 0)}</p>
              </div>
              {(() => {
                const disp = getStockValue(activeVar);
                const sellable = canSellItem(activeVar);
                const isOnDemand = isOnDemandSale(activeVar);
                const hasImmediateStock = sellable && disp > 0;
                const statusLabel = !sellable
                  ? "Sin stock"
                  : hasImmediateStock
                    ? `${disp} uds`
                    : isOnDemand
                      ? activeVar.availability_label ?? "Bajo pedido"
                      : product.supplier_lead_time_days
                        ? `~${product.supplier_lead_time_days} dias`
                        : "Agotado";
                return (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">
                      {hasImmediateStock ? "Stock" : "Entrega"}
                    </p>
                    <p className={`text-sm font-black ${
                      !sellable      ? "text-red-500"
                      : hasImmediateStock
                        ? disp <= 5  ? "text-amber-500" : "text-emerald-500"
                        : "text-purple-500"
                    }`}>
                      {statusLabel}
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-400">Selecciona todas las opciones</p>
            </div>
          )}
          <button
            onClick={() => { onSelect(product, activeVar); onClose(); }}
            disabled={!activeVar || outOfStock}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ShoppingCart size={15} />
            {outOfStock ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantChips({ attributes = [] }) {
  if (!attributes.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {attributes.map((a, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-white/[0.06] rounded-full px-1.5 py-0.5">
          {a.hex_color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.hex_color }} />}
          {a.display_value ?? a.value}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sales — componente principal
───────────────────────────────────────────── */
export default function Sales() {
  const { showNotice } = useNotice();
  const { can }        = useAuth();

  const [products,          setProducts]          = useState([]);
  const [users,             setUsers]             = useState([]);
  const [discounts,         setDiscounts]         = useState([]);
  const [cart,              setCart]              = useState([]);
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [clientSearch,      setClientSearch]      = useState("");
  const [selectedClient,    setSelectedClient]    = useState(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [isSaving,          setIsSaving]          = useState(false);
  const [categoryFilter,    setCategoryFilter]    = useState("all");
  const [pickerProduct,     setPickerProduct]     = useState(null);

  // F-16: lock para evitar doble ejecución de addVariantToCart en rapid-clicks
  const addVariantLock = useRef(false);

  /* ── Estado del pago ──────────────────────────────────────── */
  const [paymentMethod,    setPaymentMethod]    = useState("cash");
  const [creditNotes,      setCreditNotes]      = useState("");
  const [initialPayment,   setInitialPayment]   = useState("");
  const [schedule,         setSchedule]         = useState([]); // [{id, date, amount}]
  const [wizardN,          setWizardN]          = useState(3);
  const [wizardFreq,       setWizardFreq]       = useState("mensual");
  const [wizardStart,      setWizardStart]      = useState("");
  const [creditProfile,    setCreditProfile]    = useState(null);

  const isFiado      = paymentMethod === "fiado";
  const cartSubtotal = cart.reduce((s, p) => s + getPrice(p) * p.quantity, 0);
  const cartCount    = cart.reduce((s, p) => s + p.quantity, 0);

  // Descuento seleccionado y monto calculado
  const selectedDiscount = discounts.find(d => d.id === parseInt(selectedDiscountId));
  const discountAmt = (() => {
    if (!selectedDiscount) return 0;
    let amt = selectedDiscount.type === 'percentage'
      ? (cartSubtotal * Number(selectedDiscount.value)) / 100
      : Number(selectedDiscount.value);
    if (selectedDiscount.max_discount_amount)
      amt = Math.min(amt, Number(selectedDiscount.max_discount_amount));
    return Math.min(Math.round(amt), cartSubtotal);
  })();
  const total = Math.max(0, cartSubtotal - discountAmt);

  /* ── Cálculos fiado ──────────────────────────────────────── */
  const initPay    = Math.min(Number(initialPayment) || 0, total);
  const pendingAmt = total - initPay;

  const scheduleSum  = schedule.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const scheduleOk   = isFiado && schedule.length > 0 && Math.abs(scheduleSum - pendingAmt) <= 1;

  /* ── Schedule helpers ────────────────────────────────────── */
  const addInstallment    = () => setSchedule(prev => [...prev, { id: Date.now(), date: "", amount: "" }]);
  const removeInstallment = (id) => setSchedule(prev => prev.filter(i => i.id !== id));
  const updateInstallment = (id, field, value) =>
    setSchedule(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const generateSchedule = () => {
    if (!wizardStart || pendingAmt <= 0) return;
    const n = wizardFreq === "unico" ? 1 : wizardN;
    setSchedule(buildSchedule({
      total:           total,
      downPayment:     initPay,
      numInstallments: n,
      frequency:       wizardFreq,
      startDate:       wizardStart,
    }));
  };

  /* ── Carga de datos ──────────────────────────────────────── */
  // F-03: extraer loadProducts para poder llamarlo después del checkout y desde socket
  // F-10: filtrar por is_active=true para excluir productos desactivados del POS
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get("/products?limit=500&is_active=true");
      const p   = res.data;
      const raw = Array.isArray(p) ? p : p?.data ?? [];
      // Doble filtro en cliente: si el backend no aplica is_active, lo filtramos aquí
      setProducts(raw.filter(prod => prod.is_active !== false));
    } catch {
      // silencioso en refetch silencioso; el error inicial sí se notifica abajo
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const reqs = [
          api.get("/products?limit=500&is_active=true"),
          api.get("/discounts?scope=pos"),
          ...(can("user.read") ? [api.get("/users")] : []),
        ];
        const [prodRes, discRes, userRes] = await Promise.allSettled(reqs);
        if (prodRes.status === "fulfilled") {
          const p   = prodRes.value.data;
          const raw = Array.isArray(p) ? p : p?.data ?? [];
          setProducts(raw.filter(prod => prod.is_active !== false));
        }
        if (discRes.status === "fulfilled") {
          setDiscounts(Array.isArray(discRes.value.data) ? discRes.value.data : []);
        }
        if (userRes?.status === "fulfilled") {
          const u = userRes.value.data;
          setUsers(Array.isArray(u) ? u : u?.data ?? []);
        }
      } catch {
        showNotice("Error al cargar datos", "error");
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // F-03: escuchar eventos de actualización de productos vía socket
  useRealtimeData(["products", "inventory"], loadProducts);

  // Perfil crediticio del cliente — solo en modo fiado
  useEffect(() => {
    if (!selectedClient || paymentMethod !== "fiado") { setCreditProfile(null); return; }
    api.get(`/users/${selectedClient.id}/credit-profile`)
      .then(r => setCreditProfile(r.data?.data ?? null))
      .catch(() => setCreditProfile(null));
  }, [selectedClient?.id, paymentMethod]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Carrito ─────────────────────────────────────────────── */
  const addToCart = (product) => {
    if (!canSellItem(product)) {
      showNotice("Este producto está agotado y no se puede vender", "warning");
      return;
    }
    const key = cartKey(product.id, null);
    setCart(prev => {
      const exists = prev.find(p => p.cartKey === key);
      if (exists) return prev.map(p => p.cartKey === key ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { ...product, cartKey: key, variantId: null, variantPrice: null, variantAttributes: [], quantity: 1 }];
    });
  };

  // F-16: lockRef evita doble ejecución si el usuario cierra/abre el picker muy rápido
  const addVariantToCart = (product, variant) => {
    if (addVariantLock.current) return;
    if (!canSellItem(variant)) {
      showNotice("La variante seleccionada está agotada", "warning");
      return;
    }
    addVariantLock.current = true;
    try {
      const key = cartKey(product.id, variant.id);
      setCart(prev => {
        const exists = prev.find(p => p.cartKey === key);
        if (exists) return prev.map(p => p.cartKey === key ? { ...p, quantity: p.quantity + 1 } : p);
        return [...prev, {
          ...product, cartKey: key, variantId: variant.id, variantSku: variant.sku,
          variantPrice: variant.sale_price ?? null,
          variantAttributes: variant.attributes ?? [],
          stock: variant.stock,
          disponible_inmediato: variant.disponible_inmediato ?? variant.stock,
          fulfillment_mode: variant.fulfillment_mode ?? product.fulfillment_mode,
          can_order_on_demand: variant.can_order_on_demand ?? product.can_order_on_demand,
          is_on_demand: variant.is_on_demand ?? false,
          sale_mode: variant.sale_mode ?? product.sale_mode,
          availability_label: variant.availability_label ?? product.availability_label,
          is_sellable: variant.is_sellable ?? product.is_sellable,
          quantity: 1,
        }];
      });
    } finally {
      addVariantLock.current = false;
    }
  };

  const handleAddProduct = (product) => {
    if (product.has_variants) setPickerProduct(product);
    else addToCart(product);
  };

  const updateQty = (key, delta) =>
    setCart(prev =>
      prev.map(p => {
        if (p.cartKey !== key) return p;
        return { ...p, quantity: Math.max(p.quantity + delta, 0) };
      }).filter(p => p.quantity > 0)
    );

  const removeFromCart = (key) => setCart(prev => prev.filter(p => p.cartKey !== key));

  /* ── Checkout ────────────────────────────────────────────── */
  const handleCheckout = async () => {
    if (!can("sale.create"))
      return showNotice("Sin permiso para registrar ventas", "error");
    if (!selectedClient)
      return showNotice("Selecciona un cliente", "warning");
    const outOfStockItem = cart.find(item => !canSellItem(item));
    if (outOfStockItem)
      return showNotice(`No puedes vender ${outOfStockItem.name} porque no tiene stock disponible`, "warning");
    if (isFiado && schedule.length === 0)
      return showNotice("Agrega al menos una cuota al cronograma", "warning");
    if (isFiado && schedule.some(i => !i.date))
      return showNotice("Completa las fechas de todas las cuotas", "warning");
    if (isFiado && Math.abs(scheduleSum - pendingAmt) > 1)
      return showNotice(`La suma de cuotas ($${scheduleSum.toLocaleString("es-CO")}) no coincide con el pendiente ($${pendingAmt.toLocaleString("es-CO")})`, "warning");

    const fullNotes = isFiado ? (creditNotes.trim() || null) : null;

    setIsSaving(true);
    try {
      const { data } = await api.post("/sales", {
        customer_id:    selectedClient.id,
        items: cart.map(i => ({
          product_id: i.id,
          variant_id: i.variantId ?? undefined,
          quantity:   i.quantity,
        })),
        sale_type:       "fisica",
        payment_method:  isFiado ? "credit" : paymentMethod,
        discount_id:     selectedDiscountId ? parseInt(selectedDiscountId) : undefined,
        discount_amount: discountAmt,
        credit_due_date: isFiado && schedule.length > 0
          ? schedule[schedule.length - 1].date
          : undefined,
        credit_notes:     fullNotes,
        initial_payment:  isFiado ? initPay : 0,
        payment_schedule: isFiado && schedule.length > 0
          ? schedule.map(s => ({ date: s.date, amount: Number(s.amount) }))
          : undefined,
      });

      showNotice(data.message || "Venta registrada ✓", "success");
      setCart([]);
      setSelectedClient(null);
      setSelectedDiscountId("");
      setPaymentMethod("cash");
      setCreditNotes("");
      setInitialPayment("");
      setSchedule([]);
      setWizardN(3);
      setWizardFreq("mensual");
      setWizardStart("");
      setCreditProfile(null);
      setIsModalOpen(false);
      // F-03: refrescar catálogo para que el stock refleje la venta recién registrada
      loadProducts();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al procesar la venta", "error");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Filtros ─────────────────────────────────────────────── */
  const categories = ["all", ...new Set(products.map(p => p.category_name).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat    = categoryFilter === "all" || p.category_name === categoryFilter;
    return matchSearch && matchCat;
  });
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    u.cedula?.includes(clientSearch)
  );

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="pb-28 lg:pb-8 bg-gray-50 dark:bg-[#0D1117] min-h-screen transition-colors duration-300">
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 px-0 lg:px-6 py-4 lg:py-6">

        {/* ── CATÁLOGO ── */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="px-4 lg:px-0 pt-2 pb-3 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text" placeholder="Nombre o SKU..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#131B2A] rounded-xl border border-gray-200 dark:border-white/[0.06] focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-colors"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => setIsModalOpen(true)} disabled={cart.length === 0}
                className="lg:hidden relative flex items-center gap-1.5 bg-slate-900 dark:bg-slate-700 disabled:bg-gray-300 text-white px-4 rounded-xl text-sm font-bold transition-all active:scale-95 flex-shrink-0">
                <ShoppingCart size={16} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      categoryFilter === cat
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-slate-400"
                    }`}>
                    {cat === "all" ? "Todos" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-0 space-y-1.5 pb-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Package size={32} className="text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-gray-500">
                  {searchTerm ? `Sin resultados para "${searchTerm}"` : "No hay productos"}
                </p>
              </div>
            ) : filteredProducts.map(p => {
              const inCartItems = cart.filter(c => c.id === p.id);
              const inCartQty   = inCartItems.reduce((s, c) => s + c.quantity, 0);
              const price       = Number(p.sale_price ?? p.price ?? 0);
              return (
                <div key={p.id}
                  className={`bg-white dark:bg-[#131B2A] rounded-xl border transition-all ${
                    inCartItems.length ? "border-slate-900/20 dark:border-white/20" : "border-gray-100 dark:border-white/[0.06]"
                  } ${!(p.is_sellable ?? true) ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-500 font-black text-sm flex-shrink-0">
                      {p.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.sku && <span className="text-[10px] text-gray-400 font-mono flex items-center gap-0.5"><Hash size={9}/>{p.sku}</span>}
                        {p.has_variants ? (
                          <span className="text-[10px] font-bold text-violet-500 flex items-center gap-0.5"><Layers size={9}/>variantes</span>
                        ) : (() => {
                          const disp = getStockValue(p);
                          const isOnDemand = isOnDemandSale(p);
                          const isOut = !canSellItem(p);
                          const isLow = !isOut && !isOnDemand && disp <= 1;
                          if (isOnDemand && disp <= 0) {
                            return (
                              <span className="text-[10px] font-bold text-blue-500">
                                {p.availability_label ?? "Bajo pedido"}
                              </span>
                            );
                          }
                          if (p.fulfillment_mode === 'stock') {
                            return (
                              <span className={`text-[10px] font-bold ${isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-500"}`}>
                                {isOut ? "Agotado" : `${disp} uds`}
                              </span>
                            );
                          }
                          if (disp > 0) {
                            return <span className={`text-[10px] font-bold ${isLow ? "text-amber-500" : "text-emerald-500"}`}>{disp} uds</span>;
                          }
                          return <span className="text-[10px] font-bold text-red-500">Agotado</span>;
                        })()}
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-800 dark:text-slate-100 flex-shrink-0">
                      ${fmtCOP(price)}
                    </span>
                    {p.has_variants ? (
                      <button onClick={() => handleAddProduct(p)}
                        disabled={!(p.is_sellable ?? true)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
                          inCartItems.length ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" : "bg-violet-600 text-white"
                        }`}>
                        <Layers size={12} />
                        {inCartItems.length ? <><span>{inCartQty}</span><ChevronDown size={10}/></> : "Elegir"}
                      </button>
                    ) : (() => {
                      const inCart  = inCartItems[0];
                      const maxQty  = !(canOrderOnDemand(p) && getStockValue(p) <= 0) && p.fulfillment_mode === 'stock'
                        ? getStockValue(p)
                        : 9999;
                      return inCart ? (
                        <div className="flex items-center gap-1 bg-slate-900 dark:bg-slate-700 rounded-lg p-1 flex-shrink-0">
                          <button onClick={() => updateQty(inCart.cartKey, -1)} className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white"><Minus size={11}/></button>
                          <span className="text-xs font-black text-white w-4 text-center">{inCart.quantity}</span>
                          <button onClick={() => updateQty(inCart.cartKey, 1)} disabled={inCart.quantity >= maxQty} className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30"><Plus size={11}/></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(p)} disabled={!canSellItem(p)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-white/[0.06] hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-gray-600 dark:text-slate-400 rounded-xl transition-all active:scale-90 disabled:opacity-30">
                          <Plus size={15} strokeWidth={2.5}/>
                        </button>
                      );
                    })()}
                  </div>
                  {p.has_variants && inCartItems.length > 0 && (
                    <div className="px-3 pb-2.5 space-y-1">
                      {inCartItems.map(item => (
                        <div key={item.cartKey} className="flex items-center gap-2 bg-white dark:bg-white/[0.04] rounded-lg px-2.5 py-1.5 border border-gray-100 dark:border-white/[0.06]">
                          <div className="flex-1 min-w-0"><VariantChips attributes={item.variantAttributes}/></div>
                          <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400">${fmtCOP(getPrice(item))}</span>
                          <div className="flex items-center gap-1 bg-slate-900 rounded-md p-0.5">
                            <button onClick={() => updateQty(item.cartKey, -1)} className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white"><Minus size={9}/></button>
                            <span className="text-[10px] font-black text-white w-3 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.cartKey, 1)} disabled={item.quantity >= item.stock} className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30"><Plus size={9}/></button>
                          </div>
                          <button onClick={() => removeFromCart(item.cartKey)} className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"><X size={11}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CARRITO DESKTOP ── */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 sticky top-24 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                <ShoppingCart size={16}/> Carrito
                {cartCount > 0 && (
                  <span className="w-5 h-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </h2>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">Limpiar</button>
              )}
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-slate-500 text-xs py-10">Sin productos</p>
              ) : cart.map(item => (
                <div key={item.cartKey} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate">{item.name}</p>
                    <VariantChips attributes={item.variantAttributes}/>
                    <p className="text-[10px] text-gray-400 mt-0.5">${fmtCOP(getPrice(item) * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] rounded-lg px-1 py-0.5">
                    <button onClick={() => updateQty(item.cartKey, -1)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"><Minus size={10}/></button>
                    <span className="text-xs font-bold text-gray-800 dark:text-white w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.cartKey, 1)}
                      className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800"><Plus size={10}/></button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartKey)} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"><X size={13}/></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">${fmtCOP(total)}</span>
                </div>
              </div>
            )}
            <button onClick={() => setIsModalOpen(true)} disabled={cart.length === 0 || !can("sale.create")}
              className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-gray-200 dark:disabled:bg-white/10 text-white dark:text-slate-900 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:text-gray-400">
              Cobrar ${fmtCOP(total)}
            </button>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════
          MODAL CHECKOUT
      ══════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#131B2A] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] transition-colors duration-300">
            <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
              <h2 className="text-lg font-black text-gray-800 dark:text-white">Finalizar venta</h2>
              <button onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 bg-gray-100 dark:bg-white/[0.08] rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={15} strokeWidth={2.5}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* ── 1. Cliente ── */}
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                  Cliente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                  <input type="text"
                    placeholder={can("user.read") ? "Nombre o cédula..." : "Sin permiso"}
                    disabled={!can("user.read")}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:opacity-50 transition-colors"
                    value={clientSearch} onChange={e => setClientSearch(e.target.value)}/>
                </div>
                {clientSearch.length > 0 && !selectedClient && can("user.read") && (
                  <div className="mt-1.5 max-h-36 overflow-y-auto border border-gray-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#0D1117] shadow-lg">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
                    ) : filteredUsers.slice(0, 8).map(u => (
                      <button key={u.id} onClick={() => { setSelectedClient(u); setClientSearch(""); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.04] border-b border-gray-100 dark:border-white/[0.04] last:border-0 flex justify-between items-center transition-colors">
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">{u.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{u.cedula}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedClient && (
                  <div className="mt-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] px-3.5 py-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center">
                        <User size={14}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedClient.name}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <CreditCard size={9}/>{selectedClient.cedula}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-red-500"><X size={15}/></button>
                  </div>
                )}
              </div>

              {/* ── 2. Método de pago ── */}
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                  Método de pago
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_OPTIONS.map(({ value, label, Icon, color }) => {
                    const isActive = paymentMethod === value;
                    return (
                      <button key={value} onClick={() => setPaymentMethod(value)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${
                          isActive ? COLOR[color].active : COLOR[color].idle
                        }`}>
                        <Icon size={18}/>
                        <span className="text-[10px] leading-tight text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. Descuento POS ── */}
              {discounts.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                    Descuento
                  </label>
                  <div className="space-y-1.5">
                    {/* Opción "sin descuento" */}
                    <button
                      type="button"
                      onClick={() => setSelectedDiscountId("")}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all text-sm ${
                        !selectedDiscountId
                          ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.06]"
                          : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]"
                      }`}
                    >
                      <span className="font-semibold text-gray-500 dark:text-slate-400">Sin descuento</span>
                    </button>
                    {discounts.map(d => {
                      const isSel = selectedDiscountId === String(d.id);
                      const label = d.type === "percentage" ? `-${d.value}%` : `-$${fmtCOP(d.value)}`;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDiscountId(String(d.id))}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all text-sm ${
                            isSel
                              ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.06] text-gray-900 dark:text-white"
                              : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-white/20"
                          }`}
                        >
                          <span className="font-semibold truncate flex-1 text-left mr-2">{d.name}</span>
                          <span className={`flex-shrink-0 text-xs font-black px-2 py-0.5 rounded-full ${
                            isSel
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                              : "bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-slate-400"
                          }`}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {discountAmt > 0 && (
                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Descuento aplicado: -${fmtCOP(discountAmt)}
                    </p>
                  )}
                </div>
              )}

              {/* ── 4. Sección Fiado ── */}
              {isFiado && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Handshake size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0"/>
                    <p className="text-sm font-black text-amber-700 dark:text-amber-400">Condiciones del crédito</p>
                  </div>

                  {/* Perfil crediticio del cliente */}
                  {creditProfile && (
                    <div className="bg-white/80 dark:bg-white/[0.04] border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          <TrendingUp size={10}/> Historial crediticio
                        </p>
                        {/* Reliability badge */}
                        {(() => {
                          const BADGE = {
                            new:       { label: "Cliente nuevo",    cls: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400" },
                            reliable:  { label: "Confiable",        cls: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
                            risky:     { label: "Atención",         cls: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" },
                            defaulter: { label: "Riesgo alto",      cls: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" },
                          };
                          const b = BADGE[creditProfile.reliability_label] ?? BADGE.new;
                          return (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${b.cls}`}>
                              {b.label}
                            </span>
                          );
                        })()}
                      </div>
                      {creditProfile.total_credit_sales > 0 && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <p className="text-base font-black text-gray-900 dark:text-white">{creditProfile.total_credit_sales}</p>
                              <p className="text-[9px] text-gray-400">ventas fiadas</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-base font-black ${creditProfile.overdue_installments > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {creditProfile.overdue_installments}
                              </p>
                              <p className="text-[9px] text-gray-400">vencidas hoy</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-base font-black ${(creditProfile.on_time_percentage ?? 100) >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                {creditProfile.on_time_percentage !== null ? `${creditProfile.on_time_percentage}%` : "—"}
                              </p>
                              <p className="text-[9px] text-gray-400">a tiempo</p>
                            </div>
                          </div>
                          {creditProfile.pending_debt > 0 && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 ${
                              creditProfile.overdue_installments > 0
                                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            }`}>
                              {creditProfile.overdue_installments > 0 && <AlertTriangle size={10}/>}
                              Deuda activa: <strong>${fmtCOP(creditProfile.pending_debt)}</strong>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Abono inicial */}
                  <div>
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1.5 block">
                      Abono inicial (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                      <input type="number" min="0" max={total} step="1000"
                        value={initialPayment}
                        onChange={e => setInitialPayment(e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-4 py-2.5 bg-white dark:bg-[#131B2A] border border-amber-300 dark:border-amber-500/40 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors"/>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[0, 0.25, 0.5].map(f => (
                        <button key={f}
                          onClick={() => setInitialPayment(f === 0 ? "" : Math.round(total * f))}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            (f === 0 && !initialPayment) || (f > 0 && initPay === Math.round(total * f))
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white dark:bg-white/[0.04] text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                          }`}>
                          {f === 0 ? "Sin abono" : `${f * 100}%`}
                        </button>
                      ))}
                    </div>
                    {initPay > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5">
                        Queda pendiente: <strong>${fmtCOP(pendingAmt)}</strong>
                      </p>
                    )}
                  </div>

                  {/* Warning sin email */}
                  {selectedClient && !selectedClient.email && (
                    <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 rounded-xl px-3 py-2">
                      <AlertCircle size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0"/>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        Sin email registrado — solo se notificará al administrador
                      </p>
                    </div>
                  )}

                  {/* Cronograma de cuotas */}
                  <div>
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Calendar size={10}/> Cronograma de cuotas <span className="text-red-500">*</span>
                    </label>

                    {/* Wizard de generación automática */}
                    <div className="bg-white/60 dark:bg-white/[0.04] border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 mb-3 space-y-2.5">
                      <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={10}/> Generar plan automático
                      </p>

                      {/* Frecuencia */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {FREQ_OPTIONS.map(({ value, label }) => (
                          <button key={value}
                            onClick={() => { setWizardFreq(value); if (value === "unico") setWizardN(1); }}
                            className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                              wizardFreq === value
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-white dark:bg-white/[0.04] text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:border-amber-400"
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* N cuotas + fecha primera cuota */}
                      <div className="flex gap-2">
                        {wizardFreq !== "unico" && (
                          <div className="flex-1">
                            <label className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mb-1 block"># Cuotas</label>
                            <input type="number" min="2" max="36" value={wizardN}
                              onChange={e => setWizardN(Math.max(2, Math.min(36, Number(e.target.value))))}
                              className="w-full px-2.5 py-2 bg-white dark:bg-[#131B2A] border border-amber-300 dark:border-amber-500/40 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"/>
                          </div>
                        )}
                        <div className="flex-[2]">
                          <label className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mb-1 block">
                            {wizardFreq === "unico" ? "Fecha de pago" : "Primera cuota"}
                          </label>
                          <input type="date"
                            value={wizardStart}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={e => setWizardStart(e.target.value)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#131B2A] border border-amber-300 dark:border-amber-500/40 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"/>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={generateSchedule}
                            disabled={!wizardStart || pendingAmt <= 0}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white text-[10px] font-black rounded-lg transition-all active:scale-95 flex items-center gap-1">
                            <Sparkles size={10}/> Generar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de cuotas (editable) */}
                    <div className="space-y-2">
                      {schedule.map((inst, idx) => (
                        <div key={inst.id} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black w-4 text-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="date"
                            value={inst.date}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={e => updateInstallment(inst.id, "date", e.target.value)}
                            className="flex-1 px-2 py-2 bg-white dark:bg-[#131B2A] border border-amber-300 dark:border-amber-500/40 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                            <input
                              type="number" min="0" step="1000"
                              value={inst.amount}
                              onChange={e => updateInstallment(inst.id, "amount", e.target.value)}
                              placeholder="0"
                              className="w-full pl-5 pr-2 py-2 bg-white dark:bg-[#131B2A] border border-amber-300 dark:border-amber-500/40 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          <button
                            onClick={() => removeInstallment(inst.id)}
                            className="text-gray-300 dark:text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X size={13}/>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addInstallment}
                      className="mt-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:text-amber-700 transition-colors"
                    >
                      <Plus size={11}/> Añadir cuota
                    </button>

                    {/* Indicador de suma */}
                    {schedule.length > 0 && (
                      <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${
                        scheduleOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                      }`}>
                        {scheduleOk
                          ? <CheckCircle2 size={11}/>
                          : <AlertCircle size={11}/>}
                        Suma: ${fmtCOP(scheduleSum)}
                        {!scheduleOk && pendingAmt > 0 && (
                          <span className="font-normal opacity-70">
                            {" · "}pendiente: ${fmtCOP(pendingAmt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1.5 block">
                      Notas del acuerdo (opcional)
                    </label>
                    <textarea rows={2} value={creditNotes} onChange={e => setCreditNotes(e.target.value)}
                      placeholder="Ej: Paga los viernes, avisa antes…"
                      className="w-full px-3 py-2.5 bg-white dark:bg-[#131B2A] border border-amber-300 dark:border-amber-500/40 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"/>
                  </div>

                  {/* Resumen fiado */}
                  <div className="bg-white/70 dark:bg-black/20 rounded-xl px-3.5 py-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-600 dark:text-amber-400">Total de la venta</span>
                      <span className="font-bold text-gray-900 dark:text-white">${fmtCOP(total)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-600 dark:text-amber-400">Abono hoy</span>
                      <span className="font-bold text-emerald-600">${fmtCOP(initPay)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-amber-200 dark:border-amber-500/30 pt-1.5">
                      <span className="font-black text-amber-700 dark:text-amber-400">Por cobrar en cuotas</span>
                      <span className="font-black text-amber-700 dark:text-amber-400">${fmtCOP(pendingAmt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4. Resumen del pedido ── */}
              <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3.5 space-y-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Resumen del pedido</p>
                {cart.map(item => (
                  <div key={item.cartKey} className="space-y-0.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400 truncate flex-1 mr-2">
                        {item.name}
                        {item.variantId && <span className="text-gray-400"> (var.)</span>}
                        <span className="text-gray-400"> ×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-slate-100 flex-shrink-0">
                        ${fmtCOP(getPrice(item) * item.quantity)}
                      </span>
                    </div>
                    {item.variantAttributes?.length > 0 && <VariantChips attributes={item.variantAttributes}/>}
                  </div>
                ))}
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">{selectedDiscount?.name ?? "Descuento"}</span>
                    <span className="font-bold">-${fmtCOP(discountAmt)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-white/[0.06] pt-2 flex justify-between">
                  <span className="font-black text-gray-800 dark:text-white text-sm">Total</span>
                  <span className="font-black text-slate-900 dark:text-white">${fmtCOP(total)}</span>
                </div>
              </div>
            </div>

            {/* ── Footer / Botón confirmar ── */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] flex-shrink-0 space-y-2">
              {isFiado && schedule.length === 0 && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0"/>
                  <p className="text-xs text-red-600 dark:text-red-400">Agrega al menos una cuota al cronograma</p>
                </div>
              )}
              {isFiado && schedule.length > 0 && !scheduleOk && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2">
                  <AlertCircle size={13} className="text-amber-500 flex-shrink-0"/>
                  <p className="text-xs text-amber-700 dark:text-amber-400">La suma de cuotas no coincide con el pendiente</p>
                </div>
              )}
              <button onClick={handleCheckout}
                disabled={isSaving || !selectedClient || (isFiado && (schedule.length === 0 || !scheduleOk))}
                className={`w-full py-3.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFiado ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
                }`}>
                {isSaving ? <Loader2 size={16} className="animate-spin"/>
                  : isFiado ? <Handshake size={16}/>
                  : <CheckCircle2 size={16}/>}
                {isSaving ? "Procesando…"
                  : isFiado
                    ? `Registrar fiado · $${fmtCOP(total)}`
                    : `Confirmar pago · $${fmtCOP(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerProduct && (
        <VariantPicker
          product={pickerProduct}
          onSelect={addVariantToCart}
          onClose={() => setPickerProduct(null)}
        />
      )}
    </div>
  );
}
