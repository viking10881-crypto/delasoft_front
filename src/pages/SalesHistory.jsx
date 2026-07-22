import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Receipt, X, Search, RefreshCw,
  Globe, Store, Clock,
  ChevronRight,
} from "lucide-react";
import api from "../services/api";
import { useNotice } from "../context/NoticeContext";

import { relativeTime } from "../components/SalesHistory/helpers";
import SkeletonCard    from "../components/SalesHistory/SkeletonCard";
import SaleDetailModal from "../components/SalesHistory/SaleDetailModal";

/* ─── Status config — colores discretos, solo un punto, no badges gritones ── */
const STATUS_CONFIG = {
  paid:      { label: "Pagada",    dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  pending:   { label: "Pendiente", dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400"     },
  cancelled: { label: "Cancelada", dot: "bg-red-400",     text: "text-red-600 dark:text-red-400"         },
};

/* ─── Status pill — texto simple, sin fondo saturado ───────────── */
function StatusTag({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, dot: "bg-gray-300", text: "text-[var(--text-muted)]" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Filter chip — plano, sin sombras ni fondos de color fuerte ── */
function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap
        transition-colors border
        ${active
          ? "border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-subtle)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }
      `}
    >
      {label}
      {typeof count === "number" && (
        <span className={`text-[10px] ${active ? "opacity-70" : "opacity-50"}`}>{count}</span>
      )}
    </button>
  );
}

/* ─── Main component ───────────────────────────────────────────── */
export default function SalesHistory() {
  const { showNotice } = useNotice();

  const [sales,        setSales]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  // Arranca mostrando solo lo pendiente; "all" queda a un click de distancia.
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType,   setFilterType]   = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);

  /* ── Load ── */
  const loadSales = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    try {
      const res = await api.get("/sales");
      const d   = res.data;
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      setSales(arr.map(s => ({
        ...s,
        total:         s.total || 0,
        created_at:    s.created_at || s.sale_date || new Date().toISOString(),
        customer_name: s.customer_name || "Cliente",
        sale_type:     s.sale_type || "online",
      })));
    } catch {
      showNotice("Error al cargar las ventas", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showNotice]);

  useEffect(() => { loadSales(); }, [loadSales]);

  /* ── Derived ── */
  const counts = useMemo(() => ({
    all:       sales.length,
    paid:      sales.filter(s => s.payment_status === "paid").length,
    pending:   sales.filter(s => s.payment_status === "pending").length,
    cancelled: sales.filter(s => s.payment_status === "cancelled").length,
  }), [sales]);

  const filtered = useMemo(() => sales.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.sale_number?.toLowerCase().includes(q) ||
      String(s.id).includes(q);
    const matchStatus = filterStatus === "all" || s.payment_status === filterStatus;
    const matchType   = filterType   === "all" || s.sale_type      === filterType;
    return matchSearch && matchStatus && matchType;
  }), [sales, searchTerm, filterStatus, filterType]);

  const totalFiltered    = filtered.reduce((a, s) => a + Number(s.total), 0);
  const hasActiveFilters = filterStatus !== "all" || filterType !== "all" || !!searchTerm;
  const clearFilters     = () => { setSearchTerm(""); setFilterStatus("all"); setFilterType("all"); };

  /* ── Render ── */
  return (
    <div className="min-h-screen pb-28 lg:pb-8 bg-[var(--bg-page)] transition-colors duration-300">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Historial
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {loading ? "Cargando…" : `${sales.length} ventas registradas`}
            </p>
          </div>
          <button
            onClick={() => loadSales(true)}
            disabled={refreshing}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={16} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── Filtros: chips simples en una fila, sin tarjetas grandes ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          <FilterChip label="Pendientes" count={counts.pending}   active={filterStatus === "pending"}   onClick={() => setFilterStatus("pending")} />
          <FilterChip label="Pagadas"    count={counts.paid}      active={filterStatus === "paid"}      onClick={() => setFilterStatus("paid")} />
          <FilterChip label="Canceladas" count={counts.cancelled} active={filterStatus === "cancelled"} onClick={() => setFilterStatus("cancelled")} />
          <FilterChip label="Todas"      count={counts.all}       active={filterStatus === "all"}       onClick={() => setFilterStatus("all")} />

          <span className="w-px h-5 bg-[var(--border)] mx-1 flex-shrink-0" />

          <FilterChip label="Online" active={filterType === "online"} onClick={() => setFilterType(prev => prev === "online" ? "all" : "online")} />
          <FilterChip label="Local"  active={filterType === "fisica"} onClick={() => setFilterType(prev => prev === "fisica" ? "all" : "fisica")} />
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por cliente, número de venta…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="
              w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none transition-colors
              bg-[var(--bg-card)] border border-[var(--border)]
              text-[var(--text-primary)] placeholder-[var(--text-muted)]
              focus:border-[var(--text-muted)]
            "
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* ── Results summary ── */}
        <div className="flex items-center justify-between px-0.5">
          <p className="text-xs text-[var(--text-muted)]">
            {loading ? "—" : (
              <>
                <span className="font-semibold text-[var(--text-secondary)]">{filtered.length}</span>
                {" "}resultado{filtered.length !== 1 ? "s" : ""}
                {" · "}
                <span className="font-semibold text-[var(--text-secondary)]">
                  ${totalFiltered.toLocaleString("es-CO")}
                </span>
              </>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center mb-3">
              <Receipt size={18} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
              {searchTerm ? `Sin resultados para "${searchTerm}"` : "Sin ventas en esta vista"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {hasActiveFilters ? "Probá ajustando los filtros" : "Las ventas aparecerán aquí"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] px-3.5 py-1.5 rounded-lg hover:border-[var(--text-muted)] transition-colors"
              >
                Ver todas las ventas
              </button>
            )}
          </div>

        ) : (
          <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
            {filtered.map(sale => {
              const isOnline = sale.sale_type === "web" || sale.sale_type === "online";

              return (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="flex items-center gap-3 py-3 cursor-pointer group"
                >
                  {/* Channel icon — chico, sin fondo de color saturado */}
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center flex-shrink-0 text-[var(--text-muted)]">
                    {isOnline ? <Globe size={14} /> : <Store size={14} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {sale.sale_number || `#${sale.id}`}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {sale.customer_name} · {relativeTime(sale.created_at)}
                    </p>
                  </div>

                  {/* Status + amount */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      ${Number(sale.total).toLocaleString("es-CO")}
                    </span>
                    <StatusTag status={sale.payment_status} />
                  </div>

                  <ChevronRight
                    size={15}
                    className="text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform flex-shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Nota discreta de pago pendiente, solo si hay pendientes online en la vista actual */}
        {!loading && filtered.some(s => s.payment_status === "pending" && (s.sale_type === "web" || s.sale_type === "online")) && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] px-0.5">
            <Clock size={11} className="flex-shrink-0" />
            Las ventas online pendientes esperan confirmación de pago de Wompi.
          </div>
        )}

      </main>

      {selectedSale && (
        <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}