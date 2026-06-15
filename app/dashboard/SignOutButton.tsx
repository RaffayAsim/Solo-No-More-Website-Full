"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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
      className="nokia-btn nokia-btn-danger"
      style={{ width: "100%", fontSize: "7px" }}
    >
      ◀ SIGN OUT
    </button>
  );
}
