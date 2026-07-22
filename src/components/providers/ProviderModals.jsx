import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import api from "../../services/api";
import { ModalWrapper } from "./ui";
import { ProviderFormBody } from "./ProviderFormBody";

// ─── Modal: Nuevo Proveedor ───────────────────────────────────────────────────
export function CreateProviderModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "", category: "Productos Terminados", phone: "", email: "",
    address: "", contact_person: "", tax_id: "", credit_limit: "",
    payment_terms_days: 30, lead_time_days: 7, notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError("");
    try {
      await api.post("/providers", {
        ...form,
        credit_limit:       parseFloat(form.credit_limit) || 0,
        payment_terms_days: parseInt(form.payment_terms_days) || 30,
        lead_time_days:     parseInt(form.lead_time_days) || 7,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Error al crear el proveedor.");
    } finally { setSaving(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Nuevo Proveedor" subtitle="Registro de aliado comercial">
      <ProviderFormBody
        form={form} setForm={setForm}
        saving={saving} error={error}
        onSubmit={handleSubmit} submitLabel="Registrar Proveedor"
      />
    </ModalWrapper>
  );
}

// ─── Modal: Editar Proveedor ──────────────────────────────────────────────────
export function EditProviderModal({ provider, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name:               provider.name            || "",
    category:           provider.category        || "Productos Terminados",
    phone:              provider.phone            || "",
    email:              provider.email            || "",
    address:            provider.address          || "",
    contact_person:     provider.contact_person   || "",
    tax_id:             provider.tax_id           || "",
    credit_limit:       provider.credit_limit     || "",
    payment_terms_days: provider.payment_terms_days ?? 30,
    lead_time_days:     provider.lead_time_days   ?? 7,
    reliability_score:  provider.reliability_score ?? 5,
    is_active:          provider.is_active !== false,
    notes:              provider.notes            || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError("");
    try {
      await api.put(`/providers/${provider.id}`, {
        ...form,
        credit_limit:       parseFloat(form.credit_limit)      || 0,
        payment_terms_days: parseInt(form.payment_terms_days)  || 30,
        lead_time_days:     parseInt(form.lead_time_days)      || 7,
        reliability_score:  parseFloat(form.reliability_score) || 5,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Error al actualizar el proveedor.");
    } finally { setSaving(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Editar Proveedor" subtitle={provider.name}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Toggle activo / inactivo */}
        <button
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: form.is_active ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${form.is_active ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 10, padding: "10px 14px", cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: form.is_active ? "#15803d" : "#dc2626" }}>
            {form.is_active ? "✓ Proveedor activo" : "✗ Proveedor inactivo"}
          </span>
          {form.is_active
            ? <ToggleRight size={26} color="#15803d" />
            : <ToggleLeft  size={26} color="#dc2626" />}
        </button>

        <ProviderFormBody
          form={form} setForm={setForm}
          saving={saving} error={error}
          onSubmit={handleSubmit} submitLabel="Guardar Cambios"
          showReliability
        />
      </div>
    </ModalWrapper>
  );
}