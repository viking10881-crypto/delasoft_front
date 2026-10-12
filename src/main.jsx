import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { registerServiceWorker } from "./utils/pushNotifications";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Service worker solo en producción: habilita instalar la app (PWA) y el
// fallback offline. En dev interferiría con el HMR de Vite.
if (import.meta.env.PROD) {
  window.addEventListener("load", () => {
    registerServiceWorker();
  });
}
