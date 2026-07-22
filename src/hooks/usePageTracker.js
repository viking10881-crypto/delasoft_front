// hooks/usePageTracker.js
// Rastrea page views y envía el userId si el usuario está autenticado.
// Úsalo en App.jsx o MainLayout.jsx — se ejecuta una vez por cambio de ruta.

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Mapeo de rutas a labels legibles ────────────────────────────────────────
const PAGE_LABELS = {
  "/":                    "Inicio (Admin)",
  "/analytics":           "Analíticas",
  "/products":            "Productos",
  "/products/new":        "Nuevo Producto",
  "/users":               "Usuarios",
  "/sales":               "Ventas",
  "/history":             "Historial de Ventas",
  "/tools/providers":     "Proveedores",
  "/tools/finance":       "Finanzas",
  "/tools/categories":    "Categorías",
  "/tools/banners":       "Banners",
  "/tools/discounts":     "Promociones",
  "/tools/chat":          "Chat",
  "/tools/agent":         "Agente IA",
  "/tools/contact-messages": "Mensajes de Contacto",
  "/tools/settings":      "Configuración",
};

// ── Genera o recupera un session ID persistente por pestaña ──────────────────
function getSessionId() {
  const KEY = "delasoft_sid";
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

// ── Label dinámico para rutas con parámetros ─────────────────────────────────
function resolveLabel(pathname) {
  // Primero busca coincidencia exacta
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];

  // Patrones dinámicos
  if (/^\/products\/\d+/.test(pathname)) return "Detalle Producto (Admin)";
  if (/^\/users\/\d+/.test(pathname))    return "Perfil Usuario";

  // Fallback: capitalizar la última parte de la ruta
  const last = pathname.split("/").filter(Boolean).pop();
  return last
    ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ")
    : pathname;
}

// ════════════════════════════════════════════════════════════════════════════
export default function usePageTracker() {
  const location   = useLocation();
  const { user }   = useAuth();           // ← clave: leer el usuario autenticado
  const prevPath   = useRef(null);
  const enterTime  = useRef(Date.now());
  const sessionId  = useRef(getSessionId());

  useEffect(() => {
    const currentPath = location.pathname;
    const now         = Date.now();

    // Tiempo que el usuario estuvo en la página anterior (en segundos)
    const timeOnPrev = prevPath.current
      ? Math.round((now - enterTime.current) / 1000)
      : null;

    // Referrer: la página anterior dentro de la misma app
    const referrer      = prevPath.current ?? null;
    const referrerLabel = prevPath.current ? resolveLabel(prevPath.current) : null;

    const payload = {
      sessionId:      sessionId.current,
      page:           currentPath,
      pageLabel:      resolveLabel(currentPath),
      referrer,
      referrerLabel,
      timeOnPrevPage: timeOnPrev,
      userAgent:      navigator.userAgent,
      screenW:        window.screen.width,
      screenH:        window.screen.height,
      // ── ESTO ES LO QUE FALTABA ──────────────────────────────────────────
      userId: user?.id ?? null,           // null si es visitante anónimo
    };

    // Disparar sin bloquear — si falla, no rompemos la app
    api.post("/analytics/pageview", payload).catch(() => {});

    // Actualizar referencias para la próxima navegación
    prevPath.current  = currentPath;
    enterTime.current = now;
  }, [location.pathname, user?.id]);
  //          ↑ re-ejecuta si el usuario hace login/logout en la misma ruta
}
