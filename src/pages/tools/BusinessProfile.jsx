import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

/* ══════════════════════════════════════════════════════════
   ATOMS — fuera del componente principal (evita pérdida de foco)
══════════════════════════════════════════════════════════ */

const Field = ({ label, hint, children }) => (
  <div className="group flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between">
      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
        {label}
      </label>
      {hint && <span className="text-[10px] text-slate-400 dark:text-slate-600">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputBase =
  'w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none ' +
  'bg-slate-100 dark:bg-[#0d0d0f] ' +
  'border border-slate-200 dark:border-white/[0.07] ' +
  'text-slate-800 dark:text-slate-100 ' +
  'placeholder-slate-400 dark:placeholder-slate-600 ' +
  'focus:border-blue-400 dark:focus:border-white/20 ' +
  'focus:bg-white dark:focus:bg-[#111114] ' +
  'hover:border-slate-300 dark:hover:border-white/10';

const TextInput = ({ label, hint, value, onChange, type = 'text', placeholder = '' }) => (
  <Field label={label} hint={hint}>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputBase}
    />
  </Field>
);

const TextArea = ({ label, hint, value, onChange, placeholder = '', rows = 3 }) => (
  <Field label={label} hint={hint}>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputBase} resize-none leading-relaxed`}
    />
  </Field>
);

const SelectInput = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${inputBase} cursor-pointer`}
    >
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </Field>
);

const ColorSwatch = ({ label, value, onChange }) => (
  <Field label={label}>
    <div className="flex items-center gap-2.5">
      <label className="relative cursor-pointer flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
        <div
          className="w-10 h-10 rounded-xl border-2 border-white/10 shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <div className="absolute inset-0 rounded-xl ring-2 ring-transparent hover:ring-blue-400/30 dark:hover:ring-white/20 transition-all" />
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={7}
        className={`${inputBase} font-mono text-xs flex-1`}
        placeholder="#000000"
      />
    </div>
  </Field>
);

const SocialInput = ({ label, icon, value, onChange, placeholder, filled }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl
                  bg-slate-50 dark:bg-[#0d0d0f]
                  border border-slate-200 dark:border-white/[0.06]
                  hover:border-slate-300 dark:hover:border-white/10
                  transition-colors group">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                     ${value
                       ? 'bg-blue-100 dark:bg-white/10'
                       : 'bg-slate-100 dark:bg-white/[0.04] group-hover:bg-slate-200 dark:group-hover:bg-white/[0.06]'
                     }`}>
      <svg viewBox="0 0 24 24"
           fill={filled ? 'currentColor' : 'none'}
           stroke={filled ? 'none' : 'currentColor'}
           strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
           className={`w-4 h-4 transition-colors
             ${value
               ? 'text-blue-600 dark:text-slate-200'
               : 'text-slate-400 dark:text-slate-500'
             }`}>
        <path d={icon} />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200
                   placeholder-slate-400 dark:placeholder-slate-600
                   focus:outline-none"
      />
    </div>
    {value && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
  </div>
);

/* ── Config ── */
const TABS = [
  { id: 'info',    label: 'Empresa',          emoji: '🏢' },
  { id: 'visual',  label: 'Identidad visual',  emoji: '🎨' },
  { id: 'contact', label: 'Contacto',          emoji: '📍' },
  { id: 'social',  label: 'Redes sociales',    emoji: '🔗' },
];

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', filled: true,
    icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    placeholder: 'usuario' },
  { key: 'facebook', label: 'Facebook', filled: true,
    icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    placeholder: 'usuario o página' },
  { key: 'whatsapp', label: 'WhatsApp', filled: true,
    icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.057 23.5l5.797-1.452A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z',
    placeholder: '3001234567' },
  { key: 'tiktok', label: 'TikTok', filled: true,
    icon: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.72a8.16 8.16 0 0 0 4.77 1.52V6.8a4.85 4.85 0 0 1-1-.11z',
    placeholder: 'usuario' },
];

const TIMEZONES = [
  'America/Bogota','America/Lima','America/Caracas','America/Santiago',
  'America/Buenos_Aires','America/Mexico_City','America/New_York','Europe/Madrid',
];
const CURRENCIES = ['COP','USD','EUR','MXN','ARS','PEN','CLP'];

const EMPTY_FORM = {
  business_name: '', tagline: '', description: '', tax_id: '',
  primary_color: '#3B82F6', secondary_color: '#1E40AF', accent_color: '#F59E0B',
  business_email: '', business_phone: '', website: '',
  address: '', city: '', department: '', country: 'Colombia',
  currency: 'COP', timezone: 'America/Bogota',
  social_links: { instagram: '', facebook: '', whatsapp: '', tiktok: '' },
};

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function BusinessProfile() {
  const [activeTab, setActiveTab]         = useState('info');
  const [profile, setProfile]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview]     = useState(null);
  const [toast, setToast]                 = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const fileInputRef = useRef(null);
  const toastTimer   = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── Carga inicial ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin-profile');
        if (res.data?.data) {
          const p = res.data.data;
          setProfile(p);
          setForm({
            business_name:   p.business_name   ?? '',
            tagline:         p.tagline         ?? '',
            description:     p.description     ?? '',
            tax_id:          p.tax_id          ?? '',
            primary_color:   p.primary_color   ?? '#3B82F6',
            secondary_color: p.secondary_color ?? '#1E40AF',
            accent_color:    p.accent_color    ?? '#F59E0B',
            business_email:  p.business_email  ?? '',
            business_phone:  p.business_phone  ?? '',
            website:         p.website         ?? '',
            address:         p.address         ?? '',
            city:            p.city            ?? '',
            department:      p.department      ?? '',
            country:         p.country         ?? 'Colombia',
            currency:        p.currency        ?? 'COP',
            timezone:        p.timezone        ?? 'America/Bogota',
            social_links:    p.social_links    ?? { instagram:'', facebook:'', whatsapp:'', tiktok:'' },
          });
        }
      } catch { showToast('Error al cargar el perfil', 'error'); }
      finally  { setLoading(false); }
    })();
  }, [showToast]);

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSL = (k, v) => setForm(f => ({ ...f, social_links: { ...f.social_links, [k]: v } }));

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin-profile', form);
      showToast('Cambios guardados');
    } catch { showToast('Error al guardar', 'error'); }
    finally  { setSaving(false); }
  };

  /* ── Logo ── */
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await api.post('/admin-profile/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(p => ({ ...p, logo_url: res.data.data.logo_url }));
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Logo actualizado');
    } catch { showToast('Error al subir el logo', 'error'); }
    finally  { setUploadingLogo(false); }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('¿Eliminar el logo actual?')) return;
    try {
      await api.delete('/admin-profile/logo');
      setProfile(p => ({ ...p, logo_url: null }));
      setLogoPreview(null);
      showToast('Logo eliminado');
    } catch { showToast('Error al eliminar el logo', 'error'); }
  };

  const logoSrc = logoPreview ?? profile?.logo_url ?? null;

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/10 border-t-blue-500 dark:border-t-white/60 rounded-full animate-spin" />
        <p className="text-[11px] text-slate-400 dark:text-slate-500 tracking-widest uppercase">
          Cargando perfil
        </p>
      </div>
    </div>
  );

  /* ══════ RENDER ══════ */
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50
                         flex items-center gap-3 px-4 py-3 rounded-2xl
                         border shadow-2xl backdrop-blur-xl text-sm font-medium
                         transition-all duration-300
                         ${toast.type === 'error'
                           ? 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300'
                           : 'bg-white dark:bg-[#111]/90 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                         }`}>
          <span className="text-base">{toast.type === 'error' ? '⚠️' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">
              Perfil del negocio
            </h1>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-500 ml-3.5">
            Configura la identidad y datos de tu empresa
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                     bg-slate-900 dark:bg-white text-white dark:text-black
                     hover:bg-slate-700 dark:hover:bg-slate-100
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg
                     w-full sm:w-auto"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border border-white/20 dark:border-black/20 border-t-white dark:border-t-black/60 rounded-full animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                   strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" />
              </svg>
              Guardar cambios
            </>
          )}
        </button>
      </div>

      {/* ── Layout: sidebar + contenido ── */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">

        {/* ── Tabs nav ── */}
        <nav className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1
                          overflow-x-auto lg:overflow-x-visible
                          pb-1 lg:pb-0
                          lg:bg-slate-50 lg:dark:bg-[#0a0a0c]
                          lg:border lg:border-slate-200 lg:dark:border-white/[0.06]
                          lg:rounded-2xl lg:p-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
                             whitespace-nowrap transition-all duration-150 flex-shrink-0 lg:w-full
                             ${activeTab === tab.id
                               ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent'
                               : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/[0.04]'
                             }`}
              >
                <span className="text-sm">{tab.emoji}</span>
                <span className="text-[13px] font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-white hidden lg:block" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Panel de contenido ── */}
        <div className="flex-1
                        bg-white dark:bg-[#0a0a0c]
                        border border-slate-200 dark:border-white/[0.06]
                        rounded-2xl overflow-hidden
                        shadow-sm dark:shadow-none">

          {/* Barra superior del panel */}
          <div className="px-5 sm:px-6 py-4
                          border-b border-slate-100 dark:border-white/[0.05]
                          flex items-center gap-2
                          bg-slate-50/50 dark:bg-transparent">
            <span className="text-base">{TABS.find(t => t.id === activeTab)?.emoji}</span>
            <h2 className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="p-4 sm:p-6 space-y-5 sm:space-y-7">

            {/* ════════ TAB: Empresa ════════ */}
            {activeTab === 'info' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <TextInput
                    label="Nombre del negocio"
                    value={form.business_name}
                    onChange={v => set('business_name', v)}
                    placeholder="Mi Empresa S.A.S"
                  />
                  <TextInput
                    label="NIT / Tax ID"
                    hint="Opcional"
                    value={form.tax_id}
                    onChange={v => set('tax_id', v)}
                    placeholder="900.123.456-7"
                  />
                </div>

                <TextInput
                  label="Slogan"
                  hint="Máx. 255 caracteres"
                  value={form.tagline}
                  onChange={v => set('tagline', v)}
                  placeholder="Calidad que se siente"
                />

                <TextArea
                  label="Descripción"
                  hint="Breve resumen del negocio"
                  value={form.description}
                  onChange={v => set('description', v)}
                  placeholder="Empresa dedicada a…"
                  rows={3}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <SelectInput
                    label="Moneda"
                    value={form.currency}
                    onChange={v => set('currency', v)}
                    options={CURRENCIES}
                  />
                  <SelectInput
                    label="Zona horaria"
                    value={form.timezone}
                    onChange={v => set('timezone', v)}
                    options={TIMEZONES}
                  />
                </div>
              </>
            )}

            {/* ════════ TAB: Identidad visual ════════ */}
            {activeTab === 'visual' && (
              <>
                {/* Logo */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em] mb-4">
                    Logo
                  </p>

                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                    {/* Preview */}
                    <div className={`w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden
                                     border-2 transition-all duration-300
                                     ${logoSrc
                                       ? 'border-slate-200 dark:border-white/10'
                                       : 'border-dashed border-slate-300 dark:border-white/[0.08]'
                                     }
                                     bg-slate-100 dark:bg-[#0d0d0f]`}>
                      {logoSrc ? (
                        <img src={logoSrc} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-8 h-8">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 w-full sm:w-auto">
                      <p className="text-[12px] text-slate-500 dark:text-slate-500 leading-relaxed">
                        JPG, PNG, WEBP o SVG · Máx. 5 MB<br />
                        Se optimiza automáticamente a 400×400 px
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-[12px] font-medium rounded-lg
                                     bg-slate-100 dark:bg-white/[0.06]
                                     hover:bg-slate-200 dark:hover:bg-white/10
                                     text-slate-600 dark:text-slate-300
                                     border border-slate-200 dark:border-white/[0.07]
                                     transition-all duration-150"
                        >
                          Seleccionar archivo
                        </button>

                        {logoPreview && (
                          <button
                            onClick={handleUploadLogo}
                            disabled={uploadingLogo}
                            className="px-3 py-1.5 text-[12px] font-medium rounded-lg
                                       bg-blue-600 hover:bg-blue-500 text-white
                                       disabled:opacity-40 transition-all duration-150"
                          >
                            {uploadingLogo ? 'Subiendo…' : '↑ Subir logo'}
                          </button>
                        )}

                        {profile?.logo_url && !logoPreview && (
                          <button
                            onClick={handleDeleteLogo}
                            className="px-3 py-1.5 text-[12px] font-medium rounded-lg
                                       text-red-500 dark:text-red-400
                                       border border-red-200 dark:border-red-500/20
                                       hover:bg-red-50 dark:hover:bg-red-500/10
                                       transition-all duration-150"
                          >
                            Eliminar logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.05]" />

                {/* Colores */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em] mb-5">
                    Paleta de marca
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-3">
                    <ColorSwatch label="Color secundario" value={form.secondary_color} onChange={v => set('secondary_color', v)} />
                    <ColorSwatch label="Color de acento"  value={form.accent_color}    onChange={v => set('accent_color', v)} />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-5">
                    El color principal de tu tienda se configura en{' '}
                    <a href="/tools/settings/appearance" className="text-blue-500 hover:underline">Apariencia</a>.
                  </p>

                  {/* Preview paleta */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.05] h-10 flex">
                    {[form.secondary_color, form.accent_color].map((c, i) => (
                      <div key={i} className="flex-1 transition-all duration-500" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 text-center tracking-wide">
                    Vista previa de la paleta
                  </p>
                </div>
              </>
            )}

            {/* ════════ TAB: Contacto ════════ */}
            {activeTab === 'contact' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <TextInput
                    label="Email del negocio"
                    value={form.business_email}
                    onChange={v => set('business_email', v)}
                    type="email"
                    placeholder="contacto@empresa.com"
                  />
                  <TextInput
                    label="Teléfono"
                    value={form.business_phone}
                    onChange={v => set('business_phone', v)}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <TextInput
                  label="Sitio web"
                  value={form.website}
                  onChange={v => set('website', v)}
                  type="url"
                  placeholder="https://minegocio.com"
                />

                <div className="h-px bg-slate-100 dark:bg-white/[0.05]" />

                <TextInput
                  label="Dirección"
                  value={form.address}
                  onChange={v => set('address', v)}
                  placeholder="Calle 123 # 45-67"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <TextInput label="Ciudad"       value={form.city}       onChange={v => set('city', v)}       placeholder="Medellín" />
                  <TextInput label="Departamento" value={form.department} onChange={v => set('department', v)} placeholder="Antioquia" />
                  <TextInput label="País"         value={form.country}    onChange={v => set('country', v)}    placeholder="Colombia" />
                </div>
              </>
            )}

            {/* ════════ TAB: Redes sociales ════════ */}
            {activeTab === 'social' && (
              <>
                <p className="text-[12px] text-slate-500 dark:text-slate-500">
                  Conecta tus redes sociales. Solo ingresa el nombre de usuario, no la URL completa.
                </p>

                <div className="space-y-2">
                  {SOCIAL_FIELDS.map(({ key, label, icon, placeholder, filled }) => (
                    <SocialInput
                      key={key}
                      label={label}
                      icon={icon}
                      filled={filled}
                      value={form.social_links[key] ?? ''}
                      onChange={v => setSL(key, v)}
                      placeholder={placeholder}
                    />
                  ))}
                </div>

                {Object.values(form.social_links).some(Boolean) && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/10
                                  bg-emerald-50 dark:bg-emerald-500/5 px-4 py-3">
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {Object.values(form.social_links).filter(Boolean).length} red(es) configurada(s)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4
                          border-t border-slate-100 dark:border-white/[0.05]
                          flex justify-end
                          bg-slate-50/50 dark:bg-transparent">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                         bg-slate-900 dark:bg-white text-white dark:text-black
                         hover:bg-slate-700 dark:hover:bg-slate-100
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 w-full sm:w-auto justify-center"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/20 dark:border-black/20 border-t-white dark:border-t-black/60 rounded-full animate-spin" />
                  Guardando…
                </>
              ) : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}