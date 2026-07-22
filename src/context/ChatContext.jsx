// src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState({});
  const [users, setUsers]                 = useState([]);
  const [activeUser, setActiveUser]       = useState(null);
  const [unread, setUnread]               = useState({});
  const [typing, setTyping]               = useState({});
  const [socketReady, setSocketReady]     = useState(false);

  const activeUserRef = useRef(null);
  const typingTimers  = useRef({});

  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  const currentUser = user || {};

  // ── Cargar lista de admins ────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (!currentUser.id) return;
    try {
      const res = await api.get('/chat/users');
      setUsers(res.data.users ?? []);
    } catch (err) { console.error('[Chat] loadUsers:', err); }
  }, [currentUser.id]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Abrir conversación ────────────────────────────────────────────────────
  const openConversation = useCallback(async (targetUser) => {
    setActiveUser(targetUser);
    setUnread(prev => ({ ...prev, [targetUser.id]: 0 }));
    try {
      const res = await api.get(`/chat/conversation/${targetUser.id}`);
      setConversations(prev => ({ ...prev, [targetUser.id]: res.data.messages ?? [] }));
    } catch (err) { console.error('[Chat] openConversation:', err); }
  }, []);

  // ── Helpers de estado de conversación ────────────────────────────────────
  const addMessage = useCallback((msg) => {
    const otherId = msg.user_id === currentUser.id ? msg.recipient_id : msg.user_id;
    setConversations(prev => {
      const thread = prev[otherId] ?? [];
      if (thread.some(m => m.id === msg.id)) return prev;
      return { ...prev, [otherId]: [...thread, msg] };
    });

    // Actualiza last_message en la lista sin hacer fetch HTTP
    setUsers(prev => prev.map(u => {
      if (u.id !== otherId) return u;
      return {
        ...u,
        last_message:       msg.image_url ? null : msg.message,
        last_message_image: msg.image_url ?? null,
        last_message_at:    msg.created_at,
      };
    }));

    return otherId;
  }, [currentUser.id]);

  const updateMessage = useCallback((updatedMsg) => {
    const otherId = updatedMsg.user_id === currentUser.id
      ? updatedMsg.recipient_id
      : updatedMsg.user_id;
    setConversations(prev => ({
      ...prev,
      [otherId]: (prev[otherId] ?? []).map(m =>
        m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
      ),
    }));
  }, [currentUser.id]);

  const removeMessage = useCallback((msgId, otherId) => {
    setConversations(prev => ({
      ...prev,
      [otherId]: (prev[otherId] ?? []).filter(m => m.id !== msgId),
    }));
  }, []);

  // ── Adjuntar listeners al socket ──────────────────────────────────────────
  // FIX: en vez de un único intento con fallback de 300ms, reintentamos
  // hasta que el socket existe (lo crea SocketProvider en paralelo).
  useEffect(() => {
    if (!currentUser.id) return;

    let cleanup = null;
    let attempts = 0;
    const MAX = 20; // 20 × 250 ms = 5 s máximo de espera

    const tryAttach = () => {
      const s = getSocket();
      if (!s) {
        if (++attempts < MAX) {
          retryTimer = setTimeout(tryAttach, 250);
        } else {
          console.warn('[Chat] socket no disponible tras 5 s');
        }
        return;
      }

      // Socket encontrado — sincronizar estado de conexión
      setSocketReady(s.connected);

      const onConnect    = () => {
        setSocketReady(true);
        // Al (re)conectar recargamos la lista para tener datos frescos
        loadUsers();
      };
      const onDisconnect = () => setSocketReady(false);

      const onDm = (msg) => {
        const otherId = addMessage(msg);
        // Solo suma unread si el mensaje es ajeno y no es la conv activa
        if (msg.user_id !== currentUser.id && activeUserRef.current?.id !== otherId) {
          setUnread(prev => ({ ...prev, [otherId]: (prev[otherId] ?? 0) + 1 }));
        }
      };

      const onEdited  = (updatedMsg) => updateMessage(updatedMsg);

      const onDeleted = ({ id: msgId, user_id, recipient_id }) => {
        const otherId = user_id === currentUser.id ? recipient_id : user_id;
        removeMessage(msgId, otherId);
      };

      const onTyping = ({ userId, isTyping: active }) => {
        if (userId === currentUser.id) return;
        setTyping(prev => ({ ...prev, [userId]: active }));
        clearTimeout(typingTimers.current[userId]);
        if (active) {
          typingTimers.current[userId] = setTimeout(() => {
            setTyping(prev => ({ ...prev, [userId]: false }));
          }, 4000);
        }
      };

      // chat:user_joined/left solo recarga usuarios (llamada HTTP única)
      s.on('connect',              onConnect);
      s.on('disconnect',           onDisconnect);
      s.on('chat:dm',              onDm);
      s.on('chat:message_edited',  onEdited);
      s.on('chat:message_deleted', onDeleted);
      s.on('chat:typing',          onTyping);
      s.on('chat:user_joined',     loadUsers);
      s.on('chat:user_left',       loadUsers);

      cleanup = () => {
        s.off('connect',             onConnect);
        s.off('disconnect',          onDisconnect);
        s.off('chat:dm',             onDm);
        s.off('chat:message_edited', onEdited);
        s.off('chat:message_deleted',onDeleted);
        s.off('chat:typing',         onTyping);
        s.off('chat:user_joined',    loadUsers);
        s.off('chat:user_left',      loadUsers);
      };
    };

    let retryTimer = setTimeout(tryAttach, 0);

    return () => {
      clearTimeout(retryTimer);
      cleanup?.();
    };
  }, [currentUser.id, loadUsers, addMessage, updateMessage, removeMessage]);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    if (!activeUser || !text.trim()) return;
    const s = getSocket();
    if (!s?.connected) { console.warn('[Chat] socket no conectado'); return; }
    // senderId/senderName los infiere el backend desde el JWT
    s.emit('chat:dm', {
      recipientId: activeUser.id,
      message:     text.trim(),
    });
  }, [activeUser]);

  // ── Enviar imagen ─────────────────────────────────────────────────────────
  const sendImage = useCallback(async (file) => {
    if (!activeUser) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('recipientId', String(activeUser.id));
    try {
      await api.post('/chat/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // El socket event chat:dm que emite el backend actualizará la UI
    } catch (err) { console.error('[Chat] sendImage:', err); }
  }, [activeUser]);

  // ── Editar mensaje ────────────────────────────────────────────────────────
  const editMessage = useCallback(async (messageId, newText) => {
    if (!activeUser) return;
    try {
      await api.put(`/chat/message/${messageId}`, { message: newText });
    } catch (err) { console.error('[Chat] editMessage:', err); }
  }, [activeUser]);

  // ── Eliminar mensaje ──────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId) => {
    if (!activeUser) return;
    try {
      await api.delete(`/chat/message/${messageId}`);
    } catch (err) { console.error('[Chat] deleteMessage:', err); }
  }, [activeUser]);

  // ── Indicador de escritura ────────────────────────────────────────────────
  const sendTyping = useCallback((isTyping) => {
    if (!activeUser) return;
    const s = getSocket();
    if (!s?.connected) return;
    // userId lo infiere el backend desde el JWT
    s.emit('chat:typing', {
      recipientId: activeUser.id,
      isTyping,
    });
  }, [activeUser]);

  // ── Marcar conversación como leída ────────────────────────────────────────
  const markRead = useCallback((userId) => {
    setUnread(prev => ({ ...prev, [userId]: 0 }));
  }, []);

  return (
    <ChatContext.Provider value={{
      users, conversations, activeUser, unread, typing, socketReady,
      openConversation, sendMessage, sendImage, editMessage, deleteMessage,
      sendTyping, markRead, loadUsers, currentUser,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);