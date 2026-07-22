// src/components/finance/ProfitabilityTab.jsx
import { useState } from "react";
import { ArrowUpDown, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const fmtCOP = (n) =>
  `$${Number(n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

function SortBtn({ field, label, sortBy, sortOrder, onSort }) {
  const active = sortBy === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
        active ? "text-blue-500" : "text-[--text-muted] hover:text-[--text-secondary]"
      }`}
    >
      {label}
      <ArrowUpDown size={12} className={active ? "text-blue-500" : "text-[--text-muted]"} />
    </button>
  );
}

export default function ProfitabilityTab({ products = [] }) {
  const [sortBy,       setSortBy]       = useState("realized_profit");
  const [sortOrder,    setSortOrder]    = useState("desc");
  const [showLowOnly,  setShowLowOnly]  = useState(false);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("desc"); }
  };

  const sorted = [...products]
    .filter((p) => !showLowOnly || Number(p.margin_pct) < 25)
    .sort((a, b) => {
      const av = Number(a[sortBy]) || 0;
      const bv = Number(b[sortBy]) || 0;
      return sortOrder === "asc" ? av - bv : bv - av;
    });

  const totalProfit    = products.reduce((s, p) => s + (Number(p.realized_profit) || 0), 0);
  const totalUnits     = products.reduce((s, p) => s + (Number(p.units_sold) || 0), 0);
  const avgMargin      = products.length
    ? products.reduce((s, p) => s + (Number(p.margin_pct) || 0), 0) / products.length
    : 0;
  const lowMarginCount = products.filter((p) => Number(p.margin_pct) < 25).length;

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[--bg-subtle] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-[--text-muted]" />
        </div>
        <p className="font-semibold text-[--text-secondary]">Sin datos de rentabilidad aún</p>
        <p className="text-sm text-[--text-muted] mt-1">Los datos aparecen cuando registras ventas</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Productos",         value: products.length,                            sub: "activos",        color: "bg-blue-50   dark:bg-blue-500/10   text-blue-700   dark:text-blue-400"   },
          { label: "Utilidad total",    value: fmtCOP(totalProfit),                        sub: "realizada",      color: "bg-green-50  dark:bg-green-500/10  text-green-700  dark:text-green-400"  },
          { label: "Unidades vendidas", value: totalUnits.toLocaleString("es-CO"),          sub: "en total",       color: "bg-amber-50  dark:bg-amber-500/10  text-amber-700  dark:text-amber-400"  },
          { label: "Margen promedio",   value: pct(avgMargin),                             sub: "por producto",   color: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" },
        ].map((k) => (
          <div key={k.label} className={`${k.color} rounded-2xl p-4`}>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{k.value}</p>
            <p className="text-xs opacity-60 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerta márgenes bajos */}
      {lowMarginCount > 0 && (
        <button
          onClick={() => setShowLowOnly((v) => !v)}
          className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all text-left ${
            showLowOnly
              ? "bg-amber-600 border-amber-600 text-white"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/15"
          }`}
        >
          <AlertTriangle size={18} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {lowMarginCount} producto{lowMarginCount !== 1 ? "s" : ""} con margen bajo (&lt;25%)
            </p>
            <p className="text-xs opacity-70 mt-0.5">
              {showLowOnly ? "Mostrando solo productos críticos · Clic para ver todos" : "Clic para filtrar solo estos"}
            </p>
          </div>
        </button>
      )}

      {/* Tabla */}
      <div className="bg-[--bg-card] rounded-2xl border border-[--border] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[--border] bg-[--bg-subtle]">
                <th className="text-left py-3.5 px-5">
                  <SortBtn field="name"            label="Producto"  sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="text-right py-3.5 px-4">
                  <SortBtn field="cost_price"      label="Costo"     sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="text-right py-3.5 px-4">
                  <SortBtn field="sale_price"      label="Precio"    sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="text-right py-3.5 px-4">
                  <SortBtn field="margin_pct"      label="Margen"    sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="text-right py-3.5 px-4">
                  <SortBtn field="units_sold"      label="Vendidos"  sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="text-right py-3.5 px-5">
                  <SortBtn field="realized_profit" label="Utilidad"  sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 60).map((p) => {
                const margin     = Number(p.margin_pct || 0);
                const profit     = Number(p.realized_profit || 0);
                const marginBad  = margin < 25;
                const marginGood = margin >= 40;

                return (
                  <tr key={p.id} className="border-b border-[--border] hover:bg-[--bg-subtle] transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-[--text-primary]">{p.name}</p>
                      {p.sku && <p className="text-xs text-[--text-muted] font-mono">{p.sku}</p>}
                    </td>
                    <td className="text-right py-3.5 px-4 text-[--text-secondary] font-medium">
                      {fmtCOP(p.cost_price)}
                    </td>
                    <td className="text-right py-3.5 px-4 text-[--text-primary] font-semibold">
                      {fmtCOP(p.sale_price)}
                    </td>
                    <td className="text-right py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        marginGood
                          ? "bg-green-100  dark:bg-green-500/15  text-green-700  dark:text-green-400"
                          : marginBad
                            ? "bg-red-100  dark:bg-red-500/15    text-red-600    dark:text-red-400"
                            : "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {marginGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {pct(margin)}
                      </span>
                    </td>
                    <td className="text-right py-3.5 px-4 font-bold text-[--text-primary]">
                      {Number(p.units_sold || 0).toLocaleString("es-CO")}
                    </td>
                    <td className={`text-right py-3.5 px-5 font-bold ${
                      profit >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    }`}>
                      {fmtCOP(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length > 60 && (
          <div className="bg-[--bg-subtle] px-5 py-3 border-t border-[--border] text-center">
            <p className="text-xs text-[--text-muted]">Mostrando 60 de {sorted.length} productos</p>
          </div>
        )}
      </div>
    </div>
  );
}