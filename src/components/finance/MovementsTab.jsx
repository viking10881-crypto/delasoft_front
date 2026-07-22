// src/components/finance/MovementsTab.jsx
import { useState, useMemo } from "react";
import {
  Search, ShoppingCart, FileText, Zap, DollarSign,
  TrendingDown, CreditCard, Banknote, Building,
} from "lucide-react";

const fmtCOP = (n) =>
  `$${Number(n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const TYPE_META = {
  purchase: { label: "Compra",     icon: ShoppingCart, color: "bg-amber-100  dark:bg-amber-500/15  text-amber-600  dark:text-amber-400"   },
  service:  { label: "Servicio",   icon: FileText,     color: "bg-blue-100   dark:bg-blue-500/15   text-blue-600   dark:text-blue-400"     },
  utility:  { label: "S. Público", icon: Zap,          color: "bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400"   },
  tax:      { label: "Impuesto",   icon: Building,     color: "bg-red-100    dark:bg-red-500/15    text-red-600    dark:text-red-400"       },
  salary:   { label: "Nómina",     icon: DollarSign,   color: "bg-green-100  dark:bg-green-500/15  text-green-600  dark:text-green-400"    },
  other:    { label: "Otro",       icon: TrendingDown,  color: "bg-[--bg-subtle] text-[--text-muted]"                                     },
};

const PAYMENT_ICONS = {
  cash:     <Banknote  size={11} className="text-green-500" />,
  transfer: <Building  size={11} className="text-blue-500"  />,
  credit:   <CreditCard size={11} className="text-amber-500" />,
  check:    <FileText  size={11} className="text-[--text-muted]" />,
};

const PAYMENT_LABELS = {
  cash: "Efectivo", transfer: "Transferencia", credit: "Crédito", check: "Cheque",
};

const FILTER_OPTIONS = [
  { value: "all",      label: "Todos"     },
  { value: "purchase", label: "Compras"   },
  { value: "service",  label: "Servicios" },
  { value: "salary",   label: "Nómina"    },
  { value: "tax",      label: "Impuestos" },
  { value: "other",    label: "Otros"     },
];

function groupByMonth(items) {
  const groups = {};
  items.forEach((item) => {
    const d = new Date(item._date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(item);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, g]) => g);
}

function normalizeExpense(e) {
  return {
    id: `exp-${e.id}`,
    _date: e.expense_date || e.created_at,
    type: e.expense_type || "other",
    description: e.description || "Sin descripción",
    provider: e.provider_name,
    product: e.product_name,
    quantity: e.quantity > 1 ? e.quantity : null,
    amount: Number(e.amount || 0),
    paymentMethod: e.payment_method,
    source: "expense",
  };
}

function normalizeInvoice(i) {
  return {
    id: `inv-${i.id}`,
    _date: i.invoice_date || i.created_at,
    type: i.invoice_type === "purchase" ? "purchase" : "service",
    description: i.description || "Sin descripción",
    provider: i.provider_name,
    invoiceNumber: i.invoice_number,
    amount: Number(i.total_amount || 0),
    status: i.payment_status,
    paymentMethod: i.payment_method,
    source: "invoice",
  };
}

function MovementCard({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.other;
  const Icon = meta.icon;
  const date = new Date(item._date);
  const dateStr = date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[--bg-subtle] transition-colors border-b border-[--border] last:border-0">
      <div className={`shrink-0 p-2.5 rounded-xl ${meta.color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[--text-primary] text-sm truncate">{item.description}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-[--text-muted]">
          <span>{dateStr}</span>
          {item.provider && (
            <><span>·</span><span className="font-medium text-[--text-secondary]">{item.provider}</span></>
          )}
          {item.product && (
            <><span>·</span><span className="font-medium">{item.product}</span>{item.quantity && <span>x{item.quantity}</span>}</>
          )}
          {item.invoiceNumber && (
            <><span>·</span><span className="font-mono">{item.invoiceNumber}</span></>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-bold text-[--text-primary] text-sm">{fmtCOP(item.amount)}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {item.paymentMethod && PAYMENT_ICONS[item.paymentMethod]}
          <span className="text-[10px] text-[--text-muted]">
            {PAYMENT_LABELS[item.paymentMethod] || item.paymentMethod}
          </span>
          {item.source === "invoice" && item.status === "pending" && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">
              PENDIENTE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MovementsTab({ expenses = [], invoices = [] }) {
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType] = useState("all");

  const allItems = useMemo(() => {
    const exps = expenses.map(normalizeExpense);
    const invs = invoices.map(normalizeInvoice);
    return [...exps, ...invs].sort((a, b) => new Date(b._date) - new Date(a._date));
  }, [expenses, invoices]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter((item) => {
      const matchesType = filterType === "all" || item.type === filterType;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        item.description?.toLowerCase().includes(q) ||
        item.provider?.toLowerCase().includes(q) ||
        item.product?.toLowerCase().includes(q) ||
        item.invoiceNumber?.toLowerCase().includes(q)
      );
    });
  }, [allItems, search, filterType]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const totalFiltrado = filtered.reduce((s, i) => s + i.amount, 0);

  if (allItems.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[--bg-subtle] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingDown size={28} className="text-[--text-muted]" />
        </div>
        <p className="font-semibold text-[--text-secondary]">Sin movimientos registrados</p>
        <p className="text-sm text-[--text-muted] mt-1">Los egresos aparecerán aquí cuando los registres</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
          <input
            type="text"
            placeholder="Buscar descripción, proveedor, producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5
              bg-[--bg-subtle] border border-[--border]
              text-[--text-primary] placeholder:text-[--text-muted]
              rounded-xl text-sm outline-none
              focus:bg-[--bg-card] focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20
              transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterType === opt.value
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-[--bg-subtle] text-[--text-secondary] hover:bg-[--border]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-[--bg-subtle] rounded-2xl">
          <Search className="mx-auto mb-3 text-[--text-muted]" size={32} />
          <p className="text-sm font-medium text-[--text-secondary]">Sin resultados para ese filtro</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const groupTotal = group.items.reduce((s, i) => s + i.amount, 0);
            return (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-bold text-[--text-muted] uppercase tracking-widest capitalize">
                    {group.label}
                  </h3>
                  <span className="text-xs font-semibold text-[--text-secondary]">
                    {group.items.length} mov. · {fmtCOP(groupTotal)}
                  </span>
                </div>
                <div className="bg-[--bg-card] rounded-2xl border border-[--border] overflow-hidden">
                  {group.items.map((item) => <MovementCard key={item.id} item={item} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totalizador */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl px-6 py-4">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
            {filterType !== "all" && ` · ${FILTER_OPTIONS.find(f => f.value === filterType)?.label}`}
            {search && ` · "${search}"`}
          </p>
          <p className="text-xl font-bold">{fmtCOP(totalFiltrado)}</p>
        </div>
      )}
    </div>
  );
}