// src/utils/pushNotifications.js
import api from "../services/api";

const VAPID_FALLBACK = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

// ── Helpers ──────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Obtiene la VAPID public key del backend; usa el env var como fallback. */
async function fetchVapidKey() {
  try {
    const res = await api.get("/notifications/push-key");
    const raw = res.data;
    // Acepta { publicKey }, { public_key } o string directo
    return raw?.publicKey ?? raw?.public_key ?? (typeof raw === "string" ? raw : null) ?? VAPID_FALLBACK;
  } catch {
    return VAPID_FALLBACK;
  }
}

// ── Detección ────────────────────────────────────────────────

/** ¿El navegador soporta Web Push? */
export function isPushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager"   in window    &&
    "Notification"  in window
  );
}

/** ¿La app está instalada como PWA (Home Screen)? */
export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // Safari iOS
  );
}

/** Estado actual del permiso */
export function notificationPermission() {
  return Notification?.permission ?? "default";
}

// ── Service Worker ───────────────────────────────────────────

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[SW] Registro fallido:", err);
    return null;
  }
}

// ── Escuchar mensajes del SW (ej: SYNC_NOTIFICATIONS) ────────
export function listenToServiceWorker(onMessage) {
  if (!("serviceWorker" in navigator)) return () => {};
  const handler = (e) => onMessage(e.data);
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

// ── Suscripción ──────────────────────────────────────────────

/**
 * Pide permiso y suscribe al push.
 * Si ya existe una suscripción válida la reutiliza.
 * @returns {{ subscription: PushSubscription, isNew: boolean }}
 */
export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error("Push no soportado en este navegador");

  // 1. Registrar SW
  const reg = await registerServiceWorker();
  if (!reg) throw new Error("Service Worker no disponible");

  // 2. Pedir permiso
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso de notificaciones denegado");

  // 3. Obtener VAPID key del backend
  const vapidKey = await fetchVapidKey();
  if (!vapidKey) throw new Error("VAPID public key no disponible");

  // 4. Comprobar si ya existe una suscripción activa
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    const { endpoint, keys } = existing.toJSON();
    try {
      await api.post("/notifications/subscribe", { endpoint, keys });
    } catch {
      // No crítico — el backend puede ya tenerla
    }
    return { subscription: existing, isNew: false };
  }

  // 5. Crear nueva suscripción
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  // 6. Enviar al backend con exactamente { endpoint, keys: { p256dh, auth } }
  const { endpoint, keys } = subscription.toJSON();
  await api.post("/notifications/subscribe", { endpoint, keys });

  return { subscription, isNew: true };
}

/**
 * Cancela la suscripción push y notifica al backend.
 */
export async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return;

  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  // Notificar al backend primero (antes de perder el endpoint)
  await api.post("/notifications/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
}

/**
 * Devuelve la suscripción activa si existe, o null.
 */
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await registerServiceWorker();
    if (!reg) return null;
    return reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Estado completo de las notificaciones push para mostrar en UI.
 * @returns {{ supported, permission, subscribed, standalone }}
 */
export async function getPushStatus() {
  const supported   = isPushSupported();
  const permission  = notificationPermission();
  const standalone  = isStandalone();
  const subscribed  = supported ? !!(await getExistingSubscription()) : false;
  return { supported, permission, subscribed, standalone };
}