// components/dashboard/DashboardCashflow.jsx
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Card, SectionTitle, ChartLegend, EmptyState, CustomTooltip } from "./DashboardShared";

export default function DashboardCashflow({ data }) {
  return (
    <Card>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <SectionTitle title="Flujo de caja — últimos 12 meses" sub="Finanzas" />
        <ChartLegend items={[["#0878E8","Ingresos"],["#f87171","Gastos"]]} />
      </div>
      <div className="h-40 sm:h-52 lg:h-56">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0878E8" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#0878E8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f87171" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#0878E8" strokeWidth={2} fill="url(#gI)" />
              <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke="#f87171" strokeWidth={2} fill="url(#gG)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </div>
    </Card>
  );
}
