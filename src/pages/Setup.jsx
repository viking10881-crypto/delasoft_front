// pages/Setup.jsx
// Página para crear el primer admin del sistema
// Una vez creado el admin, esta página mostrará un mensaje de que ya existe

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, User, Key, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import api from "../services/api";

const isStrongPassword = (p) =>
  p.length >= 8 &&
  /[A-Z]/.test(p) &&
  /[a-z]/.test(p) &&
  /[0-9]/.test(p) &&
  /[^A-Za-z0-9]/.test(p);

export default function Setup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:      "",
    email:     "",
    password:  "",
    secretKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  // Validación de contraseña en tiempo real
  const pwValid = isStrongPassword(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.secretKey) {
      setError("Completa todos los campos.");
      return;
    }

    if (!pwValid) {
      setError("La contraseña no cumple los requisitos de seguridad.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/auth/setup", {
        name:      form.name.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        secretKey: form.secretKey,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      const data    = err.response?.data;
      const code    = data?.code;
      const message = data?.message;

      if (code === "ADMIN_EXISTS") {
        setError("Ya existe un administrador. Usa el login normal para acceder.");
      } else if (code === "INVALID_SETUP_KEY") {
        setError("Clave de configuración incorrecta. Revisa tu archivo .env (SETUP_SECRET_KEY).");
      } else if (code === "EMAIL_TAKEN") {
        setError("Ese email ya está registrado.");
      } else if (code === "ROLE_NOT_FOUND") {
        setError("El rol 'admin' no existe en la BD. Ejecuta las migraciones primero.");
      } else {
        setError(message || "Error al crear el administrador. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Pantalla de éxito ──
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans">
        <div className="max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">¡Admin creado!</h2>
            <p className="text-slate-500 mb-2">
              Administrador registrado exitosamente.
            </p>
            <p className="text-slate-400 text-sm">
              Redirigiendo al login en unos segundos…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario de setup ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12 font-sans">
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/30">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Configuración inicial
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            Crea el primer administrador del sistema.<br />
            <span className="text-amber-500 font-semibold">Solo funciona si no existe ningún admin.</span>
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-semibold flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-5">

            {/* Nombre */}
            <InputField
              icon={<User size={20} />}
              label="Nombre completo"
              name="name"
              type="text"
              placeholder="Juan García"
              value={form.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            {/* Email */}
            <InputField
              icon={<Mail size={20} />}
              label="Email de administrador"
              name="email"
              type="email"
              placeholder="admin@delasoft.com"
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            {/* Password */}
            <div className="space-y-2 group">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-3 group-focus-within:text-[#0071e3] transition-colors">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0071e3] transition-colors">
                  <Lock size={20} />
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 chars, mayúsculas, números y símbolo"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Indicador de fortaleza */}
              {form.password && (
                <p className={`text-xs ml-3 font-semibold transition-colors ${pwValid ? "text-green-500" : "text-amber-500"}`}>
                  {pwValid ? "✓ Contraseña segura" : "⚠ Agrega mayúsculas, minúsculas, números y un símbolo"}
                </p>
              )}
            </div>

            {/* Secret Key */}
            <div className="space-y-2 group">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-3 group-focus-within:text-[#0071e3] transition-colors">
                Clave secreta de configuración
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0071e3] transition-colors">
                  <Key size={20} />
                </span>
                <input
                  name="secretKey"
                  type="password"
                  placeholder="SETUP_SECRET_KEY del .env"
                  value={form.secretKey}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-400 ml-3">
                Definida en tu archivo <code className="bg-slate-100 px-1 rounded">.env</code> como{" "}
                <code className="bg-slate-100 px-1 rounded">SETUP_SECRET_KEY</code>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={20} /> Creando administrador...</>
              ) : (
                <>Crear Administrador <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-6 text-slate-400 text-xs font-semibold">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="text-slate-900 hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Sub-componente para inputs simples ──────────────────────────────────────
function InputField({ icon, label, name, type, placeholder, value, onChange, disabled }) {
  return (
    <div className="space-y-2 group">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-3 group-focus-within:text-[#0071e3] transition-colors">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0071e3] transition-colors">
          {icon}
        </span>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required
          className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}
