// src/components/InstallAppCard.jsx
// Tarjeta discreta para invitar a instalar la PWA. Solo en móvil y si la app
// no está ya instalada. El cierre se recuerda en localStorage.
import { Download, Share, X, SquarePlus } from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useLocalDismiss } from "../hooks/useLocalDismiss";

export default function InstallAppCard() {
  const { canPromptInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, dismiss] = useLocalDismiss("pwa_install_dismissed");

  if (isStandalone || dismissed) return null;
  if (!canPromptInstall && !isIOS) return null; // nada que ofrecer (desktop sin prompt, navegador no soportado)

  return (
    <div
      className="md:hidden rounded-2xl p-4 mb-4 border flex items-start gap-3"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <Download size={18} style={{ color: "var(--brand)" }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          Instala Delasoft en tu celular
        </p>

        {canPromptInstall ? (
          <>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Ábrela como una app, con ícono propio y pantalla completa.
            </p>
            <button
              onClick={promptInstall}
              className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: "var(--brand)" }}
            >
              Instalar
            </button>
          </>
        ) : (
          <p className="text-xs mt-0.5 flex flex-wrap items-center gap-1" style={{ color: "var(--text-muted)" }}>
            Toca <Share size={12} className="inline" /> Compartir y luego
            <SquarePlus size={12} className="inline" /> "Agregar a inicio".
          </p>
        )}
      </div>

      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="p-1 rounded-lg flex-shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
