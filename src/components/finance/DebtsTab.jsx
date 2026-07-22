// src/components/finance/DebtsTab.jsx
import { useState } from "react";
import { Building2, AlertTriangle, CheckCircle, X, Loader2, Phone, Clock } from "lucide-react";
import api from "../../services/api";

const fmtCOP = (n) =>
  `$${Number(n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

// ── Modal de pago rápido ─────────────────────────────────────────
function PaymentModal({ provider, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const balance = Number(provider.balance || provider.current_balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0)   { setError("Ingresa un monto válido"); return; }
    if (Number(amount) > balance)          { setError("El monto supera la deuda actual"); return; }
    setSaving(true); setError(null);
    try {
      await api.post("/finance/provider-payment", {
        provider_id:    provider.id,
        amount:         Number(amount),
        payment_method: method,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrar el pago");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[--bg-card] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[--border]">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-bold text-[--text-primary]">Registrar pago</h3>
            <p className="text-sm text-[--text-muted] mt-0.5">{provider.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[--bg-subtle] rounded-xl transition-colors text-[--text-muted] hover:text-[--text-primary]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Deuda actual */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-5">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            Deuda pendiente
          </p>
          <p className="text-3xl font-bold text-amber-900 dark:text-amber-300">{fmtCOP(balance)}</p>
          <button
            type="button"
            onClick={() => setAmount(String(balance))}
            className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline underline-offset-2"
          >
            Pagar todo
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">
              Monto a abonar *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold">$</span>
              <input
                type="number" min="1" step="0.01" required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3
                  bg-blue-50 dark:bg-blue-500/10
                  border-2 border-blue-200 dark:border-blue-500/30
                  text-blue-600 dark:text-blue-400
                  rounded-xl font-bold text-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">
              Método
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "transfer", label: "🏦 Transferencia" },
                { value: "cash",     label: "💵 Efectivo" },
                { value: "check",    label: "📝 Cheque" },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
                    method === m.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : "border-[--border] bg-[--bg-subtle] text-[--text-secondary] hover:border-[--text-muted]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 bg-[--bg-subtle] rounded-2xl font-bold text-[--text-secondary] hover:bg-[--border] transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Registrando…</> : "Confirmar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab principal ────────────────────────────────────────────────
export default function DebtsTab({ debts = [], onRefresh }) {
  const [paying, setPaying] = useState(null);

  const normalized = debts.map((d) => ({
    ...d,
    balance: Number(d.balance || d.current_balance || 0),
  }));

  const totalDebt     = normalized.reduce((s, d) => s + d.balance, 0);
  const criticalCount = normalized.filter((d) => Number(d.credit_used_pct) >= 80).length;

  if (normalized.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-500" />
        </div>
        <p className="font-bold text-[--text-primary] text-lg">¡Sin deudas pendientes!</p>
        <p className="text-sm text-[--text-muted] mt-1">No hay proveedores con saldo por pagar</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
            <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-1">Deuda total</p>
            <p className="text-xl font-bold text-red-900 dark:text-red-300">{fmtCOP(totalDebt)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1">Proveedores</p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{normalized.length}</p>
          </div>
          <div className={`border rounded-2xl p-4 ${
            criticalCount > 0
              ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
              : "bg-[--bg-subtle] border-[--border]"
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
              criticalCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-[--text-muted]"
            }`}>
              Críticos
            </p>
            <p className={`text-xl font-bold ${
              criticalCount > 0 ? "text-amber-900 dark:text-amber-300" : "text-[--text-secondary]"
            }`}>
              {criticalCount}
            </p>
          </div>
        </div>

        {/* Alerta crítica */}
        {criticalCount > 0 && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 px-5 py-4 rounded-r-2xl">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              {criticalCount} proveedor{criticalCount !== 1 ? "es" : ""} con más del 80% del límite de crédito utilizado.
            </p>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-3">
          {normalized
            .sort((a, b) => b.balance - a.balance)
            .map((d) => {
              const creditPct  = Number(d.credit_used_pct || 0);
              const isCritical = creditPct >= 80;
              const isWarning  = creditPct >= 60 && !isCritical;
              const hasLimit   = Number(d.credit_limit) > 0;

              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 ${
                    isCritical
                      ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                      : isWarning
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                        : "bg-[--bg-card] border-[--border]"
                  }`}
                >
                  {/* Ícono */}
                  <div className={`shrink-0 p-3 rounded-xl ${
                    isCritical
                      ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                      : isWarning
                        ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}>
                    {isCritical ? <AlertTriangle size={20} /> : <Building2 size={20} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[--text-primary] text-base">{d.name}</p>
                    {d.category && <p className="text-xs text-[--text-muted] mt-0.5">{d.category}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-[--text-muted]">
                      {d.phone && (
                        <span className="flex items-center gap-1"><Phone size={10} /> {d.phone}</span>
                      )}
                      {d.payment_terms_days && (
                        <span className="flex items-center gap-1"><Clock size={10} /> {d.payment_terms_days}d plazo</span>
                      )}
                    </div>

                    {/* Barra de crédito */}
                    {hasLimit && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-[--text-muted]">Límite utilizado</span>
                          <span className={`font-bold ${
                            isCritical ? "text-red-600 dark:text-red-400"
                            : isWarning  ? "text-amber-600 dark:text-amber-400"
                            : "text-blue-600 dark:text-blue-400"
                          }`}>
                            {creditPct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-[--bg-subtle] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.min(creditPct, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[--text-muted] mt-1">
                          Límite: {fmtCOP(d.credit_limit)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Monto + acción */}
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-bold ${
                      isCritical ? "text-red-600 dark:text-red-400" : "text-[--text-primary]"
                    }`}>
                      {fmtCOP(d.balance)}
                    </p>
                    <button
                      onClick={() => setPaying(d)}
                      className="mt-2 px-4 py-2
                        bg-slate-900 dark:bg-white
                        text-white dark:text-slate-900
                        text-xs font-bold rounded-xl
                        hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white
                        transition-colors"
                    >
                      Abonar
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {paying && (
        <PaymentModal
          provider={paying}
          onClose={() => setPaying(null)}
          onSuccess={() => { setPaying(null); onRefresh?.(); }}
        />
      )}
    </>
  );
}