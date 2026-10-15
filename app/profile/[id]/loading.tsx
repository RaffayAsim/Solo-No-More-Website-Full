"use client";

import React from "react";
import { User, Sparkles } from "lucide-react";

export default function ProfileLoading() {
  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden select-none bg-[#060408]">
      {/* Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255, 111, 38, 0.16) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Profile Halo Pulse */}
      <div className="relative w-36 h-36 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full border border-[#FF6F26]/30 animate-ping opacity-40" style={{ animationDuration: "2.5s" }} />
        <div className="absolute inset-3 rounded-full border border-white/10" />

        <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6F26] to-[#FF4500] p-1 shadow-[0_0_35px_rgba(255,111,38,0.5)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#0c0714] flex items-center justify-center">
            <User className="w-9 h-9 text-[#FFA05C] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2.5 max-w-sm relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#FFA05C]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
            Fetching Vibe Passport
          </span>
        </div>

        <h3 className="text-lg font-black text-white tracking-tight">
          Loading Member Profile &amp; Achievements...
        </h3>

        <div className="pt-2 max-w-[200px] mx-auto">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6F26] to-[#27C93F]"
              style={{
                width: "60%",
                animation: "pulse 1.5s ease-in-out infinite alternate",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
