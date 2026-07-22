// pages/Dashboard.jsx — compatible con MainLayout
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import DashboardKPIs          from "../components/dashboard/DashboardKPIs";
import DashboardRevenue        from "../components/dashboard/DashboardRevenue";
import DashboardProducts       from "../components/dashboard/DashboardProducts";
import DashboardFinance        from "../components/dashboard/DashboardFinance";
import DashboardCashflow       from "../components/dashboard/DashboardCashflow";
import DashboardProviders      from "../components/dashboard/DashboardProviders";
// ── Helper ────────────────────────────────────────────────────────
const toArray = (d) => {
  if (Array.isArray(d))       return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  return [];
};

const KPI_DEFAULTS = {
  salesToday: 0, salesYesterday: 0,
  monthRevenue: 0, lastMonthRevenue: 0,
  avgTicket: 0, netMargin: 0,
  inventoryValue: 0, monthExpenses: 0,
  pendingOrders: 0, lowStockCount: 0,
  activeProviders: 0, totalDebt: 0,
  productsCount: 0,
};

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kpis,              setKpis]              = useState(KPI_DEFAULTS);
  const [revenueVsExpenses, setRevenueVsExpenses]  = useState([]);
  const [cashflow,          setCashflow]            = useState([]);
  const [topProducts,       setTopProducts]         = useState([]);
  const [marginByCategory,  setMarginByCategory]    = useState([]);
  const [expensesByType,    setExpensesByType]       = useState([]);
  const [providerDebt,      setProviderDebt]         = useState([]);
  const [paymentMethods,    setPaymentMethods]       = useState([]);

  // ── Carga de datos ──────────────────────────────────────────
  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [productsRes, statsRes] = await Promise.allSettled([
        api.get("/products"),
        api.get("/stats/dashboard"),
      ]);

      const products = toArray(productsRes.value?.data);
      const stats    = statsRes.value?.data ?? {};
      const kpi      = stats.kpiSummary ?? {};

      setKpis({
        salesToday:       Number(kpi.sales_today        ?? 0),
        salesYesterday:   Number(kpi.sales_yesterday    ?? 0),
        monthRevenue:     Number(kpi.month_revenue      ?? 0),
        lastMonthRevenue: Number(kpi.last_month_revenue ?? 0),
        avgTicket:        Number(kpi.avg_ticket         ?? 0),
        netMargin:        Number(kpi.net_margin         ?? 0),
        inventoryValue:   Number(kpi.inventory_value    ?? 0),
        monthExpenses:    Number(kpi.month_expenses     ?? 0),
        pendingOrders:    Number(kpi.pending_orders     ?? 0),
        lowStockCount:    Number(kpi.low_stock_count    ?? 0),
        activeProviders:  Number(kpi.active_providers   ?? 0),
        totalDebt:        Number(kpi.total_debt         ?? 0),
        productsCount:    Number(kpi.sku_count          ?? products.length),
      });

      setRevenueVsExpenses(stats.revenueVsExpenses ?? []);
      setCashflow(stats.cashflow                   ?? []);
      setTopProducts(stats.topProducts             ?? []);
      setMarginByCategory(stats.marginByCategory   ?? []);
      setExpensesByType(stats.expensesByType        ?? []);
      setProviderDebt(stats.providerDebt            ?? []);

      const pmRaw = stats.paymentMethods ?? [];
      setPaymentMethods(
        pmRaw.length > 0
          ? pmRaw.map(p => ({ name: p.name, value: Number(p.value) }))
          : []
      );
    } catch (err) {
      console.error("[DASHBOARD ERROR]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div style={{
          width: 32, height: 32,
          border: "2.5px solid #6366f1",
          borderTopColor: "transparent",
          borderRadius: "50%",
          margin: "0 auto 12px",
          animation: "spin 0.8s linear infinite",
        }} />
        <p className="text-[11px] font-bold uppercase tracking-widest"
           style={{ color: "var(--text-muted)" }}>
          Cargando dashboard…
        </p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* El padding-top lo da MainLayout vía --header-height.
          El padding-bottom cubre el nav móvil (ya lo pone MainLayout con pb-28 lg:pb-10). */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest m-0"
               style={{ color: "var(--text-muted)" }}>
              Panel ejecutivo
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5"
                style={{ color: "var(--text-primary)" }}>
              Dashboard
            </h1>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <RefreshCw
                size={13}
                style={refreshing ? { animation: "spin 0.8s linear infinite" } : {}}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={() => navigate("/sales")}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white"
              style={{ background: "#6366f1" }}
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Nueva venta</span>
              <span className="sm:hidden">Venta</span>
            </button>

            <button
              onClick={() => navigate("/products/new")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
              style={{ color: "#4f46e5", background: "#eef2ff" }}
            >
              <ShoppingBag size={13} /> Producto
            </button>
          </div>
        </div>

        {/* ── Secciones ────────────────────────────────────── */}
        <DashboardKPIs kpis={kpis} />

        <DashboardRevenue data={revenueVsExpenses} />

        <DashboardProducts
          topProducts={topProducts}
          paymentMethods={paymentMethods}
        />

        <DashboardFinance
          marginByCategory={marginByCategory}
          expensesByType={expensesByType}
        />

        <DashboardCashflow data={cashflow} />

        <DashboardProviders providerDebt={providerDebt} />

      </div>
    </>
  );
}