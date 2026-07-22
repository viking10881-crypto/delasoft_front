import {
  Star, Wallet, ShoppingCart, BarChart2, CreditCard, Clock,
  MapPin, Mail, Phone, FileText, DollarSign, CheckCircle,
  PackageCheck, Loader2, TrendingUp, TrendingDown, ArrowUpDown, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fmtCOP, fmtDate, PAYMENT_METHODS, STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "./constants";
import { Badge, StatCard, EmptyState } from "./ui";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";

// ─── Tab: Información ─────────────────────────────────────────────────────────
export function TabInfo({ provider }) {
  const rows = [
    { icon: MapPin,     label: "Dirección",         value: provider.address },
    { icon: Mail,       label: "Email",              value: provider.email },
    { icon: Phone,      label: "Teléfono",           value: provider.phone },
    { icon: FileText,   label: "NIT / RUT",          value: provider.tax_id },
    { icon: CreditCard, label: "Crédito disponible", value: fmtCOP(provider.available_credit) },
    { icon: Clock,      label: "Días de entrega",    value: provider.lead_time_days ? `${provider.lead_time_days} días` : null },
    { icon: Clock,      label: "Términos de pago",   value: provider.payment_terms_days ? `${provider.payment_terms_days} días` : null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Fiabilidad */}
      <div style={{ background: "var(--bg-page)", borderRadius: 12, padding: "12px 14px", marginBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Fiabilidad</span>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n} size={13}
                fill={n <= Math.round(provider.reliability_score || 5) ? "#f59e0b" : "none"}
                color={n <= Math.round(provider.reliability_score || 5) ? "#f59e0b" : "#d1d5db"}
              />
            ))}
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginLeft: 4 }}>
              {Number(provider.reliability_score || 5).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {rows.map(({ icon: Icon, label, value }) =>
        value ? (
          <div key={label} style={{
            display: "flex", gap: 10, padding: "6px 0",
            borderBottom: "1px solid var(--border)", alignItems: "flex-start",
          }}>
            <Icon size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>{value}</p>
            </div>
          </div>
        ) : null
      )}

      {provider.notes && (
        <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", marginTop: 6 }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, margin: "0 0 3px", textTransform: "uppercase" }}>Notas</p>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0 }}>{provider.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Pagos ───────────────────────────────────────────────────────────────
export function TabPayments({ data }) {
  if (!data) return <EmptyState icon={Wallet} text="Cargando pagos..." />;
  if (data.length === 0) return <EmptyState icon={Wallet} text="Sin pagos registrados" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map(p => (
        <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px" }}>{fmtCOP(p.amount)}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              {PAYMENT_METHODS.find(m => m.value === p.payment_method)?.label || p.payment_method}
              {p.order_number && <span style={{ marginLeft: 6, color: "var(--text-primary)" }}>· OC {p.order_number}</span>}
            </p>
            {p.reference_number && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Ref: {p.reference_number}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{fmtDate(p.created_at)}</p>
            {p.registered_by && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{p.registered_by}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── F-09: Modal de recepción parcial de OC ──────────────────────────────────
function ReceivePurchaseOrderModal({ order, onClose, onReceived }) {
  const { showNotice } = useNotice();
  const [items,     setItems]     = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingItems(true);
    // Intentar cargar items detallados de la OC
    api.get(`/inventory/purchase-orders/${order.id}`)
      .then(({ data }) => {
        if (cancelled) return;
        const orderItems = data?.data?.items ?? data?.items ?? [];
        setItems(orderItems);
        const defaults = {};
        orderItems.forEach(item => {
          defaults[item.id] = Math.max(0, item.quantity - (item.received_quantity ?? 0));
        });
        setQuantities(defaults);
      })
      .catch(() => {
        // Si el endpoint no existe aún, mostrar un aviso vacío
        if (!cancelled) setItems([]);
      })
      .finally(() => { if (!cancelled) setLoadingItems(false); });
    return () => { cancelled = true; };
  }, [order.id]);

  const setQty = (id, val) =>
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, Number(val)) }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = items.length
        ? { items: items.map(i => ({ item_id: i.id, received_quantity: quantities[i.id] ?? 0 })) }
        : {};
      await api.post(`/inventory/purchase-order/${order.id}/receive`, payload);
      showNotice(`Orden ${order.order_number} recibida. Stock actualizado.`, "success");
      onReceived?.();
      onClose();
    } catch (e) {
      showNotice(e.response?.data?.message ?? "Error al recibir la orden", "error");
    } finally {
      setSaving(false);
    }
  };

  const totalPending  = items.reduce((s, i) => s + Math.max(0, i.quantity - (i.received_quantity ?? 0)), 0);
  const totalReceiving = Object.values(quantities).reduce((s, v) => s + Number(v), 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#161b27] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between bg-gray-50 dark:bg-white/[0.03]">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
              <PackageCheck size={16} className="text-emerald-500" />
              Recibir orden
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-white/[0.08] rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {loadingItems ? (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                No se encontraron items detallados para esta orden.
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Se registrará recepción completa de todos los productos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Indica cuántas unidades recibes de cada producto
              </p>
              {items.map(item => {
                const pending = Math.max(0, item.quantity - (item.received_quantity ?? 0));
                const qty     = quantities[item.id] ?? 0;
                const over    = qty > pending;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.product_name ?? `Producto #${item.product_id}`}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">
                        Pedido: {item.quantity} · Ya recibido: {item.received_quantity ?? 0} · Pendiente: {pending}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={pending}
                        value={qty}
                        onChange={e => setQty(item.id, e.target.value)}
                        className={`w-20 text-center px-2 py-1.5 rounded-xl border text-sm font-bold outline-none transition-all ${
                          over
                            ? "border-red-400 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            : "border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-500"
                        }`}
                      />
                      <span className="text-[11px] text-gray-400 dark:text-slate-500">/ {pending}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] space-y-3">
          {items.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Unidades a recibir</span>
              <span className="font-black text-gray-900 dark:text-white">{totalReceiving} de {totalPending} pendientes</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/[0.1] text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || (items.length > 0 && totalReceiving === 0)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-white/10 text-white disabled:text-gray-400 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Procesando…</> : <><PackageCheck size={15} /> Confirmar recepción</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Compras ─────────────────────────────────────────────────────────────
export function TabPurchases({ data, providerId, onReceived }) {
  const { showNotice } = useNotice();
  const [receiving,     setReceiving]     = useState(null); // orderId en proceso (legacy, solo para estado disabled)
  const [receiveModal,  setReceiveModal]  = useState(null); // order en modal

  // mantenido para compatibilidad hacia atrás en caso de que canReceive sea false
  const handleReceive = (order) => {
    setReceiveModal(order);
  };

  if (!data) return <EmptyState icon={ShoppingCart} text="Cargando órdenes..." />;
  if (data.length === 0) return <EmptyState icon={ShoppingCart} text="Sin órdenes de compra" />;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map(o => {
          const st  = STATUS_CONFIG[o.status]  || STATUS_CONFIG.draft;
          const pst = PAYMENT_STATUS_CONFIG[o.payment_status] || PAYMENT_STATUS_CONFIG.pending;
          const canReceive = o.status === "pending" || o.status === "draft";

          return (
            <div key={o.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>{o.order_number}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{fmtDate(o.order_date)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <Badge label={st.label}  color={st.color}  bg={st.bg} />
                  <Badge label={pst.label} color={pst.color} bg={pst.bg} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>{o.items_count || 0} productos</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{fmtCOP(o.total_cost)}</span>
              </div>

              {/* F-09: abre ReceivePurchaseOrderModal para recepción parcial */}
              {canReceive && (
                <button
                  onClick={() => handleReceive(o)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 0",
                    background: "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <PackageCheck size={13} /> Recibir orden
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de recepción parcial */}
      {receiveModal && (
        <ReceivePurchaseOrderModal
          order={receiveModal}
          onClose={() => setReceiveModal(null)}
          onReceived={() => { setReceiveModal(null); onReceived?.(); }}
        />
      )}
    </>
  );
}

// ─── Tab: Estadísticas ────────────────────────────────────────────────────────
export function TabStats({ data }) {
  if (!data) return <EmptyState icon={BarChart2} text="Cargando estadísticas..." />;
  const { summary, top_products } = data;
  const s = summary || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatCard icon={ShoppingCart} label="Total órdenes"  value={s.total_orders    || 0} accent="#2563eb" />
        <StatCard icon={CheckCircle}  label="Completadas"    value={s.completed_orders || 0} accent="#059669" />
        <StatCard icon={DollarSign}   label="Total comprado" value={fmtCOP(s.total_spent)}   accent="#7c3aed" />
        <StatCard icon={Wallet}       label="Total pagado"   value={fmtCOP(s.total_paid)}    accent="#0891b2" />
      </div>
      {top_products?.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
            Top productos comprados
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {top_products.slice(0, 5).map((prod, i) => (
              <div key={prod.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-page)", borderRadius: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 14 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{prod.sku}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{prod.total_quantity} u.</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{fmtCOP(prod.avg_cost)}/u</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Ledger (movimientos de stock) ───────────────────────────────────────
const MOVEMENT_CONFIG = {
  purchase_received:      { label: "Compra recibida",      color: "#059669", bg: "#d1fae5", delta: "+" },
  return:                 { label: "Devolución",            color: "#2563eb", bg: "#dbeafe", delta: "+" },
  manual_adjustment:      { label: "Ajuste manual",         color: "#7c3aed", bg: "#ede9fe", delta: "±" },
  reservation_created:    { label: "Reserva creada",        color: "#d97706", bg: "#fef3c7", delta: "-" },
  reservation_released:   { label: "Reserva liberada",      color: "#0891b2", bg: "#e0f2fe", delta: "+" },
  reservation_confirmed:  { label: "Reserva confirmada",    color: "#64748b", bg: "#f1f5f9", delta: "-" },
  sale_confirmed:         { label: "Venta confirmada",       color: "#dc2626", bg: "#fee2e2", delta: "-" },
  sale_cancelled:         { label: "Venta cancelada",        color: "#059669", bg: "#d1fae5", delta: "+" },
  damage_loss:            { label: "Pérdida / daño",         color: "#dc2626", bg: "#fee2e2", delta: "-" },
  transfer_in:            { label: "Traslado entrada",       color: "#059669", bg: "#d1fae5", delta: "+" },
  transfer_out:           { label: "Traslado salida",        color: "#d97706", bg: "#fef3c7", delta: "-" },
};

export function TabLedger({ data, loading, onLoadMore, hasMore }) {
  if (loading && !data?.length) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Loader2 size={22} color="#2563eb" style={{ animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!data?.length) return <EmptyState icon={ArrowUpDown} text="Sin movimientos de stock" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map(mv => {
        const cfg   = MOVEMENT_CONFIG[mv.movement_type] || { label: mv.movement_type, color: "#64748b", bg: "#f1f5f9", delta: "±" };
        const isPos = mv.qty_delta > 0;

        return (
          <div key={mv.id} style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 12px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}>
            {/* Delta badge */}
            <div style={{
              minWidth: 42,
              height: 42,
              borderRadius: 10,
              background: cfg.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {isPos
                ? <TrendingUp  size={14} color={cfg.color} />
                : <TrendingDown size={14} color={cfg.color} />
              }
              <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
                {mv.qty_delta > 0 ? `+${mv.qty_delta}` : mv.qty_delta}
              </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
                  background: cfg.bg, color: cfg.color,
                }}>
                  {cfg.label}
                </span>
                {mv.variant_attrs?.length > 0 && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {mv.variant_attrs.map(a => a.display_value).join(" / ")}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {mv.qty_before} → <strong style={{ color: "var(--text-primary)" }}>{mv.qty_after}</strong>
                </span>
                {mv.reference_type && (
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>
                    {mv.reference_type} #{mv.reference_id}
                  </span>
                )}
              </div>

              {mv.notes && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {mv.notes}
                </p>
              )}
            </div>

            {/* Fecha + usuario */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{fmtDate(mv.created_at)}</p>
              {mv.created_by_name && (
                <p style={{ fontSize: 10, color: "#94a3b8", margin: "2px 0 0" }}>{mv.created_by_name}</p>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          style={{
            marginTop: 4,
            width: "100%",
            padding: "9px 0",
            background: "var(--bg-page)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {loading
            ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Cargando...</>
            : "Cargar más"
          }
        </button>
      )}
    </div>
  );
}