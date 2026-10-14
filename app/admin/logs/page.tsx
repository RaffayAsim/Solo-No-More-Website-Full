import React from "react";
import { Terminal, Shield, Sparkles, Activity } from "lucide-react";

export const revalidate = 0; // Disable static caching

export default function AdminLogsPage() {
  const logEvents = [
    {
      timestamp: "2026-05-30 14:02:11",
      service: "AUTH_GATEWAY",
      level: "INFO",
      message: "Admin session authenticated for vibe.tester@solonomore.com from team dashboard.",
    },
    {
      timestamp: "2026-05-30 13:45:15",
      service: "NO_SHOW_ENGINE",
      level: "WARN",
      message: "User warning strike logged for applicant due to host ghost flake flagging. Strikes count = 1.",
    },
    {
      timestamp: "2026-05-30 13:21:50",
      service: "VETTING_MANAGER",
      level: "INFO",
      message: "New applicant profile approved. Lobby access granted securely.",
    },
    {
      timestamp: "2026-05-30 12:05:11",
      service: "VIP_PASS_ENGINE",
      level: "INFO",
      message: "Free ticket claimed for 'official_event = VIP Padel Tournament' by family tier user.",
    },
    {
      timestamp: "2026-05-30 10:15:33",
      service: "POSTGRES_POOL",
      level: "INFO",
      message: "Successfully synchronized database connection pools. 0 leaks detected.",
    },
    {
      timestamp: "2026-05-30 08:30:00",
      service: "STRIKE_MONITOR",
      level: "INFO",
      message: "Scanning active beacon applications... Vibe parameters checking completed.",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FF6F26]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20">
              <Terminal className="w-3.5 h-3.5" />
              <span>SYSTEM DIAGNOSTICS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Gateway Diagnostic Logs
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Real-time gateway telemetry entries, security access records, and platform events.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Stream Connected</span>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="overflow-hidden rounded-2xl bg-[#030205] border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-neutral-400 ml-3">
              telemetry@solo-no-more: ~/gateway/events
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">v4.4.23</span>
        </div>

        {/* Console stream */}
        <div className="p-6 font-mono text-xs space-y-3 max-h-[600px] overflow-y-auto">
          {logEvents.map((evt, idx) => {
            const isWarn = evt.level === "WARN";

            return (
              <div
                key={idx}
                className="flex items-start gap-3 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <span className="text-neutral-500 flex-shrink-0 select-none">
                  [{evt.timestamp}]
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                    isWarn
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {evt.level}
                </span>
                <span className="text-[#FF6F26] font-bold flex-shrink-0">
                  [{evt.service}]
                </span>
                <span className="text-neutral-300 leading-relaxed">{evt.message}</span>
              </div>
            );
          })}

          {/* Prompt cursor */}
          <div className="flex items-center gap-2 pt-4 text-xs text-neutral-400 border-t border-white/[0.06]">
            <span className="text-[#FF6F26] font-bold">$</span>
            <span className="w-2 h-4 bg-[#FF6F26] animate-pulse inline-block" />
            <span className="text-[11px] text-neutral-500">
              Listening for live gateway telemetry...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
