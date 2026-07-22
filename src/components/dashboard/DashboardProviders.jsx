// components/dashboard/DashboardProviders.jsx
import { Truck, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, SectionTitle, fmtCOP } from "./DashboardShared";

export default function DashboardProviders({ providerDebt }) {
  const navigate = useNavigate();
  if (!providerDebt.length) return null;

  return (
    <Card>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <SectionTitle title="Deuda con proveedores" sub="Cuentas por pagar" />
        <button
          onClick={() => navigate("/providers")}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Ver todos <ArrowUpRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providerDebt.map((p, i) => {
          const usagePct = p.credit_limit > 0 ? Math.min((p.balance / p.credit_limit) * 100, 100) : 0;
          const barColor = usagePct > 80 ? "#ef4444" : usagePct > 50 ? "#f59e0b" : "#10b981";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--bg-page)" }}>
              <div style={{ width: 34, height: 34, background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Truck size={14} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", margin: "0 0 0 8px", flexShrink: 0 }}>{fmtCOP(p.balance)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: barColor, width: `${usagePct}%`, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, margin: 0 }}>{p.terms}d</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}