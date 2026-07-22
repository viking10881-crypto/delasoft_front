// src/components/NotificationsPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, X, Package, ShoppingBag, Wallet, Tag,
  Truck, AlertTriangle, AlertCircle, Info,
  CheckCheck, RefreshCw, BellOff, BellRing,
  Smartphone,
} from "lucide-react";
import api from "../services/api";
import {
  isPushSupported,
  isStandalone,
  notificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
  registerServiceWorker,
} from "../utils/pushNotifications";

// ── Configuración visual ──────────────────────────────────────

const TYPE_CONFIG = {
  stock:    { icon: Package,     bg: "bg-orange-50",   text: "text-orange-500",  border: "border-orange-200"  },
  sale:     { icon: ShoppingBag, bg: "bg-blue-50",     text: "text-blue-500",    border: "border-blue-200"    },
  finance:  { icon: Wallet,      bg: "bg-emerald-50",  text: "text-emerald-500", border: "border-emerald-200" },
  discount: { icon: Tag,         bg: "bg-violet-50",   text: "text-violet-500",  border: "border-violet-200"  },
  purchase: { icon: Truck,       bg: "bg-teal-50",     text: "text-teal-500",    border: "border-teal-200"    },
};

const SEVERITY_LEFT = {
  critical: "border-l-red-500",
  warning:  "border-l-amber-400",
  info:     "border-l-blue-400",
};

const SEVERITY_DOT = {
  critical: "bg-red-500",
  warning:  "bg-amber-400",
  info:     "bg-blue-400",
};

const FILTERS = [
  { key: "all",      label: "Todas",   Icon: null          },
  { key: "critical", label: "Crítico", Icon: AlertCircle   },
  { key: "warning",  label: "Alerta",  Icon: AlertTriangle },
  { key: "info",     label: "Info",    Icon: Info          },
];

// ── Utilidades de tiempo ──────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return "Ahora";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function groupByTime(notifications) {
  const now = Date.now();
  const today    = [];
  const yesterday = [];
  const older    = [];

  for (const n of notifications) {
    const diff = (now - new Date(n.created_at).getTime()) / 1000;
    if (diff < 86400)       today.push(n);
    else if (diff < 172800) yesterday.push(n);
    else                    older.push(n);
  }

  const groups = [];
  if (today.length)     groups.push({ label: "Hoy",    items: today     });
  if (yesterday.length) groups.push({ label: "Ayer",   items: yesterday });
  if (older.length)     groups.push({ label: "Antes",  items: older     });
  return groups;
}

// ── Tarjeta de notificación (desktop) ────────────────────────

function NotifCard({ notif, isRead, onClick }) {
  const typeConf = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.sale;
  const Icon     = typeConf.icon;

  return (
    <button
      onClick={() => onClick(notif)}
      className={`
        w-full flex items-start gap-3 px-5 py-3.5 text-left
        border-l-[3px] ${SEVERITY_LEFT[notif.severity] ?? "border-l-transparent"}
        transition-all duration-150
        hover:bg-slate-50/80 active:bg-slate-100
        ${!isRead ? "bg-slate-50/40" : "bg-white"}
        group
      `}
    >
      {/* Icono */}
      <div className={`
        w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
        ${typeConf.bg} border ${typeConf.border}
      `}>
        <Icon size={14} strokeWidth={2} className={typeConf.text} />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {!isRead && (
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[notif.severity]}`} />
          )}
          <p className={`text-xs font-bold truncate ${isRead ? "text-slate-500" : "text-slate-900"}`}>
            {notif.title}
          </p>
        </div>
        {/* En desktop mostramos el mensaje completo */}
        <p className="text-[11px] text-slate-500 leading-snug
          line-clamp-1 sm:line-clamp-2 group-hover:text-slate-600 transition-colors">
          {notif.message}
        </p>
      </div>

      {/* Tiempo */}
      <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5 tabular-nums">
        {timeAgo(notif.created_at)}
      </span>
    </button>
  );
}

// ── Sección agrupada (desktop) ────────────────────────────────

function GroupSection({ label, items, read, onClickNotif }) {
  return (
    <div>
      <div className="px-5 py-1.5 bg-slate-50 border-y border-slate-100">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((n) => (
          <NotifCard key={n.id} notif={n} isRead={read.has(n.id)} onClick={onClickNotif} />
        ))}
      </div>
    </div>
  );
}

// ── Banner de instalación PWA ────────────────────────────────

function InstallBanner({ onDismiss }) {
  return (
    <div className="mx-4 my-2 px-3.5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800
      flex items-start gap-3 flex-shrink-0">
      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Smartphone size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white leading-snug">
          Activa alertas en tu iPhone
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Agrega esta app a tu pantalla de inicio y recibe notificaciones push de stock, chat y más.
        </p>
        <p className="text-[10px] text-slate-300 mt-1 font-semibold">
          Safari → Compartir → Añadir a inicio
        </p>
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 mt-0.5">
        <X size={13} />
      </button>
    </div>
  );
}

// ── Toggle push ──────────────────────────────────────────────

function PushToggle({ subscribed, loading, onToggle, permission }) {
  if (!isPushSupported()) return null;
  if (permission === "denied") return (
    <span className="text-[10px] text-slate-400 flex items-center gap-1">
      <BellOff size={11} /> Bloqueado en ajustes
    </span>
  );

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      title={subscribed ? "Desactivar push" : "Activar push"}
      className={`
        p-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1
        ${subscribed
          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
        ${loading ? "opacity-50 cursor-wait" : ""}
      `}
    >
      {subscribed ? <BellRing size={12} /> : <Bell size={12} />}
      <span className="hidden sm:inline text-[10px]">{subscribed ? "Push ON" : "Push"}</span>
    </button>
  );
}

// ── Componente principal ─────────────────────────────────────

export default function NotificationsPanel() {
  const navigate = useNavigate();
  const panelRef   = useRef(null);
  const intervalRef = useRef(null);

  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [filter,        setFilter]        = useState("all");
  const [rendered,      setRendered]      = useState(false);
  const [visible,       setVisible]       = useState(false);

  // Push state
  const [subscribed,   setSubscribed]   = useState(false);
  const [pushLoading,  setPushLoading]  = useState(false);
  const [permission,   setPermission]   = useState(notificationPermission());
  const [showInstall,  setShowInstall]  = useState(false);

  // Read IDs persistidos en localStorage
  const [read, setRead] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("notif_read") ?? "[]")); }
    catch { return new Set(); }
  });

  // ── Fetch notificaciones ────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data ?? []);
    } catch (_) {}
    finally { if (!silent) setLoading(false); }
  }, []);

  // ── Verificar suscripción push al montar ────────────────────
  useEffect(() => {
    registerServiceWorker();
    getExistingSubscription().then((sub) => setSubscribed(!!sub));
    setPermission(notificationPermission());

    // Mostrar banner de instalación solo en Safari iOS sin standalone
    const isIOSSafari =
      /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent);
    if (isIOSSafari && !isStandalone() && !sessionStorage.getItem("install_dismissed")) {
      setShowInstall(true);
    }

    fetchNotifications(true);
  }, [fetchNotifications]);

  // ── Open/close con animación ────────────────────────────────
  useEffect(() => {
    if (open) {
      setRendered(true);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      fetchNotifications();
      intervalRef.current = setInterval(() => fetchNotifications(true), 60_000);
    } else {
      setVisible(false);
      document.body.style.overflow = "";
      clearInterval(intervalRef.current);
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
    return () => clearInterval(intervalRef.current);
  }, [open, fetchNotifications]);

  // ── Click fuera (desktop) ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Marcar leído ────────────────────────────────────────────
  const markRead = (id) => {
    setRead((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem("notif_read", JSON.stringify([...next]));
      return next;
    });
  };

  const markAllRead = () => {
    const all = new Set(notifications.map((n) => n.id));
    setRead(all);
    localStorage.setItem("notif_read", JSON.stringify([...all]));
  };

  const handleClick = (notif) => {
    markRead(notif.id);
    setOpen(false);
    navigate(notif.link);
  };

  // ── Toggle push ─────────────────────────────────────────────
  const togglePush = async () => {
    // Si el usuario no está en standalone iOS, mostrar banner
    if (!isStandalone() && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setShowInstall(true);
      return;
    }
    setPushLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
        setPermission("granted");
      }
    } catch (err) {
      console.error("[Push toggle]", err.message);
      setPermission(notificationPermission());
    } finally {
      setPushLoading(false);
    }
  };

  // ── Métricas ────────────────────────────────────────────────
  const unreadCount   = notifications.filter((n) => !read.has(n.id)).length;
  const criticalCount = notifications.filter((n) => n.severity === "critical").length;
  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => n.severity === filter);
  const groups = groupByTime(filtered);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="relative" ref={panelRef}>

      {/* ── Campana ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className={`relative p-2 rounded-xl transition-all ${
          open
            ? "bg-slate-900 text-white"
            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/80"
        }`}
      >
        <Bell size={17} strokeWidth={2} />

        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
            text-[9px] font-black flex items-center justify-center border-2 border-white z-10
            ${criticalCount > 0 ? "bg-red-500 text-white" : "bg-slate-800 text-white"}`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {criticalCount > 0 && !open && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500
            opacity-50 animate-ping pointer-events-none" />
        )}
      </button>

      {/* ── Overlay móvil ── */}
      {rendered && (
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] sm:hidden
            transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* ── Panel ── */}
      {rendered && (
        <div className={`
          fixed sm:absolute
          bottom-0 sm:bottom-auto
          left-0 sm:left-auto
          right-0 sm:right-0
          sm:top-full sm:mt-2.5
          sm:w-[440px]
          z-[95]
          transition-all duration-300 ease-out
          sm:origin-top-right
          ${visible
            ? "translate-y-0 sm:translate-y-0 sm:opacity-100 sm:scale-100"
            : "translate-y-full sm:translate-y-0 sm:opacity-0 sm:scale-[0.97]"}
        `}>
          <div className="bg-white sm:rounded-2xl rounded-t-3xl
            shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.14)]
            border border-slate-100/80 overflow-hidden flex flex-col
            max-h-[88vh] sm:max-h-[min(640px,82vh)]">

            {/* Handle móvil */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-black text-slate-900 text-sm tracking-tight">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-full">
                    {unreadCount} sin leer
                  </span>
                )}
                {criticalCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                    {criticalCount} crítica{criticalCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Push toggle */}
                <PushToggle
                  subscribed={subscribed}
                  loading={pushLoading}
                  onToggle={togglePush}
                  permission={permission}
                />

                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Marcar todas como leídas">
                    <CheckCheck size={14} strokeWidth={2} />
                  </button>
                )}
                <button onClick={() => fetchNotifications()}
                  className={`p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100
                    transition-colors ${loading ? "animate-spin" : ""}`}
                  title="Actualizar">
                  <RefreshCw size={13} strokeWidth={2} />
                </button>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* ── Banner de instalación iOS ── */}
            {showInstall && (
              <InstallBanner onDismiss={() => {
                setShowInstall(false);
                sessionStorage.setItem("install_dismissed", "1");
              }} />
            )}

            {/* ── Filtros ── */}
            <div className="flex gap-1.5 px-5 py-2.5 border-b border-slate-100 overflow-x-auto
              scrollbar-hide flex-shrink-0 bg-slate-50/60">
              {FILTERS.map(({ key, label, Icon: FIcon }) => {
                const count = key === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.severity === key).length;
                return (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      text-[10px] font-bold transition-all ${
                      filter === key
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                    }`}>
                    {FIcon && <FIcon size={10} />}
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={`px-1 rounded-full text-[9px] font-black ${
                        filter === key ? "bg-white/20" : "bg-slate-100 text-slate-400"
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Lista scrollable ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <RefreshCw size={20} className="text-slate-300 animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Cargando alertas…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center
                    border border-emerald-100">
                    <CheckCheck size={20} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700">
                      {filter === "all" ? "Todo en orden 🎉" : "Sin alertas de este tipo"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {filter === "all" ? "No hay alertas pendientes" : "Cambia el filtro para ver más"}
                    </p>
                  </div>
                </div>
              ) : (
                /* Desktop: agrupado por tiempo / Mobile: lista simple */
                <div className="hidden sm:block">
                  {groups.map(({ label, items }) => (
                    <GroupSection
                      key={label}
                      label={label}
                      items={items}
                      read={read}
                      onClickNotif={handleClick}
                    />
                  ))}
                </div>
              )}

              {/* Mobile: lista sin grupos */}
              {filtered.length > 0 && (
                <div className="sm:hidden divide-y divide-slate-50">
                  {filtered.map((notif) => (
                    <NotifCard
                      key={notif.id}
                      notif={notif}
                      isRead={read.has(notif.id)}
                      onClick={handleClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center
                justify-between flex-shrink-0 bg-slate-50/60">
                <p className="text-[10px] text-slate-400">
                  {criticalCount > 0 && (
                    <span className="text-red-500 font-bold">
                      {criticalCount} crítica{criticalCount !== 1 ? "s" : ""} ·{" "}
                    </span>
                  )}
                  {notifications.length} alerta{notifications.length !== 1 ? "s" : ""} en total
                </p>
                <button
                  onClick={() => { setOpen(false); navigate("/analytics"); }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  Ver analíticas →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}