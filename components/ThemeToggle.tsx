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
  return null;
}

