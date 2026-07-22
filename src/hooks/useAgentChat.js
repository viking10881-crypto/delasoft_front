// hooks/useAgentChat.js
import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export function useAgentChat(initialConversationId = null) {
  const [messages, setMessages]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [needsConfirm, setNeedsConfirm]     = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [conversations, setConversations]   = useState([]);
  const abortRef = useRef(null);

  const loadConversations = async () => {
    try {
      const { data } = await api.get("/agent/conversations");
      setConversations(data);
    } catch (err) {
      console.error("Error cargando conversaciones", err);
    }
  };

  const loadConversation = async (id) => {
    try {
      const { data } = await api.get(`/agent/conversations/${id}`);
      setMessages(data.messages);
      setConversationId(id);
    } catch (err) {
      console.error("Error cargando conversación", err);
    }
  };

  const sendMessage = async (text) => {
    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setLoading(true);
    setNeedsConfirm(false);

    // Cancelar petición anterior si aún está en vuelo
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const { data } = await api.post(
        "/agent/chat",
        { messages: updated, conversationId },
        {
          timeout: 120_000,                        // 2 minutos — el ReAct loop puede tomar ~45s
          signal: abortRef.current.signal,
        }
      );
      setMessages(data.history);
      setNeedsConfirm(data.needsConfirm || false);
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
        loadConversations();
      }
    // hooks/useAgentChat.js — bloque catch del sendMessage
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;

        // Detectar rate limit de Groq
        const msg = err.response?.data?.message || "";
        const isRateLimit = msg.includes("rate_limit_exceeded") || msg.includes("Rate limit");
        const isTimeout   = err.code === "ECONNABORTED";

        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: isRateLimit
              ? "⚠️ El límite diario de consultas de IA se agotó. Vuelve a intentarlo en unos minutos o contacta al administrador."
              : isTimeout
              ? "La consulta tardó demasiado. Intenta con una pregunta más simple."
              : "Ocurrió un error al procesar tu consulta. Intenta de nuevo.",
          },
        ]);
      } finally {
      setLoading(false);
    }
  };

  const cancelMessage = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setLoading(false);
    }
  };

  const deleteConversation = async (id) => {
    await api.delete(`/agent/conversations/${id}`);
    if (id === conversationId) clearChat();
    loadConversations();
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setNeedsConfirm(false);
  };

  const newChat = () => {
    cancelMessage();
    clearChat();
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return {
    messages, loading, needsConfirm, conversationId,
    conversations, sendMessage, cancelMessage, clearChat, newChat,
    loadConversation, deleteConversation, loadConversations,
  };
}