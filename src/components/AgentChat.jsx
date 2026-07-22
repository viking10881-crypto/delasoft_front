// components/AgentChat.jsx
import { useState, useRef, useEffect } from "react";
import { Bot, Trash2, Plus, Clock, Send, Sparkles, MessageSquare, Menu, X, ChevronLeft, Square } from "lucide-react";
import { useAgentChat } from "../hooks/useAgentChat";

const SUGGESTIONS = [
  "¿Cuánto vendí este mes?",
  "¿Qué productos tienen poco stock?",
  "Lista los clientes con deudas",
  "¿Cuál fue la venta más alta?",
];

const styles = {
  root:    "var(--bg-page)",
  sidebar: "var(--bg-card)",
  surface: "var(--bg-card)",
  bubble:  "var(--bg-subtle)",
  input:   "var(--bg-subtle)",
  border:  "var(--border)",
  text:    "var(--text-primary)",
  muted:   "var(--text-secondary)",
  hint:    "var(--text-muted)",
};

// ── Pasos del ReAct loop que se muestran mientras carga ──────────────────────
const THINKING_STEPS = [
  "Analizando tu consulta…",
  "Consultando el ERP…",
  "Procesando datos…",
  "Generando respuesta…",
];

export default function AgentChat({ inline = false, isOpen, onClose }) {
  const [input, setInput]           = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thinkStep, setThinkStep]   = useState(0);

  const {
    messages, loading, needsConfirm, conversations,
    conversationId, sendMessage, cancelMessage, newChat,
    loadConversation, deleteConversation,
  } = useAgentChat();

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const thinkTimer  = useRef(null);

  // Rotar el mensaje de "pensando" cada 6 s mientras carga
  useEffect(() => {
    if (loading) {
      setThinkStep(0);
      thinkTimer.current = setInterval(() => {
        setThinkStep(s => (s + 1) % THINKING_STEPS.length);
      }, 6000);
    } else {
      clearInterval(thinkTimer.current);
    }
    return () => clearInterval(thinkTimer.current);
  }, [loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
    await sendMessage(text);
  };

  const handleCancel = () => {
    cancelMessage();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleLoadConversation = (id) => {
    loadConversation(id);
    setSidebarOpen(false);
  };

  if (!inline && !isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes thinking-fade {
          0%   { opacity: 0; transform: translateY(4px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .msg-anim     { animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-anim    { animation: fadeIn 0.35s ease both; }
        .think-text   { animation: thinking-fade 6s ease both; }

        .chat-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .chat-scroll:hover { scrollbar-color: rgba(91,94,244,0.18) transparent; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
        .chat-scroll:hover::-webkit-scrollbar-thumb { background: rgba(91,94,244,0.2); }

        .suggestion-chip { animation: fadeIn 0.4s ease both; }

        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #5b5ef4;
          animation: pulse-dot 1.1s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        .input-wrap:focus-within {
          border-color: rgba(91,94,244,0.5) !important;
          box-shadow: 0 0 0 3px rgba(91,94,244,0.12);
        }
        .conv-row:hover { background: var(--bg-subtle); }
        .conv-row.active {
          background: rgba(91,94,244,0.08);
          border-color: rgba(91,94,244,0.2);
        }
        .cancel-btn:hover { background: rgba(239,68,68,0.1) !important; color: #ef4444 !important; }
      `}</style>

      <div
        className={
          inline
            ? "flex w-full h-full max-h-full overflow-hidden"
            : "fixed inset-0 md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[860px] flex overflow-hidden z-[1000]"
        }
        style={{ background: styles.root }}
      >
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden fade-anim" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══ SIDEBAR ══ */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-30 md:z-auto w-72 md:w-60 flex-shrink-0 flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          style={{ background: styles.sidebar, borderRight: `1px solid ${styles.border}` }}
        >
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid var(--border)` }}>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: styles.hint }}>
              <MessageSquare size={11} style={{ color: "#5b5ef4" }} />
              Conversaciones
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={newChat}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ color: "#5b5ef4", border: "1px solid rgba(91,94,244,0.25)", background: "rgba(91,94,244,0.06)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(91,94,244,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(91,94,244,0.06)"}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: styles.hint }}>
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto chat-scroll py-2 px-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 mt-16 px-4 opacity-40">
                <MessageSquare size={22} style={{ color: styles.hint }} />
                <p className="text-xs text-center" style={{ color: styles.hint }}>Sin conversaciones aún</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === conversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv.id)}
                    className={`conv-row group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 mb-0.5 border ${isActive ? "active" : "border-transparent"}`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-2/5 rounded-r-full" style={{ background: "#5b5ef4" }} />}
                    <Clock size={11} className="mt-1 flex-shrink-0" style={{ color: isActive ? "#5b5ef4" : styles.hint, opacity: isActive ? 1 : 0.5 }} />
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[13px] font-medium truncate leading-snug" style={{ color: isActive ? styles.text : styles.muted }}>
                        {conv.preview || "Nueva consulta"}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: styles.hint }}>
                        {new Date(conv.updated_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: styles.hint }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = styles.hint; e.currentTarget.style.background = "transparent"; }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ══ PANEL PRINCIPAL ══ */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

          {/* HEADER */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4" style={{ background: styles.surface, borderBottom: `1px solid var(--border)` }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: styles.muted }}>
                <Menu size={18} />
              </button>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(91,94,244,0.08)", border: "1px solid rgba(91,94,244,0.22)" }}>
                <Sparkles size={16} style={{ color: "#5b5ef4" }} />
              </div>
              <div>
                <h2 className="font-semibold text-[14px] md:text-[15px] leading-tight" style={{ color: styles.text }}>
                  Asistente Delasoft
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: loading ? "#f59e0b" : "#22c55e" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: styles.hint }}>
                    {loading ? "Analizando…" : "En línea"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={newChat} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: "#5b5ef4", border: "1px solid rgba(91,94,244,0.25)", background: "rgba(91,94,244,0.06)" }}>
                <Plus size={17} strokeWidth={2.5} />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="hidden md:flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-xl transition-all"
                  style={{ color: styles.muted, border: `1px solid var(--border)`, background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.color = styles.text; e.currentTarget.style.background = "var(--bg-subtle)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = styles.muted; e.currentTarget.style.background = "transparent"; }}
                >
                  <ChevronLeft size={14} /> Cerrar
                </button>
              )}
            </div>
          </header>

          {/* MENSAJES */}
          <div className="flex-1 overflow-y-auto chat-scroll" style={{ background: styles.root }}>
            <div className="max-w-2xl mx-auto w-full px-4 md:px-6 pt-8 pb-6 flex flex-col gap-5">

              {messages.length === 0 && (
                <div className="flex flex-col items-center text-center gap-5 mt-10 md:mt-16 fade-anim">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(91,94,244,0.08)", border: "1px solid rgba(91,94,244,0.2)" }}>
                    <Bot size={28} strokeWidth={1.2} style={{ color: "#5b5ef4" }} />
                  </div>
                  <div className="max-w-sm">
                    <h3 className="font-bold text-lg md:text-xl mb-2" style={{ color: styles.text }}>¿Cómo puedo ayudarte?</h3>
                    <p className="text-[14px] md:text-[15px] leading-relaxed" style={{ color: styles.muted }}>
                      Consulta ventas, inventario, finanzas o cualquier dato de tu ERP en lenguaje natural.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md mt-1">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                        className="suggestion-chip text-left px-4 py-3 rounded-xl text-[13px] leading-snug transition-all duration-200 active:scale-[0.98]"
                        style={{ background: styles.bubble, border: `1px solid var(--border)`, color: styles.muted, animationDelay: `${idx * 70}ms` }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(91,94,244,0.08)"; e.currentTarget.style.borderColor = "rgba(91,94,244,0.3)"; e.currentTarget.style.color = "#5b5ef4"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = styles.bubble; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = styles.muted; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`msg-anim flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2.5`} style={{ animationDelay: `${Math.min(i * 25, 150)}ms` }}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5" style={{ background: "rgba(91,94,244,0.08)", border: "1px solid rgba(91,94,244,0.2)" }}>
                      <Bot size={14} strokeWidth={1.5} style={{ color: "#5b5ef4" }} />
                    </div>
                  )}
                  <div
                    className="max-w-[82%] md:max-w-[78%] px-4 py-3 rounded-2xl text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap"
                    style={m.role === "user"
                      ? { background: "#5b5ef4", color: "#fff", borderRadius: "18px 18px 4px 18px", boxShadow: "0 4px 14px rgba(91,94,244,0.25)" }
                      : { background: styles.bubble, color: styles.text, border: `1px solid var(--border)`, borderRadius: "18px 18px 18px 4px" }
                    }
                  >
                    {typeof m.content === "string" ? m.content : JSON.stringify(m.content)}
                  </div>
                </div>
              ))}

              {/* Typing + estado del loop ──────────────────────────────── */}
              {loading && (
                <div className="msg-anim flex items-end gap-2.5">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(91,94,244,0.08)", border: "1px solid rgba(91,94,244,0.2)" }}>
                    <Bot size={14} strokeWidth={1.5} style={{ color: "#5b5ef4" }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-4 py-3.5 rounded-2xl flex items-center gap-2" style={{ background: styles.bubble, border: `1px solid var(--border)`, borderRadius: "18px 18px 18px 4px" }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span key={thinkStep} className="think-text text-[12px] ml-1" style={{ color: styles.muted }}>
                        {THINKING_STEPS[thinkStep]}
                      </span>
                    </div>
                    {/* Botón cancelar */}
                    <button
                      onClick={handleCancel}
                      className="cancel-btn self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-all"
                      style={{ color: styles.hint, border: `1px solid var(--border)`, background: "transparent" }}
                    >
                      <Square size={10} fill="currentColor" /> Cancelar
                    </button>
                  </div>
                </div>
              )}

              {needsConfirm && (
                <div className="msg-anim ml-9 md:ml-11 px-4 py-3.5 rounded-2xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" }}>
                  <span className="text-lg mt-0.5">⚠️</span>
                  <p className="text-[13px] md:text-[14px] leading-relaxed" style={{ color: "#d97706" }}>
                    Necesito tu autorización. Escribe{" "}
                    <strong className="px-1.5 py-0.5 rounded-md font-mono text-[12px]" style={{ color: "#b45309", background: "rgba(245,158,11,0.12)" }}>
                      "sí confirmo"
                    </strong>{" "}
                    para ejecutar esta acción.
                  </p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* INPUT */}
          <div className="flex-shrink-0 px-3 md:px-6 pt-3 pb-4 md:pb-5" style={{ background: styles.surface, borderTop: `1px solid var(--border)` }}>
            <div className="max-w-2xl mx-auto w-full">
              <div className="input-wrap flex items-end gap-2 rounded-2xl px-3 py-2 transition-all duration-200" style={{ background: styles.input, border: `1px solid var(--border)` }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKey}
                  placeholder="Escribe tu consulta…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none bg-transparent text-[14px] md:text-[15px] outline-none leading-relaxed py-2.5 px-2 disabled:opacity-50"
                  style={{ color: styles.text, maxHeight: 140 }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-1 transition-all duration-150 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{
                    background: input.trim() && !loading ? "#5b5ef4" : "var(--bg-subtle)",
                    color: input.trim() && !loading ? "#fff" : styles.hint,
                    border: input.trim() && !loading ? "none" : `1px solid var(--border)`,
                  }}
                  onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = "#4a4de0"; }}
                  onMouseLeave={e => { if (input.trim() && !loading) e.currentTarget.style.background = "#5b5ef4"; }}
                >
                  <Send size={16} strokeWidth={2} className="ml-0.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[11px] flex items-center gap-1" style={{ color: styles.hint }}>
                  <Sparkles size={10} style={{ color: "rgba(91,94,244,0.5)" }} />
                  IA conectada a tu ERP
                </p>
                <p className="text-[11px] hidden sm:block" style={{ color: styles.hint }}>
                  <kbd className="font-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: styles.bubble, border: `1px solid var(--border)` }}>Enter</kbd>{" "}enviar
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
