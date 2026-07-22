import { useState, useEffect, useCallback } from "react";
import { Building2, Wallet, ShoppingCart, BarChart2, Phone, MessageCircle, Mail, ArrowLeft, ArrowDownLeft, Edit2, Power, Loader2 } from "lucide-react";
import api from "../../services/api";
import { fmtCOP, quickLink } from "./constants";
import { PaymentModal } from "./PaymentModal";
import { TabInfo, TabPayments, TabPurchases, TabStats } from "./ProviderTabs";

const TABS = [
  { id: "info",      icon: Building2,    label: "Info" },
  { id: "payments",  icon: Wallet,       label: "Pagos" },
  { id: "purchases", icon: ShoppingCart, label: "Compras" },
  { id: "stats",     icon: BarChart2,    label: "Stats" },
];

export function ProviderDetail({ provider, onRefresh, onBack, onEdit, isMobile }) {
  const [tab, setTab]               = useState("info");
  const [paymentModal, setPaymentModal] = useState(false);
  const [payments, setPayments]     = useState(null);
  const [purchases, setPurchases]   = useState(null);
  const [stats, setStats]           = useState(null);
  const [loadingTab, setLoadingTab] = useState(false);
  const [toggling, setToggling]     = useState(false);

  const loadTab = useCallback(async (t) => {
    if (t === "info") return;
    setLoadingTab(true);
    try {
      if (t === "payments"  && payments  === null) { const r = await api.get(`/providers/${provider.id}/payments`);  setPayments(r.data); }
      if (t === "purchases" && purchases === null) { const r = await api.get(`/providers/${provider.id}/purchases`); setPurchases(r.data); }
      if (t === "stats"     && stats     === null) { const r = await api.get(`/providers/${provider.id}/stats`);     setStats(r.data); }
    } catch (e) { console.error(e); }
    finally { setLoadingTab(false); }
  }, [provider.id, payments, purchases, stats]);

  const switchTab = (t) => { setTab(t); loadTab(t); };

  // Limpiar caché de sub-tabs al cambiar proveedor
  useEffect(() => {
    setTab("info");
    setPayments(null);
    setPurchases(null);
    setStats(null);
  }, [provider.id]);

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      await api.patch(`/providers/${provider.id}/toggle-active`);
      onRefresh();
    } catch (e) {
      console.error("Toggle active error:", e);
    } finally { setToggling(false); }
  };

  // Al recibir una PO: refrescar lista de compras y datos del proveedor
  const handlePurchaseReceived = () => {
    setPurchases(null); // fuerza recarga del tab
    onRefresh();        // refresca balance y datos del proveedor
    // Re-cargar el tab de compras inmediatamente
    setTimeout(() => loadTab("purchases"), 100);
  };

  const balance  = Number(provider.balance || 0);
  const hasDebt  = balance > 0;
  const isActive = provider.is_active !== false;

  return (
    <>
      {paymentModal && (
        <PaymentModal
          provider={provider}
          onClose={() => setPaymentModal(false)}
          onSuccess={() => { onRefresh(); setPayments(null); }}
        />
      )}

      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: isMobile ? 0 : 20,
        overflow: "hidden",
        position: isMobile ? "relative" : "sticky",
        top: isMobile ? 0 : 20,
        ...(isMobile && { minHeight: "calc(100vh - 0px)" }),
      }}>
        {/* Cabecera oscura */}
        <div style={{ background: "#0f172a", padding: "20px 20px 18px" }}>
          {/* Botón volver (mobile) */}
          {isMobile && onBack && (
            <button
              onClick={onBack}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}
            >
              <ArrowLeft size={16} /> Volver
            </button>
          )}

          {/* Avatar + categoría + acciones */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13,
                background: !isActive ? "#1e293b" : hasDebt ? "#fef3c7" : "#d1fae5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800,
                color: !isActive ? "#64748b" : hasDebt ? "#b45309" : "#065f46",
              }}>
                {provider.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{
                  background: "#1e293b", color: "#94a3b8", fontSize: 10,
                  fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                  textTransform: "uppercase", letterSpacing: "0.08em", display: "block",
                }}>
                  {provider.category}
                </span>
                {!isActive && (
                  <span style={{
                    background: "#7f1d1d22", color: "#fca5a5", fontSize: 10,
                    fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                    textTransform: "uppercase", marginTop: 4, display: "block",
                  }}>
                    Inactivo
                  </span>
                )}
              </div>
            </div>

            {/* Botones editar + toggle activo */}
            <div style={{ display: "flex", gap: 6 }}>
              {onEdit && (
                <button
                  onClick={onEdit}
                  title="Editar proveedor"
                  style={{
                    background: "#1e293b", border: "none", borderRadius: 8,
                    width: 34, height: 34, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#94a3b8",
                  }}
                >
                  <Edit2 size={14} />
                </button>
              )}
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                title={isActive ? "Desactivar proveedor" : "Activar proveedor"}
                style={{
                  background: isActive ? "#1e293b" : "#14532d22",
                  border: `1px solid ${isActive ? "transparent" : "#16a34a44"}`,
                  borderRadius: 8, width: 34, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: toggling ? "#475569" : isActive ? "#ef4444" : "#4ade80",
                }}
              >
                {toggling
                  ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                  : <Power size={14} />}
              </button>
            </div>
          </div>

          <h3 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.2 }}>
            {provider.name}
          </h3>
          {provider.contact_person && (
            <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Contacto: {provider.contact_person}</p>
          )}

          {/* Saldo pendiente */}
          <div style={{
            marginTop: 14,
            background: hasDebt ? "#7f1d1d22" : "#064e3b22",
            border: `1px solid ${hasDebt ? "#ef444430" : "#10b98130"}`,
            borderRadius: 12, padding: "12px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Saldo pendiente
              </p>
              <p style={{ color: hasDebt ? "#fca5a5" : "#6ee7b7", fontSize: 20, fontWeight: 800, margin: 0 }}>
                {fmtCOP(balance)}
              </p>
            </div>
            {hasDebt && (
              <button
                onClick={() => setPaymentModal(true)}
                style={{
                  background: "#2563eb", color: "#fff", border: "none",
                  borderRadius: 10, padding: "8px 12px", fontSize: 12,
                  fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <ArrowDownLeft size={13} /> Abonar
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 6px" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "10px 2px", background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid #2563eb" : "2px solid transparent",
                color: tab === t.id ? "#2563eb" : "#94a3b8",
                transition: "all 0.1s",
              }}
            >
              <t.icon size={14} />
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <div style={{ padding: 18, maxHeight: isMobile ? "none" : 460, overflowY: "auto" }}>
          {loadingTab ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={22} color="#2563eb" style={{ animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <>
              {tab === "info"      && <TabInfo      provider={provider} />}
              {tab === "payments"  && <TabPayments  data={payments} />}
              {tab === "purchases" && (
                <TabPurchases
                  data={purchases}
                  providerId={provider.id}
                  onReceived={handlePurchaseReceived}
                />
              )}
              {tab === "stats"     && <TabStats     data={stats} />}
            </>
          )}
        </div>

        {/* Links rápidos */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
          {provider.phone && (
            <a href={`tel:${provider.phone}`} title="Llamar" style={quickLink("#dbeafe", "#1e40af")}>
              <Phone size={15} />
            </a>
          )}
          {provider.phone && (
            <a href={`https://wa.me/${provider.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" title="WhatsApp" style={quickLink("#dcfce7", "#15803d")}>
              <MessageCircle size={15} />
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} title="Email" style={quickLink("#f3f4f6", "#374151")}>
              <Mail size={15} />
            </a>
          )}
        </div>
      </div>
    </>
  );
}