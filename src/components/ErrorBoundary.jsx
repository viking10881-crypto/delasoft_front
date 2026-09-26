import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div
          className="max-w-md w-full text-center p-10 rounded-[2.5rem] shadow-2xl border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h1 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
            Algo salió mal
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Ocurrió un error inesperado. Intenta recargar la página; si el problema
            persiste, contacta al equipo técnico.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <RefreshCw size={18} /> Recargar página
          </button>
        </div>
      </div>
    );
  }
}
