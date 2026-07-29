import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const devBackend = process.env.VITE_DEV_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: devBackend,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
        },
      },
      "/socket.io": {
        target: devBackend,
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on("proxyReqWs", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":   ["react", "react-dom", "react-router-dom"],
          "vendor-charts":  ["recharts"],
          "vendor-motion":  ["framer-motion"],
          "vendor-export":  ["exceljs", "jspdf", "jspdf-autotable"],
          "vendor-socket":  ["socket.io-client"],
        },
      },
    },
  },
});
