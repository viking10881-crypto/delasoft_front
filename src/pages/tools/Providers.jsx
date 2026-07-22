import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, RefreshCw, CheckCircle, AlertTriangle, Wallet, Building2, ChevronRight, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useBreakpoint } from "../../components/providers/useBreakpoint";
import { CATEGORIES, fmtCOP, inputStyle } from "../../components/providers/constants";
import { Badge, EmptyState } from "../../components/providers/ui";
import { CreateProviderModal, EditProviderModal } from "../../components/providers/ProviderModals";
import { ProviderDetail } from "../../components/providers/ProviderDetail";

export default function Providers() {
  const { isMobile } = useBreakpoint();

  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("active");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal]     = useState(false);
  const [mobileView, setMobileView]   = useState("list"); // "list" | "detail"

  const fetchProviders = useCallback(async () => {
    try {
      const res = await api.get("/providers");
      setProviders(res.data);
      if (res.data.length > 0 && !selectedProvider && !isMobile) {
        setSelectedProvider(res.data[0]);
      }
    } catch (e) {
      console.error("Error cargando proveedores:", e);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleRefresh = useCallback(async () => {
    await fetchProviders();
    if (selectedProvider) {
      try {
        const r = await api.get(`/providers/${selectedProvider.id}`);
        setSelectedProvider(r.data);
      } catch (e) {}
    }
  }, [fetchProviders, selectedProvider]);

  const handleSelectProvider = (p) => {
    setSelectedProvider(p);
    if (isMobile) setMobileView("detail");
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = providers.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contact_person || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat    = filterCategory === "all" || p.category === filterCategory;
    const matchStatus =
      filterStatus === "all"      ? true
      : filterStatus === "active" ? p.is_active !== false
      :                             p.is_active === false;
    return matchSearch && matchCat && matchStatus;
  });

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalDeuda = providers.reduce((a, p) => a + Number(p.balance || 0), 0);
  const conDeuda   = providers.filter(p => Number(p.balance) > 0).length;
  const activos    = providers.filter(p => p.is_active !== false).length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 size={32} color="#2563eb" style={{ animation: "spin 0.8s linear infinite", display: "block", margin: "0 auto 10px" }} />
        <p style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 12, margin: 0 }}>Cargando proveedores...</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Vista mobile: detalle ─────────────────────────────────────────────────
  if (isMobile && mobileView === "detail" && selectedProvider) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", background: "var(--bg-page)", minHeight: "100vh" }}>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        {createModal && <CreateProviderModal onClose={() => setCreateModal(false)} onSuccess={handleRefresh} />}
        {editModal && (
          <EditProviderModal
            provider={selectedProvider}
            onClose={() => setEditModal(false)}
            onSuccess={handleRefresh}
          />
        )}
        <ProviderDetail
          provider={selectedProvider}
          onRefresh={handleRefresh}
          onBack={() => setMobileView("list")}
          onEdit={() => setEditModal(true)}
          isMobile={true}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {createModal && <CreateProviderModal onClose={() => setCreateModal(false)} onSuccess={handleRefresh} />}
      {editModal && selectedProvider && (
        <EditProviderModal
          provider={selectedProvider}
          onClose={() => setEditModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "14px 12px" : "24px 20px" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 3px" }}>
              Proveedores
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Gestión de aliados comerciales y cuentas por pagar
            </p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 11, padding: "9px 16px", fontSize: 12,
              fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}
          >
            <Plus size={15} />
            {isMobile ? "Añadir" : "Nuevo proveedor"}
          </button>
        </div>

        {/* ── KPIs ────────────────────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 10, marginBottom: 18,
        }}>
          {[
            { label: "Activos",     value: activos,                                                              icon: CheckCircle,   accent: "#059669" },
            { label: "Con deuda",   value: conDeuda,                                                             icon: AlertTriangle, accent: "#d97706" },
            { label: "Deuda total", value: isMobile ? `$${(totalDeuda/1000000).toFixed(1)}M` : fmtCOP(totalDeuda), icon: Wallet,     accent: "#dc2626" },
            { label: "Total",       value: providers.length,                                                     icon: Building2,    accent: "#2563eb" },
          ].map(k => (
            <div key={k.label} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "13px 14px",
              display: "flex", alignItems: "center", gap: 10, minWidth: 0,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: k.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <k.icon size={16} color={k.accent} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Búsqueda y filtros ───────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar proveedor o contacto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...inputStyle({ paddingLeft: 38 }), width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ ...inputStyle(), width: isMobile ? "calc(50% - 4px)" : "auto", minWidth: 130 }}
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ ...inputStyle(), width: isMobile ? "calc(50% - 4px)" : "auto", minWidth: 110 }}
          >
            <option value="active">Solo activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </select>
          <button
            onClick={handleRefresh}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "0 12px", cursor: "pointer",
              color: "#64748b", display: "flex", alignItems: "center", flexShrink: 0,
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* ── Layout: lista + detalle ─────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 380px",
          gap: 16, alignItems: "start",
        }}>
          {/* Lista */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {filtered.length} {filtered.length === 1 ? "proveedor" : "proveedores"}
              </span>
            </div>

            <div style={{ maxHeight: isMobile ? "none" : 580, overflowY: isMobile ? "visible" : "auto" }}>
              {filtered.length === 0 ? (
                <EmptyState icon={Package} text="No se encontraron proveedores" />
              ) : filtered.map(p => {
                const bal    = Number(p.balance || 0);
                const hasD   = bal > 0;
                const isSel  = selectedProvider?.id === p.id;
                const active = p.is_active !== false;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProvider(p)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: isMobile ? "13px 16px" : "12px 18px",
                      cursor: "pointer", borderBottom: "1px solid var(--bg-page)",
                      background: isSel && !isMobile ? "#eff6ff" : "transparent",
                      borderLeft: isSel && !isMobile ? "3px solid #2563eb" : "3px solid transparent",
                      opacity: active ? 1 : 0.55,
                      transition: "background 0.1s, opacity 0.1s",
                      minHeight: isMobile ? 64 : "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: !active ? "#f1f5f9" : hasD ? "#fef3c7" : "#f0fdf4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 17, fontWeight: 800,
                        color: !active ? "#94a3b8" : hasD ? "#b45309" : "#15803d",
                      }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </p>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.category}</span>
                          {hasD && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />}
                          {!active && <Badge label="Inactivo" color="#6b7280" bg="#f3f4f6" />}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 1px", fontWeight: 600 }}>Saldo</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: hasD ? "#dc2626" : "#16a34a", margin: 0 }}>
                          {isMobile
                            ? `$${(bal / 1000).toFixed(bal >= 1000000 ? 0 : 1)}${bal >= 1000000 ? "M" : bal >= 1000 ? "k" : ""}`
                            : fmtCOP(bal)}
                        </p>
                      </div>
                      <ChevronRight size={15} color={isSel && !isMobile ? "#2563eb" : "#cbd5e1"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalle — solo desktop */}
          {!isMobile && (
            <div>
              {selectedProvider ? (
                <ProviderDetail
                  key={selectedProvider.id}
                  provider={selectedProvider}
                  onRefresh={handleRefresh}
                  onEdit={() => setEditModal(true)}
                  isMobile={false}
                />
              ) : (
                <div style={{
                  background: "var(--bg-card)", border: "2px dashed #e2e8f0",
                  borderRadius: 20, padding: 48,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                }}>
                  <Package size={36} color="#e2e8f0" />
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
                    Selecciona un proveedor para ver el detalle
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}