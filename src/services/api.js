// services/api.js
// Los interceptores de auth (token adjunto + refresh automático)
// viven en AuthContext.jsx para tener acceso al clearAuth().
// Este archivo solo configura la instancia base y los helpers.

import axios from "axios";

// ============================================
// ⚙️ CONFIGURACIÓN BASE
// ============================================
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "https://delasoft-back.onrender.com/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000, // 30s — importante para Render cold start
  headers: { "Content-Type": "application/json" },
});

// ============================================
// 📡 LOG EN DESARROLLO (solo request/response básico)
// Los interceptores de auth están en AuthContext.jsx
// ============================================
const SHOULD_LOG_API = import.meta.env.VITE_LOG_API === "true";

if (import.meta.env.DEV && SHOULD_LOG_API) {
  api.interceptors.request.use((config) => {
    console.log(`[API →] ${config.method?.toUpperCase()} ${config.url}`);
    config._startTime = Date.now();
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      const ms = Date.now() - (response.config._startTime ?? 0);
      console.log(
        `[API ←] ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status} (${ms}ms)`
      );
      return response;
    },
    (error) => {
      const ms = Date.now() - (error.config?._startTime ?? 0);
      console.error(
        `[API ✕] ${error.config?.method?.toUpperCase()} ${error.config?.url} ${error.response?.status} (${ms}ms)`,
        error.response?.data
      );
      return Promise.reject(error);
    }
  );
}

export { API_BASE_URL };
export default api;
