// src/components/variants/VariantsManager.jsx
import { useState } from "react";
import {
  Plus, RefreshCw, Package, AlertTriangle,
  TrendingDown, Activity,
} from "lucide-react";
import { useVariants }   from "../../hooks/useVariants";
import VariantRow        from "./VariantRow";
import VariantFormModal  from "./VariantFormModal";
import AdjustmentModal   from "../inventory/AdjustmentModal";

/**
 * VariantsManager — panel completo de gestión de variantes.
 *
 * Props:
 *   productId    : number   (requerido)
 *   productPrice : number   (precio base del producto)
 *   productName? : string   (para mostrar en encabezado)
 *   hasSupplier? : boolean  (si el producto tiene proveedor asignado — cambia tono de alertas de stock 0)
 */
export default function VariantsManager({ productId, productPrice, productName, hasSupplier = false }) {
  const {
    variants,
    attributes,
    loading,
    error,
    stats,
    refresh,
    createVariant,
    updateVariant,
    toggleActive,
    deleteVariant,
    createAttributeValue,
  } = useVariants(productId);

  const [modal,        setModal]        = useState(null); // null | { mode: "create" } | { mode: "edit", variant }
  const [adjustTarget, setAdjustTarget] = useState(null); // variante en ajuste

  // ─── Handlers ──────────────────────────────────────────────────
  const openCreate = () => setModal({ mode: "create" });
  const openEdit   = (v) => setModal({ mode: "edit", variant: v });
  const closeModal = () => setModal(null);

  const handleSave = async (payload) => {
    if (modal?.mode === "edit") {
      await updateVariant(modal.variant.id, payload);
    } else {
      await createVariant(payload);
    }
  };

  // F-01: abre AdjustmentModal con los datos correctos de la variante
  const handleAdjust = (variant) => {
    const attrLabel = variant.attributes?.length
      ? variant.attributes.map((a) => a.display_value ?? a.value).join(" / ")
      : null;
    setAdjustTarget({
      // product_id y variant_id separados para que AdjustmentModal arme el payload correcto
      product_id:  productId,
      variant_id:  variant.id,
      name: attrLabel
        ? `${productName ?? `Producto #${productId}`} — ${attrLabel}`
        : variant.sku ?? `Variante #${variant.id}`,
      stock_fisico: variant.stock,
      reservado:    variant.reserved ?? variant.stock_reserved ?? 0,
      safety_stock: variant.safety_stock ?? variant.min_stock ?? 0,
    });
  };

  // ─── Estados de carga / error ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <RefreshCw size={20} className="animate-spin" />
        <span className="text-sm font-semibold">Cargando variantes…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
        <AlertTriangle size={32} />
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">

        {/* ── Encabezado ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {productName ?? `Producto #${productId}`}
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">Variantes</h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={refresh}
              className="p-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors text-sm"
            >
              <Plus size={15} />
              Nueva variante
            </button>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            {
              icon: Activity,
              label: "Total variantes",
              value: stats.total,
              color: "bg-blue-50 text-blue-700",
              show: true,
            },
            {
              icon: Package,
              label: "Activas",
              value: stats.active,
              color: "bg-green-50 text-green-700",
              show: true,
            },
            {
              icon: AlertTriangle,
              label: "Stock bajo",
              value: stats.lowStock,
              color: stats.lowStock > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500",
              show: true,
            },
            {
              icon: TrendingDown,
              label: stats.noStock > 0 && hasSupplier ? "Bajo pedido" : "Sin stock",
              value: stats.noStock,
              color: stats.noStock > 0
                ? hasSupplier
                  ? "bg-gray-100 text-gray-400"
                  : "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-500",
              show: true,
            },
          ].filter(k => k.show).map((k) => (
            <div key={k.label} className={`${k.color} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">{k.label}</p>
                <k.icon size={14} className="opacity-60" />
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
            </div>
          ))}
        </div>

        {/* ── Alertas de stock ── */}
        {stats.noStock > 0 && !hasSupplier && (
          <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 px-5 py-3 rounded-r-2xl">
            <TrendingDown className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-800 font-medium">
              {stats.noStock} variante{stats.noStock > 1 ? "s" : ""} sin stock — considera reponer inventario.
            </p>
          </div>
        )}

        {/* ── Tabla ── */}
        {variants.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gray-50">
                    <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Atributos
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="text-right py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-center py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="py-3.5 px-5" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <VariantRow
                      key={v.id}
                      variant={v}
                      productPrice={productPrice}
                      hasSupplier={hasSupplier}
                      onEdit={() => openEdit(v)}
                      onToggle={(isActive) => toggleActive(v.id, isActive)}
                      onDelete={() => deleteVariant(v.id)}
                      onAdjust={handleAdjust}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 text-right">
              <p className="text-xs text-gray-400">
                {stats.active} de {stats.total} variante{stats.total !== 1 ? "s" : ""} activa{stats.active !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal edición/creación de variante ── */}
      {modal && (
        <VariantFormModal
          variant={modal.mode === "edit" ? modal.variant : undefined}
          productPrice={productPrice}
          attributes={attributes}
          onSave={handleSave}
          onNewAttrValue={createAttributeValue}
          onClose={closeModal}
        />
      )}

      {/* ── Modal ajuste de stock (F-01) ── */}
      {adjustTarget && (
        <AdjustmentModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => { setAdjustTarget(null); refresh(); }}
        />
      )}
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Package size={28} className="text-gray-300" />
      </div>
      <p className="font-bold text-gray-700 text-base">Sin variantes aún</p>
      <p className="text-sm text-gray-400 mt-1 mb-5">
        Agrega variantes para gestionar tallas, colores u otras combinaciones.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors text-sm"
      >
        <Plus size={15} />
        Crear primera variante
      </button>
    </div>
  );
}