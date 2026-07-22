// src/components/variants/VariantRow.jsx
import { useState } from "react";
import {
  Pencil, Trash2, Loader2,
  ToggleLeft, ToggleRight, SlidersHorizontal,
} from "lucide-react";
import AttributeChip from "./AttributeChip";

const fmtCOP = (n) =>
  n != null ? `$${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "—";

/**
 * VariantRow — fila de tabla. El stock es SOLO LECTURA aquí.
 * Para modificarlo usar el botón "Ajustar" → AdjustmentModal.
 *
 * Props:
 *   variant       : objeto variante
 *   productPrice  : precio base del producto
 *   hasSupplier?  : boolean — si hay proveedor, el badge "sin stock" pasa a tono neutro "bajo pedido"
 *   onEdit        : () => void  (abre modal de edición)
 *   onToggle      : async (isActive) => void
 *   onDelete      : async () => void
 *   onAdjust      : (variant) => void  (abre AdjustmentModal)
 */
export default function VariantRow({
  variant,
  productPrice,
  hasSupplier = false,
  onEdit,
  onToggle,
  onDelete,
  onAdjust,
}) {
  const [deleting,   setDeleting]   = useState(false);
  const [toggling,   setToggling]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); setConfirmDel(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(!variant.is_active); } finally { setToggling(false); }
  };

  const effectivePrice = variant.sale_price ?? productPrice;

  const stockLevel =
    variant.stock === 0  ? "out"
    : variant.stock <= 3 ? "low"
    : "ok";

  const stockColors = {
    out: hasSupplier
      ? "bg-gray-100 text-gray-400 border-gray-200"
      : "bg-red-100 text-red-700 border-red-200",
    low: "bg-amber-100 text-amber-700 border-amber-200",
    ok:  "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <tr
      className={`border-b border-gray-100 transition-colors ${
        variant.is_active ? "hover:bg-gray-50" : "opacity-50 hover:bg-gray-50"
      }`}
    >
      {/* Atributos */}
      <td className="py-3.5 px-5">
        {variant.attributes?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {variant.attributes.map((a) => (
              <AttributeChip key={a.attribute_value_id} attribute={a} />
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin atributos</span>
        )}
      </td>

      {/* SKU */}
      <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
        {variant.sku ?? <span className="text-gray-300">—</span>}
      </td>

      {/* Precio */}
      <td className="py-3.5 px-4 text-right font-semibold text-gray-800 text-sm">
        {fmtCOP(effectivePrice)}
        {!variant.sale_price && productPrice && (
          <span className="block text-[10px] text-gray-400 font-normal">heredado</span>
        )}
      </td>

      {/* Stock — solo lectura + botón Ajustar */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold select-none ${stockColors[stockLevel]}`}
          >
            {variant.stock}
            {stockLevel === "out" && <span>{hasSupplier ? "bajo pedido" : "sin stock"}</span>}
            {stockLevel === "low" && <span>bajo</span>}
          </span>

          {onAdjust && (
            <button
              type="button"
              onClick={() => onAdjust(variant)}
              title="Ajustar stock vía historial"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <SlidersHorizontal size={13} />
            </button>
          )}
        </div>
      </td>

      {/* Estado */}
      <td className="py-3.5 px-4 text-center">
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          title={variant.is_active ? "Desactivar" : "Activar"}
          className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          {toggling ? (
            <Loader2 size={18} className="animate-spin" />
          ) : variant.is_active ? (
            <ToggleRight size={22} className="text-blue-500" />
          ) : (
            <ToggleLeft size={22} />
          )}
        </button>
      </td>

      {/* Acciones */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Editar variante"
          >
            <Pencil size={14} />
          </button>

          {confirmDel ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : "Sí, eliminar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                className="px-2 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Eliminar variante"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}