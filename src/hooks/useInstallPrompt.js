// src/hooks/useInstallPrompt.js
// Captura el evento beforeinstallprompt a nivel de módulo: el navegador lo
// dispara una sola vez y muy pronto (antes de que cualquier componente
// monte), así que si se escuchara solo dentro de un componente se perdería
// casi siempre. Se guarda aquí y se comparte con useSyncExternalStore.
import { useSyncExternalStore, useCallback } from "react";

let deferredPrompt = null;
let installed = false;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    emit();
  });
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return deferredPrompt !== null || installed;
}

// En el primer render (y en cualquier entorno sin window) no hay prompt
// disponible todavía — evita descuadres de hidratación.
function getServerSnapshot() {
  return false;
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true // Safari / Chrome iOS
    );
  } catch {
    return false;
  }
}

export function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOSUA = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se reporta como "Macintosh"; se distingue por soporte multitáctil.
  const isIPadOS = /macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  return isIOSUA || isIPadOS;
}

/**
 * Estado y acción para instalar la PWA.
 * @returns {{
 *   canPromptInstall: boolean,  // Android/Chrome: hay prompt nativo disponible
 *   isIOS: boolean,             // iPhone/iPad: no hay prompt nativo, se explican los pasos
 *   isStandalone: boolean,      // ya está instalada y abierta como app
 *   promptInstall: () => Promise<boolean>,
 * }}
 */
export function useInstallPrompt() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    emit();
    return outcome === "accepted";
  }, []);

  return {
    canPromptInstall: deferredPrompt !== null,
    isIOS: isIOSDevice(),
    isStandalone: isStandaloneDisplay() || installed,
    promptInstall,
  };
}
