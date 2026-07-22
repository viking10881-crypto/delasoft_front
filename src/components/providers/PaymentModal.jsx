import { useState } from "react";
import { DollarSign, Hash, CheckCircle, Loader2 } from "lucide-react";
import api from "../../services/api";
import { PAYMENT_METHODS, fmtCOP, inputStyle, primaryBtn } from "./constants";
import { ModalWrapper, Field } from "./ui";

export function PaymentModal({ provider, onClose, onSuccess }) {
  const [form, setForm] = useState({
    provider_id: provider.id,
    amount: "",
    payment_method: "transfer",
    reference_number: "",
    notes: "",
    purchase_order_id: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      setError("Ingresa un monto válido mayor a 0."); return;
    }
    if (Number(form.amount) > Number(provider.balance)) {
      setError("El monto excede el saldo pendiente del proveedor."); return;
    }
    setSaving(true); setError("");
    try {
      await api.post("/providers/payments", { ...form, amount: parseFloat(form.amount) });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Error al registrar el pago.");
    } finally { setSaving(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Registrar Abono" subtitle={provider.name}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}
        <div style={{ background: "#fef3c7", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>SALDO PENDIENTE</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#b45309" }}>{fmtCOP(provider.balance)}</span>
        </div>

        <Field label="Monto a abonar">
          <div style={{ position: "relative" }}>
            <DollarSign size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="number" min="1" step="1000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              style={inputStyle({ paddingLeft: 36 })}
            />
          </div>
        </Field>

        <Field label="Método de pago">
          <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} style={inputStyle()}>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>

        <Field label="Referencia (opcional)">
          <div style={{ position: "relative" }}>
            <Hash size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              value={form.reference_number}
              onChange={e => setForm({ ...form, reference_number: e.target.value })}
              placeholder="Nro. de referencia"
              style={inputStyle({ paddingLeft: 36 })}
            />
          </div>
        </Field>

        <Field label="Notas (opcional)">
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Observaciones..."
            rows={2}
            style={{ ...inputStyle(), resize: "none", paddingTop: 10 }}
          />
        </Field>

        <button onClick={handleSubmit} disabled={saving} style={primaryBtn}>
          {saving
            ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
            : <CheckCircle size={16} />}
          Confirmar Pago
        </button>
      </div>
    </ModalWrapper>
  );
}