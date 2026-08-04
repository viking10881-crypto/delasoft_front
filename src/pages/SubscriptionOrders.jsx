import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const STATUS = {
  pending:  { label:"Pendiente", cls:"text-amber-600 bg-amber-500/10 border-amber-500/20" },
  approved: { label:"Aprobado", cls:"text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  declined: { label:"Rechazado", cls:"text-red-500 bg-red-500/10 border-red-500/20" },
  voided:   { label:"Anulado", cls:"text-slate-500 bg-slate-500/10 border-slate-500/20" },
  error:    { label:"Error", cls:"text-red-500 bg-red-500/10 border-red-500/20" },
  expired:  { label:"Expirado", cls:"text-slate-500 bg-slate-500/10 border-slate-500/20" },
};
const money = cents => new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 }).format(Number(cents || 0) / 100);
const date = value => value ? new Date(value).toLocaleString("es-CO", { dateStyle:"medium", timeStyle:"short" }) : "—";

export default function SubscriptionOrders() {
  const [orders,setOrders] = useState([]);
  const [admins,setAdmins] = useState([]);
  const [counts,setCounts] = useState({});
  const [status,setStatus] = useState("all");
  const [search,setSearch] = useState("");
  const [debounced,setDebounced] = useState("");
  const [loading,setLoading] = useState(true);
  const [activating,setActivating] = useState(null);
  const [targets,setTargets] = useState({});

  useEffect(() => { const timer=setTimeout(()=>setDebounced(search.trim()),350); return()=>clearTimeout(timer); },[search]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params={ limit:100 };
      if(status!=="all") params.status=status;
      if(debounced) params.search=debounced;
      const [ordersResult,adminsResult]=await Promise.all([
        api.get("/subscriptions/admin/checkouts",{params}),
        api.get("/superadmin/admins"),
      ]);
      setOrders(ordersResult.data.data||[]);
      setCounts(ordersResult.data.counts||{});
      const list=adminsResult.data?.data??adminsResult.data??[];
      setAdmins(Array.isArray(list)?list:[]);
    } catch(error){ toast.error(error.response?.data?.message||"No pudimos cargar las órdenes."); }
    finally{ setLoading(false); }
  },[status,debounced]);
  useEffect(()=>{load();},[load]);

  const cards=useMemo(()=>[
    ["all","Todas",counts.total],["pending","Pendientes",counts.pending],
    ["approved","Aprobadas",counts.approved],["activated","Activadas",counts.activated],
  ],[counts]);

  const activate=async order=>{
    const adminId=Number(targets[order.id]);
    if(!adminId) return toast.error("Selecciona el administrador que recibirá la suscripción.");
    if(!window.confirm(`¿Activar el plan ${order.plan_name} para el administrador seleccionado?`)) return;
    setActivating(order.id);
    try{
      await api.post(`/subscriptions/admin/checkouts/${order.id}/activate`,{admin_id:adminId});
      toast.success("Suscripción activada correctamente.");
      load();
    }catch(error){toast.error(error.response?.data?.message||"No pudimos activar la suscripción.");}
    finally{setActivating(null);}
  };

  return <div className="min-h-[calc(100dvh-var(--header-height,80px))] bg-slate-50 px-4 py-6 dark:bg-[#0D1117] sm:px-7">
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-blue-500"><CreditCard size={14}/> Suscripciones</div><h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Órdenes de contratación</h1><p className="mt-1 text-sm text-slate-500">Pagos iniciados desde la landing de DELASOFT.</p></div><button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300"><RefreshCw size={14} className={loading?"animate-spin":""}/>Actualizar</button></header>
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([key,label,value])=><button key={key} onClick={()=>setStatus(key)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm dark:bg-white/[.035] ${status===key?"border-blue-500":"border-slate-200 dark:border-white/[.07]"}`}><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-3 block text-2xl font-black text-slate-950 dark:text-white">{value||0}</strong></button>)}</section>
      <div className="relative mb-4"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar referencia, comprador, negocio o correo…" className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-blue-400 dark:border-white/[.07] dark:bg-white/[.035] dark:text-white"/></div>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/[.07] dark:bg-white/[.025]">{loading?<div className="grid h-64 place-items-center"><Loader2 className="animate-spin text-blue-500"/></div>:orders.length===0?<div className="grid h-64 place-items-center text-sm font-semibold text-slate-400">No hay órdenes para este filtro.</div>:<div className="divide-y divide-slate-100 dark:divide-white/[.06]">{orders.map(order=>{const badge=STATUS[order.status]||STATUS.pending;return <article key={order.id} className="grid gap-4 p-5 lg:grid-cols-[1.25fr_.8fr_.8fr_1.4fr] lg:items-center"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${badge.cls}`}>{badge.label}</span>{order.activated_at&&<span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-500"><CheckCircle2 size={11}/>Activada</span>}</div><h2 className="truncate text-sm font-black text-slate-900 dark:text-white">{order.buyer_name}</h2><p className="truncate text-xs text-slate-500">{order.business_name||order.email}</p><code className="mt-2 block text-[10px] text-slate-400">{order.reference}</code></div><div><span className="text-[10px] font-black uppercase text-slate-400">Plan</span><p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{order.plan_name} · {order.billing_cycle==="yearly"?"Anual":"Mensual"}</p><p className="text-xs text-slate-500">{money(order.amount_cents)}</p></div><div><span className="text-[10px] font-black uppercase text-slate-400">Fecha</span><p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{date(order.paid_at||order.created_at)}</p></div><div>{order.activated_at?<div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600"><ShieldCheck size={15} className="mb-1"/>Asignada a {order.activated_admin_name||order.activated_admin_email}</div>:order.status==="approved"?<div className="flex gap-2"><select value={targets[order.id]||""} onChange={event=>setTargets(current=>({...current,[order.id]:event.target.value}))} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs dark:border-white/10 dark:bg-black/20 dark:text-white"><option value="">Seleccionar administrador…</option>{admins.map(admin=><option key={admin.id} value={admin.id}>{admin.name} · {admin.email}</option>)}</select><button onClick={()=>activate(order)} disabled={activating===order.id} className="rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">{activating===order.id?<Loader2 size={15} className="animate-spin"/>:"Activar"}</button></div>:<p className="text-xs text-slate-400">La activación estará disponible cuando el pago sea aprobado.</p>}</div></article>})}</div>}</section>
    </div>
  </div>;
}
