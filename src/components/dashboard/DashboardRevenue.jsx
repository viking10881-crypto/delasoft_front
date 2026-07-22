// components/dashboard/DashboardRevenue.jsx
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Bar,
  CartesianGrid, ComposedChart, Line
} from "recharts";
import { Card, SectionTitle, ChartLegend, EmptyState, CustomTooltip } from "./DashboardShared";

export default function DashboardRevenue({ data }) {
  return (
    <Card>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <SectionTitle title="Ingresos vs Gastos" sub="Desempeño semanal" />
        <ChartLegend items={[["#6366f1","Ingresos"],["#f87171","Gastos"],["#10b981","Utilidad"]]} />
      </div>
      <div className="h-44 sm:h-56 lg:h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false} tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#6366f1" radius={[4,4,0,0]} barSize={14} />
              <Bar dataKey="gastos"   name="Gastos"   fill="#f87171" radius={[4,4,0,0]} barSize={14} />
              <Line
                dataKey="utilidad" name="Utilidad" type="monotone"
                stroke="#10b981" strokeWidth={2}
                dot={{ r: 3, fill: "#10b981" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </div>
    </Card>
  );
}