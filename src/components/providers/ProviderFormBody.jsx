import { Phone, Building2, MapPin, Mail, Save, Loader2 } from "lucide-react";
import { CATEGORIES, inputStyle, primaryBtn } from "./constants";
import { Field } from "./ui";

export function ProviderFormBody({ form, setForm, saving, error, onSubmit, submitLabel, showReliability }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      <Field label="Nombre *">
        <div style={{ position: "relative" }}>
          <Building2 size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Empresa / Proveedor"
            style={inputStyle({ paddingLeft: 36 })}
          />
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Categoría">
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle()}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
        </Field>
        <Field label="Teléfono">
          <div style={{ position: "relative" }}>
            <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+57 300..."
              style={inputStyle({ paddingLeft: 36 })}
            />
          </div>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Email">
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="correo@empresa.com"
              style={inputStyle({ paddingLeft: 36 })}
            />
          </div>
        </Field>
        <Field label="Persona de contacto">
          <input
            value={form.contact_person}
            onChange={e => setForm({ ...form, contact_person: e.target.value })}
            placeholder="Nombre del encargado"
            style={inputStyle()}
          />
        </Field>
      </div>

      <Field label="Dirección">
        <div style={{ position: "relative" }}>
          <MapPin size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="Ciudad, dirección"
            style={inputStyle({ paddingLeft: 36 })}
          />
        </div>
      </Field>

      <div style={{
        background: "var(--bg-page)", borderRadius: 12, padding: 14,
        display: "grid",
        gridTemplateColumns: showReliability ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr",
        gap: 10,
      }}>
        <Field label="Crédito ($)">
          <input
            type="number" min="0" value={form.credit_limit}
            onChange={e => setForm({ ...form, credit_limit: e.target.value })}
            placeholder="0"
            style={inputStyle()}
          />
        </Field>
        <Field label="Días pago">
          <input
            type="number" min="0" value={form.payment_terms_days}
            onChange={e => setForm({ ...form, payment_terms_days: e.target.value })}
            style={inputStyle()}
          />
        </Field>
        <Field label="Días entrega">
          <input
            type="number" min="0" value={form.lead_time_days}
            onChange={e => setForm({ ...form, lead_time_days: e.target.value })}
            style={inputStyle()}
          />
        </Field>
        {showReliability && (
          <Field label="Fiabilidad">
            <input
              type="number" min="1" max="5" step="0.1"
              value={form.reliability_score}
              onChange={e => setForm({ ...form, reliability_score: e.target.value })}
              style={inputStyle()}
            />
          </Field>
        )}
      </div>

      <Field label="NIT / RUT (opcional)">
        <input
          value={form.tax_id}
          onChange={e => setForm({ ...form, tax_id: e.target.value })}
          placeholder="900.123.456-7"
          style={inputStyle()}
        />
      </Field>

      <Field label="Notas internas">
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Condiciones especiales, comentarios..."
          rows={2}
          style={{ ...inputStyle(), resize: "none", paddingTop: 10 }}
        />
      </Field>

      <button onClick={onSubmit} disabled={saving} style={primaryBtn}>
        {saving
          ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
          : <Save size={16} />}
        {submitLabel}
      </button>
    </div>
  );
}