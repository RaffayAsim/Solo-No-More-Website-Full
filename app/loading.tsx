"use client";

import React from "react";
import { Radio, Sparkles } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden select-none bg-[#060408]">
      {/* Dynamic Background Atmosphere Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255, 111, 38, 0.16) 0%, rgba(255, 90, 31, 0.04) 50%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* Radar Sonar Sweep */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full border border-[#FF6F26]/20 animate-ping opacity-35" style={{ animationDuration: "2.8s" }} />
        <div className="absolute inset-6 rounded-full border border-white/10" />

        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, rgba(255, 111, 38, 0.4) 0deg, transparent 75deg)",
            animation: "spin 2.2s linear infinite",
          }}
        />

        <div className="relative z-10 w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF6F26] to-[#FF4500] p-1 shadow-[0_0_35px_rgba(255,111,38,0.55)] flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-[#0c0714] flex flex-col items-center justify-center">
            <Radio className="w-7 h-7 text-[#FFA05C] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2.5 max-w-sm relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-[#FF6F26]/30 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#FFA05C] animate-spin" style={{ animationDuration: "3.5s" }} />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#FFA05C]">
            Solo-No-More Pulse
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
          Connecting to City Hangout Grid...
        </h3>

        <div className="pt-2 max-w-[220px] mx-auto">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6F26] via-[#FFA05C] to-[#27C93F]"
              style={{
                width: "55%",
                animation: "pulse 1.4s ease-in-out infinite alternate",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
