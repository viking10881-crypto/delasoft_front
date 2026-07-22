import { useEffect, useState, useRef } from "react";
import {
  X, Globe, Store, CreditCard, Printer, Package,
  Hourglass, XCircle, CheckCircle2, Banknote,
  ArrowRightLeft, Handshake, Calendar, AlertCircle,
  Clock, Plus, Loader2, Receipt, Upload, Trash2, Eye, FileText,
  Truck, ShoppingCart, Star,
} from "lucide-react";
import api          from "../../services/api";
import { useAuth }  from "../../context/AuthContext";
import { useNotice } from "../../context/NoticeContext";
import StatusBadge  from "./StatusBadge";
import { fullDate, shortDate, daysUntil, fmtCOP } from "./helpers";
import { useMarkSaleDelivered } from "../../hooks/useProcurement";

/* ─── Mapa de métodos de pago (color discreto, solo icono) ───────── */
const PM = {
  cash:     { label: "Efectivo",        Icon: Banknote,       cls: "text-emerald-600 dark:text-emerald-400" },
  transfer: { label: "Transferencia",   Icon: ArrowRightLeft, cls: "text-blue-600 dark:text-blue-400"    },
  credit:   { label: "Tarjeta / Wompi", Icon: CreditCard,     cls: "text-violet-600 dark:text-violet-400"},
  check:    { label: "Cheque",          Icon: CreditCard,     cls: "text-[var(--text-muted)]"   },
  fiado:    { label: "Crédito (Fiado)", Icon: Handshake,      cls: "text-amber-600 dark:text-amber-400"  },
};

/* ─── Alert plano: punto + texto, sin fondo saturado ──────────────── */
function InlineAlert({ tone = "neutral", Icon, title, description }) {
  const toneText = {
    neutral: "text-[var(--text-secondary)]",
    amber:   "text-amber-700 dark:text-amber-400",
    red:     "text-red-600 dark:text-red-400",
  }[tone];
  const dot = {
    neutral: "bg-gray-300",
    amber:   "bg-amber-500",
    red:     "bg-red-400",
  }[tone];
  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <Icon size={14} className={`${toneText} flex-shrink-0 mt-0.5`} />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0 mt-1.5`} />
        )}
        <div>
          {title && <p className={`text-xs font-bold mb-0.5 ${toneText}`}>{title}</p>}
          {description && (
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: productos ──────────────────────────────────────── */
function fulfillmentSnapshotBadge(item) {
  const mode = item.fulfillment_mode_snapshot;
  if (!mode) return null;

  const isOnDemand = mode === "on_demand";
  return {
    label: isOnDemand ? "Bajo pedido" : "Con stock",
    cls: isOnDemand
      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  };
}

function ItemsTab({ items }) {
  if (!items.length) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Package size={28} className="text-[var(--text-muted)] opacity-40 mb-2" />
      <p className="text-sm text-[var(--text-muted)]">Sin productos registrados</p>
    </div>
  );
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i}
          className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
          <div className="w-8 h-8 bg-[var(--bg-subtle)] rounded-lg flex items-center justify-center text-xs font-black text-[var(--text-muted)] flex-shrink-0">
            {item.quantity}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
            {item.variant_attributes?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {item.variant_attributes.map((a, j) => (
                  <span key={j}
                    className="text-[9px] font-bold text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                    {a.display_value ?? a.value}
                  </span>
                ))}
              </div>
            )}
            {(() => {
              const badge = fulfillmentSnapshotBadge(item);
              if (!badge) return null;
              return (
                <span className={`inline-flex mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                  {badge.label}
                </span>
              );
            })()}
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              ${fmtCOP(item.unit_price)} c/u
            </p>
          </div>
          <p className="text-sm font-black text-[var(--text-primary)] flex-shrink-0">
            ${fmtCOP(item.unit_price * item.quantity)}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Modal de comprobante ────────────────────────────────── */
function ProofModal({ url, onClose }) {
  const isPdf = /\.pdf($|\?)/i.test(url) || url.includes("pdf");
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-w-2xl w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Comprobante de pago</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <X size={14} />
          </button>
        </div>

        {isPdf ? (
          <div className="bg-[var(--bg-card)] rounded-2xl p-8 text-center">
            <FileText size={44} className="mx-auto text-red-500 mb-3" />
            <p className="font-bold text-[var(--text-primary)] mb-1">Comprobante PDF</p>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Ábrelo en una pestaña nueva para visualizarlo completo.
            </p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
              <FileText size={14} /> Abrir PDF
            </a>
          </div>
        ) : (
          <img src={url} alt="Comprobante de pago"
            className="w-full max-h-[80vh] object-contain rounded-2xl shadow-lg" />
        )}
      </div>
    </div>
  );
}

/* ─── Tab: historial de pagos ─────────────────────────────── */
function PaymentsTab({ payments, total, saleId, onRefresh, canManage }) {
  const { showNotice } = useNotice();
  const [proofUrl,  setProofUrl]  = useState(null);
  const [uploading, setUploading] = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const fileRef    = useRef(null);
  const activePayId = useRef(null);

  const openPicker = (paymentId) => {
    activePayId.current = paymentId;
    fileRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return showNotice("El archivo supera 8 MB", "warning");
    const payId = activePayId.current;
    setUploading(payId);
    try {
      const form = new FormData();
      form.append("proof", file);
      await api.post(`/sales/${saleId}/payments/${payId}/proof`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotice("Comprobante subido ✓", "success");
      onRefresh();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al subir", "error");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (paymentId) => {
    setDeleting(paymentId);
    try {
      await api.delete(`/sales/${saleId}/payments/${paymentId}/proof`);
      showNotice("Comprobante eliminado", "success");
      onRefresh();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al eliminar", "error");
    } finally {
      setDeleting(null);
    }
  };

  if (!payments.length) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Receipt size={28} className="text-[var(--text-muted)] opacity-40 mb-2" />
      <p className="text-sm text-[var(--text-muted)]">Sin abonos registrados aún</p>
    </div>
  );

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const isPdf = (url) => /\.pdf($|\?)/i.test(url) || url.includes("pdf");

  return (
    <>
      {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="space-y-2">
        {payments.map((p, i) => {
          const pm       = PM[p.payment_method] ?? { label: p.payment_method, Icon: CreditCard, cls: "text-[var(--text-muted)]" };
          const hasProof = !!p.proof_url;
          const isImg    = hasProof && !isPdf(p.proof_url);
          const isUp     = uploading === p.id;
          const isDel    = deleting  === p.id;

          return (
            <div key={p.id}
              className="bg-[var(--bg-subtle)] rounded-xl border border-[var(--border)] overflow-hidden">

              {/* Fila principal del abono */}
              <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                <div className="w-8 h-8 bg-[var(--bg-card)] rounded-lg flex items-center justify-center text-xs font-black text-[var(--text-muted)] flex-shrink-0 border border-[var(--border)]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <pm.Icon size={11} className={pm.cls} />
                    {pm.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {shortDate(p.payment_date)}
                    {p.recorded_by ? ` · por ${p.recorded_by}` : ""}
                  </p>
                  {p.notes && (
                    <p className="text-[10px] text-[var(--text-muted)] italic mt-0.5 truncate">"{p.notes}"</p>
                  )}
                </div>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  +${fmtCOP(p.amount)}
                </p>
              </div>

              {/* Fila del comprobante */}
              <div className="px-3 pb-3 flex items-center gap-2">
                {hasProof ? (
                  <>
                    <button
                      onClick={() => setProofUrl(p.proof_url)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 hover:border-[var(--text-muted)] transition-colors group"
                    >
                      {isImg ? (
                        <img src={p.proof_url} alt="comprobante"
                          className="w-6 h-6 rounded object-cover flex-shrink-0 border border-[var(--border)]" />
                      ) : (
                        <FileText size={14} className="text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate flex-1">
                        Ver comprobante
                      </span>
                      <Eye size={10} className="text-[var(--text-muted)] flex-shrink-0" />
                    </button>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={isDel}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-red-500 hover:border-red-300 transition-colors disabled:opacity-40 flex-shrink-0"
                        title="Eliminar comprobante"
                      >
                        {isDel ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    )}

                    {p.proof_uploaded_at && (
                      <span className="text-[9px] text-[var(--text-muted)] opacity-70 flex-shrink-0 whitespace-nowrap">
                        {shortDate(p.proof_uploaded_at)}
                      </span>
                    )}
                  </>
                ) : canManage ? (
                  <button
                    onClick={() => openPicker(p.id)}
                    disabled={isUp}
                    className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg px-2.5 py-1.5 text-[10px] font-bold hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                  >
                    {isUp ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                    {isUp ? "Subiendo…" : "Subir comprobante"}
                  </button>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] italic px-1">Sin comprobante</span>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex justify-between items-center px-1 pt-1 border-t border-[var(--border)]">
          <span className="text-xs font-bold text-[var(--text-muted)]">Total abonado</span>
          <span className="text-sm font-black text-[var(--text-primary)]">${fmtCOP(totalPaid)}</span>
        </div>
      </div>
    </>
  );
}

/* ─── Formulario de abono inline ──────────────────────────── */
function PaymentForm({ pendingAmount, saleId, onSuccess, onCancel }) {
  const { showNotice } = useNotice();
  const [amount, setAmount]   = useState("");
  const [method, setMethod]   = useState("cash");
  const [notes,  setNotes]    = useState("");
  const [date,   setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return showNotice("Ingresa un monto válido", "warning");
    if (amt > pendingAmount)
      return showNotice(`El máximo es $${fmtCOP(pendingAmount)}`, "warning");
    setSaving(true);
    try {
      await api.post(`/sales/${saleId}/payments`, {
        amount: amt, payment_method: method,
        notes: notes || undefined, payment_date: date,
      });
      showNotice(amt >= pendingAmount ? "¡Venta saldada! ✓" : "Abono registrado ✓", "success");
      onSuccess();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al registrar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <p className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
        <Plus size={12}/> Registrar abono
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* Monto */}
        <div>
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 block">
            Monto *
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm font-bold">$</span>
            <input
              type="number" min="1" max={pendingAmount}
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={fmtCOP(pendingAmount)}
              className="w-full pl-6 pr-2 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-emerald-500 text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>
          {/* Atajos rápidos */}
          <div className="flex gap-1 mt-1.5">
            {[0.25, 0.5, 1].map(f => (
              <button key={f} onClick={() => setAmount(Math.round(pendingAmount * f))}
                className="flex-1 text-[9px] font-bold py-1 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                {f === 1 ? "Total" : `${f * 100}%`}
              </button>
            ))}
          </div>
        </div>
        {/* Fecha */}
        <div>
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 block">
            Fecha
          </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-2 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-emerald-500 text-[var(--text-primary)]"
          />
        </div>
      </div>

      {/* Método */}
      <div>
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block">
          Método
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { v: "cash",     l: "Efectivo"    },
            { v: "transfer", l: "Transf."     },
            { v: "credit",   l: "Tarjeta"     },
          ].map(m => (
            <button key={m.v} onClick={() => setMethod(m.v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                method === m.v
                  ? "border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-card)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* Notas */}
      <input type="text" placeholder="Notas (opcional)"
        value={notes} onChange={e => setNotes(e.target.value)}
        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-emerald-500 text-[var(--text-primary)] placeholder-[var(--text-muted)]"
      />

      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-muted)]">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={saving || !amount}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-[var(--bg-subtle)] disabled:border disabled:border-[var(--border)] text-white disabled:text-[var(--text-muted)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95">
          {saving ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>}
          {saving ? "Guardando…" : "Confirmar abono"}
        </button>
      </div>
    </div>
  );
}

/* ─── Tab: cronograma de cuotas ───────────────────────────── */
function ScheduleTab({ schedule, saleId, onRefresh, canManage }) {
  const { showNotice } = useNotice();
  const [paying,      setPaying]      = useState(null);
  const [rescheduling,setRescheduling]= useState(null);
  const [payMethod,   setPayMethod]   = useState("cash");
  const [newDate,     setNewDate]     = useState("");
  const [saving,      setSaving]      = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const getStatus = (inst) => {
    if (inst.status === "paid") return "paid";
    if (String(inst.due_date).slice(0, 10) < today)  return "overdue";
    return "pending";
  };

  const handlePay = async (inst) => {
    setSaving(true);
    try {
      await api.patch(`/sales/${saleId}/payment-schedule/${inst.id}/pay`, { payment_method: payMethod });
      showNotice("Cuota pagada ✓", "success");
      setPaying(null);
      onRefresh();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al pagar cuota", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async (instId) => {
    if (!newDate) return showNotice("Selecciona una nueva fecha", "warning");
    setSaving(true);
    try {
      await api.patch(`/sales/${saleId}/payment-schedule/${instId}/reschedule`, { new_due_date: newDate });
      showNotice("Cuota reagendada ✓", "success");
      setRescheduling(null);
      setNewDate("");
      onRefresh();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al reagendar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!schedule.length) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Calendar size={28} className="text-[var(--text-muted)] opacity-40 mb-2" />
      <p className="text-sm text-[var(--text-muted)]">Sin cronograma registrado</p>
    </div>
  );

  const totalExpected = schedule.reduce((s, i) => s + Number(i.expected_amount), 0);

  return (
    <div className="space-y-2">
      {schedule.map(inst => {
        const computed   = getStatus(inst);
        const isPaid     = computed === "paid";
        const isOverdue  = computed === "overdue";
        const isPending  = computed === "pending";

        const statusCfg = {
          paid:    { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "Pagada"    },
          pending: { dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400",     label: "Pendiente" },
          overdue: { dot: "bg-red-400",     text: "text-red-600 dark:text-red-400",         label: "Vencida"   },
        }[computed];

        return (
          <div key={inst.id}
            className="bg-[var(--bg-subtle)] rounded-xl border border-[var(--border)] overflow-hidden">

            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-7 h-7 bg-[var(--bg-card)] rounded-lg flex items-center justify-center text-xs font-black text-[var(--text-muted)] flex-shrink-0 border border-[var(--border)]">
                {inst.installment_num}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {shortDate(inst.due_date)}
                </p>
                {isPaid && inst.paid_at && (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Pagada {shortDate(inst.paid_at)}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <p className="text-sm font-black text-[var(--text-primary)] flex-shrink-0">
                ${fmtCOP(inst.expected_amount)}
              </p>
            </div>

            {canManage && (isPending || isOverdue) && (
              <div className="px-3 pb-2.5 flex items-center gap-2">
                {paying === inst.id ? (
                  <>
                    {["cash", "transfer", "credit"].map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          payMethod === m
                            ? "border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-card)]"
                            : "border-[var(--border)] text-[var(--text-muted)]"
                        }`}>
                        {m === "cash" ? "Efectivo" : m === "transfer" ? "Transf." : "Tarjeta"}
                      </button>
                    ))}
                    <button onClick={() => handlePay(inst)} disabled={saving}
                      className="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors">
                      {saving ? <Loader2 size={10} className="animate-spin"/> : <CheckCircle2 size={10}/>}
                      Confirmar
                    </button>
                    <button onClick={() => setPaying(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                      <X size={13}/>
                    </button>
                  </>
                ) : rescheduling === inst.id ? (
                  <>
                    <input type="date" value={newDate} min={today}
                      onChange={e => setNewDate(e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs outline-none focus:border-amber-500 text-[var(--text-primary)]" />
                    <button onClick={() => handleReschedule(inst.id)} disabled={saving}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors">
                      {saving ? <Loader2 size={10} className="animate-spin"/> : <Calendar size={10}/>}
                      Guardar
                    </button>
                    <button onClick={() => { setRescheduling(null); setNewDate(""); }}
                      className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                      <X size={13}/>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setPaying(inst.id); setPayMethod("cash"); }}
                      className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg px-2.5 py-1.5 text-[10px] font-bold hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                      <CheckCircle2 size={11}/> Pagar
                    </button>
                    <button
                      onClick={() => { setRescheduling(inst.id); setNewDate(inst.due_date); }}
                      className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg px-2.5 py-1.5 text-[10px] font-bold hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                      <Calendar size={11}/> Reagendar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-between items-center px-1 pt-1 border-t border-[var(--border)]">
        <span className="text-xs font-bold text-[var(--text-muted)]">Total esperado</span>
        <span className="text-sm font-black text-[var(--text-primary)]">${fmtCOP(totalExpected)}</span>
      </div>
    </div>
  );
}

/* ─── Modal principal ─────────────────────────────────────── */
export default function SaleDetailModal({ sale: initialSale, onClose }) {
  const { can }        = useAuth();
  const { showNotice } = useNotice();

  const [items,          setItems]          = useState([]);
  const [saleData,       setSaleData]       = useState(null);
  const [payments,       setPayments]       = useState([]);
  const [schedule,       setSchedule]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState("items");
  const [showPayForm,    setShowPayForm]    = useState(false);

  const { mutate: deliverMutate, loading: delivering } = useMarkSaleDelivered(() => {
    loadData(true);
    showNotice("Venta marcada como entregada ✓", "success");
  });

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [itemsRes, paymentsRes, scheduleRes] = await Promise.allSettled([
        api.get(`/sales/${initialSale.id}`),
        api.get(`/sales/${initialSale.id}/payments`),
        api.get(`/sales/${initialSale.id}/payment-schedule`),
      ]);
      if (itemsRes.status === "fulfilled") {
        const d = itemsRes.value.data;
        setItems(Array.isArray(d) ? d : d?.data ?? d?.items ?? []);
      }
      if (paymentsRes.status === "fulfilled") {
        const d = paymentsRes.value.data;
        setSaleData(d?.data?.sale ?? null);
        setPayments(d?.data?.payments ?? []);
      }
      if (scheduleRes.status === "fulfilled") {
        setSchedule(scheduleRes.value.data?.data ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [initialSale.id]);

  /* ── Datos derivados ── */
  const sale          = saleData ?? initialSale;
  const isFiado       = !!sale.credit_due_date || sale.is_fiado;
  const isOnline      = sale.sale_type === "web" || sale.sale_type === "online";
  const isPaid        = sale.payment_status === "paid";
  const isPending     = sale.payment_status === "pending";
  const isPartial     = sale.payment_status === "partial";
  const isCancelled   = sale.payment_status === "cancelled";
  const total         = Number(sale.total ?? 0);
  const amountPaid    = Number(sale.amount_paid ?? 0);
  const pendingAmount = Math.max(0, Number(sale.pending_amount ?? (total - amountPaid)));
  const progress      = total > 0 ? Math.min((amountPaid / total) * 100, 100) : 0;
  const daysLeft      = daysUntil(sale.credit_due_date);
  const isOverdue     = daysLeft !== null && daysLeft < 0;
  const dueSoon       = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  const canAddPayment = can("sale.create") && (isPending || isPartial) && !isOnline;

  /* ── Ícono principal (discreto, sin fondo saturado) ── */
  const headerIcon = isFiado
    ? { Icon: Handshake, cls: "text-amber-600 dark:text-amber-400" }
    : isOnline
    ? { Icon: Globe,     cls: "text-violet-600 dark:text-violet-400" }
    : { Icon: Store,     cls: "text-emerald-600 dark:text-emerald-400" };

  /* ── Método de pago ── */
  const pmInfo = PM[sale.payment_method] ?? { label: sale.payment_method ?? "—", Icon: CreditCard, cls: "text-[var(--text-muted)]" };

  return (
    <>
      {/* F-15: ocultar backdrop y simplificar el modal al imprimir */}
      <style>{`
        @media print {
          .sale-detail-backdrop { background: transparent !important; backdrop-filter: none !important; position: relative !important; inset: auto !important; }
          .sale-detail-card { box-shadow: none !important; border: none !important; max-height: none !important; overflow: visible !important; border-radius: 0 !important; }
          .sale-detail-no-print { display: none !important; }
        }
      `}</style>
    <div
      className="sale-detail-backdrop fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="sale-detail-card bg-[var(--bg-card)] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl border border-[var(--border)] flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden transition-colors duration-300">

        {/* drag handle (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* ── Header (Fijo) ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center flex-shrink-0">
              <headerIcon.Icon size={16} className={headerIcon.cls} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-[var(--text-primary)]">
                  {sale.sale_number || `Venta #${sale.id}`}
                </h2>
                <StatusBadge status={sale.payment_status} dot />
              </div>
              <p className="text-xs text-[var(--text-muted)]">{sale.customer_name}</p>
              <p className="text-[10px] text-[var(--text-muted)] opacity-70">{fullDate(sale.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0 ml-2">
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Barra de progreso fiado (Fija) ─────────────────────────── */}
        {isFiado && !isPaid && (
          <div className="flex-shrink-0 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {isOverdue
                  ? <AlertCircle size={13} className="text-red-500" />
                  : <Clock size={13} className="text-amber-600 dark:text-amber-400" />}
                <span className={`text-xs font-bold ${
                  isOverdue ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                }`}>
                  {isOverdue
                    ? `Vencido hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? "s" : ""}`
                    : daysLeft === 0
                    ? "Vence hoy"
                    : `Vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""} · ${shortDate(sale.credit_due_date)}`
                  }
                </span>
              </div>
              <span className="text-xs font-black text-[var(--text-secondary)]">
                ${fmtCOP(amountPaid)} / ${fmtCOP(total)}
              </span>
            </div>

            {/* barra */}
            <div className="w-full bg-[var(--border)] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isOverdue ? "bg-red-500" : progress >= 100 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[var(--text-muted)]">
                Pendiente: <strong className="text-[var(--text-secondary)]">${fmtCOP(pendingAmount)}</strong>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {Math.round(progress)}% pagado
              </span>
            </div>

            {sale.credit_notes && (
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5 italic truncate">
                📝 {sale.credit_notes}
              </p>
            )}
          </div>
        )}

        {/* ── Tabs (Fijos) ───────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex px-5 border-b border-[var(--border)]">
          {[
            { id: "items",    label: `Productos (${items.length})`   },
            { id: "payments", label: `Abonos (${payments.length})`   },
            ...(isFiado ? [{ id: "schedule", label: `Cronograma (${schedule.length})` }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 mr-4 text-xs font-bold border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 🟢 AJUSTE: Contenedor global de Scroll para el Cuerpo + el Footer. 
             Esto evita que al abrir el formulario de pago el modal colapse o se desborde */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          
          {/* ── Cuerpo principal ───────────────────────────────── */}
          <div className="flex-1 px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-[var(--bg-subtle)] rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-3/4" />
                      <div className="h-3 bg-[var(--bg-subtle)] rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === "items" ? (
              <ItemsTab items={items} />
            ) : activeTab === "schedule" ? (
              <ScheduleTab
                schedule={schedule}
                saleId={sale.id}
                onRefresh={() => loadData(true)}
                canManage={canAddPayment}
              />
            ) : (
              <PaymentsTab
                payments={payments}
                total={total}
                saleId={sale.id}
                onRefresh={() => loadData(true)}
                canManage={canAddPayment}
              />
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-[var(--border)] px-5 py-4 space-y-3">

            {/* Resumen de totales */}
            {!loading && (
              <div className="bg-[var(--bg-subtle)] rounded-xl p-3.5 space-y-1.5">
                {Number(sale.subtotal) > 0 && (
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>Subtotal</span>
                    <span>${fmtCOP(sale.subtotal)}</span>
                  </div>
                )}
                {Number(sale.discount_amount) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Descuento</span>
                    <span>-${fmtCOP(sale.discount_amount)}</span>
                  </div>
                )}
                {isFiado && amountPaid > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Total abonado</span>
                    <span>+${fmtCOP(amountPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[var(--text-primary)] pt-1.5 border-t border-[var(--border)]">
                  <span>
                    {isFiado && pendingAmount > 0 && !isPaid ? "Saldo pendiente" : "Total"}
                  </span>
                  <span className="text-lg">
                    ${fmtCOP(isFiado && pendingAmount > 0 && !isPaid ? pendingAmount : total)}
                  </span>
                </div>
              </div>
            )}

            {/* Timeline de entrega (solo on_demand / hybrid) */}
            {!loading && (sale.has_on_demand_items || sale.delivery_status) && (() => {
              const ds = sale.delivery_status ?? "pending";
              const steps = [
                { key: "created",     Icon: CheckCircle2,  label: "Venta creada",         date: sale.created_at },
                { key: "procurement", Icon: ShoppingCart,  label: "Compra al proveedor",  date: sale.procurement_ordered_at },
                { key: "ready",       Icon: Package,        label: "Lista para entrega",   date: sale.ready_at },
                { key: "delivered",   Icon: Truck,          label: "Entregada",            date: sale.delivered_at },
              ];
              const currentIdx = ds === "delivered" ? 3 : ds === "ready_to_deliver" ? 2 : ds === "ordered" ? 1 : 0;

              return (
                <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1">
                      <Truck size={9} /> Estado de entrega
                    </p>
                    {sale.revenue_recognized_at && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Star size={9} /> Ingreso reconocido
                      </span>
                    )}
                  </div>

                  {sale.estimated_delivery_date && ds !== "delivered" && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Calendar size={10} />
                      Entrega estimada: <span className="font-bold ml-0.5">{shortDate(sale.estimated_delivery_date)}</span>
                    </p>
                  )}

                  <div className="flex items-start gap-0">
                    {steps.map((step, idx) => {
                      const done   = idx <= currentIdx;
                      const active = idx === currentIdx;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center">
                          <div className="flex items-center w-full">
                            <div className={`w-full h-0.5 ${idx === 0 ? "invisible" : done ? "bg-blue-500" : "bg-[var(--border)]"}`} />
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              done
                                ? active
                                  ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-500/20"
                                  : "bg-blue-500 text-white"
                                : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
                            }`}>
                              <step.Icon size={11} />
                            </div>
                            <div className={`w-full h-0.5 ${idx === steps.length - 1 ? "invisible" : done && idx < currentIdx ? "bg-blue-500" : "bg-[var(--border)]"}`} />
                          </div>
                          <p className={`text-center mt-1.5 text-[9px] font-bold leading-tight ${
                            done ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-muted)]"
                          }`}>
                            {step.label}
                          </p>
                          {step.date && done && (
                            <p className="text-[8px] text-[var(--text-muted)] mt-0.5 text-center">
                              {shortDate(step.date)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Botón Marcar como entregada */}
            {!loading && sale.delivery_status === "ready_to_deliver" && can("sale.create") && (
              <button
                onClick={() => deliverMutate(sale.id)}
                disabled={delivering}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95"
              >
                {delivering ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
                Marcar como entregada
              </button>
            )}

            {/* Método de pago */}
            {!loading && (
              <div className="flex items-center gap-2.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl px-3.5 py-2.5">
                <pmInfo.Icon size={14} className={`${pmInfo.cls} flex-shrink-0`} />
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Método de pago
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">{pmInfo.label}</p>
                </div>
              </div>
            )}

            {/* Botón / formulario de abono */}
            {canAddPayment && (
              showPayForm ? (
                <PaymentForm
                  saleId={sale.id}
                  pendingAmount={pendingAmount}
                  onSuccess={() => { setShowPayForm(false); loadData(true); setActiveTab("payments"); }}
                  onCancel={() => setShowPayForm(false)}
                />
              ) : (
                <button onClick={() => setShowPayForm(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95">
                  <Plus size={15} />
                  Registrar abono · ${fmtCOP(pendingAmount)} pendiente
                </button>
              )
            )}

            {/* Aviso online pendiente */}
            {isPending && isOnline && (
              <InlineAlert
                tone="amber"
                Icon={Hourglass}
                title="Verificando con Wompi"
                description="El pago se confirmará automáticamente cuando Wompi procese la transacción."
              />
            )}

            {/* Aviso vencido fiado */}
            {isFiado && isOverdue && !isPaid && (
              <InlineAlert
                tone="red"
                Icon={AlertCircle}
                title={`Crédito vencido hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? "s" : ""}`}
                description="Este crédito supera su fecha límite. Registra un abono o contacta al cliente."
              />
            )}

            {/* Aviso cancelado (F-14) */}
            {isCancelled && (
              <InlineAlert
                tone={sale.stock_restored === false ? "amber" : "red"}
                Icon={XCircle}
                description={
                  sale.stock_restored === false
                    ? "Este pedido fue cancelado, pero el stock no pudo restaurarse automáticamente. Revisa manualmente el inventario."
                    : "Este pedido fue cancelado y no generó cobro. El stock fue restaurado."
                }
              />
              /* TODO: pedir al backend que incluya stock_restored: boolean en GET /sales/:id cuando payment_status='cancelled' */
            )}

            {/* Imprimir */}
            <button onClick={() => window.print()}
              className="sale-detail-no-print w-full py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors">
              <Printer size={15} />
              Imprimir recibo
            </button>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
