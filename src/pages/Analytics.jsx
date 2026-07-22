// src/pages/Analytics.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Eye, Users, MousePointerClick, Clock, TrendingUp, Smartphone,
  Monitor, Tablet, Globe, ArrowUpRight, ArrowDownRight,
  Search, X, ChevronDown, ChevronUp, Minus,
} from "lucide-react";
import api from "../services/api";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  blue:   "#4f8eff",
  green:  "#10b981",
  amber:  "#f59e0b",
  red:    "#ef4444",
  purple: "#8b5cf6",
  cyan:   "#06b6d4",
  muted:  "#94a3b8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN   = (n = 0) => new Intl.NumberFormat("es-CO").format(n);
const fmtSec = (s) => {
  if (!s && s !== 0) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};
const fmtDate = (iso) =>
  !iso ? "—" : new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
const fmtTime = (iso) =>
  !iso ? "—" : new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

// ─── Demo data ────────────────────────────────────────────────────────────────
function buildDemo(period) {
  const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 14;
  const trend = Array.from({ length: Math.min(days, 14) }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (Math.min(days, 14) - 1 - i));
    return {
      label: d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      views: 120 + Math.round(Math.random() * 280 + i * 8),
      sessions: 80 + Math.round(Math.random() * 180 + i * 5),
    };
  });

  const pages = [
    { page: "/",              label: "Inicio",           views: 1820, sessions: 1100, avgTime: 95,  bounce: 38 },
    { page: "/productos",     label: "Productos",        views: 940,  sessions: 680,  avgTime: 142, bounce: 29 },
    { page: "/productos/:id", label: "Detalle producto", views: 720,  sessions: 520,  avgTime: 188, bounce: 24 },
    { page: "/carrito",       label: "Carrito",          views: 380,  sessions: 310,  avgTime: 210, bounce: 42 },
    { page: "/checkout",      label: "Checkout",         views: 210,  sessions: 180,  avgTime: 275, bounce: 18 },
    { page: "/auth",          label: "Login / Registro", views: 170,  sessions: 155,  avgTime: 85,  bounce: 51 },
    { page: "/order-success", label: "Pedido exitoso",   views: 98,   sessions: 95,   avgTime: 45,  bounce: 72 },
    { page: "/perfil",        label: "Perfil",           views: 65,   sessions: 60,   avgTime: 120, bounce: 35 },
  ];

  const totalViews    = trend.reduce((a, t) => a + t.views, 0);
  const totalSessions = trend.reduce((a, t) => a + t.sessions, 0);

  const demoUsers = [
    { id: 1, name: "Camila Torres",  email: "camila@gmail.com",    phone: "3104521890", city: "Medellín"     },
    { id: 2, name: "Andrés Gómez",   email: "andresg@outlook.com", phone: "3007654321", city: "Bogotá"       },
    { id: 3, name: "Valentina Ríos", email: "vale.rios@mail.co",   phone: "3156781234", city: "Cali"         },
    { id: 4, name: "Felipe Herrera", email: "fherrera@corp.com",   phone: "3201234567", city: "Barranquilla" },
    { id: 5, name: "Luisa Martínez", email: "luisa.m@gmail.com",   phone: "3118765432", city: "Pereira"      },
  ];
  const devicePool  = ["Móvil", "Escritorio", "Tablet"];
  const refPool     = ["Google", "Instagram", "Facebook", "Directo", null, null];
  const sessionPool = Array.from({ length: 30 }, (_, i) => ({
    sessionId:        `s_demo_${i}`,
    device:           devicePool[i % devicePool.length],
    referrer:         refPool[Math.floor(Math.random() * refPool.length)],
    timeOnPage:       10 + Math.round(Math.random() * 200),
    visitedAt:        new Date(Date.now() - Math.random() * 8.64e7).toISOString(),
    screenW:          [375, 1440, 1280, 768][Math.floor(Math.random() * 4)],
    screenH:          [812, 900, 720, 1024][Math.floor(Math.random() * 4)],
    converted:        Math.random() > 0.72,
    sessionPageCount: 2 + Math.floor(Math.random() * 5),
    sessionDuration:  60 + Math.round(Math.random() * 360),
    user:             Math.random() > 0.38 ? demoUsers[Math.floor(Math.random() * demoUsers.length)] : null,
  }));

  return {
    summary: {
      totalViews,
      totalSessions,
      uniqueUsers:   Math.round(totalSessions * 0.62),
      conversions:   Math.round(totalSessions * 0.08),
      avgTimeOnSite: 148,
      bounceRate:    41,
      viewsChange:   +12,
      sessionsChange: +8,
      usersChange:   +15,
      convChange:    -3,
    },
    trend,
    devices: { mobile: 52, desktop: 41, tablet: 7 },
    referrers: [
      { source: "Google",    visits: Math.round(totalSessions * 0.41), icon: "🔍" },
      { source: "Directo",   visits: Math.round(totalSessions * 0.27), icon: "🔗" },
      { source: "Instagram", visits: Math.round(totalSessions * 0.18), icon: "📸" },
      { source: "Facebook",  visits: Math.round(totalSessions * 0.09), icon: "👍" },
      { source: "Otros",     visits: Math.round(totalSessions * 0.05), icon: "🌐" },
    ],
    pages: pages.map((p) => ({
      ...p,
      loggedIn:  Math.round(p.sessions * 0.28),
      anonymous: Math.round(p.sessions * 0.72),
      devices:   { mobile: Math.round(p.views * 0.52), desktop: Math.round(p.views * 0.41), tablet: Math.round(p.views * 0.07) },
      sessions:  sessionPool.slice(0, 6 + Math.floor(Math.random() * 6)).map((s, j) => ({
        ...s, sessionId: `${s.sessionId}_${p.page}_${j}`,
      })),
    })),
  };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#dbeafe", "#1d4ed8"], ["#dcfce7", "#166534"], ["#fce7f3", "#9d174d"],
  ["#fef3c7", "#92400e"], ["#ede9fe", "#5b21b6"], ["#ffedd5", "#9a3412"],
];
function Avatar({ name, size = 28 }) {
  const idx  = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  const [bg, fg] = AVATAR_COLORS[idx];
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Chip de cambio ───────────────────────────────────────────────────────────
function DeltaChip({ value }) {
  if (value == null) return null;
  const up  = value >= 0;
  const zero = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
      zero  ? "bg-gray-100 dark:bg-white/[0.06] text-gray-400"
      : up   ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
             : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
    }`}>
      {zero ? <Minus size={9} /> : up ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
      {Math.abs(value)}%
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, delta, color, sub }) {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            {label}
          </span>
        </div>
        <DeltaChip value={delta} />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Barra de dispositivos ────────────────────────────────────────────────────
function DeviceBars({ devices }) {
  const total = (devices.mobile + devices.desktop + devices.tablet) || 1;
  const segs  = [
    { label: "Móvil",      icon: Smartphone, pct: devices.mobile,  color: C.blue   },
    { label: "Escritorio", icon: Monitor,    pct: devices.desktop, color: C.purple  },
    { label: "Tablet",     icon: Tablet,     pct: devices.tablet,  color: C.amber   },
  ];
  return (
    <div className="space-y-3">
      {segs.map(({ label, icon: Icon, pct, color }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400">
              <Icon size={12} style={{ color }} />
              {label}
            </div>
            <span className="text-xs font-bold text-gray-900 dark:text-white">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(pct / total) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fila de página ───────────────────────────────────────────────────────────
function PageRow({ page, isSelected, maxViews, onClick, rank }) {
  const pct = Math.round((page.views / maxViews) * 100);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
          : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:border-gray-100 dark:hover:border-white/[0.07]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0"
          style={{ background: isSelected ? C.blue + "20" : "var(--bg-subtle)", color: isSelected ? C.blue : "var(--text-muted)" }}>
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{page.label}</span>
            <span className="text-sm font-black flex-shrink-0" style={{ color: C.blue }}>{fmtN(page.views)}</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.blue + "88" }} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-slate-500">
            <span>{fmtN(page.sessions)} sesiones</span>
            <span style={{ color: page.bounce > 60 ? C.red : page.bounce > 40 ? C.amber : C.green }}>
              {page.bounce}% rebote
            </span>
            <span>{fmtSec(page.avgTime)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Fila de sesión ───────────────────────────────────────────────────────────
const DEVICE_ICON_MAP = { "Móvil": Smartphone, "Tablet": Tablet, "Escritorio": Monitor };
function SessionRow({ session, isLast }) {
  const [open, setOpen] = useState(false);
  const { user } = session;
  const DevIcon  = DEVICE_ICON_MAP[session.device] ?? Monitor;

  return (
    <>
      <tr
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <td className="px-4 py-3" style={{ borderBottom: (isLast && !open) ? "none" : "1px solid var(--border)" }}>
          <DevIcon size={14} className="text-gray-400 dark:text-slate-500" />
        </td>
        <td className="px-4 py-3" style={{ borderBottom: (isLast && !open) ? "none" : "1px solid var(--border)" }}>
          {user ? (
            <div className="flex items-center gap-2">
              <Avatar name={user.name} size={26} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-slate-500 italic">Anónimo</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap hidden sm:table-cell"
          style={{ borderBottom: (isLast && !open) ? "none" : "1px solid var(--border)" }}>
          {fmtDate(session.visitedAt)} {fmtTime(session.visitedAt)}
        </td>
        <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white"
          style={{ borderBottom: (isLast && !open) ? "none" : "1px solid var(--border)" }}>
          {fmtSec(session.timeOnPage)}
        </td>
        <td className="px-4 py-3 hidden xs:table-cell" style={{ borderBottom: (isLast && !open) ? "none" : "1px solid var(--border)" }}>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            session.converted
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-500/10 text-red-400 dark:text-red-400"
          }`}>
            {session.converted ? "Compró" : "Salió"}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-gray-400 dark:text-slate-500"
          style={{ borderBottom: (isLast && !open) ? "none" : "1px solid var(--border)" }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}
            className="px-4 pb-4 bg-gray-50/50 dark:bg-white/[0.01]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3">
              {[
                { label: "ID sesión",   value: session.sessionId.slice(0, 18) + "…", mono: true },
                { label: "Páginas",     value: `${session.sessionPageCount} páginas` },
                { label: "Duración",    value: fmtSec(session.sessionDuration) },
                { label: "Resolución",  value: session.screenW ? `${session.screenW}×${session.screenH}` : "—" },
                { label: "Origen",      value: session.referrer ?? "Directo" },
                { label: "Dispositivo", value: session.device },
                ...(user ? [
                  { label: "Teléfono", value: user.phone ?? "—" },
                  { label: "Ciudad",   value: user.city  ?? "—" },
                ] : []),
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold mb-0.5">{label}</p>
                  <p className={`text-xs text-gray-800 dark:text-slate-300 font-medium truncate ${mono ? "font-mono" : ""}`}>{value}</p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Custom Tooltip para recharts ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/[0.1] rounded-xl shadow-xl px-3 py-2.5 text-xs">
      <p className="font-bold text-gray-500 dark:text-slate-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {fmtN(p.value)}
        </p>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const PERIODS = [
  { key: "today", label: "Hoy"    },
  { key: "7d",    label: "7 días" },
  { key: "30d",   label: "30 días"},
  { key: "month", label: "Mes"    },
];

export default function Analytics() {
  const [period,  setPeriod]  = useState("7d");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo,  setIsDemo]  = useState(false);

  // Página seleccionada para drill-down
  const [selectedPage, setSelectedPage]   = useState(null);
  const [sessionFilter, setSessionFilter] = useState("all");

  // Búsqueda en sesiones
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const debRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/summary?period=${period}`);
      const raw = res.data;
      // Soporta { summary, trend, ... } directo y { data: { summary, ... } } envuelto
      const payload = raw?.summary != null ? raw : (raw?.data ?? null);
      if (!payload?.summary) throw new Error("unexpected format");
      setData(payload);
      setIsDemo(false);
    } catch {
      setData(buildDemo(period));
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset selección al cambiar período
  useEffect(() => { setSelectedPage(null); setSessionFilter("all"); }, [period]);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setSearch(e.target.value.toLowerCase()), 400);
  };

  const clearSearch = () => { setSearchInput(""); setSearch(""); };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary, trend, devices, referrers, pages } = data;
  const activePage = selectedPage ? pages.find((p) => p.page === selectedPage) : null;
  const sessions   = activePage?.sessions ?? [];

  const filteredSessions = sessions.filter((s) => {
    const matchFilter =
      sessionFilter === "user"      ? s.user !== null :
      sessionFilter === "anon"      ? s.user === null :
      sessionFilter === "converted" ? s.converted : true;
    const matchSearch = !search || (
      s.user?.name?.toLowerCase().includes(search) ||
      s.user?.email?.toLowerCase().includes(search) ||
      s.device?.toLowerCase().includes(search)
    );
    return matchFilter && matchSearch;
  });

  const maxPageViews = Math.max(...pages.map((p) => p.views), 1);
  const topReferrer  = referrers?.[0];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24 lg:pb-10" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.blue + "20" }}>
                <TrendingUp size={14} style={{ color: C.blue }} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: C.blue }}>
                Analíticas de la tienda
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Analytics
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isDemo && (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg"
                style={{ background: C.amber + "20", color: C.amber, border: `1px solid ${C.amber}40` }}>
                Demo
              </span>
            )}

            {/* Selector de período */}
            <div className="flex gap-1 p-1 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-xl">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p.key
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Eye}             label="Vistas"       value={fmtN(summary.totalViews)}    delta={summary.viewsChange}    color={C.blue}   />
          <KpiCard icon={Globe}           label="Sesiones"     value={fmtN(summary.totalSessions)} delta={summary.sessionsChange} color={C.purple} />
          <KpiCard icon={Users}           label="Usuarios"     value={fmtN(summary.uniqueUsers)}   delta={summary.usersChange}    color={C.cyan}   />
          <KpiCard icon={MousePointerClick} label="Conversiones" value={fmtN(summary.conversions)}   delta={summary.convChange}     color={C.green}  />
          <KpiCard icon={Clock}           label="T. promedio"  value={fmtSec(summary.avgTimeOnSite)} color={C.amber} sub="por sesión" />
          <KpiCard icon={ArrowDownRight}  label="Rebote"       value={`${summary.bounceRate}%`}
            color={summary.bounceRate > 60 ? C.red : summary.bounceRate > 40 ? C.amber : C.green}
            sub="tasa de abandono" />
        </div>

        {/* ── Gráfico de tráfico + Dispositivos/Referrers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Gráfico */}
          <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Tráfico en el tiempo</h2>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Vistas y sesiones por día</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.blue }} />
                  Vistas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.purple }} />
                  Sesiones
                </span>
              </div>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.blue}   stopOpacity={0.15} />
                      <stop offset="95%" stopColor={C.blue}   stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.purple} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={C.purple} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="views"    name="Vistas"    stroke={C.blue}   strokeWidth={2} fill="url(#gradViews)"    dot={false} />
                  <Area type="monotone" dataKey="sessions" name="Sesiones"  stroke={C.purple} strokeWidth={2} fill="url(#gradSessions)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Dispositivos + Referrers */}
          <div className="space-y-4">

            {/* Dispositivos */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-4">
              <h2 className="text-sm font-black text-gray-900 dark:text-white mb-3">Dispositivos</h2>
              <DeviceBars devices={devices} />
            </div>

            {/* Fuentes de tráfico */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-4">
              <h2 className="text-sm font-black text-gray-900 dark:text-white mb-3">Fuentes de tráfico</h2>
              <div className="space-y-2.5">
                {referrers?.map((ref) => {
                  const pct = topReferrer ? Math.round((ref.visits / topReferrer.visits) * 100) : 0;
                  return (
                    <div key={ref.source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{ref.icon}</span>{ref.source}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{fmtN(ref.visits)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: C.cyan + "aa" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Páginas + Detalle de sesiones ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">

          {/* Lista de páginas */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Páginas más visitadas</h2>
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                {pages.length} rutas
              </span>
            </div>
            <div className="p-2 max-h-[520px] overflow-y-auto custom-scrollbar">
              {pages.map((p, i) => (
                <PageRow
                  key={p.page}
                  page={p}
                  rank={i + 1}
                  maxViews={maxPageViews}
                  isSelected={selectedPage === p.page}
                  onClick={() => {
                    setSelectedPage(selectedPage === p.page ? null : p.page);
                    setSessionFilter("all");
                    setSearch("");
                    setSearchInput("");
                  }}
                />
              ))}
            </div>
          </div>

          {/* Panel de sesiones */}
          {activePage ? (
            <div className="space-y-4">
              {/* Header de página seleccionada */}
              <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">{activePage.label}</h2>
                    <code className="text-xs text-gray-400 dark:text-slate-500 font-mono">{activePage.page}</code>
                  </div>
                  <button
                    onClick={() => setSelectedPage(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.14] transition-colors flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* KPIs de la página */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {[
                    { label: "Vistas",    value: fmtN(activePage.views),    color: C.blue   },
                    { label: "Sesiones",  value: fmtN(activePage.sessions), color: C.purple },
                    { label: "Logueados", value: fmtN(activePage.loggedIn), color: C.green  },
                    { label: "Anónimos",  value: fmtN(activePage.anonymous),color: C.muted  },
                    { label: "T. prom.",  value: fmtSec(activePage.avgTime),color: C.amber  },
                    { label: "Rebote",    value: `${activePage.bounce}%`,
                      color: activePage.bounce > 60 ? C.red : activePage.bounce > 40 ? C.amber : C.green },
                  ].map((k) => (
                    <div key={k.label}
                      className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-2.5 text-center"
                      style={{ borderTop: `2px solid ${k.color}` }}>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-bold mb-1">{k.label}</p>
                      <p className="text-sm font-black" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Barra de dispositivos de la página */}
                <DeviceBars devices={activePage.devices} />
              </div>

              {/* Tabla de sesiones */}
              <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] flex flex-col sm:flex-row gap-3">
                  {/* Búsqueda */}
                  <div className="relative flex-1 max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                      value={searchInput}
                      onChange={handleSearch}
                      placeholder="Buscar usuario, dispositivo…"
                      className="w-full pl-8 pr-8 py-2 text-xs rounded-xl outline-none transition-all bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />
                    {searchInput && (
                      <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Filtros */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { k: "all",       l: `Todas (${sessions.length})`                           },
                      { k: "user",      l: `Con cuenta (${sessions.filter((s) => s.user).length})`  },
                      { k: "anon",      l: `Anónimas (${sessions.filter((s) => !s.user).length})`   },
                      { k: "converted", l: `Compraron (${sessions.filter((s) => s.converted).length})` },
                    ].map((f) => (
                      <button
                        key={f.k}
                        onClick={() => setSessionFilter(f.k)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${
                          sessionFilter === f.k
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-slate-500 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-slate-300"
                        }`}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs" style={{ minWidth: 400 }}>
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-white/[0.02]">
                        {["Disp.", "Usuario", "Fecha", "Tiempo", "Estado", ""].map((h, i) => (
                          <th key={i}
                            className={`px-4 py-2.5 text-left font-bold text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-white/[0.06] whitespace-nowrap ${
                              h === "Fecha"  ? "hidden sm:table-cell" :
                              h === "Estado" ? "hidden xs:table-cell" : ""
                            }`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.length > 0
                        ? filteredSessions.map((s, i) => (
                            <SessionRow key={s.sessionId} session={s} isLast={i === filteredSessions.length - 1} />
                          ))
                        : (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-sm text-gray-400 dark:text-slate-500">
                              Sin sesiones para este filtro
                            </td>
                          </tr>
                        )
                      }
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2 border-t border-gray-100 dark:border-white/[0.06]">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 text-right">
                    {filteredSessions.length} de {sessions.length} sesiones · Toca una fila para expandir
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder cuando no hay página seleccionada */
            <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.06] text-gray-400 dark:text-slate-600">
              <MousePointerClick size={28} />
              <div className="text-center">
                <p className="text-sm font-semibold">Selecciona una página</p>
                <p className="text-xs mt-0.5">para ver las sesiones en detalle</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
