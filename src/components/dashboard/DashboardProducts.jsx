// components/dashboard/DashboardProducts.jsx
import { CreditCard, Banknote, Building2, Zap } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { Card, SectionTitle, EmptyState, COLORS, CustomTooltip, fmtCOP } from "./DashboardShared";

const paymentIcons  = {
  cash:     <Banknote size={12} />,
  transfer: <Building2 size={12} />,
  credit:   <CreditCard size={12} />,
  check:    <Zap size={12} />,
};
const paymentLabel  = {
  cash: "Efectivo", transfer: "Transferencia",
  credit: "Crédito", check: "Cheque",
};

export default function DashboardProducts({ topProducts, paymentMethods }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

      {/* Top productos — barra horizontal */}
      <Card>
        <SectionTitle title="Top productos por valor" sub="Rendimiento" />
        <div className="h-48 sm:h-56">
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category" dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Valor" radius={[0,6,6,0]} barSize={14}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState msg="Sin productos registrados" />}
        </div>
      </Card>

      {/* Métodos de pago — donut + lista */}
      <Card>
        <SectionTitle title="Métodos de pago" sub="Distribución" />
        {paymentMethods.length > 0 ? (
          <>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods} cx="50%" cy="50%"
                    innerRadius={34} outerRadius={54}
                    paddingAngle={3} dataKey="value"
                  >
                    {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + " ventas", paymentLabel[n] ?? n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {paymentMethods.map((pm, i) => {
                const total = paymentMethods.reduce((a, p) => a + p.value, 0);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], display: "inline-block" }} />
                      <span style={{ color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        {paymentIcons[pm.name]}{paymentLabel[pm.name] ?? pm.name}
                      </span>
                    </div>
                    <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      {((pm.value / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : <EmptyState />}
      </Card>
    </div>
  );
}