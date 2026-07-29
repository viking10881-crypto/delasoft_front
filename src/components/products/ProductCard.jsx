// src/components/products/ProductCard.jsx
import { memo } from 'react';
import { Eye, EyeOff, Trash2, ShoppingBag, AlertCircle, Gift, Layers, Crown, Archive, ArchiveRestore } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function thumbUrl(url, size = 160) {
  if (!url) return null;
  if (!url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,f_auto,q_auto:best/`);
}

const ProductCard = memo(({ product, onView, onDelete, onTogglePublication, onToggleLifecycle }) => {
  const { isSuperAdmin } = useAuth();

  if (!product) return null;

  const {
    is_bundle: isBundle,
    has_variants: hasVariants,
    stock,
    disponible,
    disponible_inmediato: disponibleInmediato,
    stock_status,
    availability_label: availabilityLabel,
    min_stock = 5,
    name,
    category_name: categoryName,
    main_image: mainImage,
    owner_admin_name: ownerName,
    is_active: isActive = true,
    is_published: isPublished = true,
  } = product;

  // Usar disponible del endpoint de inventario si existe, si no caer en stock
  const stockDisplay = Number(disponibleInmediato ?? disponible ?? stock ?? 0);
  // Usar stock_status del endpoint si existe, si no calcularlo localmente
  const effectiveStatus = stock_status ?? (
    hasVariants ? null
    : stockDisplay <= 0 ? "out"
    : stockDisplay <= 1 ? "low"
    : "normal"
  );
  const lowStock      = !hasVariants && effectiveStatus === "low";
  const onDemandStock = !hasVariants && effectiveStatus === "on_demand";
  const criticalStock = !hasVariants && effectiveStatus === "out";
  const stockBadge = !hasVariants && (
    onDemandStock ? (availabilityLabel ?? "Venta bajo pedido")
    : criticalStock ? "Agotado"
    : lowStock ? "Stock bajo"
    : null
  );

  const displayPrice = Number(product.sale_price || product.price) || 0;
  const finalPrice   = Number(product.final_price) || 0;
  const hasDiscount  = finalPrice > 0 && finalPrice < displayPrice;
  const discountPct  = hasDiscount ? Math.round(((displayPrice - finalPrice) / displayPrice) * 100) : 0;

  const thumb = thumbUrl(mainImage);

  return (
    <article
      onClick={() => onView(product)}
      className={`
        group relative flex items-center gap-4 rounded-[22px] p-4 cursor-pointer
        transition-all duration-300 ease-out
        bg-white border border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]
        hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] hover:-translate-y-0.5
        dark:bg-[#1C1C1E] dark:border-[#2C2C2E] dark:shadow-none
        dark:hover:bg-[#242426] dark:hover:border-[#3A3A3C]
        ${isBundle ? "ring-1 ring-orange-500/20 dark:ring-orange-500/10" : ""}
        ${!isActive ? "opacity-70 grayscale-[0.35]" : ""}
      `}
    >
      {isBundle && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/[0.02] to-transparent dark:from-orange-500/[0.01] rounded-[22px] pointer-events-none" />
      )}

      {/* ── Imagen / Contenedor Visual ── */}
      <div className="relative flex-shrink-0 z-10">
        {hasDiscount && (
          <div className="absolute -top-1.5 -left-1.5 z-20 bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight shadow-md shadow-orange-500/10">
            -{discountPct}%
          </div>
        )}

        <div className="absolute -top-1.5 -right-1.5 z-20 flex flex-col gap-1">
          {isBundle && (
            <div className="bg-orange-500 text-white w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#1C1C1E]">
              <Gift size={11} strokeWidth={2.5} />
            </div>
          )}
          {hasVariants && (
            <div className="bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#1C1C1E]">
              <Layers size={11} strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] overflow-hidden bg-gray-50 dark:bg-[#2C2C2E] border border-gray-100 dark:border-[#3A3A3C] flex items-center justify-center">
          {thumb ? (
            <img
              src={thumb}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={e => { e.target.style.display = "none"; }}
            />
          ) : (
            <ShoppingBag size={22} className="text-gray-300 dark:text-[#48484A]" strokeWidth={2} />
          )}
        </div>

        {criticalStock && !hasVariants && (
          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-1 rounded-full ring-2 ring-white dark:ring-[#1C1C1E] shadow-sm">
            <AlertCircle size={11} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ── Info del Producto ── */}
      <div className="flex-1 min-w-0 z-10 py-0.5">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 dark:bg-[#2C2C2E] dark:text-[#8E8E93]">
            {categoryName || "General"}
          </span>
          {stockBadge && (
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${criticalStock ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" : onDemandStock ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"}`}>
              {stockBadge}
            </span>
          )}
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
            !isActive
              ? "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400"
              : isPublished
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-slate-400"
          }`}>
            {!isActive ? "Desactivado" : isPublished ? "Publicado" : "Oculto"}
          </span>
        </div>

        <h3 className="font-bold text-sm sm:text-base tracking-tight text-gray-900 dark:text-white truncate mb-1">
          {name}
        </h3>

        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                ${finalPrice.toLocaleString("es-CO")}
              </span>
              <span className="text-xs font-medium line-through text-gray-400 dark:text-[#8E8E93]">
                ${displayPrice.toLocaleString("es-CO")}
              </span>
            </div>
          ) : (
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              ${displayPrice.toLocaleString("es-CO")}
            </span>
          )}
        </div>

        {/* Propietario (SuperAdmin) */}
        {isSuperAdmin() && ownerName && (
          <div className="flex items-center gap-1 mt-2">
            <Crown size={11} className="text-orange-500 flex-shrink-0" />
            <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium truncate">
              {ownerName}
            </span>
          </div>
        )}
      </div>

      {/* ── Acciones Flotantes Estilo Apple ── */}
      <div
        className="flex flex-col gap-1.5 flex-shrink-0 z-10 sm:opacity-0 sm:translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
        onClick={e => e.stopPropagation()}
      >
        {isActive && (
          <button
            onClick={() => onTogglePublication?.(product)}
            className={`p-2 rounded-xl transition-colors duration-150 ${
              isPublished
                ? "text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white dark:bg-blue-500/10"
                : "text-gray-400 bg-gray-50 hover:bg-brand hover:text-white dark:bg-[#2C2C2E]"
            }`}
            title={isPublished ? "Ocultar de la tienda" : "Publicar en la tienda"}
          >
            {isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        <button
          onClick={() => onToggleLifecycle?.(product)}
          className="p-2 text-gray-400 bg-gray-50 hover:bg-slate-700 hover:text-white dark:bg-[#2C2C2E] rounded-xl transition-colors duration-150"
          title={isActive ? "Desactivar producto" : "Reactivar producto"}
        >
          {isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
        </button>
        <button
          onClick={() => onView(product)}
          className="p-2 text-gray-400 bg-gray-50 hover:bg-orange-500 hover:text-white dark:bg-[#2C2C2E] dark:hover:bg-orange-500 dark:hover:text-white rounded-xl transition-colors duration-150"
          title="Ver detalles"
        >
          <Eye size={15} strokeWidth={2} />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="p-2 text-gray-400 bg-gray-50 hover:bg-red-500 hover:text-white dark:bg-[#2C2C2E] dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-colors duration-150"
          title="Eliminar permanentemente"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
