import { useState, useEffect } from "react";

export function useBreakpoint() {
  const [bp, setBp] = useState(() => ({
    isMobile: window.innerWidth < 768,
    isDesktop: window.innerWidth >= 768,
  }));

  useEffect(() => {
    const fn = () =>
      setBp({ isMobile: window.innerWidth < 768, isDesktop: window.innerWidth >= 768 });
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return bp;
}