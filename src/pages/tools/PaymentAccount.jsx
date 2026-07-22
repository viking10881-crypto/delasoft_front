// pages/tools/PaymentAccount.jsx
// Gestión de la cuenta de pagos Wompi del negocio.
// SEGURIDAD: los campos privados son write-only; nunca se leen del backend.
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  CreditCard, CheckCircle2, AlertCircle, Clock,
  Eye, EyeOff, Loader2, ShieldCheck,
  ToggleLeft, ToggleRight, Save, RefreshCw,
  AlertTriangle, Crown, Lock,
} from "lucide-react";

// ─── Estilos compartidos ───────────────────────────────────────────
const inputCls = `
  w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm
  bg-slate-100 dark:bg-white/[0.06] border border-transparent
  text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-amber-500 dark:focus:border-amber-500/60
  focus:ring-2 focus:ring-amber-500/10
`;

// ─── Constantes ───────────────────────────────────────────────────
const EMPTY_FORM = {
  environment:      "sandbox",
  public_key:       "",
  private_key:      "",
  events_secret:    "",
  integrity_secret: "",
};

const STATUS_CONFIG = {
  active: {
    label: "Conectada",
    Icon:  CheckCircle2,
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    dot:   "bg-emerald-500",
    icon:  "text-emerald-500",
    iconBg:"bg-emerald-50 dark:bg-emerald-500/10",
  },
  pending: {
    label: "Pendiente",
    Icon:  Clock,
    badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    dot:   "bg-amber-500",
    icon:  "text-amber-500",
    iconBg:"bg-amber-50 dark:bg-amber-500/10",
  },
  inactive: {
    label: "Desactivada",
    Icon:  AlertCircle,
    badge: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
    dot:   "bg-red-500",
    icon:  "text-red-500",
    iconBg:"bg-red-50 dark:bg-red-500/10",
  },
};

const formatDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ─── Campo de secreto (write-only) ───────────────────────────────
function SecretField({ label, value, onChange, placeholder, hint }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-gray-400 dark:text-slate-600">{hint}</span>
        )}
      </div>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          tabIndex={-1}
          aria-label={visible ? "Ocultar" : "Mostrar"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────
export default function PaymentAccount() {
  const { showNotice, askConfirmation } = useNotice();
  const { canUse } = useSubscription();

  const hasFeature = canUse("wompi_payments");

  const [account,   setAccount]   = useState(null);  // null = sin cuenta todavía
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ── Carga inicial ─────────────────────────────────────────────
  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payment-accounts");
      const acc = data?.data ?? null;
      setAccount(acc);
      if (acc) {
        setForm({
          environment:      acc.environment ?? "sandbox",
          public_key:       acc.public_key  ?? "",
          // Secretos: siempre vacíos (write-only)
          private_key:      "",
          events_secret:    "",
          integrity_secret: "",
        });
      }
    } catch (err) {
      // 404 = sin cuenta todavía, es normal
      if (err.response?.status !== 404) {
        showNotice("Error al cargar la cuenta de pagos", "error");
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  // ── Guardar ───────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.public_key.trim()) {
      showNotice("La llave pública es requerida", "error");
      return;
    }

    const isNew = !account?.id;
    if (isNew) {
      if (!form.private_key.trim())      { showNotice("La llave privada es requerida para conectar una cuenta nueva", "error"); return; }
      if (!form.events_secret.trim())    { showNotice("El secreto de eventos es requerido para conectar una cuenta nueva", "error"); return; }
      if (!form.integrity_secret.trim()) { showNotice("El secreto de integridad es requerido para conectar una cuenta nueva", "error"); return; }
    }

    // Solo enviar secretos si el usuario los escribió
    const payload = {
      provider:    "wompi",
      environment: form.environment,
      public_key:  form.public_key.trim(),
    };
    if (form.private_key.trim())      payload.private_key      = form.private_key.trim();
    if (form.events_secret.trim())    payload.events_secret    = form.events_secret.trim();
    if (form.integrity_secret.trim()) payload.integrity_secret = form.integrity_secret.trim();

    setSaving(true);
    try {
      if (account?.id) {
        await api.put(`/payment-accounts/${account.id}`, payload);
      } else {
        await api.post("/payment-accounts", payload);
      }
      showNotice("Cuenta de pagos guardada", "success");
      fetchAccount();
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Verificar conexión ────────────────────────────────────────
  const handleVerify = async () => {
    if (!account?.id) return;
    setVerifying(true);
    try {
      const { data } = await api.post(`/payment-accounts/${account.id}/verify`);
      showNotice(data?.message ?? "Conexión verificada correctamente", "success");
      fetchAccount();
    } catch (err) {
      showNotice(
        err.response?.data?.message ?? "Error al verificar: credenciales inválidas o sin respuesta",
        "error"
      );
      fetchAccount(); // refrescar estado aunque falle
    } finally {
      setVerifying(false);
    }
  };

  // ── Activar / desactivar ──────────────────────────────────────
  const handleToggle = async () => {
    if (!account?.id) return;
    const willDeactivate = account.is_active;

    const confirmed = await askConfirmation(
      willDeactivate ? "¿Desactivar pagos en línea?" : "¿Activar pagos en línea?",
      willDeactivate
        ? "Los clientes no podrán pagar en línea mientras la cuenta esté desactivada."
        : "Los pagos en línea quedarán habilitados en tu tienda."
    );
    if (!confirmed) return;

    setToggling(true);
    try {
      await api.patch(`/payment-accounts/${account.id}/toggle`);
      showNotice(`Pagos ${willDeactivate ? "desactivados" : "activados"}`, "success");
      fetchAccount();
    } catch (err) {
      showNotice(err.response?.data?.message ?? "Error al cambiar estado", "error");
    } finally {
      setToggling(false);
    }
  };

  // ── Estado de la cuenta ───────────────────────────────────────
  const statusKey = account
    ? (!account.is_active ? "inactive" : (account.status ?? "pending"))
    : null;
  const statusCfg = statusKey ? (STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending) : null;

  // ── UI: feature no disponible en el plan ─────────────────────
  if (!hasFeature) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <PageHeader />
          <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              Pagos en línea no incluidos en tu plan
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Conecta tu cuenta de Wompi para recibir pagos directamente en tu tienda.
              Disponible a partir del plan Pro.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-amber-500/20"
            >
              <Crown size={16} /> Ver planes disponibles
            </a>
          </div>
        </main>
      </div>
    );
  }

  // ── UI: cargando ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <PageHeader />
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin mb-3 text-amber-500" size={32} />
            <p className="font-medium text-sm text-gray-400">Cargando cuenta de pagos...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── UI: principal ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <PageHeader />
          {statusCfg && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold flex-shrink-0 ${statusCfg.badge}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </div>
          )}
        </div>

        {/* Nota de seguridad */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
          <ShieldCheck size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            Tus llaves privadas viajan por HTTPS y{" "}
            <strong>nunca se devuelven ni se almacenan en el navegador</strong>.
            Los campos de secreto son de solo escritura: déjalos vacíos para conservar el valor actual.
          </p>
        </div>

        {/* Tarjeta de estado (solo si ya hay cuenta) */}
        {account && statusCfg && (
          <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${statusCfg.iconBg}`}>
                  <statusCfg.Icon size={22} className={statusCfg.icon} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 dark:text-white">Wompi</p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-400">
                      {account.environment === "production" ? "Producción" : "Sandbox"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock size={11} />
                    Última verificación: <strong>{formatDateTime(account.last_verified_at)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleVerify}
                  disabled={verifying || saving || toggling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-slate-300 text-sm font-bold hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying
                    ? <Loader2 size={14} className="animate-spin" />
                    : <RefreshCw size={14} />}
                  Verificar
                </button>

                <button
                  onClick={handleToggle}
                  disabled={toggling || saving || verifying}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    account.is_active
                      ? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                      : "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                  }`}
                >
                  {toggling
                    ? <Loader2 size={14} className="animate-spin" />
                    : account.is_active
                      ? <ToggleLeft size={14} />
                      : <ToggleRight size={14} />}
                  {account.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
            <h2 className="font-black text-gray-900 dark:text-white">
              {account ? "Actualizar credenciales" : "Conectar cuenta de Wompi"}
            </h2>
            {account && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                Deja los campos de secreto vacíos para conservar los valores guardados.
              </p>
            )}
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">

            {/* Proveedor (fijo) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Proveedor
              </label>
              <div className={`${inputCls} opacity-60 cursor-not-allowed select-none`}>
                Wompi
              </div>
            </div>

            {/* Ambiente */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Ambiente *
              </label>
              <select
                value={form.environment}
                onChange={(e) => setField("environment", e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="sandbox">Sandbox (pruebas)</option>
                <option value="production">Producción</option>
              </select>
            </div>

            {/* Llave pública */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Llave pública (pub_key) *
              </label>
              <input
                type="text"
                value={form.public_key}
                onChange={(e) => setField("public_key", e.target.value)}
                placeholder="pub_stagtest_..."
                className={inputCls}
                required
              />
            </div>

            {/* Secretos (write-only) */}
            <SecretField
              label={`Llave privada (prv_key)${!account ? " *" : ""}`}
              value={form.private_key}
              onChange={(v) => setField("private_key", v)}
              placeholder={account ? "••••••••••••• (sin cambios)" : "prv_stagtest_..."}
              hint={account ? "Opcional — solo si quieres cambiarla" : undefined}
            />

            <SecretField
              label={`Secreto de eventos${!account ? " *" : ""}`}
              value={form.events_secret}
              onChange={(v) => setField("events_secret", v)}
              placeholder={account ? "••••••••••••• (sin cambios)" : "Panel Wompi → Configuración → Llaves"}
              hint={account ? "Opcional — solo si quieres cambiarlo" : undefined}
            />

            <SecretField
              label={`Secreto de integridad${!account ? " *" : ""}`}
              value={form.integrity_secret}
              onChange={(v) => setField("integrity_secret", v)}
              placeholder={account ? "••••••••••••• (sin cambios)" : "Panel Wompi → Configuración → Llaves"}
              hint={account ? "Opcional — solo si quieres cambiarlo" : undefined}
            />

            {/* Advertencia de producción */}
            {form.environment === "production" && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
                <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  Estás configurando el ambiente de <strong>producción</strong>.
                  Los cobros serán reales. Confirma que usas las credenciales de producción de Wompi.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || verifying || toggling}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
            >
              {saving
                ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                : <><Save size={18} /> {account ? "Actualizar cuenta" : "Conectar cuenta"}</>}
            </button>
          </form>
        </div>

        {/* Guía para primera conexión */}
        {!account && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.07]">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1.5">
              <p>
                <strong className="text-gray-700 dark:text-slate-300">¿Dónde encuentro mis credenciales?</strong>{" "}
                Ingresa a{" "}
                <a
                  href="https://comercios.wompi.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-amber-600 dark:text-amber-400"
                >
                  comercios.wompi.co
                </a>
                {" "}→ Configuración → Llaves de API.
              </p>
              <p>
                Para sandbox usa las credenciales de prueba de Wompi.
                Para producción, tu cuenta debe estar aprobada y activa.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Header reutilizable ──────────────────────────────────────────
function PageHeader() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <CreditCard size={14} className="text-amber-500" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">
          Integraciones
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
        Pagos en línea
      </h1>
      <p className="text-gray-500 dark:text-slate-500 font-medium text-sm mt-1">
        Conecta tu cuenta de Wompi para recibir pagos en tu tienda
      </p>
    </div>
  );
}
