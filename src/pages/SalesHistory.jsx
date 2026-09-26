import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt, X, Search, RefreshCw,
  Globe, Store, Clock, Lock,
  ChevronRight, Download, FileSpreadsheet, FileText, Loader2,
  CheckCircle2, DollarSign,
} from "lucide-react";
import api from "../services/api";
import { useNotice } from "../context/NoticeContext";
import { useExport } from "../hooks/useExport";
import { ProtectedFeature } from "../components/ProtectedFeature";
import StatCard from "../components/SalesHistory/StatCard";

/* ─── Botón de exportar bloqueado (plan sin esta función) ──────── */
function LockedExportButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/subscription")}
      title="Exportar es una función de planes pagos"
      aria-label="Exportar (función bloqueada, actualiza tu plan)"
      className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative"
    >
      <Download size={16} strokeWidth={2} />
      <Lock size={10} className="absolute -bottom-0.5 -right-0.5 bg-[var(--bg-page)] rounded-full p-0.5" />
    </button>
  );
}

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
  const { exportExcel, exportPDF } = useExport();

  const [sales,        setSales]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  // Arranca mostrando solo lo pendiente; "all" queda a un click de distancia.
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType,   setFilterType]   = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);
  const [exportOpen,   setExportOpen]   = useState(false);
  const [exporting,    setExporting]    = useState(false);

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

  const totalPaidAmount = useMemo(
    () => sales.filter(s => s.payment_status === "paid").reduce((a, s) => a + Number(s.total), 0),
    [sales]
  );
  const totalPendingAmount = useMemo(
    () => sales.filter(s => s.payment_status === "pending").reduce((a, s) => a + Number(s.total), 0),
    [sales]
  );

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

  /* ── Export ── */
  const exportColumns = [
    { key: "sale_number",    label: "N° Venta" },
    { key: "customer_name",  label: "Cliente" },
    { key: "created_at_fmt", label: "Fecha" },
    { key: "channel",        label: "Canal" },
    { key: "status_label",   label: "Estado" },
    { key: "total",          label: "Total" },
  ];

  const buildExportRows = () => filtered.map(s => ({
    ...s,
    created_at_fmt: new Date(s.created_at).toLocaleDateString("es-CO"),
    channel:        s.sale_type === "web" || s.sale_type === "online" ? "Online" : "Local",
    status_label:   STATUS_CONFIG[s.payment_status]?.label ?? s.payment_status,
  }));

  const handleExport = async (type) => {
    setExportOpen(false);
    setExporting(true);
    try {
      const rows = buildExportRows();
      if (type === "excel") {
        await exportExcel(
          [{ name: "Historial", columns: exportColumns, rows, totals: { total: totalFiltered } }],
          "historial_ventas"
        );
      } else {
        await exportPDF(
          "Historial de ventas",
          `${filtered.length} venta${filtered.length !== 1 ? "s" : ""}`,
          [{
            columns: exportColumns.map(c => ({
              header: c.label,
              dataKey: c.key,
              align: c.key === "total" ? "right" : "left",
              format: c.key === "total" ? (v) => `$${Number(v).toLocaleString("es-CO")}` : undefined,
            })),
            rows,
            totals: { total: `$${totalFiltered.toLocaleString("es-CO")}` },
          }],
          "historial_ventas"
        );
      }
      showNotice("Exportado correctamente", "success");
    } catch {
      showNotice("No se pudo exportar el archivo", "error");
    } finally {
      setExporting(false);
    }
  };

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
          <div className="flex items-center gap-1">
            <ProtectedFeature feature="export" showUpgrade={false} fallback={<LockedExportButton />}>
            <div className="relative">
              <button
                onClick={() => setExportOpen(v => !v)}
                disabled={exporting || filtered.length === 0}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                title="Exportar"
                aria-label="Exportar"
              >
                {exporting
                  ? <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                  : <Download size={16} strokeWidth={2} />
                }
              </button>

              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[170px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl py-1.5 overflow-hidden">
                    <button
                      onClick={() => handleExport("excel")}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <FileSpreadsheet size={15} className="text-emerald-600" /> Excel
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <FileText size={15} className="text-red-500" /> PDF
                    </button>
                  </div>
                </>
              )}
            </div>
            </ProtectedFeature>

            <button
              onClick={() => loadSales(true)}
              disabled={refreshing}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={16} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Resumen ── */}
        {!loading && sales.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard icon={Receipt}      label="Ventas"    value={counts.all}                                    color="slate" />
            <StatCard icon={Clock}        label="Pendiente" value={`$${totalPendingAmount.toLocaleString("es-CO")}`} sub={`${counts.pending} venta${counts.pending !== 1 ? "s" : ""}`} color="amber" />
            <StatCard icon={CheckCircle2} label="Pagado"    value={`$${totalPaidAmount.toLocaleString("es-CO")}`}    sub={`${counts.paid} venta${counts.paid !== 1 ? "s" : ""}`}       color="emerald" />
            <StatCard icon={DollarSign}   label="Total"     value={`$${(totalPaidAmount + totalPendingAmount).toLocaleString("es-CO")}`} color="violet" />
          </div>
        )}

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