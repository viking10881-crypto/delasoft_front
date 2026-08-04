import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3,
  ExternalLink, Filter, Loader2, Mail, MessageCircle, RefreshCw,
  Save, Search, UserRoundSearch, UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const STATUS = {
  new:            { label: "Nuevo",       tone: "blue" },
  contacted:      { label: "Contactado",  tone: "cyan" },
  demo_scheduled: { label: "Demo",        tone: "violet" },
  negotiating:    { label: "Negociando",  tone: "amber" },
  converted:      { label: "Convertido",  tone: "emerald" },
  discarded:      { label: "Descartado",  tone: "slate" },
};

const PLANS = {
  basic: "Básico",
  standard: "Estándar",
  pro: "Pro",
  not_sure: "Por recomendar",
};

const TONE = {
  blue:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  cyan:    "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  violet:  "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  amber:   "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  slate:   "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
};

const fmtDate = (value, withTime = true) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const whatsappUrl = (lead) => {
  if (!lead?.phone) return null;
  let digits = lead.phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) digits = `57${digits}`;
  if (digits.length < 10) return null;
  const text = `Hola ${lead.name}, recibimos tu solicitud para conocer DELASOFT. ¿Cómo podemos ayudarte?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

function StatusBadge({ status }) {
  const config = STATUS[status] || STATUS.new;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${TONE[config.tone]}`}>
      {config.label}
    </span>
  );
}

export default function Prospects() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, demo_scheduled: 0, negotiating: 0, converted: 0 });
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [edit, setEdit] = useState({ status: "new", notes: "", demo_scheduled_at: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (status !== "all") params.status = status;
      if (plan !== "all") params.plan = plan;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get("/superadmin/leads", { params });
      const items = data.data || [];
      setLeads(items);
      setCounts(data.counts || {});
      setSelected((current) => current ? items.find((item) => item.id === current.id) || null : null);
    } catch (error) {
      toast.error(error.response?.data?.message || "No pudimos cargar los prospectos.");
    } finally {
      setLoading(false);
    }
  }, [status, plan, debouncedSearch]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const chooseLead = (lead) => {
    setSelected(lead);
    setEdit({
      status: lead.status,
      notes: lead.notes || "",
      demo_scheduled_at: toInputDate(lead.demo_scheduled_at),
    });
    setMobileDetail(true);
  };

  const saveLead = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        status: edit.status,
        notes: edit.notes,
        demo_scheduled_at: edit.demo_scheduled_at ? new Date(edit.demo_scheduled_at).toISOString() : null,
      };
      const { data } = await api.patch(`/superadmin/leads/${selected.id}`, payload);
      const updated = data.data;
      setSelected(updated);
      setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));
      setEdit({ status: updated.status, notes: updated.notes || "", demo_scheduled_at: toInputDate(updated.demo_scheduled_at) });
      toast.success("Seguimiento actualizado.");
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const cards = useMemo(() => [
    { key: "total", label: "Prospectos", icon: UsersRound, tone: "blue" },
    { key: "new", label: "Nuevos", icon: UserRoundSearch, tone: "cyan" },
    { key: "demo_scheduled", label: "Demos", icon: CalendarDays, tone: "violet" },
    { key: "negotiating", label: "Negociando", icon: Clock3, tone: "amber" },
    { key: "converted", label: "Convertidos", icon: CheckCircle2, tone: "emerald" },
  ], []);

  const whatsapp = whatsappUrl(selected);

  return (
    <div className="min-h-[calc(100dvh-var(--header-height,80px))] bg-slate-50 px-4 py-5 dark:bg-[#0D1117] sm:px-7 sm:py-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-blue-500">
              <UserRoundSearch size={14} /> Captación comercial
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Prospectos</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Solicitudes recibidas desde la landing de DELASOFT.</p>
          </div>
          <button onClick={fetchLeads} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {cards.map(({ key, label, icon: Icon, tone }) => (
            <button key={key} onClick={() => setStatus(key === "total" ? "all" : key)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:bg-white/[.035] ${status === (key === "total" ? "all" : key) ? TONE[tone] : "border-slate-200 dark:border-white/[.07]"}`}>
              <div className="mb-4 flex items-center justify-between"><Icon size={18} className={TONE[tone].split(" ")[1]} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span></div>
              <strong className="text-2xl font-black text-slate-950 dark:text-white">{counts[key] || 0}</strong>
            </button>
          ))}
        </section>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/[.07] dark:bg-white/[.035] sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, negocio, correo o teléfono…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 dark:border-white/[.07] dark:bg-black/20 dark:text-white"/></div>
          <div className="flex gap-2">
            <label className="relative flex-1 sm:w-44"><Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none dark:border-white/[.07] dark:bg-black/20 dark:text-slate-300"><option value="all">Todos los estados</option>{Object.entries(STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 outline-none dark:border-white/[.07] dark:bg-black/20 dark:text-slate-300 sm:w-40"><option value="all">Todos los planes</option>{Object.entries(PLANS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          </div>
        </div>

        <div className="grid min-h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/[.07] dark:bg-white/[.025] lg:grid-cols-[.85fr_1.15fr]">
          <section className={`${mobileDetail ? "hidden lg:block" : "block"} border-r border-slate-100 dark:border-white/[.06]`}>
            {loading ? <div className="flex h-72 items-center justify-center"><Loader2 className="animate-spin text-blue-500"/></div> : leads.length === 0 ? <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400"><UserRoundSearch size={42} strokeWidth={1.3}/><p className="text-sm font-semibold">No hay prospectos para este filtro</p></div> : <div className="divide-y divide-slate-100 dark:divide-white/[.06]">{leads.map((lead) => (
              <button key={lead.id} onClick={() => chooseLead(lead)} className={`w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/[.035] sm:p-5 ${selected?.id === lead.id ? "bg-blue-50/70 dark:bg-blue-500/[.07]" : ""}`}>
                <div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{lead.name}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{lead.business_name || lead.email}</p></div><StatusBadge status={lead.status}/></div>
                <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400"><span className="truncate">{PLANS[lead.interested_plan] || "Sin plan"}</span><span className="shrink-0">{fmtDate(lead.created_at, false)}</span></div>
              </button>
            ))}</div>}
          </section>

          <section className={`${mobileDetail ? "block" : "hidden lg:block"} bg-slate-50/60 dark:bg-black/10`}>
            {!selected ? <div className="flex h-full min-h-[560px] flex-col items-center justify-center gap-4 text-slate-300 dark:text-slate-700"><UserRoundSearch size={58} strokeWidth={1}/><p className="text-sm font-semibold">Selecciona un prospecto para revisar su solicitud</p></div> : <div className="p-4 sm:p-7">
              <button onClick={() => setMobileDetail(false)} className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500 lg:hidden"><ArrowLeft size={15}/>Volver a la lista</button>
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[.07] dark:bg-white/[.035]">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><StatusBadge status={selected.status}/><span className="text-[10px] font-bold text-slate-400">#{selected.id}</span></div><h2 className="text-xl font-black text-slate-950 dark:text-white">{selected.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Building2 size={14}/>{selected.business_name || "Negocio no especificado"}</p></div><div className="flex gap-2"><a href={`mailto:${selected.email}`} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-white/10" title="Enviar correo"><Mail size={17}/></a>{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600" title="Abrir WhatsApp"><MessageCircle size={17}/></a>}</div></div>
                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-xs dark:border-white/[.06] sm:grid-cols-2"><p><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Correo</span><a href={`mailto:${selected.email}`} className="mt-1 block break-all font-semibold text-blue-600 dark:text-blue-400">{selected.email}</a></p><p><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Teléfono</span><span className="mt-1 block font-semibold text-slate-700 dark:text-slate-300">{selected.phone || "—"}</span></p><p><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de negocio</span><span className="mt-1 block font-semibold text-slate-700 dark:text-slate-300">{selected.business_type || "—"}</span></p><p><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Productos</span><span className="mt-1 block font-semibold text-slate-700 dark:text-slate-300">{selected.product_count || "—"}</span></p><p><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Plan de interés</span><span className="mt-1 block font-semibold text-slate-700 dark:text-slate-300">{PLANS[selected.interested_plan] || "—"}</span></p><p><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Recibido</span><span className="mt-1 block font-semibold text-slate-700 dark:text-slate-300">{fmtDate(selected.created_at)}</span></p></div>
                {selected.message && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-black/20 dark:text-slate-300">{selected.message}</div>}
                {(selected.utm_source || selected.landing_page) && <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-400">{selected.utm_source && <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/[.05]">Origen: {selected.utm_source}</span>}{selected.landing_page && <a href={selected.landing_page} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 hover:text-blue-500 dark:bg-white/[.05]">Landing <ExternalLink size={10}/></a>}</div>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[.07] dark:bg-white/[.035]">
                <h3 className="mb-5 text-sm font-black text-slate-900 dark:text-white">Seguimiento comercial</h3>
                <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-400">Estado</span><select value={edit.status} onChange={(e) => setEdit((current) => ({ ...current, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none dark:border-white/[.08] dark:bg-black/20 dark:text-white">{Object.entries(STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><label><span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha de demostración</span><input type="datetime-local" value={edit.demo_scheduled_at} onChange={(e) => setEdit((current) => ({ ...current, demo_scheduled_at: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none dark:border-white/[.08] dark:bg-black/20 dark:text-white"/></label></div>
                <label className="mt-4 block"><span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-400">Notas internas</span><textarea rows={5} maxLength={5000} value={edit.notes} onChange={(e) => setEdit((current) => ({ ...current, notes: e.target.value }))} placeholder="Registra acuerdos, necesidades y próximos pasos…" className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none focus:border-blue-400 dark:border-white/[.08] dark:bg-black/20 dark:text-white"/></label>
                <div className="mt-4 flex items-center justify-between gap-3"><span className="text-[10px] text-slate-400">Última actualización: {fmtDate(selected.updated_at)}</span><button onClick={saveLead} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}Guardar seguimiento</button></div>
              </div>
            </div>}
          </section>
        </div>
      </div>
    </div>
  );
}
