// pages/Admins.jsx  — ACTUALIZADO con selector de plan y asignación a admins existentes
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Search, UserPlus, Phone, Mail, X,
  Loader2, Save, CreditCard, ShieldCheck,
  Edit3, Trash2, ShieldAlert, ToggleLeft, ToggleRight,
  KeyRound, Building2, Clock, Crown, Zap, ChevronDown,
  CheckCircle2, Circle, Package,
} from "lucide-react";
import { useNotice } from "../context/NoticeContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = "") => name.charAt(0).toUpperCase() || "?";

const formatDate = (dateStr) => {
  if (!dateStr) return "Nunca";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const STATUS_STYLES = {
  trial:     { bg: "bg-blue-50 dark:bg-blue-500/10",       text: "text-blue-600 dark:text-blue-400",       label: "Trial" },
  active:    { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", label: "Activo" },
  past_due:  { bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-600 dark:text-amber-400",     label: "Pago pendiente" },
  suspended: { bg: "bg-red-50 dark:bg-red-500/10",         text: "text-red-500 dark:text-red-400",         label: "Suspendido" },
  cancelled: { bg: "bg-gray-100 dark:bg-white/[0.04]",     text: "text-gray-400 dark:text-slate-500",      label: "Cancelado" },
};

const inputCls = `
  w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm
  bg-slate-100 dark:bg-white/[0.06]
  border border-transparent
  text-gray-900 dark:text-white
  placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-violet-500 dark:focus:border-violet-500/60
  focus:ring-2 focus:ring-violet-500/10
`;

const EMPTY_FORM = {
  id: null, name: "", email: "", phone: "",
  cedula: "", city: "", address: "", password: "",
  // Plan fields (solo para creación)
  plan_slug: "basic",
  billing_cycle: "monthly",
  trial_days: "",
  start_active: false,
};

// ─── Componente principal ──────────────────────────────────────────────────────
export default function Admins() {
  const { showNotice, askConfirmation } = useNotice();
  const { isSuperAdmin } = useAuth();

  const [admins,          setAdmins]          = useState([]);
  const [plans,           setPlans]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);
  const [formData,        setFormData]        = useState(EMPTY_FORM);
  const [toggling,        setToggling]        = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTargetAdmin, setPlanTargetAdmin] = useState(null);

  const openPlanModal  = (admin) => { setPlanTargetAdmin(admin); setIsPlanModalOpen(true); };
  const closePlanModal = () => { setIsPlanModalOpen(false); setPlanTargetAdmin(null); };

  if (!isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-gray-900 dark:text-white font-bold text-lg">Acceso Restringido</p>
          <p className="text-gray-500 dark:text-slate-500 text-sm mt-1">Solo superadmin puede gestionar administradores.</p>
        </div>
      </div>
    );
  }

  // ── Carga ──────────────────────────────────────────────────────────────────
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, plansRes] = await Promise.all([
        api.get("/superadmin/admins"),
        api.get("/subscriptions/plans"),
      ]);
      const list = adminsRes.data?.data ?? adminsRes.data ?? [];
      setAdmins(Array.isArray(list) ? list : []);
      setPlans(plansRes.data?.plans ?? []);
    } catch {
      showNotice("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  // ── Modales ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setIsEditing(false);
    setFormData({ ...EMPTY_FORM, plan_slug: plans[0]?.slug ?? "basic" });
    setIsModalOpen(true);
  };

  const openEdit = (admin) => {
    setIsEditing(true);
    setFormData({
      id: admin.id, name: admin.name ?? "", email: admin.email ?? "",
      phone: admin.phone ?? "", cedula: admin.cedula ?? "",
      city: admin.city ?? "", address: admin.address ?? "", password: "",
      plan_slug: "", billing_cycle: "monthly", trial_days: "", start_active: false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setFormData(EMPTY_FORM); };

  // ── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        email:   formData.email.trim()   || null,
        phone:   formData.phone.trim()   || null,
        city:    formData.city.trim()    || null,
        address: formData.address.trim() || null,
      };

      if (isEditing) {
        if (!payload.password) delete payload.password;
        delete payload.plan_slug; delete payload.trial_days;
        delete payload.start_active; delete payload.billing_cycle;
        await api.put(`/superadmin/admins/${formData.id}`, payload);
      } else {
        if (formData.trial_days) payload.trial_days = parseInt(formData.trial_days);
        await api.post("/superadmin/admins", payload);
      }

      closeModal();
      fetchAdmins();
      showNotice(isEditing ? "Administrador actualizado" : "Administrador creado", "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al guardar", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle activo ──────────────────────────────────────────────────────────
  const handleToggle = async (admin) => {
    const action = admin.is_active ? "desactivar" : "activar";
    const confirmed = await askConfirmation(
      `¿${action.charAt(0).toUpperCase() + action.slice(1)} administrador?`,
      admin.is_active
        ? "El administrador no podrá iniciar sesión mientras esté desactivado."
        : "El administrador podrá volver a iniciar sesión."
    );
    if (!confirmed) return;
    setToggling(admin.id);
    try {
      await api.patch(`/superadmin/admins/${admin.id}/toggle`);
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a));
      showNotice(`Administrador ${admin.is_active ? "desactivado" : "activado"}`, "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error", "error");
    } finally {
      setToggling(null);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async (admin) => {
    const confirmed = await askConfirmation(
      "¿Eliminar administrador?",
      `Elimina permanentemente a "${admin.name}". Si tiene registros vinculados, desactívalo en su lugar.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/superadmin/admins/${admin.id}`);
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
      showNotice("Administrador eliminado", "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "No se pudo eliminar", "error");
    }
  };

  const filtered = admins.filter(a => {
    const q = searchTerm.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.cedula?.includes(q) || a.email?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24 transition-colors duration-300">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
                <ShieldCheck size={14} className="text-violet-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-500">Panel Superadmin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">Administradores</h1>
            <p className="text-gray-500 dark:text-slate-500 font-medium text-sm mt-1">
              Gestiona admins y sus planes de suscripción
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden md:flex flex-col items-end px-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">Total</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">{admins.length}</span>
            </div>
            <button
              onClick={openCreate}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-violet-500/20 flex items-center gap-2 font-bold text-sm transition-all active:scale-95"
            >
              <UserPlus size={18} /> Nuevo Admin
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o email..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50"
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-600">
              <Loader2 className="animate-spin mb-3 text-violet-500" size={32} />
              <p className="font-medium text-sm">Cargando administradores...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(admin => (
              <AdminCard
                key={admin.id}
                admin={admin}
                isToggling={toggling === admin.id}
                onEdit={openEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onAssignPlan={openPlanModal}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/[0.06]">
              <Building2 className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
              <p className="text-gray-400 dark:text-slate-600 font-bold">
                {searchTerm ? "Sin resultados" : "Aún no hay administradores"}
              </p>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <AdminModal
          isEditing={isEditing}
          formData={formData}
          isSaving={isSaving}
          plans={plans}
          onChange={(field, val) => setFormData(prev => ({ ...prev, [field]: val }))}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}

      {isPlanModalOpen && planTargetAdmin && (
        <PlanAssignModal
          admin={planTargetAdmin}
          plans={plans}
          onClose={closePlanModal}
          onSuccess={() => { closePlanModal(); fetchAdmins(); }}
        />
      )}
    </div>
  );
}

// ─── Tarjeta de admin ─────────────────────────────────────────────────────────
function AdminCard({ admin, isToggling, onEdit, onToggle, onDelete, onAssignPlan }) {
  const roles = admin.roles ?? [];
  const isSA  = roles.some(r => (typeof r === "string" ? r : r.name) === "superadmin");
  const subStatus   = admin.subscription_status;
  const statusStyle = STATUS_STYLES[subStatus] ?? STATUS_STYLES.cancelled;

  return (
    <div className={`
      group relative overflow-hidden bg-white dark:bg-white/[0.03]
      border dark:border-white/[0.07] hover:shadow-xl hover:shadow-slate-200/80
      dark:hover:shadow-black/30 rounded-3xl p-5 transition-all duration-300
      ${admin.is_active
        ? "border-gray-100 hover:border-violet-300 dark:hover:border-violet-500/30"
        : "border-red-100 dark:border-red-500/20 opacity-60"}
    `}>

      {/* Acciones */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        {!isSA && (
          <>
            <button
              onClick={() => onToggle(admin)}
              disabled={isToggling}
              className={`p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08]
                ${admin.is_active
                  ? "text-emerald-500 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                  : "text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white"}
                disabled:opacity-50`}
            >
              {isToggling
                ? <Loader2 size={14} className="animate-spin" />
                : admin.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>

            <button
              onClick={() => onAssignPlan(admin)}
              title="Asignar / cambiar plan"
              className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:bg-violet-500 hover:border-violet-500 hover:text-white"
            >
              <Package size={14} />
            </button>

            <button
              onClick={() => onEdit(admin)}
              className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:bg-violet-500 hover:border-violet-500 hover:text-white"
            >
              <Edit3 size={14} />
            </button>

            <button
              onClick={() => onDelete(admin)}
              className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:bg-red-500 hover:border-red-500 hover:text-white"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Avatar + estado */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center text-lg font-black text-violet-600 dark:text-violet-400 flex-shrink-0">
          {initials(admin.name)}
        </div>
        <div className="flex-1 min-w-0 pr-36">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">{admin.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${admin.is_active ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-500"}`}>
              {admin.is_active ? "Activo" : "Inactivo"}
            </span>
            {isSA && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <ShieldCheck size={9} /> Superadmin
              </span>
            )}
            {admin.cedula && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.07]">
                <CreditCard size={10} /> {admin.cedula}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan badge */}
      {admin.plan_name ? (
        <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${statusStyle.bg} border-transparent`}>
          <Crown size={12} className={statusStyle.text} />
          <span className={`text-xs font-bold ${statusStyle.text}`}>{admin.plan_name}</span>
          <span className={`ml-auto text-[10px] font-black uppercase tracking-wide ${statusStyle.text}`}>{statusStyle.label}</span>
          {admin.subscription_trial_end && subStatus === "trial" && (
            <span className="text-[10px] text-gray-400">· vence {formatDate(admin.subscription_trial_end)}</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06]">
          <Package size={12} className="text-gray-400 dark:text-slate-500" />
          <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Sin plan asignado</span>
          <button
            onClick={() => onAssignPlan(admin)}
            className="ml-auto text-[10px] font-black uppercase tracking-wide text-violet-500 hover:text-violet-600 transition-colors"
          >
            Asignar →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-2.5 border border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-1">
            <KeyRound size={11} className="text-gray-400 dark:text-slate-500" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">API Keys</span>
          </div>
          <span className="text-lg font-black text-gray-900 dark:text-white">{admin.api_keys_count ?? 0}</span>
        </div>
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-2.5 border border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={11} className="text-gray-400 dark:text-slate-500" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Último login</span>
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{formatDate(admin.last_login)}</span>
        </div>
      </div>

      {/* Contacto */}
      {(admin.phone || admin.email) && (
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
          {admin.phone && (
            <a href={`tel:${admin.phone}`} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
              <Phone size={13} /> Llamar
            </a>
          )}
          {admin.email && (
            <a href={`mailto:${admin.email}`} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
              <Mail size={13} /> Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PlanSelector ─────────────────────────────────────────────────────────────
function PlanSelector({ plans, selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {plans.map(plan => (
        <button
          key={plan.slug}
          type="button"
          onClick={() => onSelect(plan.slug)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
            ${selected === plan.slug
              ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
              : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-violet-300"}
          `}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
            style={{ backgroundColor: plan.color ?? "#6366f1" }}
          >
            {plan.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-white">{plan.name}</span>
              {plan.badge_label && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: plan.color ?? "#6366f1" }}>
                  {plan.badge_label}
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              {plan.trial_days > 0 ? `${plan.trial_days} días trial · ` : ""}
              ${plan.price_monthly.toLocaleString()}/mes
            </span>
          </div>
          {selected === plan.slug
            ? <CheckCircle2 size={16} className="text-violet-500 flex-shrink-0" />
            : <Circle size={16} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}

// ─── Modal edición / creación ─────────────────────────────────────────────────
function AdminModal({ isEditing, formData, isSaving, plans, onChange, onClose, onSubmit }) {
  const [showPlanSection, setShowPlanSection] = useState(true);

  const selectedPlan = plans.find(p => p.slug === formData.plan_slug);
  const f = (field) => ({
    value:    formData[field],
    onChange: (e) => onChange(field, e.target.value),
    className: inputCls,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-[#161b27]">

        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center bg-gray-50 dark:bg-white/[0.03]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShieldCheck size={14} className="text-violet-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Panel Superadmin</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {isEditing ? "Editar Administrador" : "Nuevo Administrador"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {isEditing ? "Modifica datos del admin" : "Configura el perfil y el plan de suscripción"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* ── Datos personales ─────────────────────── */}
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Datos personales</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Cédula *</label>
                <input required placeholder="123456789" {...f("cedula")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Nombre *</label>
                <input required placeholder="Nombre Apellido" {...f("name")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Email corporativo * <span className="font-normal normal-case">(login)</span>
              </label>
              <input required type="email" placeholder="admin@empresa.com" {...f("email")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Teléfono</label>
              <input type="tel" placeholder="300 000 0000" {...f("phone")} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Contraseña{" "}
                {isEditing
                  ? <span className="font-normal normal-case">(vacío = no cambiar)</span>
                  : <span className="text-red-400">* mín. 8 chars, may, min, número</span>}
              </label>
              <input type="password" placeholder="••••••••" required={!isEditing} {...f("password")} />
            </div>

            <div className="flex gap-3">
              <input className={`${inputCls} w-1/3`} placeholder="Ciudad"    value={formData.city}    onChange={e => onChange("city",    e.target.value)} />
              <input className={`${inputCls} w-2/3`} placeholder="Dirección" value={formData.address} onChange={e => onChange("address", e.target.value)} />
            </div>
          </div>

          {/* ── Plan de suscripción (solo creación) ───── */}
          {!isEditing && plans.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPlanSection(p => !p)}
                className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-violet-500 transition-colors"
              >
                <span className="flex items-center gap-2"><Crown size={12} /> Plan de suscripción</span>
                <ChevronDown size={14} className={`transition-transform ${showPlanSection ? "rotate-180" : ""}`} />
              </button>

              {showPlanSection && (
                <div className="space-y-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.06]">

                  <PlanSelector plans={plans} selected={formData.plan_slug} onSelect={v => onChange("plan_slug", v)} />

                  {/* Modo de activación */}
                  <div className="flex gap-2 p-1 bg-white dark:bg-white/[0.04] rounded-xl border border-gray-200 dark:border-white/[0.08]">
                    {[
                      { val: false, label: "🕐 Trial" },
                      { val: true,  label: "⚡ Activo" },
                    ].map(opt => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => onChange("start_active", opt.val)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                          ${formData.start_active === opt.val
                            ? "bg-violet-500 text-white shadow"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-700"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Trial days override */}
                  {!formData.start_active && selectedPlan?.trial_days > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Días de trial <span className="font-normal normal-case text-gray-400">(default: {selectedPlan.trial_days})</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder={String(selectedPlan.trial_days)}
                        className={inputCls}
                        value={formData.trial_days}
                        onChange={e => onChange("trial_days", e.target.value)}
                      />
                    </div>
                  )}

                  {/* Billing cycle */}
                  {formData.start_active && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Ciclo de facturación</label>
                      <div className="flex gap-2">
                        {["monthly", "yearly"].map(cycle => (
                          <button
                            key={cycle}
                            type="button"
                            onClick={() => onChange("billing_cycle", cycle)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all
                              ${formData.billing_cycle === cycle
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                : "border-gray-200 dark:border-white/[0.08] text-gray-500"}`}
                          >
                            {cycle === "monthly" ? "Mensual" : "Anual (-17%)"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resumen */}
                  {selectedPlan && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                      <Zap size={14} className="text-violet-500 flex-shrink-0" />
                      <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                        {formData.start_active
                          ? `Se activará directamente en plan ${selectedPlan.name} (${formData.billing_cycle === "yearly" ? "anual" : "mensual"}).`
                          : `Tendrá ${formData.trial_days || selectedPlan.trial_days} días de trial en el plan ${selectedPlan.name}.`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="sticky bottom-0 pt-2 bg-white dark:bg-[#161b27]">
            <button
              disabled={isSaving}
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSaving
                ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                : <><Save size={18} /> {isEditing ? "Actualizar Administrador" : "Crear Administrador"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal asignación de plan ─────────────────────────────────────────────────
function PlanAssignModal({ admin, plans, onClose, onSuccess }) {
  const { showNotice } = useNotice();
  const [isSaving,     setIsSaving]     = useState(false);
  const [planSlug,     setPlanSlug]     = useState(admin.plan_slug ?? plans[0]?.slug ?? "");
  const [startActive,  setStartActive]  = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [trialDays,    setTrialDays]    = useState("");

  const selectedPlan = plans.find(p => p.slug === planSlug);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!planSlug) return showNotice("Selecciona un plan", "error");
    setIsSaving(true);
    try {
      await api.post(`/superadmin/admins/${admin.id}/subscription`, {
        plan_slug:     planSlug,
        start_active:  startActive,
        billing_cycle: billingCycle,
        ...(trialDays ? { trial_days: parseInt(trialDays) } : {}),
      });
      showNotice("Plan asignado correctamente", "success");
      onSuccess();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al asignar plan", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-[#161b27]">

        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center bg-gray-50 dark:bg-white/[0.03]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Package size={14} className="text-violet-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Asignar plan</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">{admin.name}</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Plan actual:{" "}
              <span className="font-bold text-gray-600 dark:text-slate-300">
                {admin.plan_name ?? "Sin plan"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Selector de plan */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Plan</p>
            <PlanSelector plans={plans} selected={planSlug} onSelect={setPlanSlug} />
          </div>

          {/* Modo de activación */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Modo</p>
            <div className="flex gap-2 p-1 bg-white dark:bg-white/[0.04] rounded-xl border border-gray-200 dark:border-white/[0.08]">
              {[
                { val: false, label: "🕐 Trial" },
                { val: true,  label: "⚡ Activo" },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setStartActive(opt.val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                    ${startActive === opt.val
                      ? "bg-violet-500 text-white shadow"
                      : "text-gray-500 dark:text-slate-400 hover:text-gray-700"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trial days override */}
          {!startActive && selectedPlan?.trial_days > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Días de trial{" "}
                <span className="font-normal normal-case text-gray-400">(default: {selectedPlan.trial_days})</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                placeholder={String(selectedPlan.trial_days)}
                value={trialDays}
                onChange={e => setTrialDays(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {/* Billing cycle */}
          {startActive && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Ciclo</p>
              <div className="flex gap-2">
                {["monthly", "yearly"].map(cycle => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all
                      ${billingCycle === cycle
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-gray-200 dark:border-white/[0.08] text-gray-500"}`}
                  >
                    {cycle === "monthly" ? "Mensual" : "Anual (-17%)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resumen */}
          {selectedPlan && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <Zap size={14} className="text-violet-500 flex-shrink-0" />
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                {startActive
                  ? `Se activará en plan ${selectedPlan.name} (${billingCycle === "yearly" ? "anual" : "mensual"}).`
                  : `Tendrá ${trialDays || selectedPlan.trial_days} días de trial en el plan ${selectedPlan.name}.`}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            disabled={isSaving || !planSlug}
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSaving
              ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              : <><Package size={18} /> Asignar plan</>}
          </button>
        </form>
      </div>
    </div>
  );
}