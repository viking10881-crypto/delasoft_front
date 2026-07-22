// src/context/SubscriptionContext.jsx
import {
  createContext, useContext, useEffect,
  useState, useCallback, useMemo,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const SubscriptionContext = createContext(null);

export const FEATURE_ROUTES = {
  analytics:         ["/analytics"],
  ai_agent:          ["/tools/agent"],
  api_access:        ["/tools/api-keys"],
  financial_reports: ["/tools/finance"],
  purchase_orders:   ["/tools/providers", "/procurement"],
  discount_system:   ["/tools/discounts"],
  custom_branding:   ["/tools/business-profile"],
  wompi_payments:    ["/tools/payments"],
  inventory:         ["/tools/inventory"],
};

const ACTIVE_STATUSES = new Set(["trial", "active", "past_due", "superadmin"]);

// ─── Provider ──────────────────────────────────────────────────────
export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [limits,       setLimits]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [lastFetch,    setLastFetch]    = useState(null);

  const fetchSubscription = useCallback(async (force = false) => {
    if (!isAuthenticated || !user) return;

    // Superadmin ve todo sin suscripción real
    if (user.roles?.includes("superadmin")) {
      setSubscription({ status: "superadmin", plan_slug: "superadmin" });
      setLimits(_buildSuperadminLimits());
      return;
    }

    if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000) return;

    setLoading(true);
    try {
      const { data } = await api.get("/subscriptions/me");
      setSubscription(data.subscription);
      setLimits(data.limits);
      setLastFetch(Date.now());
    } catch {
      setSubscription(null);
      setLimits(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, lastFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription(true);
    } else {
      setSubscription(null);
      setLimits(null);
      setLastFetch(null);
    }
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derivados reactivos ──────────────────────────────────────────

  const isActive = useMemo(
    () => ACTIVE_STATUSES.has(subscription?.status),
    [subscription]
  );

  const trialDaysLeft = useMemo(() => {
    if (!subscription?.trial_end) return null;
    return Math.max(0, Math.ceil(
      (new Date(subscription.trial_end) - new Date()) / 86_400_000
    ));
  }, [subscription]);

  const graceDaysLeft = useMemo(() => {
    if (!subscription?.grace_expires_at) return null;
    return Math.max(0, Math.ceil(
      (new Date(subscription.grace_expires_at) - new Date()) / 86_400_000
    ));
  }, [subscription]);

  // ── Helpers públicos ─────────────────────────────────────────────

  /** ¿El plan incluye esta feature? */
  const canUse = useCallback((feature) => {
    if (user?.roles?.includes("superadmin")) return true;
    if (!limits?.allowed) return false;
    return limits.features?.[feature] === true;
  }, [limits, user]);

  /** ¿Quedan unidades disponibles de este recurso? */
  const hasRoom = useCallback((resource) => {
    if (user?.roles?.includes("superadmin")) return true;
    if (!limits?.limits) return false;
    const l = limits.limits[resource];
    if (!l) return true;
    return l.max === -1 || l.used < l.max;
  }, [limits, user]);

  /** % de uso de un recurso (0-100) */
  const usagePct = useCallback((resource) => {
    if (!limits?.limits) return 0;
    const l = limits.limits[resource];
    if (!l || l.max === -1) return 0;
    return Math.min(100, Math.round((l.used / l.max) * 100));
  }, [limits]);

  const value = useMemo(() => ({
    subscription,
    limits,
    loading,
    isActive,
    trialDaysLeft,
    graceDaysLeft,
    canUse,
    hasRoom,
    usagePct,
    refresh: () => fetchSubscription(true),
  }), [
    subscription, limits, loading, isActive,
    trialDaysLeft, graceDaysLeft, canUse, hasRoom, usagePct, fetchSubscription,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────
export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be inside SubscriptionProvider");
  return ctx;
}

// ─── Helpers internos ───────────────────────────────────────────────
function _buildSuperadminLimits() {
  return {
    allowed: true,
    features: {
      analytics: true, ai_agent: true, api_access: true,
      multi_admin: true, custom_branding: true, wompi_payments: true,
      export: true, priority_support: true, push_notifications: true,
      financial_reports: true, purchase_orders: true, discount_system: true,
      inventory: true,  // ← AGREGAR
    },
    limits: {
      products:      { max: -1, used: 0 },
      users:         { max: -1, used: 0 },
      api_keys:      { max: -1, used: 0 },
      categories:    { max: -1, used: 0 },
      banners:       { max: -1, used: 0 },
      providers:     { max: -1, used: 0 },
      monthly_sales: { max: -1, used: 0 },
    },
  };
}