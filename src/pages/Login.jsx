// pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock, Mail, Eye, EyeOff, Loader2, ArrowRight,
  AlertCircle, CheckCircle, RefreshCw,
} from "lucide-react";
import { useAuth, PANEL_ROLES } from "../context/AuthContext";
import api from "../services/api";

// ─── Error mapping ────────────────────────────────────────────────────────────
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Email o contraseña incorrectos.",
  USER_INACTIVE:       "Tu cuenta ha sido desactivada. Contacta al administrador.",
  SERVER_ERROR:        "Error en el servidor. Intenta nuevamente.",
  MISSING_FIELDS:      "Por favor, completa todos los campos.",
  EMAIL_NOT_VERIFIED:  null, // se maneja aparte
  ACCOUNT_LOCKED:      null, // se maneja aparte
  RATE_LIMIT_EXCEEDED: null, // se maneja aparte
  DEFAULT:             "Ocurrió un error inesperado. Intenta de nuevo.",
};

const parseError = (err) => {
  if (err.request && !err.response) {
    return {
      code:    "NO_CONNECTION",
      message: "Sin conexión con el servidor. Verifica tu internet.",
    };
  }
  const res     = err.response?.data ?? {};
  const code    = res.code ?? "DEFAULT";
  let   message = res.message || ERROR_MESSAGES[code] || ERROR_MESSAGES.DEFAULT;

  if (res.retryAfter) {
    message = `Demasiados intentos. Espera ${res.retryAfter} minuto${res.retryAfter !== 1 ? "s" : ""}.`;
  }
  return { code, message, data: res };
};

// ─── Redirect por rol ──────────────────────────────────────────────────────────
const homeByRole = (roles = []) => {
  if (roles.includes("superadmin")) return "/";
  return "/";
};

// ─── Welcome screen ───────────────────────────────────────────────────────────
function WelcomeScreen({ userName }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-20"
          style={{ backgroundColor: "var(--brand)" }}
        />
        <div
          className="absolute bottom-0 right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: "var(--brand)" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <img
          src="/brand/delasoft-d.png"
          alt="Delasoft logo"
          className="w-20 h-20 md:w-24 md:h-24 object-contain mb-10 drop-shadow-lg"
        />

        <h1 className="flex flex-col items-center gap-2">
          <span
            className="text-lg md:text-2xl font-medium tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ color: "var(--text-muted)" }}
          >
            Bienvenido a
          </span>
          <span
            className="text-5xl md:text-8xl font-black tracking-tighter animate-in fade-in zoom-in-95 duration-1000 delay-200"
            style={{ color: "var(--text-primary)" }}
          >
            Delasoft<span style={{ color: "var(--brand)" }}>Admin</span>
          </span>
        </h1>

        <div className="flex justify-center mt-6 min-h-[40px]">
          <p
            className="text-xl md:text-3xl font-light tracking-tight overflow-hidden whitespace-nowrap border-r-2 animate-typewriter pr-2"
            style={{ color: "var(--text-secondary)", borderColor: "var(--brand)" }}
          >
            Hola,{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {userName}
            </span>
          </p>
        </div>

        <div className="mt-20 w-48 md:w-64">
          <div
            className="h-[2px] w-full relative overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)" }}
          >
            <div
              className="absolute inset-0 animate-shimmer"
              style={{ background: "linear-gradient(to right, transparent, var(--brand), transparent)" }}
            />
          </div>
          <p
            className="text-[10px] text-center mt-4 uppercase tracking-[0.4em] font-black animate-pulse"
            style={{ color: "var(--text-muted)" }}
          >
            Cargando Panel
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Panel email no verificado ────────────────────────────────────────────────
function NotVerifiedPanel({ email, onBack }) {
  const [resending, setResending] = useState(false);
  const [msg,       setMsg]       = useState("");
  const [ok,        setOk]        = useState(false);

  const handleResend = async () => {
    setResending(true);
    setMsg("");
    try {
      await api.post("/auth/resend-code", { email });
      setOk(true);
      setMsg("¡Código enviado! Revisa tu bandeja (y spam).");
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === "ALREADY_VERIFIED") {
        setOk(true);
        setMsg("Tu cuenta ya está verificada. Intenta iniciar sesión de nuevo.");
      } else {
        setOk(false);
        setMsg(err.response?.data?.message || "No se pudo enviar. Intenta de nuevo.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="p-10 rounded-[2.5rem] shadow-2xl border text-center"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <Mail size={32} style={{ color: "var(--brand)" }} />
      </div>

      <h3 className="text-2xl font-black tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
        Verifica tu email
      </h3>
      <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        Enviamos un código de verificación a:
      </p>
      <p className="font-bold mb-6 text-sm break-all" style={{ color: "var(--text-primary)" }}>
        {email}
      </p>

      {msg && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl mb-6 text-sm font-medium text-left"
          style={{
            backgroundColor: ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            color:           ok ? "#16a34a" : "#dc2626",
          }}
        >
          {ok ? <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              : <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />}
          <span>{msg}</span>
        </div>
      )}

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full text-white py-4 rounded-2xl font-bold shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-3 mb-4 hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: "var(--brand)", boxShadow: "0 8px 24px var(--brand-muted)" }}
      >
        {resending
          ? <><Loader2 className="animate-spin" size={18} /> Enviando...</>
          : <><RefreshCw size={18} /> Reenviar código</>
        }
      </button>

      <button
        onClick={onBack}
        className="w-full text-sm font-semibold py-2 transition-colors hover:opacity-80"
        style={{ color: "var(--text-muted)" }}
      >
        ← Volver al login
      </button>
    </div>
  );
}

// ─── Login principal ──────────────────────────────────────────────────────────
export default function Login() {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome,  setShowWelcome]  = useState(false);
  const [userName,     setUserName]     = useState("");
  const [notVerified,  setNotVerified]  = useState(false);

  const navigate     = useNavigate();
  const { login }    = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);
    setIsSubmitting(true);

    try {
      const userData = await login(email.trim(), password);

      // Verificar que el usuario tiene permiso para entrar al panel
      if (!userData?.roles?.some((r) => PANEL_ROLES.includes(r))) {
        setError("No tienes permisos para acceder al panel de administración.");
        setIsSubmitting(false);
        return;
      }

      const displayName = userData?.name || userData?.email?.split("@")[0] || "Administrador";
      setUserName(displayName);
      setShowWelcome(true);

      // Redirigir según rol después de la animación de bienvenida
      setTimeout(() => navigate(homeByRole(userData.roles)), 2500);
    } catch (err) {
      setIsSubmitting(false);
      const parsed = parseError(err);
      if (parsed.code === "EMAIL_NOT_VERIFIED") { setNotVerified(true); return; }
      setError(parsed.message);
    }
  };

  if (showWelcome) return <WelcomeScreen userName={userName} />;

  if (notVerified) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
          <NotVerifiedPanel email={email} onBack={() => setNotVerified(false)} />
        </div>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: "var(--bg-subtle)",
    color:           "var(--text-primary)",
    borderColor:     "transparent",
  };

  const focusHandlers = {
    onFocus: (e) => {
      e.target.style.backgroundColor = "var(--bg-card)";
      e.target.style.borderColor     = "var(--brand)";
      e.target.style.boxShadow       = "0 0 0 4px var(--brand-muted)";
    },
    onBlur: (e) => {
      e.target.style.backgroundColor = "var(--bg-subtle)";
      e.target.style.borderColor     = "transparent";
      e.target.style.boxShadow       = "none";
    },
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[160px] opacity-[0.07]"
          style={{ backgroundColor: "var(--brand)" }}
        />
      </div>

      <div className="relative max-w-md w-full animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/brand/delasoft-d.png"
            alt="Delasoft logo"
            className="w-24 h-24 object-contain mx-auto mb-2 drop-shadow-lg"
          />
          <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Delasoft<span style={{ color: "var(--brand)" }}>Admin</span>
          </h2>
          <p className="mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
            Ingresa tus credenciales de acceso
          </p>
        </div>

        {/* Card */}
        <div
          className="p-10 rounded-[2.5rem] shadow-2xl border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {error && (
            <div
              className="p-4 rounded-2xl mb-6 text-sm font-semibold flex items-start gap-3 animate-in slide-in-from-top-2"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#dc2626" }}
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <label
                className="text-[11px] font-bold uppercase tracking-wider ml-3 block"
                style={{ color: "var(--text-muted)" }}
              >
                Email Corporativo
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2"
                  size={20}
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl outline-none border-2 font-semibold transition-all duration-200 placeholder:opacity-40"
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label
                className="text-[11px] font-bold uppercase tracking-wider ml-3 block"
                style={{ color: "var(--text-muted)" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2"
                  size={20}
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 rounded-2xl outline-none border-2 font-semibold transition-all duration-200 placeholder:opacity-40"
                  style={inputStyle}
                  {...focusHandlers}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-60"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 text-white py-4 rounded-2xl font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
              style={{ backgroundColor: "var(--brand)", boxShadow: "0 8px 32px var(--brand-muted)" }}
            >
              {isSubmitting
                ? <><Loader2 className="animate-spin" size={20} /> Verificando...</>
                : <>Entrar al Panel <ArrowRight size={20} /></>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            ¿Olvidaste tu contraseña?{" "}
            <span
              className="cursor-pointer hover:underline"
              style={{ color: "var(--text-primary)" }}
            >
              Solicitar restablecimiento
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
