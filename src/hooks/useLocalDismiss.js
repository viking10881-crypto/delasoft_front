// src/hooks/useLocalDismiss.js
// Recordar que el usuario cerró algo (una tarjeta, un aviso) en localStorage.
// Es una conveniencia por-dispositivo, nunca estado que deba sincronizarse:
// siempre con try/catch porque localStorage puede fallar (modo privado,
// almacenamiento bloqueado, cuota llena).
import { useState, useCallback } from "react";

export function useLocalDismiss(key) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* no-op: si no se puede persistir, igual se oculta por esta sesión */
    }
  }, [key]);

  return [dismissed, dismiss];
}
