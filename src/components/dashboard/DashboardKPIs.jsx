// components/dashboard/DashboardKPIs.jsx
import { DollarSign, TrendingUp, Wallet, BarChart3, Package, ShoppingCart, Layers, AlertTriangle } from "lucide-react";
import KpiCard from "../finance/KpiCard";

const fmt    = (n) => Number(n ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
const fmtCOP = (n) => `$${fmt(n)}`;
const pct    = (a, b) => (b === 0 ? 0 : (((a - b) / b) * 100).toFixed(1));

export default function DashboardKPIs({ kpis }) {
  return (
    <>
      {/* ── Ventas ─────────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2.5"
           style={{ color: "var(--text-muted)" }}>Ventas</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            title="Ventas hoy"
            value={fmtCOP(kpis.salesToday)}
            icon={DollarSign}
            variant="success"
            trend={+pct(kpis.salesToday, kpis.salesYesterday)}
            subtitle="vs ayer"
          />
          <KpiCard
            title="Ingresos del mes"
            value={fmtCOP(kpis.monthRevenue)}
            icon={TrendingUp}
            variant="primary"
            trend={+pct(kpis.monthRevenue, kpis.lastMonthRevenue)}
            subtitle="vs mes anterior"
          />
          <KpiCard
            title="Ticket promedio"
            value={fmtCOP(kpis.avgTicket)}
            icon={Wallet}
            variant="default"
            subtitle="Todas las ventas"
          />
          <KpiCard
            title="Margen neto"
            value={`${kpis.netMargin}%`}
            icon={BarChart3}
            variant="default"
            subtitle="Este mes"
          />
        </div>
      </section>

      {/* ── Operaciones ────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2.5"
           style={{ color: "var(--text-muted)" }}>Operaciones</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            title="Valor inventario"
            value={fmtCOP(kpis.inventoryValue)}
            icon={Package}
            variant="warning"
            subtitle={`${kpis.productsCount} SKUs`}
          />
          <KpiCard
            title="Gastos del mes"
            value={fmtCOP(kpis.monthExpenses)}
            icon={ShoppingCart}
            variant="danger"
            subtitle="Todos los tipos"
          />
          <KpiCard
            title="Órd. pendientes"
            value={kpis.pendingOrders}
            icon={Layers}
            variant="warning"
            subtitle="En proceso"
          />
          <KpiCard
            title="Stock bajo"
            value={kpis.lowStockCount}
            icon={AlertTriangle}
            variant={kpis.lowStockCount > 0 ? "danger" : "default"}
            subtitle="Productos en alerta"
          />
        </div>
      </section>
    </>
  );
}