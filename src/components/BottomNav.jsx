// src/components/BottomNav.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect }               from "react";
import { useAuth }                           from "../context/AuthContext";
import { useSubscription }                   from "../context/SubscriptionContext";
import { usePendingProcurement }             from "../hooks/useProcurement";
import {
  Home, Package, ShoppingBag, Settings, Users,
  ChevronRight, ChevronDown, LayoutDashboard,
  BarChart3, FileText, Truck, Wallet, Calculator,
  Tags, Image, Sliders, X, KeyRound, Layers,
  MessageSquare, Bot, Mail, ShieldCheck,
  Crown, Sparkles, Lock, Star, CreditCard, UserRoundSearch,
} from "lucide-react";

// ─── Mapa feature → mensaje de upgrade ───────────────────────────
const FEATURE_UPGRADE_MSG = {
  analytics:         "Analíticas avanzadas",
  ai_agent:          "Agente IA",
  api_access:        "API Keys",
  financial_reports: "Reportes financieros",
  purchase_orders:   "Órdenes de compra",
  discount_system:   "Descuentos y promociones",
  custom_branding:   "Branding personalizado",
  wompi_payments:    "Pagos en línea",
  inventory:         "Gestión de inventario",
};

export default function BottomNav({ collapsed, setCollapsed }) {
  const { isSuperAdmin, user } = useAuth();
  const { canUse, subscription } = useSubscription();
  const navigate = useNavigate();
  const { data: pendingOrders } = usePendingProcurement();
  const procurementBadge = pendingOrders?.length || 0;

  const isOwner = isSuperAdmin() || user?.roles?.includes("admin");

  const [expandedSections, setExpandedSections] = useState({ tools: false, ventas: false, comunicacion: false });
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const location = useLocation();

  // ── Auto-collapse sidebar al cambiar de ruta ─────────────────────
  useEffect(() => {
    setMobileMenuOpen(false);
    if (!collapsed) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const toggleSection = (section) =>
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  // ── helper: ¿este ítem está bloqueado? ───────────────────────────
  const isLocked = (item) => {
    if (!item.feature) return false;
    if (isSuperAdmin()) return false;
    return !canUse(item.feature);
  };

  const navSections = [
    {
      title: "Dashboard",
      emoji: "📊",
      items: [
        { to: "/",          icon: Home,      label: "Inicio"     },
        { to: "/analytics", icon: BarChart3, label: "Analíticas", feature: "analytics" },
      ],
    },
    {
      title: "Inventario",
      emoji: "📦",
      items: [
        { to: "/products",        icon: Package, label: "Productos"  },
        { to: "/users",           icon: Users,   label: "Clientes"   },
        { to: "/tools/providers", icon: Truck,   label: "Proveedores", feature: "purchase_orders" },
        { to: "/tools/finance",   icon: Wallet,  label: "Finanzas",    feature: "financial_reports" },
        { to: "/tools/inventory", icon: LayoutDashboard, label: "Inventario", feature: "inventory" },
      ],
    },
    {
      title: "Ventas",
      emoji: "💰",
      collapsible: true,
      sectionKey: "ventas",
      items: [
        { to: "/sales",        icon: Calculator,    label: "Nueva venta" },
        { to: "/history",      icon: FileText,      label: "Historial"   },
        { to: "/procurement",  icon: ShoppingBag,   label: "Compras",    feature: "purchase_orders", badge: procurementBadge },
      ],
    },
    {
      title: "Tienda web",
      emoji: "🌐",
      collapsible: true,
      sectionKey: "tools",
      items: [
        { to: "/tools/categories",       icon: Tags,          label: "Categorías"        },
        { to: "/tools/banners",          icon: Image,         label: "Banners"           },
        { to: "/tools/discounts",        icon: Sliders,       label: "Promociones",       feature: "discount_system" },
        { to: "/tools/reviews",          icon: Star,          label: "Reseñas"            },
        { to: "/tools/contact-messages", icon: Mail,          label: "Mensajes de contacto" },
      ],
    },
    {
      title: "Comunicación",
      emoji: "💬",
      collapsible: true,
      sectionKey: "comunicacion",
      items: [
        { to: "/tools/chat",  icon: MessageSquare, label: "Chat"       },
        { to: "/tools/agent", icon: Bot,           label: "Agente IA", feature: "ai_agent" },
      ],
    },
    {
      title: "Configuración",
      emoji: "⚙️",
      items: [
        { to: "/tools/settings", icon: Settings, label: "Configuración" },
      ],
    },

    ...(isOwner ? [{
      title: "Mi Plan",
      emoji: "💎",
      items: [
        { to: "/subscription", icon: Crown,    label: "Mi Suscripción" },
        { to: "/pricing",      icon: Sparkles, label: "Ver planes"     },
      ],
    }] : []),

    ...(isSuperAdmin() ? [{
      title: "Superadmin",
      emoji: "🛡️",
      items: [
        { to: "/admins", icon: ShieldCheck, label: "Administradores" },
        { to: "/prospects", icon: UserRoundSearch, label: "Prospectos" },
        { to: "/subscription-orders", icon: CreditCard, label: "Contrataciones" },
      ],
    }] : []),
  ];

  const mobileNavItems = [
    { to: "/",         icon: Home,       label: "Inicio"    },
    { to: "/products", icon: Package,    label: "Productos" },
    { to: "/users",    icon: Users,      label: "Usuarios"  },
    { to: "/sales",    icon: ShoppingBag,label: "Ventas"    },
  ];

  // ── NavLink con soporte de bloqueo ───────────────────────────────
  function NavItem({ item, mobile = false }) {
    const locked = isLocked(item);

    if (locked) {
      return (
        <button
          onClick={() => navigate("/subscription")}
          className={`
            group relative flex items-center gap-3 w-full text-left
            ${mobile
              ? "px-4 py-3.5 rounded-2xl bg-transparent text-zinc-600 hover:bg-white/5"
              : "px-4 py-3 rounded-xl text-slate-600 hover:bg-white/5 hover:text-slate-500"
            }
            transition-all duration-300
          `}
          title={`Actualiza tu plan para usar ${FEATURE_UPGRADE_MSG[item.feature] ?? item.label}`}
        >
          {mobile ? (
            <>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/5">
                <item.icon size={16} strokeWidth={1.5} className="text-zinc-600" />
              </div>
              <span className="text-[14px] font-medium tracking-wide flex-1 text-zinc-600 line-through">
                {item.label}
              </span>
              <Lock size={13} className="text-zinc-600 shrink-0" />
            </>
          ) : (
            <>
              <item.icon size={18} strokeWidth={1.5} className="text-slate-600" />
              <span className="font-medium text-[13px] flex-1 tracking-wide line-through">
                {item.label}
              </span>
              <Lock size={12} className="text-slate-600" />
            </>
          )}

          {/* Tooltip desktop */}
          {!mobile && (
            <div className="
              absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
              hidden group-hover:block
              bg-white border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700 text-slate-900 dark:text-white
              text-xs rounded-xl px-3 py-2 w-44 shadow-2xl
            ">
              <p className="font-semibold mb-0.5">🔒 Función bloqueada</p>
              <p className="text-slate-600 dark:text-zinc-400">Actualiza tu plan para acceder a {FEATURE_UPGRADE_MSG[item.feature] ?? item.label}.</p>
            </div>
          )}
        </button>
      );
    }

    // Ítem normal
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) => mobile
          ? `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 active:scale-[0.98] ${
              isActive
                ? "bg-slate-900 dark:bg-white/10 text-white dark:text-white border border-slate-800 dark:border-white/10 shadow-sm"
                : "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            }`
          : `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
              isActive
                ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
            }`
        }
      >
        {({ isActive }) => mobile ? (
          <>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-md" : "bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400"}`}>
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
            </div>
            <span className={`text-[14px] font-medium tracking-wide flex-1 ${isActive ? "text-white dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center px-1 mr-1">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            <ChevronRight size={16} className={`transition-opacity ${isActive ? "opacity-100 text-white" : "opacity-30 text-slate-500 dark:text-slate-600"}`} />
          </>
        ) : (
          <>
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 to-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            )}
            <item.icon
              size={18}
              strokeWidth={isActive ? 2 : 1.5}
              className={isActive ? "text-white" : "text-slate-600 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-300"}
            />
            <span className="font-medium text-[13px] flex-1 tracking-wide">{item.label}</span>
            {item.badge > 0 && (
              <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center px-1">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            {!isActive && !item.badge && (
              <ChevronRight
                size={14}
                className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-600"
              />
            )}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <>
      {/* ════════════════════════════════════
          DESKTOP SIDEBAR
          ════════════════════════════════════ */}
      <aside
        className="
          hidden lg:flex lg:flex-col
          fixed left-0 top-0 h-screen w-[280px]
          bg-white dark:bg-[#0a0a0a]
          border-r border-slate-200 dark:border-white/5
          z-40 text-slate-900 dark:text-slate-300
          overflow-hidden
          transition-colors duration-300 ease-in-out
        "
        style={{ transform: collapsed ? "translateX(-100%)" : "translateX(0)" }}
      >
        {/* Logo */}
        <div className="h-24 flex items-center px-8 flex-shrink-0">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img
              src="/brand/delasoft-d.png"
              alt="Delasoft"
              className="w-14 h-14 object-contain group-hover:scale-105 transition-all duration-300 drop-shadow-lg"
            />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-widest uppercase">
              Delasoft
            </h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="mb-8">
              <div className="px-4 mb-4 flex items-center gap-2 opacity-60">
                <span className="text-[10px] grayscale">{section.emoji}</span>
                <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                  {section.title}
                </h3>
              </div>

              {section.collapsible ? (
                <>
                  <button
                    onClick={() => toggleSection(section.sectionKey)}
                    className="w-full flex items-center justify-between px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all duration-300 mb-1 group hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500 text-slate-600 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" strokeWidth={1.5} />
                      <span className="text-sm font-medium tracking-wide text-slate-700 dark:text-slate-200">Desplegar</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${expandedSections[section.sectionKey] ? "rotate-180 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-600"}`}
                    />
                  </button>
                  <div
                    className={`space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${
                      expandedSections[section.sectionKey] ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0"
                    }`}
                  >
                    {section.items.map(item => (
                      <div key={item.to} className="ml-4">
                        <NavItem item={item} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  {section.items.map(item => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Plan badge en el footer del sidebar */}
        {subscription && subscription.status !== "superadmin" && (
          <button
            onClick={() => navigate("/subscription")}
            className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                       border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 transition-colors group text-left bg-slate-50 dark:bg-white/5"
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: subscription.color ?? "#8B5CF6" }}
            >
              {subscription.plan_name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{subscription.plan_name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {subscription.status === "trial"
                  ? `Trial · vence pronto`
                  : subscription.status === "active"
                    ? "Activo"
                    : subscription.status}
              </p>
            </div>
            <Crown size={13} className="text-slate-600 dark:text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
          </button>
        )}

        <div className="p-6 pt-2 border-t border-slate-200 dark:border-white/10 flex-shrink-0">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
            © {new Date().getFullYear()} Delasoft
          </p>
        </div>
      </aside>

      {/* ════════════════════════════════════
          MOBILE BOTTOM NAV
          — posicionado en bottom-6, altura h-16
          — La barra de paginación usa bottom-24 para quedar sobre él
          ════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-around px-2 h-16 transition-colors duration-300">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-300 ${
                  isActive ? "bg-slate-900 dark:bg-white/10 text-white dark:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center gap-1">
                  <div className={`transition-all duration-500 ease-out ${isActive ? "-translate-y-1 scale-110 drop-shadow-md" : "translate-y-1 scale-100"}`}>
                    <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={`text-[9px] font-medium tracking-wider absolute -bottom-3 transition-all duration-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}

          <div className="w-px h-8 bg-slate-300 dark:bg-white/10 mx-1 flex-shrink-0" />

          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all duration-300 ${mobileMenuOpen ? "bg-slate-900 dark:bg-white/10 text-white" : "text-slate-600 dark:text-slate-400"}`}
          >
            <div className={`transition-all duration-500 ease-out ${mobileMenuOpen ? "rotate-90 scale-110" : "scale-100"}`}>
              <Layers size={20} strokeWidth={1.5} />
            </div>
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════
          MOBILE DRAWER
          ════════════════════════════════════ */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`lg:hidden fixed inset-0 z-[60] transition-all duration-500 ${
          mobileMenuOpen
            ? "bg-black/60 backdrop-blur-sm pointer-events-auto opacity-100"
            : "bg-black/0 backdrop-blur-none pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[70] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
          mobileMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white dark:bg-[#0a0a0a] rounded-t-[2.5rem] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.8)] max-h-[85vh] flex flex-col border-t border-slate-200 dark:border-white/10 transition-colors duration-300">
          <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img
                src="/brand/delasoft-d.png"
                alt="Delasoft"
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium tracking-widest uppercase">Control Center DELASOFT</p>
                {subscription && subscription.status !== "superadmin" && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate("/subscription"); }}
                    className="flex items-center gap-1 mt-1"
                  >
                    <Crown size={10} className="text-violet-500" />
                    <span className="text-[10px] text-violet-500 font-semibold">{subscription.plan_name}</span>
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all hover:bg-white/10"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-28 custom-scrollbar">
            {navSections.map((section, idx) => (
              <div key={idx} className="bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-3xl p-4 backdrop-blur-sm transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <span className="text-sm opacity-70 grayscale">{section.emoji}</span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
                    {section.title}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {section.items.map(item => (
                    <NavItem key={item.to} item={item} mobile />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
