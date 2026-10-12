// src/pages/tools/InstallApp.jsx
import { Smartphone, Share, SquarePlus, MoreVertical, CheckCircle2, Download, Monitor } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

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

function Step({ n, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/[0.08] text-gray-700 dark:text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{children}</p>
    </div>
  );
}

export default function InstallApp() {
  const { canPromptInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();

  if (isStandalone) {
    return (
      <Section title="Instalar app" icon={Smartphone}>
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={20} />
          <p className="text-sm font-bold">Ya tienes Delasoft instalado en este dispositivo.</p>
        </div>
      </Section>
    );
  }

  return (
    <div className="space-y-5">
      <Section title="Instalar en este dispositivo" icon={Smartphone}>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Agrega Delasoft a tu pantalla de inicio: abre a pantalla completa, con ícono propio,
          y carga más rápido que desde el navegador.
        </p>

        {canPromptInstall && (
          <button
            onClick={promptInstall}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Download size={16} /> Instalar ahora
          </button>
        )}

        {!canPromptInstall && !isIOS && (
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Tu navegador todavía no ofrece el botón de instalación automática. Ábrelo desde Chrome o
            Edge en tu celular, o Safari/Chrome en iPhone, para ver los pasos.
          </p>
        )}
      </Section>

      {isIOS && (
        <Section title="Pasos en iPhone / iPad" icon={Share}>
          <Step n={1}>
            Toca el botón <strong>Compartir</strong> <Share size={13} className="inline -mt-0.5" /> en la
            barra del navegador (Safari abajo, Chrome arriba).
          </Step>
          <Step n={2}>
            Busca <strong>"Agregar a inicio"</strong> <SquarePlus size={13} className="inline -mt-0.5" /> en
            la lista de opciones.
          </Step>
          <Step n={3}>
            Confirma tocando <strong>Agregar</strong>. El ícono de Delasoft aparecerá en tu pantalla de inicio.
          </Step>
        </Section>
      )}

      {!canPromptInstall && !isIOS && (
        <Section title="Android (si no ves el botón)" icon={MoreVertical}>
          <Step n={1}>
            Abre el menú <MoreVertical size={13} className="inline -mt-0.5" /> de Chrome (arriba a la derecha).
          </Step>
          <Step n={2}>
            Toca <strong>"Instalar app"</strong> o <strong>"Agregar a pantalla de inicio"</strong>.
          </Step>
        </Section>
      )}

      <Section title="En computador" icon={Monitor}>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          En Chrome o Edge de escritorio, busca el ícono de instalar en la barra de direcciones
          (al lado de los favoritos) y elige <strong>"Instalar"</strong>.
        </p>
      </Section>
    </div>
  );
}
