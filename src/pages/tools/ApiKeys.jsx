// pages/tools/ApiKeys.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useNotice } from "../../context/NoticeContext";
import {
  KeyRound, Plus, Copy, Check, Eye, EyeOff,
  ToggleLeft, ToggleRight, RefreshCw, Trash2,
  Loader2, X, AlertTriangle, Activity, Clock,
  Terminal, Zap, Book, ChevronDown, ChevronUp,
  Globe, Code2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://tu-backend.com";
const PUBLIC_BASE = `${API_BASE}/public-api/v1`;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const PERM_LABELS = {
  "products:read":   "Ver productos",
  "categories:read": "Ver categorías",
  "inventory:read":  "Ver inventario",
  "sales:read":      "Ver ventas",
  "sales:write":     "Crear ventas",
  "customers:read":  "Ver clientes",
  "all":             "Acceso completo",
};

const PERM_COLORS = {
  "products:read":   "blue",
  "categories:read": "cyan",
  "inventory:read":  "teal",
  "sales:read":      "emerald",
  "sales:write":     "orange",
  "customers:read":  "violet",
  "all":             "rose",
};

const permBadge = (perm) => {
  const color = PERM_COLORS[perm] ?? "gray";
  const map = {
    blue:    "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    cyan:    "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20",
    teal:    "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    orange:  "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
    violet:  "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
    rose:    "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
    gray:    "bg-gray-50 dark:bg-white/[0.05] text-gray-600 dark:text-slate-400 border-gray-200 dark:border-white/[0.08]",
  };
  return map[color];
};

const inputCls = `
  w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm
  bg-slate-100 dark:bg-white/[0.06] border border-transparent
  text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600
  focus:bg-white dark:focus:bg-white/[0.09]
  focus:border-amber-500 dark:focus:border-amber-500/60
  focus:ring-2 focus:ring-amber-500/10
`;

const EMPTY_FORM = {
  name:            "",
  description:     "",
  permissions:     ["products:read"],
  allowed_origins: "",
  expires_at:      "",
};

// ─── Endpoints de documentación ───────────────────────────────
const ENDPOINTS = [
  {
    method: "GET",
    path: "/ping",
    label: "Health check",
    permission: null,
    description: "Verifica que tu API Key es válida.",
    response: `{ "success": true, "api_key": "Mi tienda", "permissions": ["products:read"] }`,
  },
  {
    method: "GET",
    path: "/products",
    label: "Listar productos",
    permission: "products:read",
    description: "Retorna los productos activos de tu tienda. Parámetros opcionales: ?category=slug, ?search=texto, ?page=1, ?limit=20, ?sort=name|price_asc|price_desc|newest",
    response: `{ "success": true, "data": [...], "meta": { "total": 50, "page": 1, "limit": 20, "pages": 3 } }`,
  },
  {
    method: "GET",
    path: "/products/:id",
    label: "Detalle de producto",
    permission: "products:read",
    description: "Retorna un producto con todas sus imágenes y variantes.",
    response: `{ "success": true, "data": { "id": 1, "name": "...", "images": [...], "variants": [...] } }`,
  },
  {
    method: "GET",
    path: "/categories",
    label: "Listar categorías",
    permission: "categories:read",
    description: "Retorna las categorías activas con conteo de productos.",
    response: `{ "success": true, "data": [{ "id": 1, "name": "Ropa", "slug": "ropa", "product_count": 12 }] }`,
  },
  {
    method: "GET",
    path: "/inventory",
    label: "Inventario",
    permission: "inventory:read",
    description: "Stock actual de todos los productos. Agrega ?low_stock=true para ver solo los que están por debajo del mínimo.",
    response: `{ "success": true, "data": [{ "id": 1, "name": "...", "stock": 5, "stock_status": "low" }] }`,
  },
  {
    method: "GET",
    path: "/banners",
    label: "Banners activos",
    permission: null,
    description: "Banners activos ordenados por display_order. Úsalos para el carrusel de tu tienda.",
    response: `{ "success": true, "data": [{ "id": 1, "title": "...", "image_url": "...", "button_link": "..." }] }`,
  },
  {
    method: "GET",
    path: "/discounts",
    label: "Descuentos activos",
    permission: null,
    description: "Descuentos activos en el momento de la consulta (fecha válida y usos disponibles).",
    response: `{ "success": true, "data": [{ "id": 1, "code": "VERANO20", "type": "percentage", "value": 20 }] }`,
  },
  {
    method: "POST",
    path: "/discounts/validate",
    label: "Validar cupón",
    permission: null,
    description: "Valida un código de descuento y calcula el monto a descontar.",
    body: `{ "code": "VERANO20", "amount": 150000 }`,
    response: `{ "success": true, "data": { "discount_amount": 30000, "final_amount": 120000 } }`,
  },
  {
    method: "GET",
    path: "/sales",
    label: "Historial de ventas",
    permission: "sales:read",
    description: "Ventas registradas en tu tienda. Parámetros: ?status=pending|paid|partial, ?page, ?limit",
    response: `{ "success": true, "data": [...] }`,
  },
  {
    method: "POST",
    path: "/sales",
    label: "Crear venta",
    permission: "sales:write",
    description: "Registra una venta desde tu tienda web. Descuenta stock automáticamente.",
    body: `{
  "items": [{ "product_id": 1, "quantity": 2 }],
  "customer_phone": "3001234567",
  "shipping_address": "Calle 123",
  "shipping_city": "Medellín",
  "payment_method": "transfer",
  "coupon_code": "VERANO20"
}`,
    response: `{ "success": true, "data": { "sale_id": 45, "sale_number": "WEB-1-...", "total": 120000 } }`,
  },
  {
    method: "GET",
    path: "/customers",
    label: "Clientes",
    permission: "customers:read",
    description: "Lista de clientes de tu tienda con total de pedidos y gasto acumulado.",
    response: `{ "success": true, "data": [{ "id": 1, "name": "...", "total_orders": 3, "total_spent": 450000 }] }`,
  },
];

// ─── Componente principal ──────────────────────────────────────
export default function ApiKeys() {
  const { showNotice, askConfirmation } = useNotice();

  const [keys,         setKeys]         = useState([]);
  const [permsMap,     setPermsMap]     = useState(PERM_LABELS);
  const [loading,      setLoading]      = useState(true);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [newKey,       setNewKey]       = useState(null);
  const [toggling,     setToggling]     = useState(null);
  const [rotating,     setRotating]     = useState(null);
  const [expandedLogs, setExpandedLogs] = useState(null);
  const [logs,         setLogs]         = useState({});
  const [loadingLogs,  setLoadingLogs]  = useState(false);
  const [activeTab,    setActiveTab]    = useState("keys"); // "keys" | "docs"

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, permsRes] = await Promise.all([
        api.get("/api-keys"),
        api.get("/api-keys/permissions"),
      ]);
      setKeys(keysRes.data?.data ?? []);
      if (permsRes.data?.data) setPermsMap(permsRes.data.data);
    } catch {
      showNotice("Error al cargar API Keys", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const origins = formData.allowed_origins
        .split(",").map((s) => s.trim()).filter(Boolean);

      const { data } = await api.post("/api-keys", {
        name:            formData.name.trim(),
        description:     formData.description.trim() || undefined,
        permissions:     formData.permissions,
        allowed_origins: origins,
        expires_at:      formData.expires_at || undefined,
      });

      setNewKey(data.data.api_key);
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchKeys();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al crear API Key", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (key) => {
    setToggling(key.id);
    try {
      await api.patch(`/api-keys/${key.id}/toggle`);
      setKeys((prev) => prev.map((k) => k.id === key.id ? { ...k, is_active: !k.is_active } : k));
      showNotice(`Key ${key.is_active ? "desactivada" : "activada"}`, "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error", "error");
    } finally {
      setToggling(null);
    }
  };

  const handleRotate = async (key) => {
    const confirmed = await askConfirmation(
      "¿Rotar API Key?",
      `La clave actual de "${key.name}" dejará de funcionar inmediatamente.`
    );
    if (!confirmed) return;
    setRotating(key.id);
    try {
      const { data } = await api.post(`/api-keys/${key.id}/rotate`);
      setNewKey(data.data.api_key);
      fetchKeys();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al rotar", "error");
    } finally {
      setRotating(null);
    }
  };

  const handleDelete = async (key) => {
    const confirmed = await askConfirmation(
      "¿Eliminar API Key?",
      `"${key.name}" se eliminará permanentemente.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/api-keys/${key.id}`);
      setKeys((prev) => prev.filter((k) => k.id !== key.id));
      showNotice("API Key eliminada", "success");
    } catch (err) {
      showNotice(err.response?.data?.message || "Error al eliminar", "error");
    }
  };

  const toggleLogs = async (keyId) => {
    if (expandedLogs === keyId) { setExpandedLogs(null); return; }
    setExpandedLogs(keyId);
    if (logs[keyId]) return;
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/api-keys/${keyId}/logs?limit=20`);
      setLogs((prev) => ({ ...prev, [keyId]: data.data ?? [] }));
    } catch {
      showNotice("Error al cargar logs", "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  const togglePerm = (perm) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] pb-24">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <KeyRound size={14} className="text-amber-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">
                Integraciones
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              API Keys
            </h1>
            <p className="text-gray-500 dark:text-slate-500 font-medium text-sm mt-1">
              Conecta tu tienda web con tu panel de administración
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {activeTab === "keys" && (
              <>
                <div className="hidden md:flex flex-col items-end px-4">
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">
                    Keys activas
                  </span>
                  <span className="text-xl font-black text-gray-900 dark:text-white">
                    {keys.filter((k) => k.is_active).length}
                    <span className="text-sm font-medium text-gray-400 dark:text-slate-600">
                      /{keys.length}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => { setFormData(EMPTY_FORM); setIsModalOpen(true); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 font-bold text-sm transition-all active:scale-95"
                >
                  <Plus size={18} /> Nueva API Key
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl w-fit">
          {[
            { id: "keys", label: "Mis Keys", icon: <KeyRound size={14} /> },
            { id: "docs", label: "Documentación",  icon: <Book size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: KEYS ── */}
        {activeTab === "keys" && (
          <>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <Zap size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Cada key da acceso <strong>únicamente a tus datos</strong>. Úsalas en tu tienda web, app o POS.
                La clave completa se muestra <strong>una sola vez</strong> al crearla.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin mb-3 text-amber-500" size={32} />
                <p className="font-medium text-sm text-gray-400">Cargando API Keys...</p>
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/[0.06]">
                <KeyRound className="mx-auto mb-3 text-gray-300 dark:text-slate-700" size={40} />
                <p className="text-gray-400 dark:text-slate-600 font-bold">No tienes API Keys todavía</p>
                <p className="text-gray-400 dark:text-slate-600 text-sm mt-1 mb-4">
                  Crea una para integrar tu tienda.
                </p>
                <button
                  onClick={() => { setFormData(EMPTY_FORM); setIsModalOpen(true); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Crear primera key
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => (
                  <KeyCard
                    key={key.id}
                    apiKey={key}
                    isToggling={toggling === key.id}
                    isRotating={rotating === key.id}
                    logsExpanded={expandedLogs === key.id}
                    logs={logs[key.id]}
                    loadingLogs={loadingLogs && expandedLogs === key.id}
                    onToggle={handleToggle}
                    onRotate={handleRotate}
                    onDelete={handleDelete}
                    onToggleLogs={toggleLogs}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB: DOCS ── */}
        {activeTab === "docs" && (
          <DocsPanel publicBase={PUBLIC_BASE} />
        )}
      </main>

      {isModalOpen && (
        <CreateModal
          formData={formData}
          isSaving={isSaving}
          permsMap={permsMap}
          onTogglePerm={togglePerm}
          onChange={(f, v) => setFormData((p) => ({ ...p, [f]: v }))}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {newKey && (
        <NewKeyModal apiKey={newKey} onClose={() => setNewKey(null)} />
      )}
    </div>
  );
}

// ─── Panel de documentación ───────────────────────────────────
function DocsPanel({ publicBase }) {
  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const [expandedEp,    setExpandedEp]    = useState(null);

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const methodColor = {
    GET:  "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    POST: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  const jsExample = `// Ejemplo con fetch (JavaScript)
const API_KEY = "ak_xxxxxxxx_...";  // Tu API Key
const BASE    = "${publicBase}";

// Obtener productos
const res  = await fetch(\`\${BASE}/products?page=1&limit=20\`, {
  headers: { "X-API-Key": API_KEY }
});
const data = await res.json();
console.log(data.data); // array de productos

// Crear venta
const order = await fetch(\`\${BASE}/sales\`, {
  method:  "POST",
  headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    items: [{ product_id: 1, quantity: 2 }],
    customer_phone:  "3001234567",
    shipping_address: "Calle 123 #45-67",
    shipping_city:    "Medellín",
    payment_method:   "transfer",
  }),
});`;

  const axiosExample = `// Ejemplo con Axios
import axios from "axios";

const client = axios.create({
  baseURL: "${publicBase}",
  headers: { "X-API-Key": "ak_xxxxxxxx_..." },
});

// Obtener categorías
const { data } = await client.get("/categories");

// Validar cupón
const { data: coupon } = await client.post("/discounts/validate", {
  code: "VERANO20", amount: 150000,
});
console.log(coupon.data.discount_amount); // monto descontado`;

  return (
    <div className="space-y-6">

      {/* Base URL */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-amber-500" />
          <h2 className="font-black text-gray-900 dark:text-white">URL Base</h2>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/30 rounded-2xl px-4 py-3 font-mono text-sm">
          <code className="text-amber-500 flex-1 break-all">{publicBase}</code>
          <button
            onClick={() => copy(publicBase, "baseurl")}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            {copiedSnippet === "baseurl" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            <strong>Autenticación:</strong> Incluye el header{" "}
            <code className="bg-blue-100 dark:bg-blue-500/20 px-1.5 py-0.5 rounded font-mono">X-API-Key: ak_xxxxxxxx_...</code>{" "}
            en cada request. Sin él, recibirás un <code>401</code>.
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
          <Terminal size={16} className="text-amber-500" />
          <h2 className="font-black text-gray-900 dark:text-white">Endpoints disponibles</h2>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {ENDPOINTS.map((ep, i) => {
            const isOpen = expandedEp === i;
            const fullUrl = `${publicBase}${ep.path}`;

            return (
              <div key={i}>
                <button
                  onClick={() => setExpandedEp(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors text-left"
                >
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg w-12 text-center flex-shrink-0 ${methodColor[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-gray-700 dark:text-slate-300 flex-1">
                    {ep.path}
                  </code>
                  <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block flex-shrink-0">
                    {ep.label}
                  </span>
                  {ep.permission && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border hidden md:inline-flex ${permBadge(ep.permission)}`}>
                      {PERM_LABELS[ep.permission]}
                    </span>
                  )}
                  {isOpen
                    ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
                    : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 space-y-3 bg-gray-50/50 dark:bg-white/[0.01]">
                    <p className="text-xs text-gray-500 dark:text-slate-400">{ep.description}</p>

                    {/* URL completa */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/30 rounded-xl px-3 py-2">
                      <code className="text-xs font-mono text-gray-600 dark:text-slate-400 flex-1 break-all">
                        {fullUrl}
                      </code>
                      <button onClick={() => copy(fullUrl, `url-${i}`)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex-shrink-0">
                        {copiedSnippet === `url-${i}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Body */}
                    {ep.body && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Body (JSON)</p>
                        <div className="relative bg-gray-950 dark:bg-black/50 rounded-xl p-3 border border-gray-800 dark:border-white/[0.06]">
                          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">{ep.body}</pre>
                          <button
                            onClick={() => copy(ep.body, `body-${i}`)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-white transition-colors"
                          >
                            {copiedSnippet === `body-${i}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Respuesta</p>
                      <div className="relative bg-gray-950 dark:bg-black/50 rounded-xl p-3 border border-gray-800 dark:border-white/[0.06]">
                        <pre className="text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ejemplos de código */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
          <Code2 size={16} className="text-amber-500" />
          <h2 className="font-black text-gray-900 dark:text-white">Ejemplos de código</h2>
        </div>

        <div className="p-6 space-y-4">
          {[
            { key: "fetch",  label: "fetch (nativo)", code: jsExample },
            { key: "axios",  label: "Axios",          code: axiosExample },
          ].map((ex) => (
            <div key={ex.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {ex.label}
                </span>
                <button
                  onClick={() => copy(ex.code, ex.key)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  {copiedSnippet === ex.key
                    ? <><Check size={12} className="text-emerald-400" /> Copiado</>
                    : <><Copy size={12} /> Copiar</>
                  }
                </button>
              </div>
              <div className="bg-gray-950 dark:bg-black/50 rounded-2xl p-4 border border-gray-800 dark:border-white/[0.06] overflow-x-auto">
                <pre className="text-xs font-mono text-gray-300 whitespace-pre">{ex.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nota de CORS */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.07]">
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
          <p><strong className="text-gray-700 dark:text-slate-300">CORS:</strong> Si consumes la API desde un navegador, agrega tu dominio en <strong>Orígenes permitidos</strong> al crear la key.</p>
          <p><strong className="text-gray-700 dark:text-slate-300">Errores comunes:</strong> <code className="bg-gray-100 dark:bg-white/[0.08] px-1 rounded">401</code> = key inválida o faltante. <code className="bg-gray-100 dark:bg-white/[0.08] px-1 rounded">403</code> = sin permiso para ese endpoint. <code className="bg-gray-100 dark:bg-white/[0.08] px-1 rounded">404</code> = recurso no encontrado.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de key ───────────────────────────────────────────
function KeyCard({ apiKey, isToggling, isRotating, logsExpanded, logs, loadingLogs, onToggle, onRotate, onDelete, onToggleLogs }) {
  const perms = apiKey.permissions ?? [];

  return (
    <div className={`bg-white dark:bg-white/[0.03] border rounded-3xl overflow-hidden transition-all duration-300
      ${apiKey.is_active
        ? "border-gray-100 dark:border-white/[0.07]"
        : "border-red-100 dark:border-red-500/20 opacity-60"}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
              ${apiKey.is_active ? "bg-amber-50 dark:bg-amber-500/10" : "bg-gray-100 dark:bg-white/[0.05]"}`}>
              <KeyRound size={18} className={apiKey.is_active ? "text-amber-500" : "text-gray-400"} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{apiKey.name}</h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md
                  ${apiKey.is_active
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"}`}>
                  {apiKey.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <code className="text-xs font-mono text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-md mt-1 inline-block">
                {apiKey.key_prefix}_••••••••••••••••
              </code>
              {apiKey.description && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{apiKey.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onToggle(apiKey)}
              disabled={isToggling}
              title={apiKey.is_active ? "Desactivar" : "Activar"}
              className={`p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08]
                ${apiKey.is_active
                  ? "text-emerald-500 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                  : "text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white"}`}
            >
              {isToggling ? <Loader2 size={14} className="animate-spin" /> : apiKey.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>

            <button
              onClick={() => onRotate(apiKey)}
              disabled={isRotating}
              title="Rotar clave"
              className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:bg-amber-500 hover:border-amber-500 hover:text-white"
            >
              {isRotating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>

            <button
              onClick={() => onToggleLogs(apiKey.id)}
              title="Ver logs"
              className={`p-2 rounded-full transition-all border border-gray-200 dark:border-white/[0.08]
                ${logsExpanded
                  ? "bg-gray-800 dark:bg-white/[0.15] text-white"
                  : "bg-gray-50 dark:bg-white/[0.06] text-gray-400 hover:bg-gray-800 hover:border-gray-800 hover:text-white"}`}
            >
              <Terminal size={14} />
            </button>

            <button
              onClick={() => onDelete(apiKey)}
              className="p-2 rounded-full transition-all border bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:bg-red-500 hover:border-red-500 hover:text-white"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Activity size={11} />
              <strong className="text-gray-700 dark:text-slate-300">{apiKey.request_count ?? 0}</strong> requests
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Usado: <strong className="text-gray-700 dark:text-slate-300">{formatDateTime(apiKey.last_used_at)}</strong>
            </span>
            {apiKey.expires_at && (
              <span className="flex items-center gap-1 text-orange-400">
                <AlertTriangle size={11} />
                Expira: {formatDate(apiKey.expires_at)}
              </span>
            )}
          </div>

          <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-white/[0.08]" />

          <div className="flex flex-wrap gap-1.5">
            {perms.map((perm) => (
              <span key={perm} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${permBadge(perm)}`}>
                {PERM_LABELS[perm] ?? perm}
              </span>
            ))}
          </div>
        </div>
      </div>

      {logsExpanded && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
            Últimos 20 requests
          </p>
          {loadingLogs ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <Loader2 size={14} className="animate-spin" /> Cargando logs...
            </div>
          ) : !logs || logs.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-600 py-4 text-center">Sin actividad registrada aún</p>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                  <span className={`font-bold w-10 text-center ${log.status_code >= 400 ? "text-red-500" : "text-emerald-500"}`}>
                    {log.status_code ?? "—"}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 w-12">{log.method}</span>
                  <span className="text-gray-600 dark:text-slate-400 flex-1 truncate">{log.endpoint}</span>
                  <span className="text-gray-400 dark:text-slate-600 hidden sm:block">{log.ip_address}</span>
                  <span className="text-gray-400 dark:text-slate-600">{formatDateTime(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal crear key ──────────────────────────────────────────
function CreateModal({ formData, isSaving, permsMap, onTogglePerm, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-[#161b27]">
        <div className="px-7 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center bg-gray-50 dark:bg-white/[0.03]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <KeyRound size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Nueva Key</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Crear API Key</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              La clave completa se mostrará <strong>una sola vez</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Nombre *</label>
            <input required placeholder="Mi tienda web" value={formData.name} onChange={(e) => onChange("name", e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Descripción</label>
            <input placeholder="Para qué se usa esta key" value={formData.description} onChange={(e) => onChange("description", e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Permisos *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(permsMap).map(([perm, label]) => {
                const active = formData.permissions.includes(perm);
                return (
                  <button
                    key={perm} type="button" onClick={() => onTogglePerm(perm)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all
                      ${active ? `${permBadge(perm)} border-current` : "bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-slate-600 border-gray-200 dark:border-white/[0.07] hover:border-gray-300"}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? "border-current" : "border-gray-300 dark:border-slate-600"}`}>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
            {formData.permissions.length === 0 && (
              <p className="text-xs text-red-400">Selecciona al menos un permiso</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Orígenes permitidos <span className="font-normal normal-case">(opcional, separados por comas)</span>
            </label>
            <input placeholder="https://mitienda.com, https://app.mitienda.com" value={formData.allowed_origins} onChange={(e) => onChange("allowed_origins", e.target.value)} className={inputCls} />
            <p className="text-[10px] text-gray-400 dark:text-slate-600">Si dejas vacío, se aceptan peticiones de cualquier origen.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Expira el <span className="font-normal normal-case">(opcional)</span>
            </label>
            <input type="datetime-local" value={formData.expires_at} onChange={(e) => onChange("expires_at", e.target.value)} className={inputCls} />
          </div>

          <div className="sticky bottom-0 pt-2 bg-white dark:bg-[#161b27]">
            <button
              type="submit"
              disabled={isSaving || formData.permissions.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
            >
              {isSaving ? <><Loader2 size={18} className="animate-spin" /> Generando...</> : <><KeyRound size={18} /> Generar API Key</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal clave nueva ────────────────────────────────────────
function NewKeyModal({ apiKey, onClose }) {
  const [copied,  setCopied]  = useState(false);
  const [visible, setVisible] = useState(true);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-md rounded-3xl shadow-2xl bg-white dark:bg-[#161b27] overflow-hidden">
        <div className="px-7 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">¡Tu API Key está lista!</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Copia y guarda esta clave ahora.{" "}
            <strong className="text-red-500">No se mostrará de nuevo.</strong>
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="bg-gray-950 dark:bg-black/40 rounded-2xl p-4 border border-gray-800 dark:border-white/[0.08]">
            <div className="flex items-center justify-between gap-3">
              <code className={`text-xs font-mono text-emerald-400 flex-1 break-all ${visible ? "" : "blur-sm select-none"}`}>
                {apiKey}
              </code>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setVisible((v) => !v)} className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
                  {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={handleCopy} className={`p-1.5 rounded-lg transition-colors ${copied ? "text-emerald-400" : "text-gray-500 hover:text-white"}`}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              Si cierras esta ventana sin copiarla, tendrás que rotar la key para obtener una nueva.
            </p>
          </div>

          <button onClick={handleCopy} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white transition-all active:scale-[0.98]">
            {copied ? <><Check size={16} /> ¡Copiada!</> : <><Copy size={16} /> Copiar clave</>}
          </button>

          <button onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            Ya la guardé, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}