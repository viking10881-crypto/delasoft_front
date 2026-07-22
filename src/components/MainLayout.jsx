// src/components/MainLayout.jsx
import React, { useState, useEffect } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { Outlet } from "react-router-dom";
import usePageTracker from "../hooks/usePageTracker";  // ← nuevo

export const SidebarContext = React.createContext({ collapsed: false, setCollapsed: () => {} });

const LG_BREAKPOINT = 1024;

export default function MainLayout() {
  usePageTracker();  // ← una sola línea, rastrea todas las rutas automáticamente

  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= LG_BREAKPOINT);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isDesktop) setCollapsed(true);
  }, [isDesktop]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isDesktop && !collapsed ? "280px" : "0px"
    );
  }, [collapsed, isDesktop]);

  const contentMargin = isDesktop && !collapsed ? "280px" : "0px";

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0B0B0D] transition-colors duration-300">
        <BottomNav collapsed={collapsed} setCollapsed={setCollapsed} />

        <div
          className="transition-all duration-300 ease-in-out"
          style={{ marginLeft: contentMargin }}
        >
          <Header collapsed={collapsed} onToggleSidebar={() => setCollapsed(v => !v)} />
          <main
            style={{ paddingTop: "var(--header-height, 80px)" }}
            className="w-full pb-28 lg:pb-10"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}