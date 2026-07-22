// src/components/chat/Chat.jsx
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  MessageSquare, Search, Send, Pencil, X, Check,
  ImagePlus, ShieldCheck, ArrowLeft, Trash2, Wifi, WifiOff,
} from 'lucide-react';

/* ── Design tokens ──────────────────────────────────────────────────────────── */
const T = {
  accent:     '#5b5ef4',
  accentHov:  '#4a4de0',
  accentBg:   'rgba(91,94,244,0.08)',
  accentRing: 'rgba(91,94,244,0.18)',
  surface:    'var(--bg-card)',
  raised:     'var(--bg-subtle)',
  border:     'var(--border)',
  text:       'var(--text-primary)',
  muted:      'var(--text-secondary)',
  hint:       'var(--text-muted)',
  online:     '#22c55e',
  danger:     '#ef4444',
};

/* ── Utilidades ─────────────────────────────────────────────────────────────── */
const nameColor = (n = '') => {
  let h = 0;
  for (const c of n) h = c.charCodeAt(0) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return {
    fg:     `hsl(${hue},60%,35%)`,
    bg:     `hsl(${hue},55%,93%)`,
    border: `hsl(${hue},40%,80%)`,
  };
};

const fmt = iso => {
  if (!iso) return '';
  const d = new Date(iso), now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const fmtDate = iso =>
  new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

/* ── Hook: mobile detection ─────────────────────────────────────────────────── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const h = e => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
};

/* ── Hook: typing debounce ──────────────────────────────────────────────────── */
const useTypingEmitter = (sendTyping) => {
  const timer = useRef(null);
  const isTyping = useRef(false);

  const emit = useCallback((active) => {
    if (active !== isTyping.current) {
      isTyping.current = active;
      sendTyping(active);
    }
  }, [sendTyping]);

  const onInput = useCallback(() => {
    emit(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => emit(false), 2000);
  }, [emit]);

  const onBlur = useCallback(() => {
    clearTimeout(timer.current);
    emit(false);
  }, [emit]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { onInput, onBlur };
};

/* ── Spinner ────────────────────────────────────────────────────────────────── */
const Spin = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6" stroke={T.accent} strokeWidth="1.5" strokeDasharray="9 6">
      <animateTransform attributeName="transform" type="rotate"
        from="0 8 8" to="360 8 8" dur="0.65s" repeatCount="indefinite" />
    </circle>
  </svg>
);

/* ── Avatar ─────────────────────────────────────────────────────────────────── */
const Avatar = memo(({ name = '', size = 36, dot = false }) => {
  const { fg, bg, border } = nameColor(name);
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, border: `1.5px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.38, color: fg,
        letterSpacing: '-0.01em', userSelect: 'none',
      }}>
        {name[0]?.toUpperCase()}
      </div>
      {dot && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.27, height: size * 0.27, borderRadius: '50%',
          background: T.online, border: `2px solid var(--bg-card)`,
        }} />
      )}
    </div>
  );
});

/* ── Unread pill ────────────────────────────────────────────────────────────── */
const Pill = ({ n }) => n > 0 ? (
  <span style={{
    minWidth: 20, height: 20, borderRadius: 99, padding: '0 5px',
    background: T.accent, color: '#fff',
    fontSize: 11, fontWeight: 700, lineHeight: '20px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>{n > 99 ? '99+' : n}</span>
) : null;

/* ── Typing dots ────────────────────────────────────────────────────────────── */
const TypingDots = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '8px 12px',
    background: 'var(--bg-card)', border: `1px solid var(--border)`,
    borderRadius: '16px 16px 16px 4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--text-muted)',
        display: 'inline-block',
        animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`
      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-5px); opacity: 1; }
      }
    `}</style>
  </div>
);

/* ── Image lightbox ─────────────────────────────────────────────────────────── */
const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: 40, height: 40,
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={18} />
      </button>
      <img
        src={src} alt=""
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          borderRadius: 8, cursor: 'default',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
};

/* ── Message bubble ─────────────────────────────────────────────────────────── */
const Bubble = memo(({ m, isMe, onEdit, onDelete, isMobile }) => {
  const [hover, setHover]   = useState(false);
  const [edit, setEdit]     = useState(false);
  const [draft, setDraft]   = useState(m.message);
  const [confirm, setConfirm] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const inp = useRef();

  useEffect(() => { if (edit) inp.current?.focus(); }, [edit]);
  useEffect(() => { setDraft(m.message); }, [m.message]);

  const submitEdit = () => {
    const t = draft.trim();
    if (t && t !== m.message) onEdit(m.id, t);
    setEdit(false);
  };

  const handleDelete = () => {
    if (confirm) { onDelete(m.id); setConfirm(false); }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 3000); }
  };

  const showActions = isMe && !m.image_url && hover && !edit;

  const bubbleEvents = isMobile
    ? { onClick: () => { if (isMe && !m.image_url) setHover(v => !v); } }
    : {
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => { setHover(false); setConfirm(false); },
      };

  return (
    <>
      {lightbox && <Lightbox src={m.image_url} onClose={() => setLightbox(false)} />}
      <div
        {...bubbleEvents}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 5,
          flexDirection: isMe ? 'row-reverse' : 'row',
        }}>
          {/* Botonera de acciones */}
          {showActions && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 3,
              marginBottom: 2,
            }}>
              {/* Editar */}
              <button
                onClick={e => { e.stopPropagation(); setDraft(m.message); setEdit(true); }}
                title="Editar"
                style={actionBtnStyle()}
              >
                <Pencil size={10} />
              </button>
              {/* Eliminar */}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(); }}
                title={confirm ? 'Confirmar' : 'Eliminar'}
                style={actionBtnStyle(confirm ? T.danger : undefined)}
              >
                {confirm ? <Check size={10} /> : <Trash2 size={10} />}
              </button>
            </div>
          )}

          {/* Imagen */}
          {m.image_url ? (
            <div
              onClick={() => setLightbox(true)}
              style={{
                borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                overflow: 'hidden', cursor: 'zoom-in',
                border: `1px solid var(--border)`,
                maxWidth: 'min(220px, 58vw)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <img
                src={m.image_url} alt="imagen"
                loading="lazy"
                style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'cover' }}
              />
            </div>

          ) : edit ? (
            /* Campo de edición */
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-card)',
              border: `1.5px solid ${T.accent}`,
              borderRadius: 12, padding: '7px 10px',
              boxShadow: `0 0 0 3px ${T.accentRing}`,
              maxWidth: 'min(280px, 70vw)',
            }}>
              <input
                ref={inp} value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                  if (e.key === 'Escape') setEdit(false);
                }}
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: 14,
                  background: 'transparent', color: 'var(--text-primary)', minWidth: 0,
                }}
              />
              <button onClick={submitEdit}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, padding: 2 }}>
                <Check size={13} />
              </button>
              <button onClick={() => setEdit(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2 }}>
                <X size={13} />
              </button>
            </div>

          ) : (
            /* Burbuja normal */
            <div style={{
              maxWidth: 'min(280px, 70vw)', padding: '9px 13px',
              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              fontSize: 14, lineHeight: 1.55,
              background: isMe ? T.accent : 'var(--bg-card)',
              color: isMe ? '#fff' : 'var(--text-primary)',
              border: isMe ? 'none' : `1px solid var(--border)`,
              boxShadow: isMe
                ? `0 2px 10px ${T.accentRing}`
                : '0 1px 4px rgba(0,0,0,0.05)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              transition: 'transform 0.08s',
            }}>
              {m.message}
            </div>
          )}
        </div>

        {/* Timestamp + edited */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0 2px' }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{fmt(m.created_at)}</span>
          {m.edited_at && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>· editado</span>
          )}
        </div>
      </div>
    </>
  );
});

const actionBtnStyle = (bg) => ({
  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
  border: `1px solid var(--border)`,
  background: bg ?? 'var(--bg-subtle)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  color: bg ? '#fff' : 'var(--text-secondary)',
  transition: 'all 0.12s',
});

/* ── Date divider ───────────────────────────────────────────────────────────── */
const DateDivider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
    <span style={{
      fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap',
      letterSpacing: '0.04em', padding: '2px 8px',
      background: 'var(--bg-subtle)', borderRadius: 20,
      border: `0.5px solid var(--border)`,
    }}>{label}</span>
    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
  </div>
);

/* ── User list row ──────────────────────────────────────────────────────────── */
const UserRow = memo(({ u, isActive, unread: cnt, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px', border: 'none', outline: 'none',
      borderBottom: `0.5px solid var(--border)`,
      borderLeft: `3px solid ${isActive ? T.accent : 'transparent'}`,
      background: isActive ? T.accentBg : 'transparent',
      cursor: 'pointer', textAlign: 'left',
      transition: 'background 0.1s',
      WebkitTapHighlightColor: 'transparent',
      minHeight: 68,
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
  >
    <Avatar name={u.name} size={43} dot />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
        <span style={{
          fontSize: 13.5, fontWeight: cnt > 0 ? 700 : 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{u.name}</span>
        {u.last_message_at && (
          <span style={{
            fontSize: 11, flexShrink: 0, fontWeight: cnt > 0 ? 600 : 400,
            color: cnt > 0 ? T.accent : 'var(--text-muted)',
          }}>
            {fmt(u.last_message_at)}
          </span>
        )}
      </div>
      <p style={{
        margin: '2px 0 0', fontSize: 12,
        color: cnt > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
        fontWeight: cnt > 0 ? 500 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: '85%',
      }}>
        {u.last_message_image
          ? '📷 Imagen'
          : (u.last_message || 'Sin mensajes')}
      </p>
    </div>
    <Pill n={cnt} />
  </button>
));

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════════════ */
export default function Chat() {
  const {
    users, conversations, activeUser, unread, typing, socketReady,
    openConversation, sendMessage, sendImage, editMessage, deleteMessage,
    sendTyping, currentUser, loadUsers,
  } = useChat();

  const isMobile = useIsMobile();

  const [text, setText]             = useState('');
  const [search, setSearch]         = useState('');
  const [uploading, setUploading]   = useState(false);
  const [focused, setFocused]       = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [atBottom, setAtBottom]     = useState(true);

  const bottomRef  = useRef();
  const fileRef    = useRef();
  const inputRef   = useRef();
  const scrollRef  = useRef();

  const { onInput: onTypingInput, onBlur: onTypingBlur } = useTypingEmitter(sendTyping);

  const msgs = activeUser ? (conversations[activeUser.id] ?? []) : [];
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
  const peerIsTyping = activeUser && typing[activeUser.id];

  // ── Scroll inteligente ──────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(dist < 80);
  }, []);

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, peerIsTyping, atBottom]);

  useEffect(() => { if (!isMobile) setMobileView('list'); }, [isMobile]);

  useEffect(() => {
    if (typeof loadUsers === 'function') loadUsers();
  }, [loadUsers]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpen = useCallback(user => {
    openConversation(user);
    if (isMobile) setMobileView('chat');
  }, [openConversation, isMobile]);

  const handleBack = useCallback(() => setMobileView('list'), []);

  const handleSend = useCallback(e => {
    e?.preventDefault();
    if (!text.trim() || !activeUser) return;
    sendMessage(text.trim());
    setText('');
    sendTyping(false);
    inputRef.current?.focus();
  }, [text, activeUser, sendMessage, sendTyping]);

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleImg = useCallback(async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    await sendImage(file);
    setUploading(false);
    e.target.value = '';
  }, [sendImage]);

  // ── Agrupar mensajes por fecha ──────────────────────────────────────────────
  const grouped = [];
  let lastDay = null;
  for (const m of msgs) {
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDay) {
      grouped.push({ k: 'd', label: fmtDate(m.created_at), id: day });
      lastDay = day;
    }
    grouped.push({ k: 'm', m });
  }

  const showSidebar = isMobile ? mobileView === 'list' : true;
  const showChat    = isMobile ? mobileView === 'chat' : true;

  return (
    <div style={{
      display: 'flex',
      height: isMobile ? 'calc(100dvh - 120px)' : 'calc(100vh - 140px)',
      minHeight: isMobile ? 400 : 480,
      background: 'var(--bg-subtle)',
      overflow: 'hidden',
    }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      {showSidebar && (
        <div style={{
          width: isMobile ? '100%' : 'clamp(220px, 28%, 280px)',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)',
          borderRight: isMobile ? 'none' : `1px solid var(--border)`,
        }}>
          {/* Header sidebar */}
          <div style={{
            padding: '13px 15px 11px',
            borderBottom: `1px solid var(--border)`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 11 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: T.accentBg, border: `1px solid ${T.accentRing}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 8, flexShrink: 0,
              }}>
                <ShieldCheck size={14} color={T.accent} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
                Mensajes internos
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Indicador de conexión */}
                <div title={socketReady ? 'Conectado' : 'Sin conexión'}>
                  {socketReady
                    ? <Wifi size={13} color={T.online} />
                    : <WifiOff size={13} color={T.danger} />
                  }
                </div>
                {totalUnread > 0 && <Pill n={totalUnread} />}
              </div>
            </div>

            {/* Búsqueda */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-subtle)', borderRadius: 10, padding: '7px 11px',
              border: `1px solid var(--border)`,
            }}>
              <Search size={13} color="var(--text-muted)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar admin…"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 13, background: 'transparent', color: 'var(--text-primary)',
                  minWidth: 0,
                }}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  {search ? 'Sin resultados' : 'No hay otros admins'}
                </p>
              </div>
            ) : (
              filtered.map(u => (
                <UserRow
                  key={u.id} u={u}
                  isActive={!isMobile && activeUser?.id === u.id}
                  unread={unread[u.id] || 0}
                  onClick={() => handleOpen(u)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ PANEL DE CONVERSACIÓN ════════════════════════════════════════════ */}
      {showChat && (
        activeUser ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
            width: isMobile ? '100%' : undefined,
          }}>

            {/* Header chat */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isMobile ? '9px 13px' : '9px 17px',
              borderBottom: `1px solid var(--border)`,
              background: 'var(--bg-card)', flexShrink: 0,
              minHeight: 58,
            }}>
              {isMobile && (
                <button
                  onClick={handleBack}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.accent, display: 'flex', alignItems: 'center',
                    padding: '4px 4px 4px 0', flexShrink: 0, position: 'relative',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ArrowLeft size={21} />
                  {totalUnread - (unread[activeUser.id] || 0) > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, left: 0,
                      minWidth: 15, height: 15, borderRadius: 99,
                      background: T.accent, color: '#fff',
                      fontSize: 9, fontWeight: 700, lineHeight: '15px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                    }}>
                      {totalUnread - (unread[activeUser.id] || 0)}
                    </span>
                  )}
                </button>
              )}

              <Avatar name={activeUser.name} size={isMobile ? 36 : 34} dot />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: isMobile ? 14.5 : 14,
                  fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2,
                }}>
                  {activeUser.name}
                </p>
                <p style={{
                  margin: '1px 0 0', fontSize: 11, lineHeight: 1,
                  color: peerIsTyping ? T.accent : T.online,
                  fontWeight: 500, transition: 'color 0.2s',
                }}>
                  {peerIsTyping ? 'escribiendo…' : 'En línea'}
                </p>
              </div>
            </div>

            {/* Mensajes */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              style={{
                flex: 1, overflowY: 'auto',
                padding: isMobile ? '12px 12px 8px' : '14px 20px 10px',
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'var(--bg-subtle)',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            >
              {msgs.length === 0 && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, paddingTop: '18%',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: T.accentBg, border: `1px solid ${T.accentRing}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MessageSquare size={20} color={T.accent} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Sin mensajes aún
                    </p>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                      Inicia la conversación con {activeUser.name}
                    </p>
                  </div>
                </div>
              )}

              {grouped.map(item =>
                item.k === 'd' ? (
                  <DateDivider key={item.id} label={item.label} />
                ) : (
                  <div
                    key={item.m.id}
                    style={{
                      display: 'flex',
                      justifyContent: item.m.user_id === currentUser.id ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Bubble
                      m={item.m}
                      isMe={item.m.user_id === currentUser.id}
                      onEdit={editMessage}
                      onDelete={deleteMessage}
                      isMobile={isMobile}
                    />
                  </div>
                )
              )}

              {/* Typing indicator */}
              {peerIsTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <TypingDots />
                </div>
              )}

              <div ref={bottomRef} style={{ height: 1 }} />
            </div>

            {/* Botón "Bajar al final" */}
            {!atBottom && (
              <button
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  position: 'absolute',
                  bottom: isMobile ? 74 : 72,
                  right: 20,
                  width: 36, height: 36, borderRadius: '50%',
                  background: T.accent, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 2px 12px ${T.accentRing}`,
                  fontSize: 16,
                  zIndex: 10,
                }}
              >
                ↓
              </button>
            )}

            {/* Barra de input */}
            <div style={{
              padding: isMobile ? '8px 10px' : '9px 13px',
              paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom))' : '9px',
              borderTop: `1px solid var(--border)`,
              background: 'var(--bg-card)', flexShrink: 0,
            }}>
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleImg} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* Imagen */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="Adjuntar imagen"
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    border: `1px solid var(--border)`, background: 'var(--bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    color: 'var(--text-secondary)', opacity: uploading ? 0.5 : 1,
                    transition: 'all 0.13s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {uploading ? <Spin size={15} /> : <ImagePlus size={15} />}
                </button>

                {/* Texto */}
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  background: 'var(--bg-subtle)', borderRadius: 20, minWidth: 0,
                  border: `1px solid ${focused ? T.accent : 'var(--border)'}`,
                  boxShadow: focused ? `0 0 0 3px ${T.accentRing}` : 'none',
                  padding: '0 13px',
                  transition: 'border-color 0.13s, box-shadow 0.13s',
                  minHeight: 38,
                }}>
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={e => { setText(e.target.value); onTypingInput(); }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); onTypingBlur(); }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Mensaje a ${activeUser.name}…`}
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: isMobile ? 15 : 13.5, background: 'transparent',
                      color: 'var(--text-primary)', padding: '8px 0', minWidth: 0,
                    }}
                  />
                </div>

                {/* Enviar */}
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                    background: text.trim() ? T.accent : 'var(--bg-subtle)',
                    color: text.trim() ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: text.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: text.trim() ? `0 2px 10px ${T.accentRing}` : 'none',
                    transition: 'all 0.13s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { if (text.trim()) e.currentTarget.style.background = T.accentHov; }}
                  onMouseLeave={e => { if (text.trim()) e.currentTarget.style.background = T.accent; }}
                >
                  <Send size={14} style={{ marginLeft: 1 }} />
                </button>
              </div>

              {isMobile && msgs.some(m => m.user_id === currentUser.id && !m.image_url) && (
                <p style={{
                  margin: '5px 0 0', textAlign: 'center',
                  fontSize: 10, color: 'var(--text-muted)',
                }}>
                  Toca tu mensaje para editarlo o eliminarlo
                </p>
              )}
            </div>
          </div>

        ) : (
          /* Estado vacío — solo desktop */
          !isMobile && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 14, background: 'var(--bg-subtle)',
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 19,
                background: T.accentBg, border: `1px solid ${T.accentRing}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={24} color={T.accent} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Mensajes internos
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  Selecciona un admin de la lista para comenzar
                </p>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}