import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutos

const AUTH_KEYS = ["accessToken", "refreshToken", "user"];

const AutoLogout = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
        window.location.href = "/login";
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach((e) => document.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, [isAuthenticated]);

  return children;
};

export default AutoLogout;
