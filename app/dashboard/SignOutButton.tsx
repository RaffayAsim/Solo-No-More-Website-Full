"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  variant?: "statusbar" | "standard";
}

export default function SignOutButton({ variant = "standard" }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (variant === "statusbar") {
    return (
      <button
        onClick={handleSignOut}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 8px",
          fontFamily: "var(--font-pixel), 'Courier New', monospace",
          fontSize: "7px",
          color: "#FFF",
          background: "var(--accent-danger)",
          border: "2px solid var(--border-strong)",
          boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)",
          borderRadius: "2px",
          cursor: "pointer",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
        title="Sign out of your session"
      >
        <span>✕</span>
        <span>EXIT</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: "rgba(0, 0, 0, 0.35)",
        border: "1px solid rgba(255, 255, 255, 0.28)",
        color: "#FFFFFF",
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "0.04em",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
        transition: "all 0.15s ease",
      }}
      className="hover:bg-black/50 hover:border-white/50 active:scale-95"
      title="Sign out of your session"
    >
      <LogOut className="w-3.5 h-3.5 opacity-90" />
      <span>SIGN OUT</span>
    </button>
  );
}
