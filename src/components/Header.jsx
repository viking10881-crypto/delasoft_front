import {
  LogOut, Search, Sun, Moon,
  PanelLeftClose, PanelLeftOpen,
  Building2, ChevronDown, Settings,
  Command, Sparkles
} from "lucide-react";
import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import useRealtimeData from "../hooks/useRealtimeData";
import GlobalSearch from "./GlobalSearch";
import NotificationsPanel from "./NotificationsPanel";
import api from "../services/api";

const FALLBACK_LOGO =
  "/brand/delasoft-d.png";

export default function Header({ collapsed, onToggleSidebar }) {
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const { user, logout, isSuperAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(FALLBACK_LOGO);

  /* ── Cargar logo del negocio ── */
  const loadLogo = useCallback(() => {
    if (!user?.id) return;
    api.get("/admin-profile")
      .then(res => {
        const url = res.data?.data?.logo_url;
        if (url) setLogoUrl(url);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { loadLogo(); }, [loadLogo]);

  // Actualización en tiempo real sin recargar
  useRealtimeData(["admin_profile"], loadLogo);

  /* ── Altura del header ── */
  const syncHeight = useCallback(() => {
    if (ref.current) {
      document.documentElement.style.setProperty(
        "--header-height",
        `${ref.current.offsetHeight}px`
      );
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches");
    setCurrentDate(
      new Date()
        .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
        .toUpperCase()
    );
    syncHeight();
    window.addEventListener("resize", syncHeight);
    return () => window.removeEventListener("resize", syncHeight);
  }, [syncHeight]);

  /* ── Cmd+K ── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Cerrar dropdown al click afuera ── */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const roleName = user?.roles?.[0]?.name ?? user?.roles?.[0] ?? "Admin";
  const email = user?.email ?? "";

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  /* ── Avatar Premium ── */
  const AvatarLogo = ({ size = "w-9 h-9 sm:w-10 sm:h-10", withDot = true }) => (
    <div className={`
      relative ${size} rounded-full flex-shrink-0
      bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-[#1A1D24] dark:to-[#0D1117]
      border-[1.5px] border-white/50 dark:border-white/10
      shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)]
      flex items-center justify-center overflow-visible
      transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_15px_rgba(0,0,0,0.12)]
    `}>
      <img
        src={logoUrl}
        alt="Logo"
        className="w-full h-full object-contain rounded-full p-0.5"
        onError={() => setLogoUrl(FALLBACK_LOGO)}
      />
      {withDot && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-[1.5px] border-white dark:border-[#0D1117]"></span>
        </span>
      )}
    </div>
  );

  return (
    <>
      <header
        ref={ref}
        className="
          fixed top-0 right-0 z-50
          bg-white/70 dark:bg-[#0A0A0A]/70
          backdrop-blur-xl backdrop-saturate-150
          border-b border-black/[0.04] dark:border-white/[0.04]
          transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
        "
        style={{ left: collapsed ? "0px" : "280px" }}
      >
        <div className="flex items-center justify-between h-16 sm:h-[72px] px-4 sm:px-8">

          {/* ── Izquierda: Menú y Saludo ── */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            
            {/* Toggle sidebar */}
            <button
              onClick={onToggleSidebar}
              title={collapsed ? "Mostrar menú" : "Ocultar menú"}
              className="
                hidden lg:flex items-center justify-center
                w-10 h-10 rounded-2xl flex-shrink-0
                text-slate-400 hover:text-slate-900 dark:hover:text-white
                bg-transparent hover:bg-black/5 dark:hover:bg-white/10
                active:scale-95 transition-all duration-200
              "
            >
              {collapsed
                ? <PanelLeftOpen size={18} strokeWidth={2.5} />
                : <PanelLeftClose size={18} strokeWidth={2.5} />
              }
            </button>

            {/* Saludo (Estilo Dashboard Premium) */}
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-medium text-slate-500 dark:text-slate-400 tracking-tight truncate leading-tight flex items-center gap-1.5">
                {greeting}, 
                {firstName && (
                  <span className="font-bold text-slate-900 dark:text-white bg-clip-text">
                    {firstName}
                  </span>
                )}
                <Sparkles size={14} className="text-brand hidden sm:block" />
              </h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400/80 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap hidden sm:block">
                {currentDate}
              </p>
            </div>
          </div>

          {/* ── Derecha: Controles y Perfil ── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            {/* Buscador Estilo Spotlight */}
            <div className="hidden sm:flex items-center">
              <button
                onClick={() => setSearchOpen(true)}
                className="
                  flex items-center justify-between gap-3 px-3 py-2 w-48 lg:w-60
                  text-slate-400 bg-slate-100/50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]
                  border border-slate-200/50 dark:border-white/[0.05]
                  rounded-xl transition-all duration-200 active:scale-[0.98] group
                "
              >
                <div className="flex items-center gap-2">
                  <Search size={16} strokeWidth={2} className="group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  <span className="text-[13px] font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    Buscar...
                  </span>
                </div>
                <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-black/50 text-slate-400 text-[10px] font-bold rounded-md border border-slate-200/80 dark:border-white/[0.05] shadow-sm">
                  <Command size={10} /> K
                </kbd>
              </button>
            </div>

            {/* Búsqueda móvil */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>

            {/* Dark mode */}
            <button
              onClick={toggle}
              title={dark ? "Modo claro" : "Modo oscuro"}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-200 relative overflow-hidden"
            >
              <div className={`absolute transition-all duration-500 ${dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
                <Moon size={18} strokeWidth={2.5} />
              </div>
              <div className={`absolute transition-all duration-500 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                <Sun size={18} strokeWidth={2.5} className="text-white" />
              </div>
            </button>

            <NotificationsPanel />

            <div className="hidden sm:block w-px h-8 bg-slate-200/80 dark:bg-white/[0.08] mx-2" />

            {/* ── Dropdown Perfil ── */}
            <div className="relative" ref={dropdownRef}>
              
              {/* Trigger */}
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 sm:gap-3 rounded-2xl p-1 pr-2 sm:pr-3 hover:bg-black/5 dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200 group"
              >
                <AvatarLogo withDot={true} />
                
                <div className="text-left hidden sm:block">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user?.name ?? "Administrador"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    {roleName}
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  strokeWidth={3}
                  className={`hidden sm:block text-slate-300 dark:text-slate-600 transition-transform duration-300 ease-out flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Panel Flotante (Glassmorphism) */}
              <div
                className={`
                  absolute right-0 top-[calc(100%+8px)] w-72
                  bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-2xl backdrop-saturate-200
                  border border-black/[0.08] dark:border-white/[0.08]
                  rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]
                  overflow-hidden z-50 origin-top-right
                  transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                  ${dropdownOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }
                `}
              >
                {/* Cabecera */}
                <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.04] bg-slate-50/30 dark:bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <AvatarLogo size="w-12 h-12" withDot={false} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user?.name ?? "Administrador"}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {email}
                      </p>
                      <span className="inline-flex mt-1.5 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-md">
                        {roleName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => handleNavigate("/tools/business-profile")}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1D24] shadow-sm border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-shadow">
                      <Building2 size={16} strokeWidth={2} className="text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                        Perfil del negocio
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        Identidad y preferencias
                      </p>
                    </div>
                  </button>

                  {isSuperAdmin?.() && (
                    <button
                      onClick={() => handleNavigate("/setup")}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1D24] shadow-sm border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-shadow">
                        <Settings size={16} strokeWidth={2} className="text-slate-700 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                          Configuración
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          Parámetros del sistema
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                <div className="border-t border-black/[0.04] dark:border-white/[0.04]" />

                {/* Logout */}
                <div className="p-2">
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors">
                      <LogOut size={16} strokeWidth={2} className="text-red-600 dark:text-red-500" />
                    </div>
                    <p className="text-[13px] font-semibold text-red-600 dark:text-red-500">
                      Cerrar sesión
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
