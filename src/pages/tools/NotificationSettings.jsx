// src/pages/tools/NotificationSettings.jsx
import { useState, useEffect } from 'react';
import {
  Bell, MessageCircle, Mail, Smartphone, Clock, Save,
  Loader2, CheckCircle2, AlertCircle, Send, ShieldCheck,
} from 'lucide-react';
import { useNotice } from '../../context/NoticeContext';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useTestWhatsApp,
} from '../../hooks/useNotificationSettings';

const EVENT_LABELS = {
  new_sale:              'Nueva venta',
  new_on_demand_sale:    'Venta con ítem bajo pedido',
  procurement_needed:    'Compra a proveedor requerida',
  procurement_overdue:   'Compra a proveedor atrasada',
  sale_paid:             'Venta pagada',
  sale_delivered:        'Venta entregada',
  low_stock:             'Stock bajo',
  payment_received:      'Pago recibido',
};

const TIMEZONES = [
  'America/Bogota',
  'America/New_York',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'Europe/Madrid',
];

const COUNTRY_CODES = [
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+1',  label: '🇺🇸 +1'  },
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+51', label: '🇵🇪 +51' },
  { code: '+56', label: '🇨🇱 +56' },
  { code: '+34', label: '🇪🇸 +34' },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'
      }`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-[#131B2A] rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
          <Icon size={16} className="text-gray-600 dark:text-slate-400" />
        </div>
        <h2 className="font-black text-gray-900 dark:text-white text-sm">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export default function NotificationSettings() {
  const { showNotice } = useNotice();
  const { data: settings, loading, error, reload } = useNotificationSettings();
  const { mutate: save, loading: saving }          = useUpdateNotificationSettings(() => {
    showNotice('Configuración guardada', 'success');
    reload();
  });
  const { send: sendTest, loading: testing, success: testOk } = useTestWhatsApp();

  const [form, setForm] = useState({
    whatsapp_enabled:      false,
    whatsapp_phone:        '',
    whatsapp_country_code: '+57',
    email_enabled:         false,
    push_enabled:          false,
    events_enabled:        [],
    quiet_hours_start:     '',
    quiet_hours_end:       '',
    timezone:              'America/Bogota',
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      whatsapp_enabled:      settings.whatsapp_enabled      ?? false,
      whatsapp_phone:        settings.whatsapp_phone        ?? '',
      whatsapp_country_code: settings.whatsapp_country_code ?? '+57',
      email_enabled:         settings.email_enabled         ?? false,
      push_enabled:          settings.push_enabled          ?? false,
      events_enabled:        Array.isArray(settings.events_enabled) ? settings.events_enabled : [],
      quiet_hours_start:     settings.quiet_hours_start     ?? '',
      quiet_hours_end:       settings.quiet_hours_end       ?? '',
      timezone:              settings.timezone               ?? 'America/Bogota',
    });
  }, [settings]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleEvent = (event) =>
    setForm(prev => ({
      ...prev,
      events_enabled: prev.events_enabled.includes(event)
        ? prev.events_enabled.filter(e => e !== event)
        : [...prev.events_enabled, event],
    }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await save(form);
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleTest = async () => {
    try {
      await sendTest();
      showNotice('Mensaje de prueba enviado', 'success');
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-4 py-3 text-red-700 dark:text-red-400 text-sm font-medium">
        <AlertCircle size={16} /> {error}
      </div>
    </div>
  );

  return (
    <div className="pb-28 lg:pb-8 bg-gray-50 dark:bg-[#0D1117] min-h-screen transition-colors duration-300">
      <form onSubmit={handleSave}>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Notificaciones
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Configura cómo y cuándo recibir alertas del negocio
            </p>
          </div>

          {/* WhatsApp */}
          <Section title="WhatsApp" icon={MessageCircle}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Activar WhatsApp</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Recibe alertas por mensaje de texto</p>
              </div>
              <Toggle checked={form.whatsapp_enabled} onChange={v => set('whatsapp_enabled', v)} />
            </div>

            {form.whatsapp_enabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                    Número de WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.whatsapp_country_code}
                      onChange={e => set('whatsapp_country_code', e.target.value)}
                      className="flex-shrink-0 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COUNTRY_CODES.map(cc => (
                        <option key={cc.code} value={cc.code}>{cc.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={form.whatsapp_phone}
                      onChange={e => set('whatsapp_phone', e.target.value)}
                      placeholder="3001234567"
                      className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing || !form.whatsapp_phone}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Enviar prueba
                  </button>
                  {testOk && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 size={13} /> Enviado
                    </span>
                  )}
                  {settings?.whatsapp_verified && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <ShieldCheck size={13} /> Verificado
                    </span>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Otros canales */}
          <Section title="Otros canales" icon={Bell}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Email</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Notificaciones por correo electrónico</p>
              </div>
              <Toggle checked={form.email_enabled} onChange={v => set('email_enabled', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Push</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Notificaciones push en el navegador</p>
              </div>
              <Toggle checked={form.push_enabled} onChange={v => set('push_enabled', v)} />
            </div>
          </Section>

          {/* Eventos */}
          <Section title="Eventos a notificar" icon={Smartphone}>
            <p className="text-xs text-gray-400 dark:text-slate-500 -mt-1">
              Si no seleccionas ninguno, recibirás todos los eventos.
            </p>
            <div className="space-y-2.5">
              {Object.entries(EVENT_LABELS).map(([event, label]) => (
                <label key={event} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={form.events_enabled.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                </label>
              ))}
            </div>
          </Section>

          {/* Horario silencioso */}
          <Section title="Horario silencioso" icon={Clock}>
            <p className="text-xs text-gray-400 dark:text-slate-500 -mt-1">
              No se enviarán notificaciones en este rango. Déjalo vacío para desactivar.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Desde</label>
                <input
                  type="time"
                  value={form.quiet_hours_start}
                  onChange={e => set('quiet_hours_start', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Hasta</label>
                <input
                  type="time"
                  value={form.quiet_hours_end}
                  onChange={e => set('quiet_hours_end', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Zona horaria</label>
              <select
                value={form.timezone}
                onChange={e => set('timezone', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </Section>

          {/* Guardar */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar configuración
          </button>

        </main>
      </form>
    </div>
  );
}