// components/dashboard/DashboardFinance.jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell
} from "recharts";
import { Card, SectionTitle, EmptyState, COLORS, fmtCOP } from "./DashboardShared";

const expenseLabel = {
  purchase: "Compras",
  service:  "Servicios",
  utility:  "Servicios públicos",
  tax:      "Impuestos",
  salary:   "Nómina",
  other:    "Otros",
};

export default function DashboardFinance({ marginByCategory, expensesByType }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* Margen por categoría */}
      <Card>
        <SectionTitle title="Margen por categoría" sub="Rentabilidad" />
        <div style={{ height: 200 }}>
          {marginByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginByCategory} layout="vertical">
                <XAxis
                  type="number" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickFormatter={v => `${v}%`} domain={[0, 100]}
                />
                <YAxis
                  type="category" dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 700 }}
                  width={72}
                />
                <Tooltip formatter={v => [`${v}%`, "Margen"]} />
                <Bar dataKey="margin" radius={[0,6,6,0]} barSize={14}>
                  {marginByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </Card>

      {/* Gastos por tipo */}
      <Card>
        <SectionTitle title="Gastos por tipo" sub="Distribución" />
        {expensesByType.length > 0 ? (
          <>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByType} cx="50%" cy="50%"
                    innerRadius={30} outerRadius={52}
                    paddingAngle={3} dataKey="value"
                  >
                    {expensesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [fmtCOP(v), "Total"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
              {expensesByType.slice(0, 5).map((e, i) => {
                const total = expensesByType.reduce((a, x) => a + x.value, 0);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], display: "inline-block" }} />
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{expenseLabel[e.name] ?? e.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{fmtCOP(e.value)}</span>
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