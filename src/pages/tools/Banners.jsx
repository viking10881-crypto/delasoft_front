import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Upload, ImageIcon, Link2, Type, AlignLeft } from "lucide-react";
import api from "../../services/api";

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function BannerModal({ open, onClose, banner, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    button_text: "Ver más",
    button_link: "/productos",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (banner) {
      setForm({
        title: banner.title || "",
        description: banner.description || "",
        button_text: banner.button_text || "Ver más",
        button_link: banner.button_link || "/productos",
        is_active: banner.is_active === undefined ? true : !!banner.is_active,
      });
      setPreviewUrl(banner.image_url || "");
      setImageFile(null);
    } else {
      setForm({ title: "", description: "", button_text: "Ver más", button_link: "/productos", is_active: true });
      setPreviewUrl("");
      setImageFile(null);
    }
  }, [banner, open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const saveBanner = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("button_text", form.button_text);
      formData.append("button_link", form.button_link);
      formData.append("is_active", form.is_active ? "1" : "0");
      if (imageFile) formData.append("image", imageFile);

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (banner?.id) {
        await api.put(`/banners/${banner.id}`, formData, config);
      } else {
        if (!imageFile) return alert("Debes seleccionar una imagen");
        await api.post("/banners", formData, config);
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Handle móvil */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-7 py-4 sm:pt-6 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {banner ? "Editar banner" : "Nuevo banner"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {banner ? "Modifica los campos que necesites" : "Completa la información del banner"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-subtle)"}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4">

          {/* Título */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <Type size={11} /> Título
            </label>
            <input
              placeholder="Ej: Ofertas de temporada"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={e => { e.target.style.borderColor = "#5b5ef4"; e.target.style.boxShadow = "0 0 0 3px rgba(91,94,244,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <AlignLeft size={11} /> Descripción
            </label>
            <textarea
              placeholder="Breve descripción del banner..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl resize-none h-20 text-sm outline-none transition-all"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={e => { e.target.style.borderColor = "#5b5ef4"; e.target.style.boxShadow = "0 0 0 3px rgba(91,94,244,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Upload imagen */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <ImageIcon size={11} /> Imagen
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="relative rounded-xl border-2 border-dashed transition-all"
              style={{
                borderColor: dragOver ? "#5b5ef4" : previewUrl ? "transparent" : "var(--border)",
                background: dragOver ? "rgba(91,94,244,0.05)" : previewUrl ? "transparent" : "var(--bg-subtle)",
                overflow: previewUrl ? "hidden" : undefined,
                padding: previewUrl ? 0 : undefined,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} className="w-full h-36 sm:h-44 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Upload size={14} /> Cambiar imagen
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--border)" }}
                  >
                    <Upload size={18} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      Sube o arrastra una imagen
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      PNG, JPG hasta 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <Link2 size={11} /> Botón CTA
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["button_text", "button_link"].map((field) => (
                <input
                  key={field}
                  placeholder={field === "button_text" ? "Texto del botón" : "/ruta o URL"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#5b5ef4"; e.target.style.boxShadow = "0 0 0 3px rgba(91,94,244,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              ))}
            </div>
          </div>

          {/* Toggle activo */}
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Banner activo
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Visible en la tienda
              </p>
            </div>
            <button
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
              style={{ background: form.is_active ? "#5b5ef4" : "var(--border)" }}
            >
              <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                style={{ left: form.is_active ? "1.75rem" : "0.25rem" }}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 sm:px-7 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Cancelar
          </button>
          <button
            onClick={saveBanner}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-60"
            style={{ background: "#5b5ef4" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#4a4de0"; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#5b5ef4"; }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   BANNER CARD
───────────────────────────────────────── */
function BannerCard({ banner, onEdit, onToggle, onDelete }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Imagen móvil */}
      <div className="md:hidden w-full h-40 sm:h-48 overflow-hidden relative" style={{ background: "var(--bg-subtle)" }}>
        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
          banner.is_active ? "bg-emerald-500 text-white" : "bg-black/50 text-white"
        }`}>
          {banner.is_active ? "● Activo" : "○ Inactivo"}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-4 p-4 md:p-5">
        {/* Imagen desktop */}
        <div
          className="hidden md:block w-44 h-24 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background: "var(--bg-subtle)" }}
        >
          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-bold truncate text-base leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {banner.title}
            </h3>
            {/* Badge desktop */}
            <span
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0 ${
                banner.is_active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : ""
              }`}
              style={!banner.is_active ? { background: "var(--bg-subtle)", color: "var(--text-muted)" } : {}}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
              {banner.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>

          {banner.description && (
            <p
              className="text-sm mt-1 line-clamp-2 leading-snug"
              style={{ color: "var(--text-secondary)" }}
            >
              {banner.description}
            </p>
          )}

          {banner.button_text && (
            <div
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                {banner.button_text}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>→</span>
              <span
                className="text-[11px] truncate max-w-[100px]"
                style={{ color: "var(--text-muted)" }}
              >
                {banner.button_link}
              </span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div
          className="flex items-center gap-2 pt-3 md:pt-0 md:flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Estilos inline en el div de acciones para quitar la línea en desktop */}
          <style>{`.action-wrap { border-top: 1px solid var(--border); } @media (min-width: 768px) { .action-wrap { border-top: none; } }`}</style>

          <button
            onClick={() => onToggle(banner)}
            className="flex-1 md:flex-none md:w-auto text-center px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            style={
              banner.is_active
                ? { background: "rgba(34,197,94,0.08)", color: "#16a34a" }
                : { background: "var(--bg-subtle)", color: "var(--text-muted)" }
            }
            onMouseEnter={e => {
              e.currentTarget.style.background = banner.is_active
                ? "rgba(34,197,94,0.15)"
                : "var(--border)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = banner.is_active
                ? "rgba(34,197,94,0.08)"
                : "var(--bg-subtle)";
            }}
          >
            {banner.is_active ? "Desactivar" : "Activar"}
          </button>

          <button
            onClick={() => onEdit(banner)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
            style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
            title="Editar"
            onMouseEnter={e => { e.currentTarget.style.background = "#5b5ef4"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <Pencil size={15} strokeWidth={2} />
          </button>

          <button
            onClick={() => onDelete(banner.id)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
            title="Eliminar"
            onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────── */
export default function Banners() {
  const [banners, setBanners]         = useState([]);
  const [openModal, setOpenModal]     = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { loadBanners(); }, []);

  // ── loadBanners ───────────────────────────────────────────────
  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get("/banners/admin");          // ← /admin
      setBanners(res.data?.data ?? []);                     // ← desempacar data
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── toggleActive ──────────────────────────────────────────────
  const toggleActive = async (banner) => {
    try {
      const fd = new FormData();
      fd.append("title",       banner.title       ?? "");
      fd.append("description", banner.description ?? "");
      fd.append("button_text", banner.button_text ?? "");
      fd.append("button_link", banner.button_link ?? "");
      fd.append("is_active",   banner.is_active ? "0" : "1"); // invierte el estado
      await api.put(`/banners/${banner.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      loadBanners();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm("¿Eliminar este banner?")) return;
    try {
      await api.delete(`/banners/${id}`);
      loadBanners();
    } catch (error) {
      console.error(error);
    }
  };

  const openNew  = () => { setSelectedBanner(null); setOpenModal(true); };
  const openEdit = (b) => { setSelectedBanner(b); setOpenModal(true); };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <main className="px-4 sm:px-6 lg:px-8 pb-28 lg:pb-10 max-w-4xl mx-auto">

        {/* Page header */}
        <div className="pt-6 sm:pt-8 pb-5 flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Banners
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {loading
                ? "Cargando..."
                : `${banners.length} banner${banners.length !== 1 ? "s" : ""} configurado${banners.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            onClick={openNew}
            className="flex items-center gap-2 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm transition-all active:scale-95 flex-shrink-0"
            style={{ background: "#5b5ef4", boxShadow: "0 4px 14px rgba(91,94,244,0.3)" }}
            onMouseEnter={e => e.currentTarget.style.background = "#4a4de0"}
            onMouseLeave={e => e.currentTarget.style.background = "#5b5ef4"}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo banner</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>

        {/* Empty state */}
        {!loading && banners.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              <ImageIcon size={28} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Sin banners aún
            </h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--text-muted)" }}>
              Crea tu primer banner para mostrarlo en la tienda
            </p>
            <button
              onClick={openNew}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "#5b5ef4" }}
            >
              <Plus size={15} /> Crear primer banner
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden animate-pulse"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="md:hidden h-40" style={{ background: "var(--bg-subtle)" }} />
                <div className="flex gap-4 p-5">
                  <div
                    className="hidden md:block w-44 h-24 rounded-xl flex-shrink-0"
                    style={{ background: "var(--bg-subtle)" }}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 rounded-lg w-3/4" style={{ background: "var(--bg-subtle)" }} />
                    <div className="h-3 rounded-lg w-full"  style={{ background: "var(--bg-subtle)", opacity: 0.6 }} />
                    <div className="h-3 rounded-lg w-1/2"  style={{ background: "var(--bg-subtle)", opacity: 0.4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista */}
        {!loading && banners.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {banners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={openEdit}
                onToggle={toggleActive}
                onDelete={deleteBanner}
              />
            ))}
          </div>
        )}
      </main>

      <BannerModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        banner={selectedBanner}
        onSaved={loadBanners}
      />
    </div>
  );
}