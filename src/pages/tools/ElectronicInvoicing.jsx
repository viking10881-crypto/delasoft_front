import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileCheck2, Loader2, Save, ShieldCheck, TestTube2 } from "lucide-react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";

const EMPTY = {
  environment: "sandbox", client_id: "", client_secret: "", username: "", password: "",
  tax_id: "", verification_digit: "", document_type_id: "", numbering_range_id: "",
  municipality_id: "", tribute_id: "", legal_organization_id: "", fiscal_regime_id: "",
  fiscal_responsibility_code: "", request_mode: "customer_request",
};

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

export default function ElectronicInvoicing() {
  const { showNotice } = useNotice();
  const [form, setForm] = useState(EMPTY);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/fiscal-integrations");
      setAccount(data.data);
      if (data.data) setForm(current => ({ ...current, ...data.data }));
    } catch (error) {
      showNotice(error.response?.data?.message || "No se pudo cargar la facturación electrónica", "error");
    } finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const { data } = await api.put("/fiscal-integrations", form);
      showNotice(data.message, "success"); await load();
    } catch (error) { showNotice(error.response?.data?.message || "No se pudo guardar", "error"); }
    finally { setSaving(false); }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const { data } = await api.post("/fiscal-integrations/verify");
      showNotice(data.message, "success"); await load();
    } catch (error) { showNotice(error.response?.data?.message || "No se pudo verificar", "error"); }
    finally { setVerifying(false); }
  };

  if (loading) return <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return <div className="mx-auto max-w-4xl space-y-5">
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <div className="flex gap-3"><FileCheck2 className="mt-0.5 shrink-0" size={18}/><div><strong>El comprobante comercial seguirá siendo el documento principal.</strong><p className="mt-1 text-xs leading-relaxed text-blue-700">La factura electrónica se solicitará únicamente cuando el comprador la necesite. DELASOFT no enviará documentos reales hasta verificar una conexión de producción.</p></div></div>
    </div>

    <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-bold text-slate-900">Proveedor fiscal</p><p className="text-xs text-slate-500">Primera integración: Factus API</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${account?.status === "connected" ? "bg-emerald-100 text-emerald-700" : account?.status === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{account?.status === "connected" ? "Conectado" : account?.status === "error" ? "Error" : "Pendiente"}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ambiente"><select className={input} value={form.environment} onChange={e=>set("environment",e.target.value)}><option value="sandbox">Pruebas (sandbox)</option><option value="production">Producción</option></select></Field>
        <Field label="Cuándo facturar"><select className={input} value={form.request_mode} onChange={e=>set("request_mode",e.target.value)}><option value="customer_request">Cuando el cliente la solicite</option><option value="manual">Solo manualmente</option><option value="always">En todas las ventas</option></select></Field>
        <Field label="Client ID *"><input className={input} value={form.client_id} onChange={e=>set("client_id",e.target.value)} required/></Field>
        <Field label={`Client Secret ${account ? "" : "*"}`}><input type="password" className={input} value={form.client_secret} onChange={e=>set("client_secret",e.target.value)} required={!account}/></Field>
        <Field label={`Usuario API ${account ? "" : "*"}`}><input className={input} value={form.username} onChange={e=>set("username",e.target.value)} required={!account}/></Field>
        <Field label={`Contraseña API ${account ? "" : "*"}`}><input type="password" className={input} value={form.password} onChange={e=>set("password",e.target.value)} required={!account}/></Field>
      </div>

      <div className="border-t border-slate-200 pt-5"><p className="mb-4 font-bold text-slate-900">Datos fiscales de la tienda</p><div className="grid gap-4 sm:grid-cols-3">
        <Field label="NIT *"><input className={input} value={form.tax_id} onChange={e=>set("tax_id",e.target.value)} required/></Field>
        <Field label="Dígito de verificación"><input className={input} maxLength={2} value={form.verification_digit} onChange={e=>set("verification_digit",e.target.value)}/></Field>
        <Field label="Rango de numeración ID"><input type="number" className={input} value={form.numbering_range_id} onChange={e=>set("numbering_range_id",e.target.value)}/></Field>
        <Field label="Tipo de documento ID"><input type="number" className={input} value={form.document_type_id} onChange={e=>set("document_type_id",e.target.value)}/></Field>
        <Field label="Municipio ID"><input type="number" className={input} value={form.municipality_id} onChange={e=>set("municipality_id",e.target.value)}/></Field>
        <Field label="Tributo ID"><input type="number" className={input} value={form.tribute_id} onChange={e=>set("tribute_id",e.target.value)}/></Field>
        <Field label="Organización legal ID"><input type="number" className={input} value={form.legal_organization_id} onChange={e=>set("legal_organization_id",e.target.value)}/></Field>
        <Field label="Régimen fiscal ID"><input type="number" className={input} value={form.fiscal_regime_id} onChange={e=>set("fiscal_regime_id",e.target.value)}/></Field>
        <Field label="Responsabilidad fiscal"><input className={input} value={form.fiscal_responsibility_code} onChange={e=>set("fiscal_responsibility_code",e.target.value)}/></Field>
      </div></div>

      {form.environment === "production" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">Producción puede emitir documentos fiscales reales. Guarda y verifica las credenciales antes de habilitarla.</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {account && <button type="button" onClick={verify} disabled={saving||verifying} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 disabled:opacity-50">{verifying?<Loader2 size={16} className="animate-spin"/>:<TestTube2 size={16}/>} Verificar conexión</button>}
        <button disabled={saving||verifying} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>} Guardar configuración</button>
      </div>
      <div className="flex items-start gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="shrink-0 text-emerald-600"/>Las credenciales secretas se almacenan cifradas y nunca vuelven a mostrarse completas.</div>
    </form>
    {account?.status === "connected" && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18}/> Ya puedes registrar solicitudes de factura electrónica desde el detalle de una venta.</div>}
  </div>;
}

function Field({label,children}) { return <label className="space-y-1.5"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
