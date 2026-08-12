// src/pages/MySubscription.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../context/SubscriptionContext";
import api from "../services/api";   // ← api service con token, no axios crudo
import toast from "react-hot-toast";
import {
  Crown, Zap, AlertTriangle, CheckCircle2, XCircle,
  Clock, TrendingUp, Package, Users, Tag, Truck,
  Image, Key, ShoppingCart, BarChart2, Bot, FileText,
  RefreshCw, ChevronRight, X, Loader2, ArrowUpCircle,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toLocaleString("es-CO");
const cop = (n) => `$${fmt(n)} COP`;

const STATUS_META = {
  trial:     { label: "Prueba gratuita", color: "text-blue-400",    bg: "bg-blue-500/10",    icon: Clock },
  active:    { label: "Activa",          color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  past_due:  { label: "Pago pendiente",  color: "text-amber-400",   bg: "bg-amber-500/10",   icon: AlertTriangle },
  suspended: { label: "Suspendida",      color: "text-red-400",     bg: "bg-red-500/10",     icon: XCircle },
  cancelled: { label: "Cancelada",       color: "text-zinc-400",    bg: "bg-zinc-500/10",    icon: XCircle },
};

const LIMIT_META = {
  products:      { label: "Productos",   icon: Package },
  users:         { label: "Clientes registrados", icon: Users },
  categories:    { label: "Categorías",  icon: Tag },
  providers:     { label: "Proveedores", icon: Truck },
  banners:       { label: "Banners",     icon: Image },
  api_keys:      { label: "API Keys",    icon: Key },
  monthly_sales: { label: "Ventas/mes",  icon: ShoppingCart },
};

const FEATURE_META = {
  analytics:          { label: "Analytics",            icon: BarChart2 },
  ai_agent:           { label: "Agente IA",            icon: Bot },
  api_access:         { label: "API Access",           icon: Key },
  multi_admin:        { label: "Multi-admin",          icon: Users },
  custom_branding:    { label: "Branding propio",      icon: Crown },
  wompi_payments:     { label: "Pagos Wompi",          icon: Zap },
  export:             { label: "Exportar datos",       icon: FileText },
  priority_support:   { label: "Soporte prioritario",  icon: CheckCircle2 },
  push_notifications: { label: "Notificaciones push",  icon: Zap },
  financial_reports:  { label: "Reportes financieros", icon: TrendingUp },
  purchase_orders:    { label: "Órdenes de compra",    icon: ShoppingCart },
};

// ─── sub-componentes ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.suspended;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${m.color} ${m.bg}`}>
      <Icon size={12} /> {m.label}
    </span>
  );
}

function UsageBar({ resource, data }) {
  const m = LIMIT_META[resource];
  if (!m || !data) return null;
  const Icon = m.icon;
  const infinite = data.max === -1;
  const pct = infinite ? 0 : Math.min(100, Math.round((data.used / data.max) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <Icon size={14} className="text-zinc-400" />
          {m.label}
        </span>
        <span className="text-zinc-400 tabular-nums">
          {fmt(data.used)} / {infinite ? "∞" : fmt(data.max)}
        </span>
      </div>
      {!infinite && (
        <div className="h-1.5 rounded-full bg-zinc-700/60 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function FeatureChip({ feature, enabled }) {
  const m = FEATURE_META[feature];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border
      ${enabled
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        : "border-zinc-700/50 bg-zinc-800/40 text-zinc-500 line-through"}`}
    >
      <Icon size={13} />
      {m.label}
    </div>
  );
}

function CancelModal({ onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  const [cancelNow, setCancelNow] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">Cancelar suscripción</h3>
            <p className="text-zinc-400 text-sm mt-1">Esta acción no puede deshacerse fácilmente.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <textarea
          rows={3}
          placeholder="¿Por qué cancelas? (opcional)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3
                     text-sm text-white placeholder:text-zinc-500 resize-none
                     focus:outline-none focus:border-zinc-500 transition-colors"
        />

        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setCancelNow(v => !v)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
              ${cancelNow ? "bg-red-500 border-red-500" : "border-zinc-600 group-hover:border-zinc-400"}`}
          >
            {cancelNow && <CheckCircle2 size={12} className="text-white" />}
          </div>
          <span className="text-sm text-zinc-300">
            Cancelar inmediatamente (perderás el período restante)
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300
                       hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Volver
          </button>
          <button
            onClick={() => onConfirm(reason, cancelNow)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50
                       text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── página principal ────────────────────────────────────────────
export default function MySubscription() {
  const navigate = useNavigate();
  const { refresh } = useSubscription();  // ← invalida el contexto global tras acciones

  const [data,       setData]      = useState(null);
  const [plans,      setPlans]     = useState([]);
  const [invoices,   setInvoices]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [busy,       setBusy]      = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, plansRes, invoicesRes] = await Promise.all([
        api.get("/subscriptions/me"),
        api.get("/subscriptions/plans"),
        api.get("/subscriptions/me/invoices"),
      ]);
      setData(subRes.data);
      setPlans(plansRes.data.plans ?? []);
      setInvoices(invoicesRes.data.invoices ?? []);
    } catch {
      toast.error("No se pudo cargar la suscripción");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── acciones ─────────────────────────────────────────────────────

  const handleReactivate = async () => {
    setBusy(true);
    try {
      await api.post("/subscriptions/reactivate");
      toast.success("Suscripción reactivada");
      await loadData();
      refresh();    // ← invalida cache del contexto global
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Error al reactivar");
    } finally { setBusy(false); }
  };

  const handleChangePlan = async (slug) => {
    setBusy(true);
    try {
      await api.post("/subscriptions/change-plan", { plan_slug: slug });
      toast.success("Plan actualizado correctamente");
      await loadData();
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Error al cambiar plan");
    } finally { setBusy(false); }
  };

  const handleCancel = async (reason, cancelNow) => {
    setBusy(true);
    try {
      await api.post("/subscriptions/cancel", { reason, cancel_now: cancelNow });
      toast.success(cancelNow ? "Suscripción cancelada" : "Se cancelará al final del período");
      setShowCancel(false);
      await loadData();
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Error al cancelar");
    } finally { setBusy(false); }
  };

  const downloadLatestInvoice = async () => {
    const invoice = invoices[0];
    if (!invoice) return toast.error("Todavía no tienes facturas de suscripción");
    setBusy(true);
    try {
      const response = await api.get(`/subscriptions/me/invoices/${invoice.id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DELASOFT-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.response?.data?.message ?? "No se pudo descargar la factura");
    } finally { setBusy(false); }
  };

  // ── loading / sin suscripción ──────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!data?.subscription) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4 text-zinc-400">
        <AlertTriangle size={40} className="text-amber-400" />
        <p className="text-lg font-medium text-white">Sin suscripción activa</p>
        <p className="text-sm">Elige un plan para comenzar a usar el panel.</p>
        <button
          onClick={() => navigate("/pricing")}
          className="mt-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          Ver planes
        </button>
      </div>
    );
  }

  const { subscription: sub, limits } = data;
  const currentPlanSlug = sub.plan_slug;
  const isCancelling    = sub.cancel_at_period_end;
  const canReactivate   = sub.status === "cancelled" || isCancelling;

  const daysLeft = sub.trial_end
    ? Math.max(0, Math.ceil((new Date(sub.trial_end) - new Date()) / 86_400_000))
    : null;

  return (
    <>
      {showCancel && (
        <CancelModal
          loading={busy}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Mi suscripción</h1>
            <p className="text-zinc-400 text-sm mt-1">Gestiona tu plan y uso de recursos</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white
                       border border-zinc-700 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {/* Banners contextuales */}
        {sub.status === "trial" && daysLeft !== null && daysLeft <= 5 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
            <Clock size={18} className="text-amber-400 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="text-amber-300 font-semibold">
                Tu prueba vence en {daysLeft} día{daysLeft !== 1 ? "s" : ""}
              </span>
              <span className="text-zinc-400"> — elige un plan para no perder el acceso.</span>
            </div>
            <button
              onClick={() => document.getElementById("planes-section")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 shrink-0 flex items-center gap-1"
            >
              Ver planes <ChevronRight size={13} />
            </button>
          </div>
        )}

        {sub.status === "past_due" && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">
              <strong>Pago pendiente.</strong> Tu cuenta será suspendida el{" "}
              {sub.grace_expires_at
                ? new Date(sub.grace_expires_at).toLocaleDateString("es-CO")
                : "pronto"}.
            </p>
          </div>
        )}

        {isCancelling && (
          <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-2xl px-5 py-4">
            <XCircle size={18} className="text-zinc-400 shrink-0" />
            <p className="text-sm text-zinc-300 flex-1">
              Tu suscripción se cancelará el{" "}
              <strong>{new Date(sub.current_period_end).toLocaleDateString("es-CO")}</strong>.
            </p>
            <button
              onClick={handleReactivate}
              disabled={busy}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
            >
              {busy && <Loader2 size={12} className="animate-spin" />}
              Reactivar <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Tarjeta del plan actual */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${sub.color ?? "#3B82F6"}22` }}
              >
                <Crown size={18} style={{ color: sub.color ?? "#3B82F6" }} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Plan actual</p>
                <h2 className="text-xl font-bold text-white">{sub.plan_name}</h2>
              </div>
            </div>
            <StatusBadge status={sub.status} />
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: sub.status === "trial" ? "Prueba hasta" : "Período actual",
                value: sub.status === "trial"
                  ? new Date(sub.trial_end).toLocaleDateString("es-CO")
                  : `${new Date(sub.current_period_start).toLocaleDateString("es-CO")} – ${new Date(sub.current_period_end).toLocaleDateString("es-CO")}`,
              },
              { label: "Ciclo",    value: sub.billing_cycle === "yearly" ? "Anual" : "Mensual" },
              { label: "Monto",    value: sub.status === "trial" ? "Gratis" : cop(sub.amount_due) },
              {
                label: "Próx. cobro",
                value: sub.next_billing_date && sub.status !== "trial"
                  ? new Date(sub.next_billing_date).toLocaleDateString("es-CO")
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-800/50 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Uso de recursos */}
          {limits?.limits && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Uso de recursos</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(limits.limits).map(([key, val]) => (
                  <UsageBar key={key} resource={key} data={val} />
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {limits?.features && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Funcionalidades</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(limits.features).map(([key, enabled]) => (
                  <FeatureChip key={key} feature={key} enabled={enabled} />
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800">
            {canReactivate ? (
              <button
                onClick={handleReactivate}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600
                           hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Reactivar suscripción
              </button>
            ) : !isCancelling && sub.status !== "cancelled" && (
              <button
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700
                           text-zinc-400 hover:text-red-400 hover:border-red-500/40 text-sm font-medium transition-colors"
              >
                <XCircle size={14} /> Cancelar suscripción
              </button>
            )}
            <button
              onClick={downloadLatestInvoice}
              disabled={busy || invoices.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700
                         text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={14} /> {invoices.length ? "Descargar última factura" : "Sin facturas disponibles"}
            </button>
          </div>
        </div>

        {/* Selector de planes */}
        <div id="planes-section" className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={18} className="text-zinc-400" />
            <h3 className="text-lg font-semibold text-white">Cambiar plan</h3>
          </div>

          {plans.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay planes disponibles.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrent = plan.slug === currentPlanSlug;
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-5 space-y-4 transition-all
                      ${isCurrent
                        ? "border-white/20 bg-zinc-800/60 ring-1 ring-white/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}
                  >
                    {plan.badge_label && (
                      <span
                        className="absolute -top-2.5 left-4 text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                        style={{ background: plan.color ?? "#3B82F6" }}
                      >
                        {plan.badge_label}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${plan.color ?? "#3B82F6"}22` }}
                      >
                        <Crown size={14} style={{ color: plan.color ?? "#3B82F6" }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{plan.name}</p>
                        {plan.tagline && <p className="text-xs text-zinc-500">{plan.tagline}</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-white">
                        {plan.price_monthly == 0 ? "Gratis" : cop(plan.price_monthly)}
                        {plan.price_monthly > 0 && (
                          <span className="text-sm font-normal text-zinc-500"> /mes</span>
                        )}
                      </p>
                      {plan.trial_days > 0 && (
                        <p className="text-xs text-zinc-500 mt-0.5">{plan.trial_days} días de prueba</p>
                      )}
                    </div>

                    <button
                      onClick={() => !isCurrent && !busy && handleChangePlan(plan.slug)}
                      disabled={isCurrent || busy}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                        ${isCurrent
                          ? "bg-zinc-700 text-zinc-400 cursor-default"
                          : "bg-white text-black hover:bg-zinc-100 disabled:opacity-50"}`}
                    >
                      {isCurrent ? "Plan actual" : "Seleccionar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
