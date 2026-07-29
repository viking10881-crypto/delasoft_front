// src/pages/tools/Inventory.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package, Search, RefreshCw, Loader2, AlertTriangle,
  XCircle, BarChart3, ChevronDown, ChevronUp,
  DollarSign, Boxes, Clock, ShoppingCart, EyeOff,
} from "lucide-react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";
import { useAuth }   from "../../context/AuthContext";
import AdjustmentModal       from "../../components/inventory/AdjustmentModal";
import DamageModal           from "../../components/inventory/DamageModal";
import LedgerModal           from "../../components/inventory/LedgerModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN   = (n) => (n == null ? "—" : Number(n).toLocaleString("es-CO"));
const fmtCOP = (n) => (n == null ? "—" : `$${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`);

// Derivar status client-side para cubrir casos que la vista no contempla
function deriveStatus(item) {
  const fisico   = Number(item.stock_fisico ?? item.stock ?? 0);
  const minStock = Number(item.stock_safety ?? item.min_stock ?? 0);
  const maxStock = item.max_stock != null ? Number(item.max_stock) : null;

  if (fisico <= 0) {
    return "out";
  }
  if (maxStock != null && fisico >= maxStock) return "excess";
  if (minStock > 0 && fisico <= minStock) return "low";
  return "normal";
}

const STATUS_CFG = {
  normal:   { label: "Normal",    cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" },
  low:      { label: "Bajo",      cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" },
  out:      { label: "Agotado",   cls: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20" },
  excess:   { label: "Excedente", cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" },
  blocked:  { label: "Safety",    cls: "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-400 border-gray-200 dark:border-white/[0.08]" },
};

function StatusBadge({ item }) {
  const key = deriveStatus(item);
  const cfg = STATUS_CFG[key] ?? STATUS_CFG.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Inventory() {
  const { showNotice } = useNotice();
  const { can }        = useAuth();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [sortKey,  setSortKey]  = useState("name");
  const [sortDir,  setSortDir]  = useState("asc");

  const [adjustTarget,       setAdjustTarget]       = useState(null);
  const [damageTarget,       setDamageTarget]        = useState(null);
  const [ledgerTarget,       setLedgerTarget]        = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inventory/products");
      const rows = Array.isArray(data?.data) ? data.data
                 : Array.isArray(data)        ? data
                 : [];
      setItems(rows);
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al cargar inventario", "error");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const stockItems = items;

  // KPIs derivados de la lista ya cargada — no dependemos de v_inventory_valuation
  const kpis = useMemo(() => {
    if (!stockItems.length) return null;
    return {
      total_value:  stockItems.reduce((s, i) => s + Number(i.stock_fisico ?? i.stock ?? 0) * Number(i.purchase_price ?? 0), 0),
      total_units:  stockItems.reduce((s, i) => s + Number(i.stock_fisico ?? i.stock ?? 0), 0),
      out_of_stock: stockItems.filter(i => deriveStatus(i) === "out").length,
      low_stock:    stockItems.filter(i => deriveStatus(i) === "low").length,
    };
  }, [stockItems]);


  // ── Ordenar ────────────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Counts para filtros (dinámicos) ───────────────────────────────────────
  const counts = useMemo(() => ({
    all:    stockItems.length,
    low:    stockItems.filter(i => deriveStatus(i) === "low").length,
    out:    stockItems.filter(i => deriveStatus(i) === "out").length,
    excess: stockItems.filter(i => deriveStatus(i) === "excess").length,
  }), [stockItems]);

  // ── Filtrar y ordenar ──────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    return [...stockItems]
      .filter(item => {
        const q = search.trim().toLowerCase();
        const matchSearch = !q ||
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.variant_sku?.toLowerCase().includes(q);
        const matchFilter = filter === "all" || deriveStatus(item) === filter;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        let va = a[sortKey] ?? "";
        let vb = b[sortKey] ?? "";
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
      });
  }, [items, search, filter, sortKey, sortDir]);

  // ── Th sorteable con tooltip ───────────────────────────────────────────────
  function Th({ label, sortable, field, right, tooltip }) {
    const active = sortable && sortKey === field;
    return (
      <th
        onClick={sortable ? () => toggleSort(field) : undefined}
        title={tooltip}
        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap select-none
          ${right ? "text-right" : "text-left"}
          ${sortable ? "cursor-pointer hover:text-gray-700 dark:hover:text-white" : ""}
          text-gray-400 dark:text-slate-500`}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {tooltip && <span className="text-gray-300 dark:text-slate-700 text-[9px]" title={tooltip}>ⓘ</span>}
          {active && (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
        </span>
      </th>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Package size={14} className="text-amber-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">Stock</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">Inventario</h1>
            <p className="text-sm text-gray-500 dark:text-slate-500 font-medium mt-1">
              {loading ? "Cargando..." : `${displayed.length} de ${stockItems.length} producto${stockItems.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-300 text-sm font-bold hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Valor total", value: fmtCOP(kpis.total_value),
                icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10",
                highlight: false,
              },
              {
                label: "Unidades", value: fmtN(kpis.total_units),
                icon: Boxes, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10",
                highlight: false,
              },
              {
                label: "Agotados", value: fmtN(kpis.out_of_stock),
                icon: XCircle,
                color: kpis.out_of_stock > 0 ? "text-red-500" : "text-gray-400",
                bg: kpis.out_of_stock > 0 ? "bg-red-50 dark:bg-red-500/10" : "bg-gray-50 dark:bg-white/[0.03]",
                highlight: kpis.out_of_stock > 0,
              },
              {
                label: "Stock bajo", value: fmtN(kpis.low_stock),
                icon: AlertTriangle,
                color: kpis.low_stock > 0 ? "text-amber-500" : "text-gray-400",
                bg: kpis.low_stock > 0 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-gray-50 dark:bg-white/[0.03]",
                highlight: kpis.low_stock > 0,
              },
            ].map(({ label, value, icon: Icon, color, bg, highlight }) => (
              <div key={label} className={`bg-white dark:bg-white/[0.03] border rounded-2xl p-4 flex items-center gap-3 ${
                highlight ? "border-red-100 dark:border-red-500/20" : "border-gray-100 dark:border-white/[0.07]"
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                  <p className={`text-lg font-black truncate ${highlight ? color : "text-gray-900 dark:text-white"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtros y búsqueda ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o variante…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-500/60 transition-all"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {[
              { key: "all",    label: "Todos",     icon: <BarChart3 size={12} /> },
              { key: "low",    label: "Bajo",      icon: <AlertTriangle size={12} /> },
              { key: "out",    label: "Agotado",   icon: <XCircle size={12} /> },
              { key: "excess", label: "Excedente", icon: <ChevronUp size={12} /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  filter === key
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20"
                    : "bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-slate-400 hover:border-gray-300"
                }`}
              >
                {icon}
                {label}
                <span className={`px-1 rounded text-[10px] font-black ${filter === key ? "bg-white/25" : "bg-gray-100 dark:bg-white/[0.08]"}`}>
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabla ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin mb-3 text-amber-500" size={32} />
            <p className="font-medium text-sm text-gray-400">Cargando inventario…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/[0.06]">
            <Package className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
            <p className="text-gray-400 dark:text-slate-600 font-bold">Sin productos para este filtro</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 800 }}>
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    <Th label="Producto"   sortable field="name" />
                    <Th label="SKU"        sortable field="sku" />
                    <Th label="Físico"     sortable field="stock_fisico"   right tooltip="Unidades reales en almacén" />
                    <Th label="Safety"     sortable field="safety_stock"   right tooltip="Colchón mínimo de seguridad configurado por producto" />
                    <Th label="Disponible" sortable field="disponible"     right tooltip="Unidades disponibles para venta" />
                    <Th label="Valor inv." sortable field="inventory_value" right />
                    <Th label="Estado" />
                    <Th label="Acciones" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {displayed.map((item) => (
                    <InventoryRow
                      key={`${item.product_id ?? item.id}-${item.variant_id ?? "base"}`}
                      item={item}
                      canAdjust={can("product.update")}
                      onAdjust={() => setAdjustTarget({ ...item, product_id: item.product_id ?? item.id, variant_id: item.variant_id ?? undefined })}
                      onDamage={() => setDamageTarget({ ...item, product_id: item.product_id ?? item.id, variant_id: item.variant_id ?? undefined })}
                      onLedger={() => setLedgerTarget({ ...item, product_id: item.product_id ?? item.id })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Modales ── */}
      {adjustTarget && (
        <AdjustmentModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => { setAdjustTarget(null); load(); }}
        />
      )}
      {damageTarget && (
        <DamageModal
          item={damageTarget}
          onClose={() => setDamageTarget(null)}
          onSuccess={() => { setDamageTarget(null); load(); }}
        />
      )}
      {ledgerTarget && (
        <LedgerModal
          item={ledgerTarget}
          onClose={() => setLedgerTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Fila de inventario ───────────────────────────────────────────────────────
function InventoryRow({ item, onAdjust, onDamage, onLedger, canAdjust }) {

  // Valor de inventario: campo del backend si existe, o calcular desde stock × costo
  const invValue = item.inventory_value != null
    ? Number(item.inventory_value)
    : (Number(item.stock_fisico ?? item.stock ?? 0) * Number(item.purchase_price ?? 0)) || null;

  // Label de variante: atributos del backend primero (ej: "Talla M / Rojo"), SKU como fallback
  const varLabel = item.variant_label || item.variant_sku || null;

  // Nombre con label de variante en segunda línea cuando aplica
  const displayName = varLabel
    ? <>
        {item.name}
        <span className="block text-[11px] font-normal text-gray-400 dark:text-slate-500 mt-0.5 leading-tight">
          {varLabel}
        </span>
      </>
    : item.name;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">

      {/* Producto */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
          {item.is_published === false && (
            <span
              title="Este producto se conserva en inventario, pero no aparece en la tienda online"
              className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:bg-white/[0.06] dark:text-slate-400"
            >
              <EyeOff size={10} />
              Oculto
            </span>
          )}
        </div>
      </td>

      {/* SKU — variante si existe, producto si no */}
      <td className="px-4 py-3">
        <code className="text-xs font-mono text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
          {(item.variant_id ? item.variant_sku : item.sku) || "—"}
        </code>
      </td>

      {/* Stock físico */}
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
        {fmtN(item.stock_fisico ?? item.stock)}
      </td>

      {/* Safety stock */}
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-slate-400">
        {fmtN(item.safety_stock ?? item.min_stock ?? 0)}
      </td>

      {/* Disponible */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-black text-gray-900 dark:text-white">
          {fmtN(item.stock_fisico ?? item.stock)}
        </span>
      </td>

      {/* Valor inv. */}
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-slate-400">
        {invValue ? fmtCOP(invValue) : <span className="text-gray-300 dark:text-slate-700">—</span>}
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <StatusBadge item={item} />
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        {canAdjust ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onAdjust}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 transition-all"
            >
              Ajustar
            </button>
            <button
              onClick={onDamage}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-all"
            >
              Merma
            </button>
            <button
              onClick={onLedger}
              title="Ver historial de movimientos"
              className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] transition-all"
            >
              <Clock size={13} />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
        )}
      </td>
    </tr>
  );
}
