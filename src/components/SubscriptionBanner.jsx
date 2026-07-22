// components/SubscriptionBanner.jsx
// Muestra alertas de suscripción según el estado.
// Colócalo en MainLayout.jsx justo debajo del header/nav.
//
// Uso: <SubscriptionBanner />
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import {
  Crown, X, AlertTriangle, Clock, Zap, ShieldOff,
  ChevronRight,
} from "lucide-react";

// ─── Configuración de alertas por estado/días ─────────────────────────────────
const getBannerConfig = ({ subscription, trialDaysLeft, graceDaysLeft }) => {
  if (!subscription) return null;

  const status = subscription.status;

  // ── Trial a punto de vencer ────────────────────────────────────────────────
  if (status === "trial" && trialDaysLeft !== null) {
    if (trialDaysLeft <= 0) {
      return {
        type: "critical",
        icon: ShieldOff,
        title: "Tu período de prueba ha terminado",
        message: "Activa tu plan para seguir usando todas las funcionalidades del panel.",
        cta: "Activar plan ahora",
        dismissable: false,
        bg: "bg-red-50 dark:bg-red-950/40",
        border: "border-red-200 dark:border-red-500/30",
        iconColor: "text-red-500",
        textColor: "text-red-800 dark:text-red-300",
        ctaBg: "bg-red-500 hover:bg-red-600",
      };
    }
    if (trialDaysLeft <= 3) {
      return {
        type: "urgent",
        icon: AlertTriangle,
        title: `Tu trial vence en ${trialDaysLeft} día${trialDaysLeft !== 1 ? "s" : ""}`,
        message: "Activa tu plan para no perder el acceso a tus datos y funcionalidades.",
        cta: "Ver planes",
        dismissable: false,
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-500/30",
        iconColor: "text-amber-500",
        textColor: "text-amber-800 dark:text-amber-300",
        ctaBg: "bg-amber-500 hover:bg-amber-600",
      };
    }
    if (trialDaysLeft <= 7) {
      return {
        type: "warning",
        icon: Clock,
        title: `${trialDaysLeft} días restantes de trial`,
        message: `Estás usando el plan ${subscription.plan_name}. Activa tu suscripción para continuar.`,
        cta: "Ver planes",
        dismissable: true,
        bg: "bg-blue-50 dark:bg-blue-950/40",
        border: "border-blue-200 dark:border-blue-500/30",
        iconColor: "text-blue-500",
        textColor: "text-blue-800 dark:text-blue-300",
        ctaBg: "bg-blue-500 hover:bg-blue-600",
      };
    }
  }

  // ── Pago pendiente (past_due + grace period) ───────────────────────────────
  if (status === "past_due" && graceDaysLeft !== null) {
    if (graceDaysLeft <= 1) {
      return {
        type: "critical",
        icon: AlertTriangle,
        title: "Tu cuenta se suspende hoy",
        message: "Tienes un pago pendiente. Renueva ahora para evitar la suspensión.",
        cta: "Renovar ahora",
        dismissable: false,
        bg: "bg-red-50 dark:bg-red-950/40",
        border: "border-red-200 dark:border-red-500/30",
        iconColor: "text-red-500",
        textColor: "text-red-800 dark:text-red-300",
        ctaBg: "bg-red-500 hover:bg-red-600",
      };
    }
    return {
      type: "urgent",
      icon: AlertTriangle,
      title: "Pago pendiente",
      message: `Tu suscripción venció. Tienes ${graceDaysLeft} día${graceDaysLeft !== 1 ? "s" : ""} de gracia antes de la suspensión.`,
      cta: "Renovar suscripción",
      dismissable: false,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-500/30",
      iconColor: "text-amber-500",
      textColor: "text-amber-800 dark:text-amber-300",
      ctaBg: "bg-amber-500 hover:bg-amber-600",
    };
  }

  // ── Suspendido ─────────────────────────────────────────────────────────────
  if (status === "suspended") {
    return {
      type: "critical",
      icon: ShieldOff,
      title: "Cuenta suspendida",
      message: "Tu suscripción está suspendida. Renueva para recuperar el acceso completo.",
      cta: "Reactivar cuenta",
      dismissable: false,
      bg: "bg-red-50 dark:bg-red-950/40",
      border: "border-red-200 dark:border-red-500/30",
      iconColor: "text-red-500",
      textColor: "text-red-800 dark:text-red-300",
      ctaBg: "bg-red-500 hover:bg-red-600",
    };
  }

  // ── Cancela al final del período ───────────────────────────────────────────
  if (status === "active" && subscription.cancel_at_period_end) {
    const endDate = subscription.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString("es-CO", { day: "2-digit", month: "long" })
      : "pronto";
    return {
      type: "info",
      icon: Crown,
      title: "Suscripción programada para cancelar",
      message: `Tu plan se cancelará el ${endDate}. Puedes reactivarlo en cualquier momento.`,
      cta: "Reactivar",
      dismissable: true,
      bg: "bg-gray-50 dark:bg-white/[0.03]",
      border: "border-gray-200 dark:border-white/[0.08]",
      iconColor: "text-gray-400",
      textColor: "text-gray-700 dark:text-slate-300",
      ctaBg: "bg-gray-700 hover:bg-gray-800",
    };
  }

  return null;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function SubscriptionBanner() {
  const { subscription, trialDaysLeft, graceDaysLeft } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Superadmin no ve banners
  if (user?.roles?.includes("superadmin")) return null;
  if (dismissed) return null;

  const config = getBannerConfig({ subscription, trialDaysLeft, graceDaysLeft });
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`
      w-full px-4 sm:px-6 py-3
      border-b ${config.border} ${config.bg}
      transition-all duration-300
    `}>
      <div className="max-w-7xl mx-auto flex items-center gap-3">

        {/* Icono */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon size={18} />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.textColor} leading-tight`}>
            {config.title}
          </p>
          <p className={`text-xs ${config.textColor} opacity-80 hidden sm:block`}>
            {config.message}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/subscription")}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5
            rounded-lg text-xs font-bold text-white transition-all
            active:scale-95 ${config.ctaBg}
          `}
        >
          <Zap size={12} />
          {config.cta}
          <ChevronRight size={12} />
        </button>

        {/* Dismiss */}
        {config.dismissable && (
          <button
            onClick={() => setDismissed(true)}
            className={`flex-shrink-0 p-1 rounded-lg ${config.textColor} opacity-50 hover:opacity-100 transition-opacity`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}