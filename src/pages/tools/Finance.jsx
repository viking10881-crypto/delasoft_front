// src/pages/tools/Finance.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  DollarSign, TrendingUp, ShoppingCart, FileText,
  Building2, BarChart3, Plus, RefreshCw, Percent, Activity,
} from "lucide-react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";
import FinancePinGate from "../../components/FinancePinGate";

import TabNavigation    from "../../components/finance/TabNavigation";
import MovementsTab     from "../../components/finance/MovementsTab";
import ProfitabilityTab from "../../components/finance/ProfitabilityTab";
import DebtsTab         from "../../components/finance/DebtsTab";
import RegisterExpenseModal from "../../components/finance/RegisterExpenseModal";
import KpiCard          from "../../components/finance/KpiCard";

const fmtCOP = (n) =>
  `$${Number(n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const safeArray = (v) =>
  Array.isArray(v) ? v : v?.data ?? v?.providers ?? v?.invoices ?? v?.rows ?? [];

const safeFetch = async (promise) => {
  try {
    const { data } = await promise;
    return data;
  } catch (err) {
    console.warn("[Finance safeFetch]", err?.config?.url, err?.response?.status ?? err.message);
    return null;
  }
};

// ── Contenido real de finanzas (solo se monta tras pasar el PIN) ──
function FinanceContent() {
  const { showNotice } = useNotice();

  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]        = useState("movements");
  const [summary,         setSummary]          = useState(null);
  const [expenses,        setExpenses]         = useState([]);
  const [invoices,        setInvoices]         = useState([]);
  const [profitByProduct, setProfitByProduct]  = useState([]);
  const [debts,           setDebts]            = useState([]);
  const [products,        setProducts]         = useState([]);
  const [providers,       setProviders]        = useState([]);
  const [isModalOpen,     setIsModalOpen]      = useState(false);

  const didFetch = useRef(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, expData, invData, profData, debtsData, prodData, provData] =
        await Promise.all([
          safeFetch(api.get("/finance/summary")),
          safeFetch(api.get("/finance/expenses?limit=300")),
          safeFetch(api.get("/finance/invoices?limit=300")),
          safeFetch(api.get("/finance/profit-by-product")),
          safeFetch(api.get("/finance/provider-debts")),
          safeFetch(api.get("/products")),
          safeFetch(api.get("/providers")),
        ]);

      if (sumData)   setSummary(sumData);
      if (expData)   setExpenses(safeArray(expData));
      if (invData)   setInvoices(safeArray(invData));
      if (profData)  setProfitByProduct(safeArray(profData));
      if (debtsData) setDebts(Array.isArray(debtsData) ? debtsData : debtsData?.providers ?? []);
      if (prodData)  setProducts(safeArray(prodData));
      if (provData)  setProviders(safeArray(provData));
    } catch (err) {
      console.error("[Finance loadAll]", err);
      showNotice("Error cargando datos financieros", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    loadAll();
  }, [loadAll]);

  const handleRefresh = useCallback(() => {
    didFetch.current = false;
    loadAll();
  }, [loadAll]);

  const handleModalClose   = useCallback(() => setIsModalOpen(false), []);
  const handleModalSuccess = useCallback(() => handleRefresh(), [handleRefresh]);

  const totalMovements = expenses.length + invoices.length;

  const tabs = [
    { id: "movements", label: "Movimientos",  icon: <Activity  size={16} />, badge: totalMovements },
    { id: "products",  label: "Rentabilidad", icon: <Percent   size={16} /> },
    { id: "debts",     label: "Deudas",       icon: <Building2 size={16} />, badge: debts.length },
  ];

  const s = summary || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-[--bg-page] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <RefreshCw size={28} className="text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[--text-muted]">Cargando finanzas…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--bg-page] pb-24 lg:pb-8 transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[--text-muted] uppercase tracking-wider">
              Panel financiero
            </p>
            <h1 className="text-2xl font-bold text-[--text-primary] mt-0.5">Finanzas</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                font-semibold rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white
                transition-colors text-sm shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nuevo registro</span>
            </button>
            <button
              onClick={handleRefresh}
              title="Actualizar datos"
              className="p-2.5 border border-[--border] text-[--text-secondary]
                bg-[--bg-card] rounded-xl hover:bg-[--bg-subtle] transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="Ingresos"       value={fmtCOP(s.revenue?.total)}               subtitle={`${s.revenue?.sales_count ?? 0} ventas`}                             icon={DollarSign}  variant="success" />
          <KpiCard title="Utilidad bruta" value={fmtCOP(s.profitability?.gross_profit)}  trend={s.profitability?.gross_margin_pct}                                       icon={TrendingUp}  variant="success" />
          <KpiCard title="Utilidad neta"  value={fmtCOP(s.profitability?.net_profit)}    trend={s.profitability?.net_margin_pct}                                         icon={BarChart3}   variant={(s.profitability?.net_profit ?? 0) >= 0 ? "success" : "danger"} />
          <KpiCard title="Costo ventas"   value={fmtCOP(s.revenue?.cogs)}                subtitle="COGS"                                                                 icon={ShoppingCart} variant="warning" />
          <KpiCard title="Gastos op."     value={fmtCOP(s.expenses?.operating)}          subtitle="Del período"                                                          icon={FileText}    variant="default" />
          <KpiCard title="Deuda prov."    value={fmtCOP(s.debt?.provider_total)}         subtitle={`${s.debt?.providers_with_debt ?? debts.length} proveedores`}         icon={Building2}   variant="danger" />
        </div>

        {/* Panel de pestañas */}
        <div className="bg-[--bg-card] rounded-2xl shadow-sm border border-[--border] overflow-hidden">
          <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="p-6">
            {activeTab === "movements" && <MovementsTab expenses={expenses} invoices={invoices} />}
            {activeTab === "products"  && <ProfitabilityTab products={profitByProduct} />}
            {activeTab === "debts"     && <DebtsTab debts={debts} onRefresh={handleRefresh} />}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <RegisterExpenseModal
          products={products}
          providers={providers}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

// ── Export principal: gate primero, datos después ──
export default function Finance() {
  return (
    <FinancePinGate>
      <FinanceContent />
    </FinancePinGate>
  );
}