// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

// ============================================
// 🎯 ROLES PERMITIDOS EN EL PANEL
// ============================================
export const PANEL_ROLES = ["superadmin", "admin", "gerente"];

// ============================================
// 🔄 INTERCEPTORES — se registran UNA SOLA VEZ
// ============================================
let _interceptorsRegistered = false;

const setupInterceptors = (onSessionExpired) => {
  if (_interceptorsRegistered) return;
  _interceptorsRegistered = true;

  // Adjuntar token a cada request
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (err) => Promise.reject(err)
  );

  // Renovación automática del access token
  api.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config;

      // PIN de finanzas expirado → notificar al gate sin desloguear
      if (
        err.response?.status === 401 &&
        err.response?.data?.code === "FINANCE_PIN_REQUIRED"
      ) {
        window.dispatchEvent(new CustomEvent("finance:session-expired"));
        return Promise.reject(err);
      }

      if (
        err.response?.status === 401 &&
        err.response?.data?.code === "TOKEN_EXPIRED" &&
        !original._retry
      ) {
        original._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("Sin refresh token");

          const { data } = await api.post("/auth/refresh", { refreshToken });

          if (data.success && data.data?.accessToken) {
            localStorage.setItem("accessToken", data.data.accessToken);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(original);
          }

          throw new Error("Refresh fallido");
        } catch {
          onSessionExpired();
        }
      }

      return Promise.reject(err);
    }
  );
};

// ============================================
// 🏠 PROVEEDOR
// ============================================
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Limpia todo y redirige al login
  const clearAuth = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  // Registrar interceptores con acceso a clearAuth
  useEffect(() => {
    setupInterceptors(clearAuth);
  }, [clearAuth]);

  // ============================================
  // 🔁 RESTAURAR SESIÓN AL MONTAR
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      const storedUser   = localStorage.getItem("user");
      const accessToken  = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!storedUser || !accessToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/verify-token");
        if (data.success) {
          setUser(JSON.parse(storedUser));
        } else {
          clearAuth();
        }
      } catch {
        // Token expirado → intentar renovar
        if (refreshToken) {
          try {
            const { data } = await api.post("/auth/refresh", { refreshToken });
            if (data.success && data.data?.accessToken) {
              localStorage.setItem("accessToken", data.data.accessToken);
              setUser(JSON.parse(storedUser));
            } else {
              clearAuth();
            }
          } catch {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [clearAuth]);

  // ============================================
  // 🚪 LOGIN
  // Respuesta del backend: { success, user, token, refreshToken }
  // ============================================
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
      deviceInfo: navigator.userAgent,
    });

    if (!data.success) throw new Error(data.message || "Error en el login");

    const { user: userData, token, refreshToken } = data;
    if (!userData || !token) throw new Error("Respuesta del servidor incompleta");

    localStorage.setItem("accessToken",  token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user",         JSON.stringify(userData));

    setUser(userData);
    return userData;
  };

  // ============================================
  // 🚪 LOGOUT
  // ============================================
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Si falla en el servidor igual limpiamos localmente
    } finally {
      clearAuth();
    }
  };

  // ============================================
  // 🔑 HELPERS DE ROL
  // ============================================
  const isSuperAdmin = useCallback(() => user?.roles?.includes("superadmin") ?? false, [user]);
  const isAdmin      = useCallback(() => user?.roles?.includes("admin")      ?? false, [user]);

  const hasRole = useCallback(
    (role) => user?.roles?.includes(role) ?? false,
    [user]
  );

  const hasAnyRole = useCallback(
    (roles) => roles.some((r) => user?.roles?.includes(r)) ?? false,
    [user]
  );

  // ============================================
  // 🔐 PERMISOS POR ACCIÓN
  // superadmin → todo
  // admin      → todo dentro de su panel
  // gerente    → lista acotada
  // ============================================
  const can = useCallback(
    (action) => {
      if (!user?.roles?.length) return false;

      // Superadmin: acceso total
      if (user.roles.includes("superadmin")) return true;

      // Admin: acceso completo a su panel
      if (user.roles.includes("admin")) return true;

      // Gerente: permisos acotados
      if (user.roles.includes("gerente")) {
        const GERENTE_PERMS = new Set([
          "product.read",    "product.create",   "product.update",   "product.delete",
          "sale.read",       "sale.create",
          "provider.read",   "provider.create",  "provider.update",
          "purchase.read",   "purchase.create",  "purchase.update",
          "user.read",
          "expense.read",    "expense.create",
          "report.read",
        ]);
        return GERENTE_PERMS.has(action);
      }

      return false;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin,
        isAdmin,
        login,
        logout,
        can,
        hasRole,
        hasAnyRole,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};