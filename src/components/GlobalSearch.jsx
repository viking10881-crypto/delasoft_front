// src/components/GlobalSearch.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, Package, Users, ShoppingBag, Truck,
  Wallet, BarChart3, Tags, Image, Sliders, FileText,
  Settings, Home, ArrowRight, Clock, TrendingUp,
} from "lucide-react";
import api from "../services/api";

/* ── Navegación rápida (siempre disponible) ── */
const NAV_ITEMS = [
  { label: "Inicio",            to: "/",                    icon: Home,      color: "text-slate-500" },
  { label: "Analíticas",        to: "/analytics",           icon: BarChart3, color: "text-blue-500"  },
  { label: "Productos",         to: "/products",            icon: Package,   color: "text-orange-500"},
  { label: "Usuarios",          to: "/users",               icon: Users,     color: "text-violet-500"},
  { label: "Proveedores",       to: "/tools/providers",     icon: Truck,     color: "text-teal-500"  },
  { label: "Finanzas",          to: "/tools/finance",       icon: Wallet,    color: "text-emerald-500"},
  { label: "Registro de Ventas",to: "/sales",               icon: ShoppingBag,color:"text-pink-500"  },
  { label: "Historial",         to: "/history",             icon: FileText,  color: "text-slate-500" },
  { label: "Categorías",        to: "/tools/categories",    icon: Tags,      color: "text-yellow-500"},
  { label: "Banners",           to: "/tools/banners",       icon: Image,     color: "text-cyan-500"  },
  { label: "Promociones",       to: "/tools/discounts",     icon: Sliders,   color: "text-rose-500"  },
  { label: "Reportes",          to: "/reports",             icon: FileText,  color: "text-slate-500" },
  { label: "Configuración",     to: "/tools/settings",      icon: Settings,  color: "text-slate-500" },
];

function highlight(raw, query) {
  // Convierte cualquier valor a string seguro antes de renderizar
  const text = typeof raw === "string" ? raw : raw != null ? String(raw) : "";
  if (!text) return null;
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-slate-900 text-white rounded px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResultRow({ icon: Icon, iconColor = "text-slate-400", title, subtitle, badge, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
        active ? "bg-slate-900 text-white" : "hover:bg-slate-50"
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        active ? "bg-white/10" : "bg-slate-100"
      }`}>
        <Icon size={14} strokeWidth={2} className={active ? "text-white" : iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${active ? "text-white" : "text-slate-800"}`}>{title}</p>
        {subtitle && (
          <p className={`text-xs truncate mt-0.5 ${active ? "text-white/60" : "text-slate-400"}`}>{subtitle}</p>
        )}
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}>{badge}</span>
      )}
      <ArrowRight size={13} className={`flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
        active ? "text-white/50" : "text-slate-300"
      }`} />
    </button>
  );
}

function SectionLabel({ label }) {
  return (
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
      {label}
    </p>
  );
}

export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [rendered, setRendered] = useState(false); // para animación de entrada/salida
  const [visible, setVisible] = useState(false);

  /* ── Controla la animación: mount → visible → invisible → unmount ── */
  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* ── Foco automático al abrir ── */
  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [visible]);

  /* ── Cerrar con Escape ── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── Búsqueda en API con debounce ── */
  useEffect(() => {
    if (!query.trim()) { setProducts([]); setUsers([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [prodRes, userRes] = await Promise.allSettled([
          api.get(`/products?search=${encodeURIComponent(query)}&limit=4`),
          api.get(`/users?search=${encodeURIComponent(query)}&limit=3`),
        ]);
        setProducts(prodRes.status === "fulfilled" ? (prodRes.value.data?.data || prodRes.value.data || []) : []);
        setUsers(userRes.status === "fulfilled" ? (userRes.value.data?.data || userRes.value.data || []) : []);
      } catch (_) {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  /* ── Items planos para navegación por teclado ── */
  const navFiltered = query
    ? NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : NAV_ITEMS.slice(0, 5);

  const allItems = [
    ...products.map((p) => ({ type: "product", data: p })),
    ...users.map((u)   => ({ type: "user",    data: u })),
    ...navFiltered.map((n) => ({ type: "nav", data: n })),
  ];

  /* ── Navegación por teclado ── */
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allItems[activeIdx]) {
      const item = allItems[activeIdx];
      if (item.type === "nav")     go(item.data.to);
      if (item.type === "product") go(`/products/${item.data.id}`);
      if (item.type === "user")    go(`/users/${item.data.id}`);
    }
  };

  const go = useCallback((to) => { navigate(to); onClose(); }, [navigate, onClose]);

  if (!rendered) return null;

  const isEmpty = !query.trim();
  const hasResults = products.length > 0 || users.length > 0;
  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-250 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-xl bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden transition-all duration-280 ease-out ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-3 scale-[0.97]"
        }`}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search size={17} strokeWidth={2.5} className={`flex-shrink-0 transition-colors ${loading ? "text-blue-500 animate-pulse" : "text-slate-400"}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, usuarios, secciones…"
            className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto px-2 pb-3">

          {/* Estado vacío — sugerencias rápidas */}
          {isEmpty && (
            <>
              <SectionLabel label="Accesos rápidos" />
              {navFiltered.map((item) => {
                const idx = flatIdx++;
                return (
                  <ResultRow
                    key={item.to}
                    icon={item.icon}
                    iconColor={item.color}
                    title={item.label}
                    subtitle={item.to}
                    active={activeIdx === idx}
                    onClick={() => go(item.to)}
                  />
                );
              })}
              <div className="mx-3 mt-3 px-3 py-2.5 bg-slate-50 rounded-xl flex items-center gap-2">
                <TrendingUp size={13} className="text-slate-400" />
                <p className="text-xs text-slate-500">Escribe para buscar en productos, usuarios y más</p>
              </div>
            </>
          )}

          {/* Sin resultados */}
          {!isEmpty && !loading && !hasResults && navFiltered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <Search size={18} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Sin resultados para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Intenta con otro término</p>
            </div>
          )}

          {/* Productos */}
          {products.length > 0 && (
            <>
              <SectionLabel label={`Productos (${products.length})`} />
              {products.map((p) => {
                const idx = flatIdx++;
                const stock = p.stock ?? p.quantity ?? null;
                return (
                  <ResultRow
                    key={p.id}
                    icon={Package}
                    iconColor="text-orange-500"
                    title={highlight(p.name || p.nombre, query)}
                    subtitle={p.category_name || p.category?.name || "Producto"}
                    badge={
                      stock !== null
                        ? stock === 0 ? "Sin stock" : `Stock: ${stock}`
                        : p.price != null && !isNaN(Number(p.price))
                          ? `$${Number(p.price).toLocaleString("es-CO")}`
                          : undefined
                    }
                    active={activeIdx === idx}
                    onClick={() => go(`/products/${p.id}`)}
                  />
                );
              })}
            </>
          )}

          {/* Usuarios */}
          {users.length > 0 && (
            <>
              <SectionLabel label={`Usuarios (${users.length})`} />
              {users.map((u) => {
                const idx = flatIdx++;
                return (
                  <ResultRow
                    key={u.id}
                    icon={Users}
                    iconColor="text-violet-500"
                    title={highlight(u.name || u.nombre, query)}
                    subtitle={u.email || u.correo || ""}
                    badge={u.roles?.[0]?.name || u.roles?.[0] || u.role || undefined}
                    active={activeIdx === idx}
                    onClick={() => go(`/users/${u.id}`)}
                  />
                );
              })}
            </>
          )}

          {/* Navegación filtrada por query */}
          {!isEmpty && navFiltered.length > 0 && (
            <>
              <SectionLabel label="Secciones" />
              {navFiltered.map((item) => {
                const idx = flatIdx++;
                return (
                  <ResultRow
                    key={item.to}
                    icon={item.icon}
                    iconColor={item.color}
                    title={highlight(item.label, query)}
                    subtitle={item.to}
                    active={activeIdx === idx}
                    onClick={() => go(item.to)}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold">↑↓</kbd> navegar
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold">↵</kbd> abrir
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold">ESC</kbd> cerrar
          </div>
        </div>
      </div>
    </div>
  );
}