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

// ============================================
// 🛠️ HELPERS CON MANEJO DE ERRORES
// ============================================

/** GET con resultado seguro: { data, error } */
export const safeGet = async (url, config = {}) => {
  try {
    const { data } = await api.get(url, config);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.message ?? err.message };
  }
};

/** POST con resultado seguro */
export const safePost = async (url, body, config = {}) => {
  try {
    const { data } = await api.post(url, body, config);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.message ?? err.message };
  }
};

/** PUT con resultado seguro */
export const safePut = async (url, body, config = {}) => {
  try {
    const { data } = await api.put(url, body, config);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.message ?? err.message };
  }
};

/** DELETE con resultado seguro */
export const safeDelete = async (url, config = {}) => {
  try {
    const { data } = await api.delete(url, config);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.response?.data?.message ?? err.message };
  }
};

/** Subir archivo con progreso */
export const uploadFile = async (url, file, onProgress = () => {}) => {
  const form = new FormData();
  form.append("file", file);

  return api.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: ({ loaded, total }) =>
      onProgress(Math.round((loaded * 100) / total)),
  });
};

/** Descargar archivo */
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([response.data]));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.response?.data?.message ?? err.message };
  }
};

export { API_BASE_URL };
export default api;
