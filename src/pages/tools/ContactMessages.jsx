// src/pages/ContactMessages.jsx
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MailOpen, Reply, Trash2, Search,
  ChevronRight, Send, Loader2, CheckCircle2,
  AlertCircle, RefreshCw, Inbox, X,
} from "lucide-react";
import api from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  unread:  {
    label: "Sin leer",
    bg: "bg-blue-100 dark:bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  read: {
    label: "Leído",
    bg: "bg-neutral-100 dark:bg-white/[0.06]",
    text: "text-neutral-600 dark:text-slate-400",
    dot: "bg-neutral-400 dark:bg-slate-500",
  },
  replied: {
    label: "Respondido",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.read;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ContactMessages() {
  const [messages,  setMessages]  = useState([]);
  const [counts,    setCounts]    = useState({ total: 0, unread: 0, read: 0, replied: 0 });
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [reply,     setReply]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [toast,     setToast]     = useState(null);
  // Mobile: show detail panel when a message is selected
  const [mobileDetail, setMobileDetail] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const { data } = await api.get("/contact", { params });
      setMessages(data.messages || []);
      setCounts(data.counts || {});
    } catch (err) {
      showToast("error", "Error al cargar mensajes.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── Seleccionar mensaje ───────────────────────────────────────────────────
  const handleSelect = async (msg) => {
    setSelected(msg);
    setReply("");
    setMobileDetail(true);

    if (msg.status === "unread") {
      try {
        await api.patch(`/contact/${msg.id}/read`);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: "read" } : m));
        setSelected(prev => prev?.id === msg.id ? { ...prev, status: "read" } : prev);
        setCounts(prev => ({
          ...prev,
          unread: Math.max(0, parseInt(prev.unread) - 1),
          read:   parseInt(prev.read) + 1,
        }));
      } catch (_) {}
    }
  };

  // ── Enviar respuesta ──────────────────────────────────────────────────────
  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/contact/${selected.id}/reply`, { reply });
      const updated = { ...selected, status: "replied", reply, replied_at: new Date().toISOString() };
      setSelected(updated);
      setMessages(prev => prev.map(m => m.id === selected.id ? updated : m));
      setCounts(prev => ({
        ...prev,
        replied: parseInt(prev.replied) + 1,
        read: Math.max(0, parseInt(prev.read) - (selected.status === "read" ? 1 : 0)),
      }));
      setReply("");
      showToast("success", "Respuesta enviada correctamente.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Error al enviar la respuesta.");
    } finally {
      setSending(false);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este mensaje? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      await api.delete(`/contact/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) { setSelected(null); setMobileDetail(false); }
      showToast("success", "Mensaje eliminado.");
      fetchMessages();
    } catch (_) {
      showToast("error", "Error al eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const visible = messages.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { key: "all",     label: "Todos",       count: counts.total   },
    { key: "unread",  label: "Sin leer",    count: counts.unread  },
    { key: "read",    label: "Leídos",      count: counts.read    },
    { key: "replied", label: "Respondidos", count: counts.replied },
  ];

  // ── Detail panel (shared between desktop and mobile drawer) ───────────────
  const DetailPanel = () => (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="p-5 sm:p-8"
        >
          {/* Cabecera del mensaje */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-5 sm:p-6 mb-4 border border-neutral-100 dark:border-white/[0.07] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight break-words">
                  {selected.subject || "Sin asunto"}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-[12px] text-neutral-500 dark:text-slate-400 font-medium">{selected.name}</span>
                  <span className="text-neutral-200 dark:text-white/10">·</span>
                  <a href={`mailto:${selected.email}`} className="text-[12px] text-blue-500 dark:text-blue-400 hover:underline break-all">
                    {selected.email}
                  </a>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-slate-500 mt-1">{fmtDate(selected.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={selected.status} />
                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={deleting}
                  className="p-2 rounded-xl text-neutral-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-white/[0.04] rounded-xl p-4 sm:p-5">
              <p className="text-[14px] text-neutral-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </p>
            </div>
          </div>

          {/* Respuesta anterior */}
          {selected.status === "replied" && selected.reply && (
            <div className="bg-emerald-50 dark:bg-emerald-500/[0.07] border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5 sm:p-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Reply size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Respuesta enviada
                </span>
                <span className="text-[10px] text-emerald-400 dark:text-emerald-600 ml-auto">
                  {fmtDate(selected.replied_at)}
                </span>
              </div>
              <p className="text-[13px] text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap">
                {selected.reply}
              </p>
            </div>
          )}

          {/* Área de respuesta */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-5 sm:p-6 border border-neutral-100 dark:border-white/[0.07] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Reply size={14} className="text-neutral-400 dark:text-slate-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500 dark:text-slate-400">
                {selected.status === "replied" ? "Responder de nuevo" : "Responder"}
              </span>
            </div>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder={`Escribe tu respuesta para ${selected.name}...`}
              rows={5}
              className="
                w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none mb-4
                bg-neutral-50 dark:bg-white/[0.04]
                border border-neutral-200 dark:border-white/[0.08]
                text-neutral-900 dark:text-white
                placeholder:text-neutral-300 dark:placeholder:text-slate-600
                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50
                transition-all
              "
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <p className="text-[11px] text-neutral-400 dark:text-slate-500">
                Se enviará a <strong className="text-neutral-600 dark:text-slate-300">{selected.email}</strong>
              </p>
              <button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="
                  flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                  text-[11px] font-black uppercase tracking-widest
                  bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                  hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white
                  transition-colors disabled:opacity-40
                "
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Enviar respuesta
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden md:flex flex-col items-center justify-center h-full gap-4 text-neutral-300 dark:text-slate-700"
        >
          <Mail size={48} strokeWidth={1} />
          <p className="text-[14px] font-medium">Selecciona un mensaje para leerlo</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-height,80px))] bg-slate-50 dark:bg-[#0D1117] overflow-hidden">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-[13px] font-bold ${
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <div className="
        bg-white dark:bg-[#0D1117]
        border-b border-neutral-100 dark:border-white/[0.06]
        px-4 sm:px-6 py-4 sm:py-5
        flex items-center justify-between shrink-0
      ">
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 dark:text-white">
            Mensajes de contacto
          </h1>
          <p className="text-[12px] text-neutral-400 dark:text-slate-500 mt-0.5">
            {counts.unread > 0
              ? `${counts.unread} sin leer · ${counts.total} en total`
              : `${counts.total} mensajes en total`}
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* ── Tabs + Search ── */}
      <div className="
        bg-white dark:bg-[#0D1117]
        border-b border-neutral-100 dark:border-white/[0.06]
        px-4 sm:px-6 py-3
        flex flex-wrap items-center gap-3 sm:gap-4 shrink-0
      ">
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setSelected(null); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${
                filter === t.key
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-neutral-400 dark:text-slate-500 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                  filter === t.key
                    ? "bg-white/20 dark:bg-black/20"
                    : "bg-neutral-100 dark:bg-white/[0.06]"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="
              pl-8 pr-4 py-1.5 rounded-lg text-[12px] outline-none
              bg-neutral-100 dark:bg-white/[0.06]
              text-neutral-900 dark:text-white
              placeholder:text-neutral-400 dark:placeholder:text-slate-600
              focus:ring-2 focus:ring-blue-500/20
              w-36 sm:w-48 transition-all focus:w-48 sm:focus:w-64
            "
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Lista — full width on mobile, fixed width on desktop */}
        <div className={`
          ${mobileDetail ? "hidden md:flex" : "flex"}
          md:w-72 lg:w-80 w-full
          flex-col
          border-r border-neutral-100 dark:border-white/[0.06]
          overflow-y-auto
          bg-white dark:bg-[#0D1117]
          shrink-0
        `}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-neutral-400 dark:text-slate-600">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-[12px]">Cargando mensajes...</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-neutral-400 dark:text-slate-600">
              <Inbox size={32} className="text-neutral-200 dark:text-slate-700" />
              <span className="text-[12px]">Sin mensajes</span>
            </div>
          ) : (
            visible.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`
                  w-full text-left px-4 sm:px-5 py-4
                  border-b border-neutral-50 dark:border-white/[0.04]
                  transition-all group
                  hover:bg-neutral-50 dark:hover:bg-white/[0.03]
                  ${selected?.id === msg.id
                    ? "bg-blue-50 dark:bg-blue-500/[0.07] border-l-2 border-l-blue-500"
                    : ""
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {msg.status === "unread"
                      ? <Mail size={13} className="text-blue-500 shrink-0" />
                      : <MailOpen size={13} className="text-neutral-300 dark:text-slate-600 shrink-0" />
                    }
                    <span className={`text-[13px] truncate ${
                      msg.status === "unread"
                        ? "font-black text-neutral-900 dark:text-white"
                        : "font-semibold text-neutral-700 dark:text-slate-300"
                    }`}>
                      {msg.name}
                    </span>
                  </div>
                  <ChevronRight size={12} className="text-neutral-300 dark:text-slate-700 group-hover:text-neutral-500 dark:group-hover:text-slate-400 shrink-0 mt-0.5" />
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-slate-500 truncate mb-2">
                  {msg.subject || "Sin asunto"}
                </p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={msg.status} />
                  <span className="text-[10px] text-neutral-300 dark:text-slate-600">
                    {new Date(msg.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detalle desktop */}
        <div className={`
          hidden md:block
          flex-1 overflow-y-auto
          bg-slate-50 dark:bg-[#0D1117]
        `}>
          <DetailPanel />
        </div>

        {/* Detalle mobile — slide up */}
        <AnimatePresence>
          {mobileDetail && selected && (
            <motion.div
              key="mobile-detail"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="
                md:hidden
                fixed inset-0 z-30
                bg-slate-50 dark:bg-[#0D1117]
                overflow-y-auto
              "
              style={{ top: "var(--header-height, 80px)" }}
            >
              {/* Back button */}
              <div className="
                sticky top-0 z-10 px-4 py-3
                bg-white/80 dark:bg-[#0D1117]/90 backdrop-blur-xl
                border-b border-neutral-100 dark:border-white/[0.06]
                flex items-center gap-3
              ">
                <button
                  onClick={() => setMobileDetail(false)}
                  className="
                    flex items-center gap-2
                    text-[12px] font-bold text-neutral-500 dark:text-slate-400
                    hover:text-neutral-900 dark:hover:text-white
                    transition-colors
                  "
                >
                  <X size={16} strokeWidth={2} />
                  Volver
                </button>
                <div className="ml-auto">
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <DetailPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}