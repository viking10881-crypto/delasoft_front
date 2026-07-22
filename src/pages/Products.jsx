// src/pages/admin/Products.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Package,
  Search,
  Layers,
  Gift,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


import ProductCard        from '../components/products/ProductCard';
import CreateProductModal from '../components/products/CreateProductModal';
import BundleCreatorModal from '../components/products/BundleCreatorModal';
import { VariantsManager } from '../components/variants';
import useRealtimeData    from '../hooks/useRealtimeData';
import api                from '../services/api';
import { useNotice }      from '../context/NoticeContext';

function normalizeProduct(data) {
  return {
    ...data,
    main_image:
      data?.images?.find(i => i.is_main)?.url ||
      data?.main_image ||
      null,
    has_variants: data?.has_variants ?? false,
    is_bundle: data?.is_bundle ?? false,
  };
}

const PAGE_SIZE_OPTIONS = [10, 20, 30];

export default function Products() {
  const { showNotice, askConfirmation } = useNotice();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openBundle, setOpenBundle] = useState(false);

  const [currentProduct, setCurrentProduct] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const [variantProductId, setVariantProductId] = useState(null);
  const [showVariantManager, setShowVariantManager] = useState(false);
  const [initialHasVariants, setInitialHasVariants] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Mapa por id: si el backend llegara a repetir un producto entre
      // páginas (p. ej. porque se crea/edita algo mientras se pagina),
      // esto evita duplicados y keys repetidas en el render.
      const productsById = new Map();
      let page = 1;
      const LIMIT = 100;
      const MAX_PAGES = 100; // techo de seguridad: hasta 10,000 productos

      // No confiamos en metadata de paginación del backend (no la devuelve
      // en /products). Seguimos pidiendo páginas hasta recibir menos
      // productos que el límite solicitado (señal de última página) o un
      // array vacío.
      while (page <= MAX_PAGES) {
        const prodRes = await api.get(`/products?limit=${LIMIT}&page=${page}`);

        const raw =
          Array.isArray(prodRes?.data?.data)
            ? prodRes.data.data
            : Array.isArray(prodRes?.data?.products)
              ? prodRes.data.products
              : Array.isArray(prodRes?.data)
                ? prodRes.data
                : [];

        if (!raw.length) break;

        raw.forEach(p => {
          if (p?.id != null) productsById.set(p.id, p);
        });

        if (raw.length < LIMIT) break; // última página (vino incompleta)

        page++;
      }

      const allProducts = Array.from(productsById.values());

      const catRes = await api.get('/categories/flat');

      setProducts(allProducts.map(normalizeProduct));
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
    } catch (err) {
      console.error(err);
      showNotice(
        err?.response?.data?.message || "Error al cargar productos",
        "error"
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, pageSize]);

  useRealtimeData(['products', 'categories'], async (evt) => {
    if (!evt || typeof evt !== 'object') {
      console.warn('[Realtime] evento inválido recibido', evt);
      return;
    }

    const { resource, action, payload } = evt;

    if (!resource) {
      console.warn('[Realtime] evento sin resource', evt);
      return;
    }

    if (resource === 'categories') {
      try {
        const catRes = await api.get('/categories/flat');
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } catch {}
      return;
    }

    if (resource !== 'products') return;

    if (action === 'deleted' && payload?.id) {
      setProducts(prev => prev.filter(p => p.id !== payload.id));
      return;
    }

    if (action === 'created' || action === 'updated') {
      if (!payload) {
        loadProducts();
        return;
      }

      if (payload?.product) {
        const product = normalizeProduct(payload.product);

        setProducts(prev => {
          const idx = prev.findIndex(p => p.id === product.id);
          if (idx === -1) return [product, ...prev];
          const next = [...prev];
          next[idx] = { ...prev[idx], ...product };
          return next;
        });

        return;
      }

      if (payload?.id) {
        try {
          const res = await api.get(`/products/${payload.id}`);
          const product = normalizeProduct(res?.data?.data || res?.data);

          setProducts(prev => {
            const idx = prev.findIndex(p => p.id === product.id);
            if (idx === -1) return [product, ...prev];
            const next = [...prev];
            next[idx] = { ...prev[idx], ...product };
            return next;
          });
        } catch {
          loadProducts();
        }
      }
    }
  });

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return products.filter(p => {
      const name = p?.name?.toLowerCase() || "";
      const category = p?.category_name?.toLowerCase() || "";

      const matchSearch =
        !search ||
        name.includes(search) ||
        category.includes(search);

      const matchType =
        filterType === "all"
          ? true
          : filterType === "simple"
            ? !p.has_variants && !p.is_bundle
            : filterType === "variants"
              ? p.has_variants
              : filterType === "bundle"
                ? p.is_bundle
                : true;

      return matchSearch && matchType;
    });
  }, [products, searchTerm, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  const counts = useMemo(() => ({
    all: products.length,
    simple: products.filter(p => !p.has_variants && !p.is_bundle).length,
    variants: products.filter(p => p.has_variants).length,
    bundle: products.filter(p => p.is_bundle).length,
  }), [products]);

  const activeProductDetail = useMemo(() => {
    if (!currentProduct?.id) return null;
    return products.find(p => p.id === currentProduct.id) || currentProduct;
  }, [products, currentProduct]);

  const openPreview = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDelete = async (id) => {
    const ok = await askConfirmation(
      "Eliminar producto",
      "¿Eliminar este producto? Si tiene movimientos asociados (ventas, compras, facturas) se desactivará en lugar de borrarse permanentemente."
    );
    if (!ok) return;

    try {
      const res = await api.delete(`/products/${id}`);
      const wasSoft = res?.data?.soft_deleted === true;

      showNotice(
        wasSoft
          ? "Producto desactivado (no se pudo eliminar por tener movimientos)"
          : "Producto eliminado correctamente",
        wasSoft ? "info" : "success"
      );

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      const data = e?.response?.data;
      const msg = data?.message || "No se pudo eliminar el producto";
      showNotice(msg, "error");

      if (data?.constraint || data?.detail) {
        console.warn("[DELETE PRODUCT]", {
          constraint: data.constraint,
          detail: data.detail,
          suggestion: data.suggestion,
        });
      }
    }
  };

  const openCreateModal = (withVariants = false) => {
    setInitialHasVariants(withVariants);
    setOpenCreate(true);
    setShowCreateMenu(false);
  };

  const openVariantManager = (productId) => {
    setVariantProductId(productId);
    setShowVariantManager(true);
    setOpenDetail(false);
  };

  // Genera los números de página con ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <>
      {/* Keyframe global para la animación de la barra */}
      <style>{`
        @keyframes pagSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .pag-bar-animate {
          animation: pagSlideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .pag-page-btn {
          transition: background 0.15s, border-color 0.15s, transform 0.12s, color 0.15s, box-shadow 0.15s;
        }
        .pag-page-btn:active:not(:disabled) {
          transform: scale(0.88);
        }
      `}</style>

      <div className="pb-40 lg:pb-8 min-h-screen bg-slate-50 dark:bg-[#0D1117]">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Productos
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-500 mt-0.5">
                {filtered.length} de {products.length} producto{products.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="relative flex-shrink-0">
              <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-900 dark:border-white/10">
                <button
                  onClick={() => openCreateModal(false)}
                  className="flex items-center gap-2 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/[0.15] text-white px-4 py-2.5 text-sm font-semibold transition-all"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Producto</span>
                </button>

                <div className="w-px bg-white/20 dark:bg-white/10" />

                <button
                  onClick={() => setShowCreateMenu(v => !v)}
                  className="bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/[0.15] text-white px-2.5 py-2.5 transition-all"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showCreateMenu ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {showCreateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[40]"
                    onClick={() => setShowCreateMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-[50] min-w-[190px] bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/[0.08] rounded-xl shadow-xl dark:shadow-black/40 py-1.5 overflow-hidden">
                    <button
                      onClick={() => openCreateModal(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Package size={15} className="text-gray-400 dark:text-slate-500" />
                      Producto simple
                    </button>
                    <button
                      onClick={() => openCreateModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Layers size={15} className="text-violet-500" />
                      Con variantes
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-white/[0.06] mx-3 my-1" />
                    <button
                      onClick={() => {
                        setOpenBundle(true);
                        setShowCreateMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Gift size={15} className="text-pink-500" />
                      Bundle / Combo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Filtros ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                size={15}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o categoría..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/10 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { key: "all",      label: "Todos",    icon: null    },
                { key: "simple",   label: "Simples",  icon: Package },
                { key: "variants", label: "Variantes",icon: Layers  },
                { key: "bundle",   label: "Bundles",  icon: Gift    },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`
                    flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                    ${filterType === key
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-white/20"
                    }
                  `}
                >
                  {Icon && <Icon size={12} />}
                  {label}
                  <span
                    className={`px-1.5 rounded text-[10px] font-black ${
                      filterType === key
                        ? "bg-white/20 dark:bg-black/20"
                        : "bg-gray-100 dark:bg-white/[0.08]"
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Contenido ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
              <Loader2 className="animate-spin mb-3 text-slate-900 dark:text-white" size={28} />
              <p className="font-medium text-sm">Sincronizando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
              <Package size={32} className="text-gray-300 dark:text-slate-700 mb-3" />
              <p className="font-bold text-gray-600 dark:text-slate-400 mb-1">
                {searchTerm ? `Sin resultados para "${searchTerm}"` : "Sin productos"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => openCreateModal(false)}
                  className="mt-3 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Crear primer producto
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs text-slate-600 dark:text-slate-400 underline mt-1"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {paginated.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={openPreview}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>

        {/* ════════════════════════════════════
            BARRA DE PAGINACIÓN FLOTANTE STICKY
            - bottom-24 en móvil  → queda sobre el nav flotante (h-16 + bottom-6 = ~6rem)
            - bottom-4  en desktop → pegado al borde inferior
            ════════════════════════════════════ */}
        {!loading && filtered.length > 0 && (
          <div
            className="
              pag-bar-animate
              sticky bottom-24 lg:bottom-4 z-30
              mx-4 sm:mx-6 lg:mx-8
              flex flex-col sm:flex-row items-center sm:justify-between gap-2
              px-4 py-2.5
              rounded-2xl
              bg-white/90 dark:bg-[#0D1117]/90
              border border-slate-200/80 dark:border-white/[0.08]
              backdrop-blur-xl
              shadow-[0_4px_32px_rgba(0,0,0,0.12)]
            "
          >
            {/* ── Fila 1: Items por página + Rango — centrado en móvil ── */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-gray-500 dark:text-slate-400">Mostrar</span>
              <div className="flex gap-1">
                {PAGE_SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`
                      pag-page-btn w-9 h-8 rounded-lg text-xs font-bold
                      ${pageSize === size
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-105 shadow-sm"
                        : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.12] border border-transparent hover:border-gray-300 dark:hover:border-white/10"
                      }
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <span className="text-gray-300 dark:text-white/10 select-none">·</span>
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                {startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)} de {filtered.length}
              </span>
            </div>

            {/* ── Fila 2: Páginas — ancho completo en móvil con extremos separados ── */}
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-1">
              {/* Anterior */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="
                  pag-page-btn w-8 h-8 rounded-lg flex items-center justify-center
                  bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400
                  hover:bg-gray-200 dark:hover:bg-white/[0.12]
                  disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-white/[0.06]
                "
              >
                <ChevronLeft size={14} />
              </button>

              {/* Números — también con espacio entre ellos en móvil */}
              <div className="flex items-center justify-between flex-1 sm:flex-none sm:gap-1 px-1 sm:px-0">
                {pageNumbers.map((item, idx) =>
                  item === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`
                        pag-page-btn w-8 h-8 rounded-lg text-xs font-bold
                        ${safePage === item
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-105 shadow-sm"
                          : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.12] border border-transparent hover:border-gray-300 dark:hover:border-white/10"
                        }
                      `}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              {/* Siguiente */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="
                  pag-page-btn w-8 h-8 rounded-lg flex items-center justify-center
                  bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400
                  hover:bg-gray-200 dark:hover:bg-white/[0.12]
                  disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-white/[0.06]
                "
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      <CreateProductModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={loadProducts}
        categories={categories}
        showNotice={showNotice}
        initialHasVariants={initialHasVariants}
      />

      <BundleCreatorModal
        isOpen={openBundle}
        onClose={() => setOpenBundle(false)}
        onCreated={loadProducts}
        categories={categories}
        showNotice={showNotice}
      />

      {showVariantManager && variantProductId && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] bg-white dark:bg-[#1a1f2e]">
            <div className="sm:hidden w-10 h-1 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-3" />

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers size={17} className="text-violet-500" />
                  {activeProductDetail?.name ?? "Variantes"}
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Color, talla, modelo y más
                </p>
              </div>
              <button
                onClick={() => {
                  setShowVariantManager(false);
                  loadProducts();
                }}
                className="w-8 h-8 bg-gray-100 dark:bg-white/[0.08] rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <VariantsManager
                productId={variantProductId}
                productPrice={activeProductDetail?.sale_price}
                productName={activeProductDetail?.name}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}