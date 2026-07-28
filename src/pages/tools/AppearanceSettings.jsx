// src/pages/tools/AppearanceSettings.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle, AlertCircle, Upload, ExternalLink } from 'lucide-react';
import api from '../../services/api';

/* ─── Presets ─────────────────────────────────────────── */
const NAVBAR_PRESETS = [
  { label: 'Negro',       value: '#0A0A0A' },
  { label: 'Navy',        value: '#0F172A' },
  { label: 'Grafito',     value: '#1C1C22' },
  { label: 'Bosque',      value: '#1B2D1B' },
  { label: 'Vino',        value: '#44100F' },
  { label: 'Índigo',      value: '#1E1B4B' },
  { label: 'Teal oscuro', value: '#0D2B2B' },
  { label: 'Blanco',      value: '#FFFFFF' },
  { label: 'Crema',       value: '#FAFAF8' },
  { label: 'Gris claro',  value: '#F1F5F9' },
];

const PAGE_PRESETS = [
  { label: 'Blanco',      value: '#FFFFFF' },
  { label: 'Gris suave',  value: '#F5F5F7' },
  { label: 'Papel',       value: '#F4F3EF' },
  { label: 'Crema',       value: '#FFFBF0' },
  { label: 'Fresco',      value: '#F0F4F8' },
  { label: 'Negro',       value: '#0B0B0D' },
  { label: 'Grafito',     value: '#1C1C22' },
  { label: 'Azul noche',  value: '#0D1117' },
];

const BRAND_PRESETS = [
  { label: 'Azul Delasoft', value: '#0878E8' },
  { label: 'Navy Delasoft', value: '#082B68' },
  { label: 'Naranja',  value: '#F97316' },
  { label: 'Morado',   value: '#8B5CF6' },
  { label: 'Verde',    value: '#10B981' },
  { label: 'Rojo',     value: '#EF4444' },
  { label: 'Rosa',     value: '#EC4899' },
  { label: 'Teal',     value: '#14B8A6' },
  { label: 'Ámbar',    value: '#F59E0B' },
];

const FONTS = [
  { label: 'Sistema',  value: '',          sample: 'system-ui, sans-serif' },
  { label: 'Inter',    value: 'Inter',     sample: "'Inter', sans-serif" },
  { label: 'Poppins',  value: 'Poppins',   sample: "'Poppins', sans-serif" },
  { label: 'Raleway',  value: 'Raleway',   sample: "'Raleway', sans-serif" },
  { label: 'Nunito',   value: 'Nunito',    sample: "'Nunito', sans-serif" },
  { label: 'Lato',     value: 'Lato',      sample: "'Lato', sans-serif" },
];

const EMPTY = {
  store_navbar_bg:   '#0A0A0A',
  store_navbar_text: 'light',
  store_page_bg:     '#FFFFFF',
  store_font:        '',
  primary_color:     '#0878E8',
  logo_url:          '',
  business_name:     '',
};

/* ─── Helpers ─────────────────────────────────────────── */
function isLight(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

/* ─── Sub-componentes ─────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-3">
      {children}
    </p>
  );
}

function ColorRow({ presets, value, onChange }) {
  const [hexDraft, setHexDraft] = useState(value);
  useEffect(() => { setHexDraft(value); }, [value]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map(p => (
        <button
          key={p.value}
          type="button"
          title={p.label}
          onClick={() => onChange(p.value)}
          className="relative w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 flex-shrink-0"
          style={{
            backgroundColor: p.value,
            borderColor: value === p.value ? '#3B82F6' : 'rgba(0,0,0,0.12)',
          }}
        >
          {value === p.value && (
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px]"
              style={{ color: isLight(p.value) ? '#000' : '#fff' }}
            >
              ✓
            </span>
          )}
        </button>
      ))}
      {/* Custom picker */}
      <label className="flex items-center gap-1.5 cursor-pointer group">
        <div
          className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 group-hover:border-blue-400 transition-colors flex items-center justify-center text-[10px] text-slate-400"
          style={value && !presets.find(p => p.value === value) ? { backgroundColor: value, border: '2px solid #3B82F6' } : {}}
        >
          {value && !presets.find(p => p.value === value) ? (
            <span style={{ color: isLight(value) ? '#000' : '#fff' }}>✓</span>
          ) : (
            <span>+</span>
          )}
        </div>
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
        <span className="text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
          Personalizado
        </span>
      </label>

      {/* Hex input */}
      <input
        type="text"
        value={hexDraft}
        onChange={e => {
          const v = e.target.value;
          if (!/^#[0-9A-Fa-f]{0,6}$/.test(v)) return;
          setHexDraft(v);
          if (v.length === 7) onChange(v);
        }}
        onBlur={() => { if (hexDraft !== value) setHexDraft(value); }}
        maxLength={7}
        className="w-24 px-2 py-1 rounded-lg text-[11px] font-mono border
          bg-slate-100 dark:bg-[#0d0d0f]
          border-slate-200 dark:border-white/[0.07]
          text-slate-700 dark:text-slate-300
          focus:outline-none focus:border-blue-400 dark:focus:border-white/20"
        placeholder="#000000"
      />
    </div>
  );
}

/* ─── Preview del navbar de la tienda pública ─────────── */
function StorePreview({ navBg, navText, pageBg, brandColor, logoUrl, businessName, font }) {
  useEffect(() => {
    if (!font) return;
    const id = 'gf-preview';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
  }, [font]);

  const textColor = navText === 'light' ? '#fff' : '#18181b';
  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.07] shadow-lg"
      style={{ fontFamily: font ? `'${font}', sans-serif` : undefined }}
    >
      {/* Barra del browser */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-[#1a1a1e]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 mx-3 h-4 rounded bg-white/60 dark:bg-white/10 px-2 flex items-center">
          <span className="text-[9px] text-slate-400">tu-tienda.com</span>
        </div>
      </div>

      {/* Navbar simulado */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: navBg || '#0A0A0A' }}
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="h-6 w-6 object-contain rounded" onError={e => e.target.style.display='none'} />
          ) : (
            <div className="w-6 h-6 rounded" style={{ backgroundColor: brandColor || '#0878E8' }} />
          )}
          <span className="text-[11px] font-bold" style={{ color: textColor }}>
            {businessName || 'Mi Tienda'}
          </span>
        </div>
        <div className="flex gap-3">
          {['Inicio','Productos','Nosotros'].map(l => (
            <span key={l} className="text-[9px]" style={{ color: textColor, opacity: 0.7 }}>{l}</span>
          ))}
        </div>
        <div
          className="px-3 py-1 rounded-full text-[9px] font-bold"
          style={{ backgroundColor: brandColor || '#0878E8', color: isLight(brandColor || '#0878E8') ? '#000' : '#fff' }}
        >
          Comprar
        </div>
      </div>

      {/* Página simulada */}
      <div className="px-5 py-5 space-y-3" style={{ backgroundColor: pageBg || '#FFFFFF', minHeight: 100 }}>
        <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: (brandColor || '#0878E8') + '20' }} />
        <div className="h-2 rounded-full w-full bg-slate-100 dark:bg-white/10" />
        <div className="h-2 rounded-full w-5/6 bg-slate-100 dark:bg-white/10" />
        <div className="flex gap-2 mt-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 rounded-xl overflow-hidden border border-slate-100 dark:border-white/5">
              <div className="h-10 bg-slate-100 dark:bg-white/5" />
              <div className="p-2 space-y-1">
                <div className="h-1.5 rounded w-3/4 bg-slate-200 dark:bg-white/10" />
                <div className="h-1.5 rounded w-1/2" style={{ backgroundColor: (brandColor || '#0878E8') + '40' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ────────────────────────────── */
export default function AppearanceSettings() {
  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback]   = useState(null); // { type: 'ok'|'err', msg }
  const fileRef   = useRef(null);
  const fbTimer   = useRef(null);
  const savedRef  = useRef(null);

  const flash = useCallback((type, msg) => {
    clearTimeout(fbTimer.current);
    setFeedback({ type, msg });
    fbTimer.current = setTimeout(() => setFeedback(null), 3500);
  }, []);

  /* ── Carga inicial ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin-profile');
        const p   = res.data?.data ?? {};
        const initial = {
          store_navbar_bg:   p.store_navbar_bg   || '#0A0A0A',
          store_navbar_text: p.store_navbar_text || 'light',
          store_page_bg:     p.store_page_bg     || '#FFFFFF',
          store_font:        p.store_font        || '',
          primary_color:     p.primary_color     || '#0878E8',
          logo_url:          p.logo_url          || '',
          business_name:     p.business_name     || '',
        };
        setForm(initial);
        savedRef.current = initial;
      } catch {
        flash('err', 'Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    })();
  }, [flash]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      // Solo enviamos los campos que este formulario gestiona
      const payload = {
        business_name:   form.business_name,
        tagline:         form.tagline,
        description:     form.description,
        tax_id:          form.tax_id,
        primary_color:   form.primary_color,
        secondary_color: form.secondary_color,
        accent_color:    form.accent_color,
        business_email:  form.business_email,
        business_phone:  form.business_phone,
        website:         form.website,
        address:         form.address,
        city:            form.city,
        department:      form.department,
        country:         form.country,
        currency:        form.currency,
        timezone:        form.timezone,
        social_links:    form.social_links,
      };
      await api.put('/admin-profile', payload);
      showToast('Cambios guardados');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Logo ── */
  const handleLogoUpload = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await api.post('/admin-profile/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.logo_url || res.data?.data?.logo_url;
      if (url) {
        set('logo_url', url);
        savedRef.current = { ...savedRef.current, logo_url: url };
        flash('ok', 'Logo actualizado');
      }
    } catch {
      flash('err', 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const isDirty = savedRef.current !== null &&
    JSON.stringify(form) !== JSON.stringify(savedRef.current);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Layout principal: form + preview ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">

        {/* ─── Columna izquierda: configuraciones ─── */}
        <div className="space-y-7">

          {/* ── Logo del negocio ── */}
          <div>
            <SectionTitle>Logo del negocio</SectionTitle>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/[0.06]">
              <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111114] flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.primary_color }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {form.business_name || 'Tu negocio'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                  Se mostrará en el navbar de tu tienda pública
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-white dark:bg-[#1a1a1e] border border-slate-200 dark:border-white/10
                      text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500/50
                      transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploading ? 'Subiendo…' : 'Cambiar logo'}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Color del navbar ── */}
          <div>
            <SectionTitle>Color del navbar de la tienda</SectionTitle>
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/[0.06]">
              <ColorRow
                presets={NAVBAR_PRESETS}
                value={form.store_navbar_bg}
                onChange={v => set('store_navbar_bg', v)}
              />
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Texto del navbar:</span>
                {[{ v: 'light', label: 'Blanco (oscuro)' }, { v: 'dark', label: 'Negro (claro)' }].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => set('store_navbar_text', opt.v)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      form.store_navbar_text === opt.v
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Fondo de la página ── */}
          <div>
            <SectionTitle>Fondo de la página</SectionTitle>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/[0.06]">
              <ColorRow
                presets={PAGE_PRESETS}
                value={form.store_page_bg}
                onChange={v => set('store_page_bg', v)}
              />
            </div>
          </div>

          {/* ── Color de marca ── */}
          <div>
            <SectionTitle>Color de marca</SectionTitle>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/[0.06]">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                Se usa en botones, badges y elementos de acción de la tienda.
              </p>
              <ColorRow
                presets={BRAND_PRESETS}
                value={form.primary_color}
                onChange={v => set('primary_color', v)}
              />
            </div>
          </div>

          {/* ── Tipografía ── */}
          <div>
            <SectionTitle>Tipografía</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('store_font', f.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.store_font === f.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                      : 'border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0d0d0f] hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <p
                    className="text-base font-medium text-slate-800 dark:text-slate-100 mb-0.5"
                    style={{ fontFamily: f.sample }}
                  >
                    Aa
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{f.label}</p>
                  {form.store_font === f.value && (
                    <span className="text-[10px] text-blue-500 font-semibold">✓ Activa</span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ─── Columna derecha: preview ─── */}
        <div className="xl:sticky xl:top-6">
          <SectionTitle>Vista previa de la tienda</SectionTitle>
          <StorePreview
            navBg={form.store_navbar_bg}
            navText={form.store_navbar_text}
            pageBg={form.store_page_bg}
            brandColor={form.primary_color}
            logoUrl={form.logo_url}
            businessName={form.business_name}
            font={form.store_font}
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center mt-3">
            Vista previa aproximada · Los cambios son en tiempo real
          </p>
        </div>

      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          feedback.type === 'ok'
            ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
        }`}>
          {feedback.type === 'ok'
            ? <CheckCircle size={15} className="shrink-0" />
            : <AlertCircle size={15} className="shrink-0" />
          }
          {feedback.msg}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => setForm(savedRef.current ?? EMPTY)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            text-slate-400 dark:text-slate-500
            hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10
            transition-colors"
        >
          <RotateCcw size={13} />
          Restablecer
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
            bg-slate-900 dark:bg-white text-white dark:text-slate-900
            hover:bg-slate-700 dark:hover:bg-slate-100
            disabled:opacity-50 transition-all active:scale-95 shadow-sm"
        >
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
            : isDirty
              ? <><Save size={14} /> Guardar apariencia</>
              : <><CheckCircle size={14} /> Sin cambios</>
          }
        </button>
      </div>

    </div>
  );
}
