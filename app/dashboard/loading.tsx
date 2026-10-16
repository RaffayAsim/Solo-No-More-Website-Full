"use client";

import React from "react";
import { Radio, Sparkles, Compass } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[82vh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Atmosphere Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255, 111, 38, 0.18) 0%, rgba(255, 90, 31, 0.05) 50%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* Futuristic Radar Sonar Sweep Mechanism */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mb-8">
        {/* Concentric Sonar Rings */}
        <div className="absolute inset-0 rounded-full border border-[#FF6F26]/20 animate-ping opacity-35" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-4 rounded-full border border-[#FF6F26]/30 animate-ping opacity-45" style={{ animationDuration: "2.4s", animationDelay: "0.5s" }} />
        <div className="absolute inset-8 rounded-full border border-white/10" />
        <div className="absolute inset-16 rounded-full border border-[#FF6F26]/40" />

        {/* Rotating Sonar Radar Beam */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, rgba(255, 111, 38, 0.45) 0deg, rgba(255, 111, 38, 0.05) 60deg, transparent 90deg)",
            animation: "spin 2.2s linear infinite",
          }}
        />

        {/* Center Glowing Beacon Node */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#FF6F26] to-[#FF4500] p-[1.5px] shadow-[0_0_40px_rgba(255,111,38,0.6)] flex items-center justify-center">
          <div className="w-full h-full rounded-[22px] bg-[#0c0714] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[#FF6F26]/10 animate-pulse" />
            <Radio className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFA05C] relative z-10 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-2 shadow-[0_0_8px_#27C93F] animate-ping" />
          </div>
        </div>

        {/* Floating Mini Satellite Nodes */}
        <div className="absolute top-3 right-6 w-3 h-3 rounded-full bg-[#FF8A3D] shadow-[0_0_12px_#FF8A3D] animate-bounce" style={{ animationDuration: "2.2s" }} />
        <div className="absolute bottom-5 left-8 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#27C93F] animate-pulse" />
      </div>

      {/* Engaging Dynamic Content Header */}
      <div className="text-center space-y-3 max-w-md relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#FF6F26]/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,111,38,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-[#FFA05C] animate-spin" style={{ animationDuration: "4s" }} />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#FFA05C]">
            Live City Radar Synchronizing
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Locking onto Live Squads &amp; Beacons
        </h3>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Calibrating real-time hangout coordinates, verified guest vetting, and VIP access passes nationwide...
        </p>

        {/* Shimmering Neon Progress Track */}
        <div className="pt-2 max-w-xs mx-auto">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-[1px] relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6F26] via-[#FFA05C] to-[#27C93F]"
              style={{
                width: "60%",
                animation: "shimmerSlide 1.8s ease-in-out infinite alternate",
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmerSlide {
          0% { transform: translateX(-40%); width: 30%; }
          50% { width: 75%; }
          100% { transform: translateX(120%); width: 40%; }
        }
      `}</style>
    </div>
  );
}
