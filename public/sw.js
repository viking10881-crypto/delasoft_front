/* ============================================================
   Service Worker — Delasoft PWA
   Ubicación: /public/sw.js  (raíz del build de Vite)

   Regla de privacidad: este SW NUNCA cachea páginas HTML, respuestas
   de API ni datos del usuario. Solo cachea archivos estáticos con hash
   (/assets/*, salida de Vite) e íconos (/icons/*). Las navegaciones
   siempre van a la red; si falla, se sirve /offline.html precacheado.
   ============================================================ */

const CACHE_NAME   = "delasoft-static-v1";
const MAX_ENTRIES  = 80;

const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

// ── Instalación: precachear solo estáticos + fallback offline ───────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: borrar caches de versiones anteriores ───────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// ── Util: limitar el tamaño del cache (FIFO simple) ─────────────────────────
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)));
}

function isCacheableStatic(url) {
  return url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/");
}

// ── Fetch ────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Solo GET del mismo origen
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Nunca interceptar la API ni nada bajo /api/
  if (url.pathname.startsWith("/api/")) return;

  // Navegaciones (cambiar de página / recargar): siempre red, nunca cache de HTML.
  // Si falla (sin conexión), mostrar la página offline precacheada.
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Estáticos con hash e íconos: cache-first, se repueblan solos en cada deploy
  // porque el nombre del archivo cambia (contenido con hash).
  if (isCacheableStatic(url)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone).then(() => trimCache(CACHE_NAME, MAX_ENTRIES)));
          }
          return res;
        });
      })
    );
    return;
  }

  // Cualquier otra petición GET (CSS/JS sin hash, fuentes externas, etc.): red directa,
  // sin pasar por el SW ni quedar en cache.
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
    icon     = "/icons/icon-192.png",
    badge    = "/icons/icon-192.png",
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
