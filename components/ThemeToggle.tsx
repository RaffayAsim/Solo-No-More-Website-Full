"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Skin Switcher — lets members pick the visual "skin" of the whole app.
 *
 *  - partiful : Default. Modern, warm, party-invite aesthetic.
 *  - light    : Nokia Classic (90s beige handset).
 *  - dark     : Synthwave Arcade (neon CRT).
 *
 * The selected skin is written to <html data-theme="..."> and persisted in
 * localStorage under "snm-skin". A tiny inline script in app/layout.tsx
 * applies the saved skin before first paint to avoid a flash.
 */
export type Skin = "partiful" | "light" | "dark";

export const SKINS: { id: Skin; label: string; emoji: string; desc: string }[] = [
  { id: "partiful", label: "Party", emoji: "🎉", desc: "Default · modern & warm" },
  { id: "light", label: "Nokia Classic", emoji: "📱", desc: "90s beige handset" },
  { id: "dark", label: "Synthwave", emoji: "🌆", desc: "Neon arcade CRT" },
];

export const SKIN_STORAGE_KEY = "snm-skin";

export function applySkin(skin: Skin) {
  document.documentElement.setAttribute("data-theme", skin);
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, skin);
  } catch {}
}

export default function ThemeToggle() {
  const [skin, setSkin] = useState<Skin>("partiful");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // On mount: sync with whatever skin the pre-paint script applied
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Skin | null;
    if (current && SKINS.some((s) => s.id === current)) setSkin(current);
  }, []);

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Skin) => {
    setSkin(next);
    applySkin(next);
    setOpen(false);
  };

  const active = SKINS.find((s) => s.id === skin) ?? SKINS[0];

  return (
    <div ref={wrapRef} className="skin-switcher">
      <button
        id="skin-switcher-button"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="theme-toggle"
        title="Change app skin"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span aria-hidden>{active.emoji}</span>
        <span>Skin</span>
      </button>

      {open && (
        <div className="skin-switcher-menu" role="menu">
          <div className="skin-switcher-title">Choose your skin</div>
          {SKINS.map((s) => (
            <button
              key={s.id}
              id={`skin-option-${s.id}`}
              type="button"
              role="menuitemradio"
              aria-checked={skin === s.id}
              onClick={() => choose(s.id)}
              className={`skin-switcher-option ${skin === s.id ? "is-active" : ""}`}
            >
              <span className={`skin-swatch skin-swatch-${s.id}`} aria-hidden>
                {s.emoji}
              </span>
              <span className="skin-switcher-text">
                <span className="skin-switcher-label">{s.label}</span>
                <span className="skin-switcher-desc">{s.desc}</span>
              </span>
              {skin === s.id && <span className="skin-switcher-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
