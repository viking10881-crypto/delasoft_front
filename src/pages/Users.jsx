// pages/Users.jsx
// Admins ven y gestionan SOLO sus usuarios propios.
// Superadmin ve todos (con badge del admin propietario).
// No hay selector de rol: todos los usuarios creados aquí son 'user'.
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Search, UserPlus, Phone, Mail, X,
  Loader2, Save, CreditCard, User,
  Edit3, Trash2, ShieldAlert, ToggleLeft, ToggleRight,
  Building2,
} from "lucide-react";
import { useNotice } from "../context/NoticeContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = "") => name.charAt(0).toUpperCase() || "?";

const inputCls = `
  w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm
  bg-slate-100 dark:bg-white/[0.06]
  border border-transparent
  text-gray-900 dark:text-white
  placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-blue-500 dark:focus:border-blue-500/60
  focus:ring-2 focus:ring-blue-500/10
`;

const EMPTY_FORM = {
  id:       null,
  name:     "",
  email:    "",
  phone:    "",
  cedula:   "",
  city:     "",
  address:  "",
  password: "",
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Users() {
  const { showNotice, askConfirmation } = useNotice();
  const { can, isSuperAdmin }           = useAuth();

  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [toggling,    setToggling]    = useState(null); // id del user en proceso

  // ── Carga ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!can("user.read")) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      const list = data?.data ?? data ?? [];
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      showNotice("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Modales ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setIsEditing(true);
    setFormData({
      id:       user.id,
      name:     user.name     ?? "",
      email:    user.email    ?? "",
      phone:    user.phone    ?? "",
      cedula:   user.cedula   ?? "",
      city:     user.city     ?? "",
      address:  user.address  ?? "",
      password: "",
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
        // Al editar: si no escribe contraseña, no la enviamos
        if (!payload.password) delete payload.password;
      } else {
        // Al crear: si no escribe contraseña, default = cédula
        if (!payload.password) payload.password = payload.cedula;
      }

      if (isEditing) {
        await api.put(`/users/${formData.id}`, payload);
      } else {
        await api.post("/users", payload);
      }

      closeModal();
      fetchUsers();
      showNotice(isEditing ? "Usuario actualizado" : "Usuario creado", "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al guardar", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle activo ──────────────────────────────────────────────────────────
  const handleToggle = async (user) => {
    const action = user.is_active ? "desactivar" : "activar";
    const confirmed = await askConfirmation(
      `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
      user.is_active
        ? "El usuario no podrá iniciar sesión mientras esté desactivado."
        : "El usuario podrá volver a iniciar sesión."
    );
    if (!confirmed) return;

    setToggling(user.id);
    try {
      await api.patch(`/users/${user.id}/toggle`);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      );
      showNotice(`Usuario ${user.is_active ? "desactivado" : "activado"}`, "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al cambiar estado", "error");
    } finally {
      setToggling(null);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    const confirmed = await askConfirmation(
      "¿Eliminar usuario?",
      `Esta acción eliminará a "${user.name}" permanentemente y no se puede deshacer. Si tiene ventas asociadas, desactívalo en su lugar.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showNotice("Usuario eliminado", "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "No se pudo eliminar", "error");
    }
  };

  // ── Filtro ─────────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.cedula?.includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24 transition-colors duration-300">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Usuarios
            </h1>
            <p className="text-gray-500 dark:text-slate-500 font-medium text-sm mt-1">
              {isSuperAdmin()
                ? "Todos los usuarios registrados en el sistema"
                : "Usuarios registrados en tu panel"}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden md:flex flex-col items-end px-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">
                Total
              </span>
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {users.length}
              </span>
            </div>

            {can("user.create") && (
              <button
                onClick={openCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 font-bold text-sm transition-all active:scale-95"
              >
                <UserPlus size={18} />
                Nuevo Usuario
              </button>
            )}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o email..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500/50"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid de usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-600">
              <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
              <p className="font-medium text-sm">Cargando usuarios...</p>
            </div>
          ) : !can("user.read") ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-white/[0.03] rounded-3xl border border-red-200 dark:border-red-500/20">
              <ShieldAlert className="mx-auto mb-4 text-red-400" size={48} />
              <p className="text-gray-900 dark:text-white font-bold text-lg">Acceso Restringido</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                showOwner={isSuperAdmin()}
                canUpdate={can("user.update")}
                canDelete={can("user.delete")}
                isToggling={toggling === user.id}
                onEdit={openEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/[0.06]">
              <User className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
              <p className="text-gray-400 dark:text-slate-600 font-bold">
                {searchTerm ? "Sin resultados para tu búsqueda" : "Aún no tienes usuarios registrados"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal crear / editar */}
      {isModalOpen && (
        <UserModal
          isEditing={isEditing}
          formData={formData}
          isSaving={isSaving}
          onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}

// ─── Tarjeta de usuario ───────────────────────────────────────────────────────
function UserCard({ user, showOwner, canUpdate, canDelete, isToggling, onEdit, onToggle, onDelete }) {
  return (
    <div
      className={`
        group relative overflow-hidden
        bg-white dark:bg-white/[0.03]
        border dark:border-white/[0.07]
        hover:shadow-xl hover:shadow-slate-200/80 dark:hover:shadow-black/30
        rounded-3xl p-5 transition-all duration-300
        ${user.is_active
          ? "border-gray-100 hover:border-blue-300 dark:hover:border-blue-500/30"
          : "border-red-100 dark:border-red-500/20 opacity-60"}
      `}
    >
      {/* Acciones */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        {canUpdate && (
          <>
            <button
              onClick={() => onToggle(user)}
              disabled={isToggling}
              title={user.is_active ? "Desactivar" : "Activar"}
              className={`p-2 rounded-full transition-all border
                bg-gray-50 dark:bg-white/[0.06]
                border-gray-200 dark:border-white/[0.08]
                ${user.is_active
                  ? "text-emerald-500 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                  : "text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white"}
                disabled:opacity-50`}
            >
              {isToggling
                ? <Loader2 size={14} className="animate-spin" />
                : user.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>

            <button
              onClick={() => onEdit(user)}
              className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-slate-500 hover:bg-blue-500 hover:border-blue-500 hover:text-white"
            >
              <Edit3 size={14} />
            </button>
          </>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-slate-500 hover:bg-red-500 hover:border-red-500 hover:text-white"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Avatar + estado */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-lg font-black text-gray-500 dark:text-slate-400 flex-shrink-0">
          {initials(user.name)}
        </div>

        <div className="flex-1 min-w-0 pr-24">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">
            {user.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${
                user.is_active
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
              }`}
            >
              {user.is_active ? "Activo" : "Inactivo"}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.07]">
              <CreditCard size={10} /> {user.cedula || "S/N"}
            </span>
          </div>
        </div>
      </div>

      {/* Admin propietario (solo superadmin) */}
      {showOwner && user.owner_admin_name && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-600 mb-3">
          <Building2 size={12} />
          <span className="truncate">{user.owner_admin_name}</span>
        </div>
      )}

      {/* Contacto */}
      {(user.phone || user.email) && (
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
          {user.phone && (
            <a
              href={`tel:${user.phone}`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <Phone size={13} /> Llamar
            </a>
          )}
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              <Mail size={13} /> Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function UserModal({ isEditing, formData, isSaving, onChange, onClose, onSubmit }) {
  const f = (field) => ({
    value:    formData[field],
    onChange: (e) => onChange(field, e.target.value),
    className: inputCls,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-[#161b27]">

        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center bg-gray-50 dark:bg-white/[0.03]">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {isEditing ? "Modifica los datos del usuario" : "Será registrado como cliente"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Cédula + Nombre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Cédula *
              </label>
              <input required placeholder="123456789" {...f("cedula")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Nombre completo *
              </label>
              <input required placeholder="Nombre Apellido" {...f("name")} />
            </div>
          </div>

          {/* Teléfono + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Teléfono
              </label>
              <input type="tel" placeholder="300 000 0000" {...f("phone")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Email
              </label>
              <input type="email" placeholder="correo@ejemplo.com" {...f("email")} />
            </div>
          </div>

          {/* Contraseña — solo visible al crear o si se quiere cambiar al editar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Contraseña{" "}
              {isEditing
                ? <span className="font-normal normal-case">(dejar vacío para no cambiar)</span>
                : <span className="text-gray-300">(opcional — default: cédula)</span>}
            </label>
            <input type="password" placeholder="••••••••" {...f("password")} />
          </div>

          {/* Ciudad + Dirección */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Ubicación
            </label>
            <div className="flex gap-3">
              <input className={`${inputCls} w-1/3`} placeholder="Ciudad" value={formData.city} onChange={(e) => onChange("city", e.target.value)} />
              <input className={`${inputCls} w-2/3`} placeholder="Dirección" value={formData.address} onChange={(e) => onChange("address", e.target.value)} />
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 pt-2 bg-white dark:bg-[#161b27]">
            <button
              disabled={isSaving}
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              {isSaving
                ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                : <><Save size={18} /> {isEditing ? "Actualizar Usuario" : "Crear Usuario"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}