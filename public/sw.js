/* ============================================================
   Service Worker — Delasoft PWA
   Ubicación: /public/sw.js  (raíz del build de Vite)
   ============================================================ */

const CACHE_NAME     = "delasoft-v2";
const STATIC_ASSETS  = ["/", "/index.html"];

// ── Instalación ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar caches viejos ────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => clients.claim())
  );
});

// ── Fetch: Network-first para API, Cache-first para assets ───
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // No interceptar peticiones al backend
  if (url.pathname.startsWith("/api/")) return;
  // Solo interceptar GET del mismo origen
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        // Cachear solo respuestas válidas de assets estáticos
        if (res.ok && (url.pathname.startsWith("/assets/") || url.pathname === "/")) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/index.html")))
  );
});

// ── Colores por severidad ────────────────────────────────────
const SEVERITY_VIBRATE = {
  critical: [300, 100, 300, 100, 300],
  warning:  [200, 100, 200],
  info:     [100],
};

// ── PUSH: mostrar notificación nativa ───────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;

  let payload;
  try {
    payload = e.data.json();
  } catch {
    payload = { title: "Delasoft", body: e.data.text(), severity: "info" };
  }

  const {
    title    = "Delasoft",
    body     = "",
    icon     = "/brand/delasoft-d.png",
    badge    = "/brand/delasoft-d.png",
    url      = "/",
    tag      = "delasoft-general",
    severity = "info",
    type,
  } = payload;

  const isCritical = severity === "critical";

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify: true,                                      // resuena aunque el tag exista
      data: { url, type, severity },
      vibrate: SEVERITY_VIBRATE[severity] ?? SEVERITY_VIBRATE.info,
      requireInteraction: isCritical,
      silent: false,
      timestamp: Date.now(),
      actions: [
        { action: "open",    title: "Ver"       },
        { action: "dismiss", title: "Descartar" },
      ],
    })
  );
});

// ── CLICK en notificación ────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;

  const targetUrl = e.notification.data?.url ?? "/";

  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Buscar una ventana del mismo origen que esté abierta
        const appClient = windowClients.find(
          (c) => new URL(c.url).origin === self.location.origin
        );

        if (appClient) {
          // Navegar al target y enfocar
          return appClient.navigate(targetUrl).then((c) => c?.focus());
        }

        // No hay ventana abierta → abrir nueva
        return clients.openWindow(targetUrl);
      })
  );
});

// ── SYNC en background (reintenta cuando vuelve online) ──────
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-notifications") {
    // Enviar mensaje a todos los clientes para que hagan re-fetch
    e.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) =>
        windowClients.forEach((c) => c.postMessage({ type: "SYNC_NOTIFICATIONS" }))
      )
    );
  }
});

// ── PUSH SUBSCRIPTION CHANGE (renovación automática) ─────────
// Se dispara cuando el navegador rota las claves de suscripción
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: e.oldSubscription?.options?.applicationServerKey,
      })
      .then((newSub) =>
        fetch("/api/notifications/subscribe", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(newSub.toJSON()),
        })
      )
  );
});
