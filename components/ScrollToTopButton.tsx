"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: "clamp(16px, 2.5vw, 32px)",
        bottom: "clamp(16px, 2.5vw, 32px)",
        zIndex: 1000,
        width: "54px",
        height: "54px",
        borderRadius: "50%",
        border: "1.5px solid rgba(255, 255, 255, 0.35)",
        background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 50%, #E6450A 100%)",
        color: "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 12px 30px rgba(255, 90, 31, 0.5), 0 0 0 4px rgba(255, 90, 31, 0.12)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.85)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px) scale(1.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.85)")}
    >
      <ArrowUp className="w-6 h-6" strokeWidth={3} />
    </button>
  );
}
