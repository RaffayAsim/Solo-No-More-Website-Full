"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // On mount: load saved preference or default to dark
  useEffect(() => {
    const saved = localStorage.getItem("snm-theme") as "dark" | "light" | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("snm-theme", next);
  }

  return (
    <button onClick={toggle} className="theme-toggle" title="Toggle theme">
      {theme === "dark" ? (
        <>
          <span>☀</span>
          <span>LIGHT</span>
        </>
      ) : (
        <>
          <span>▓</span>
          <span>DARK</span>
        </>
      )}
    </button>
  );
}
