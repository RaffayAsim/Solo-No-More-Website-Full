"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  QrCode,
  UserCheck,
  XCircle,
  ShieldCheck,
  Check,
  Hourglass,
  Camera,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Zap,
  ListFilter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  verifyAndCheckInTicketAction,
  VerifyTicketResult,
} from "@/app/actions/events";

export interface ScannerTicket {
  id: string;
  event_id: string;
  user_id: string;
  ticket_status: string;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    city?: string | null;
  } | null;
}

interface EventDoorScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  eventTitle: string;
  eventDate?: string;
  eventVenue?: string;
  tickets: ScannerTicket[];
  onToggleAdmit: (ticketId: string, currentStatus: string) => Promise<void>;
  onApprove?: (ticketId: string) => Promise<void>;
  onReject?: (ticketId: string) => Promise<void>;
  accent?: "orange" | "purple";
}

type FilterTab = "all" | "pending" | "waiting" | "admitted" | "cancelled";
type ScannerMode = "camera" | "roster";

/**
 * Web Audio API synthesizer for instant gate sound effects (zero external asset dependency).
 */
function playGateSound(type: "success" | "error" | "warning") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // 2-tone uplifting chime (D5 -> A5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "error") {
      // Harsh warning buzzer
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Alert ding
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {}
}

export default function EventDoorScannerModal({
  isOpen,
  onClose,
  eventId = "",
  eventTitle,
  eventDate,
  eventVenue,
  tickets: initialTickets,
  onToggleAdmit,
  onApprove,
  onReject,
  accent = "orange",
}: EventDoorScannerModalProps) {
  const [localTickets, setLocalTickets] = useState<ScannerTicket[]>(initialTickets);
  const [mode, setMode] = useState<ScannerMode>("camera");
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<VerifyTicketResult | null>(null);

  const scannerRef = useRef<any>(null);
  const lastScannedCodeRef = useRef<string>("");
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal tickets state with prop updates
  useEffect(() => {
    setLocalTickets(initialTickets);
  }, [initialTickets]);

  const accentCls =
    accent === "purple"
      ? {
          primary: "text-purple-300",
          bg: "bg-purple-500/15",
          border: "border-purple-500/30",
          btn: "bg-gradient-to-r from-purple-600 to-indigo-600",
          laser: "rgba(168, 85, 247, 0.8)",
        }
      : {
          primary: "text-[#FFA05C]",
          bg: "bg-[#FF6F26]/15",
          border: "border-[#FF6F26]/30",
          btn: "bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F]",
          laser: "rgba(255, 111, 38, 0.85)",
        };

  // Metrics
  const admitted = localTickets.filter((t) => t.ticket_status === "admitted");
  const active = localTickets.filter((t) => t.ticket_status === "active");
  const pending = localTickets.filter((t) => t.ticket_status === "pending");
  const cancelled = localTickets.filter(
    (t) => t.ticket_status === "cancelled" || t.ticket_status === "scanned"
  );
  const progress =
    localTickets.length > 0
      ? Math.round((admitted.length / localTickets.length) * 100)
      : 0;

  const tabs: { id: FilterTab; label: string; count: number; color: string }[] = [
    { id: "all", label: "All", count: localTickets.length, color: "text-zinc-300" },
    { id: "pending", label: "Pending", count: pending.length, color: "text-amber-300" },
    { id: "waiting", label: "At Gate", count: active.length, color: "text-sky-300" },
    { id: "admitted", label: "Admitted", count: admitted.length, color: "text-emerald-300" },
    { id: "cancelled", label: "Cancelled", count: cancelled.length, color: "text-rose-300" },
  ];

  const filteredTickets = useMemo(() => {
    let list = localTickets;
    if (filterTab === "pending") list = list.filter((t) => t.ticket_status === "pending");
    else if (filterTab === "waiting") list = list.filter((t) => t.ticket_status === "active");
    else if (filterTab === "admitted") list = list.filter((t) => t.ticket_status === "admitted");
    else if (filterTab === "cancelled")
      list = list.filter(
        (t) => t.ticket_status === "cancelled" || t.ticket_status === "scanned"
      );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.profiles?.full_name || "").toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.profiles?.city || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [localTickets, filterTab, search]);

  // ─── Camera Scanner Initialization ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || mode !== "camera") {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function initCamera() {
      setCameraError(null);
      setCameraActive(false);

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (!isMounted) return;

        // Clean previous instance if any
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}
          try {
            scannerRef.current.clear();
          } catch {}
        }

        const html5QrCode = new Html5Qrcode("door-camera-viewport", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            handleCodeScanned(decodedText);
          },
          () => {} // suppress empty scan frame callbacks
        );

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Camera start warning:", err);
        // If rear camera failed, try user facing camera fallback
        if (facingMode === "environment") {
          setFacingMode("user");
        } else {
          setCameraError(
            err?.message || "Camera access denied or unavailable. You can enter pass IDs manually below."
          );
        }
      }
    }

    const t = setTimeout(initCamera, 200);

    return () => {
      isMounted = false;
      clearTimeout(t);
      stopCamera();
    };
  }, [isOpen, mode, facingMode]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  // ─── Bullet-Proof Verification Handler ──────────────────────────────────────
  const handleCodeScanned = async (scannedText: string) => {
    const code = scannedText.trim();
    if (!code) return;

    // Prevent immediate duplicate firing while inspecting result
    if (code === lastScannedCodeRef.current) return;
    lastScannedCodeRef.current = code;

    await executeVerification(code);

    // Cooldown before scanning same code again
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      lastScannedCodeRef.current = "";
    }, 4000);
  };

  const executeVerification = async (codeToVerify: string) => {
    setVerifying(true);
    setScanResult(null);

    try {
      const result = await verifyAndCheckInTicketAction({
        scannedCode: codeToVerify,
        currentEventId: eventId,
      });

      setScanResult(result);

      if (result.success && result.verdict === "valid_admitted") {
        playGateSound("success");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100]);
        }
        // Update local ticket roster to reflect admission immediately
        if (result.ticket) {
          setLocalTickets((prev) =>
            prev.map((t) =>
              t.id === result.ticket!.id ? { ...t, ticket_status: "admitted" } : t
            )
          );
        }
      } else if (result.verdict === "pending_approval") {
        playGateSound("warning");
      } else {
        playGateSound("error");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 80, 200]);
        }
      }
    } catch {
      playGateSound("error");
      setScanResult({
        success: false,
        verdict: "not_found",
        message: "Network error during verification. Check connection.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    executeVerification(manualCode.trim());
    setManualCode("");
  };

  const toggleTorch = async () => {
    try {
      if (scannerRef.current && scannerRef.current.applyVideoConstraints) {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      }
    } catch {}
  };

  // ─── Direct Attendee Roster Actions ─────────────────────────────────────────
  const handleToggleAdmit = async (ticket: ScannerTicket) => {
    setProcessingId(ticket.id);
    try {
      await onToggleAdmit(ticket.id, ticket.ticket_status);
      const newStatus = ticket.ticket_status === "admitted" ? "active" : "admitted";
      setLocalTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, ticket_status: newStatus } : t))
      );
      playGateSound(newStatus === "admitted" ? "success" : "warning");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (ticketId: string) => {
    if (!onApprove) return;
    setProcessingId(ticketId);
    try {
      await onApprove(ticketId);
      setLocalTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "active" } : t))
      );
      playGateSound("success");
      if (scanResult && scanResult.ticket?.id === ticketId) {
        setScanResult(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAndAdmitFromScan = async (ticketId: string) => {
    setVerifying(true);
    try {
      if (onApprove) await onApprove(ticketId);
      await onToggleAdmit(ticketId, "pending");
      setLocalTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "admitted" } : t))
      );
      playGateSound("success");
      setScanResult({
        success: true,
        verdict: "valid_admitted",
        message: "Approved & Admitted at Door!",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async (ticketId: string) => {
    if (!onReject) return;
    setProcessingId(ticketId);
    try {
      await onReject(ticketId);
      setLocalTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ticket_status: "cancelled" } : t))
      );
      playGateSound("warning");
      if (scanResult && scanResult.ticket?.id === ticketId) {
        setScanResult(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] max-h-[96vh]"
        style={{ background: "linear-gradient(180deg, #100b1a 0%, #07050d 100%)" }}
      >
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <div className="p-3 sm:p-5 border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${accentCls.bg} ${accentCls.primary} ${accentCls.border} flex items-center gap-1`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>Door Scanner Hub</span>
                </span>
                {eventVenue && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    <span>{eventVenue}</span>
                  </span>
                )}
                {eventDate && (
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{eventDate}</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                {eventTitle}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetry Progress Bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">
                Gate Telemetry: <strong className="text-emerald-400">{admitted.length}</strong> checked in
                {active.length > 0 && (
                  <span className="text-sky-300 ml-1.5 font-normal">({active.length} waiting)</span>
                )}
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                {admitted.length} / {localTickets.length} Passes ({progress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-3 flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("camera");
                setScanResult(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "camera"
                  ? `${accentCls.btn} text-white shadow-lg`
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 Live Camera Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("roster");
                stopCamera();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "roster"
                  ? `${accentCls.btn} text-white shadow-lg`
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>📋 Guestlist Roster ({localTickets.length})</span>
            </button>
          </div>
        </div>

        {/* ── MODE 1: CAMERA SCANNER VIEWPORT ─────────────────────────────── */}
        {mode === "camera" && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 flex flex-col justify-between">
            {/* Camera Viewfinder Box */}
            <div className="relative w-full max-w-md mx-auto aspect-[4/3] sm:aspect-square max-h-[38vh] sm:max-h-none rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-black/90 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center">
              {/* html5-qrcode target div */}
              <div
                id="door-camera-viewport"
                className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />

              {/* High-tech targeting reticle overlay */}
              {cameraActive && !scanResult && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {/* Corner Reticle Brackets */}
                  <div className="w-48 h-48 sm:w-60 sm:h-60 relative">
                    <span className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl" />
                    <span className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl" />
                    <span className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl" />
                    <span className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-xl" />

                    {/* Animated Laser Scanning Line */}
                    <div
                      className="absolute left-2 right-2 h-0.5 shadow-[0_0_12px_#10b981]"
                      style={{
                        background: "linear-gradient(90deg, transparent, #10b981, transparent)",
                        animation: "scanPulse 2s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <div className="absolute bottom-4 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-[11px] font-mono text-zinc-300 backdrop-blur-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>TARGETING QR CODE</span>
                  </div>
                </div>
              )}

              {/* Camera Loading or Error State */}
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin" />
                  <p className="text-xs text-zinc-400 font-medium">
                    Initializing camera stream...
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-amber-400" />
                  <div className="text-sm font-bold text-white">Camera Unavailable</div>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20"
                  >
                    Switch Camera
                  </button>
                </div>
              )}

              {/* ── Scan Result Card Overlay ──────────────────────────────── */}
              {scanResult && (
                <div className="absolute inset-0 p-5 bg-black/92 backdrop-blur-lg flex flex-col items-center justify-center text-center space-y-3 animate-scaleIn z-20">
                  {scanResult.verdict === "valid_admitted" && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          ✓ ENTRY GRANTED
                        </span>
                        <h3 className="text-lg font-black text-white mt-1">
                          {scanResult.ticket?.attendeeName || "Verified Guest"}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {scanResult.ticket?.attendeeCity || "Karachi"} · Pass #{scanResult.ticket?.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-medium">
                        Admitted at door reception. Telemetry updated.
                      </div>
                    </>
                  )}

                  {scanResult.verdict === "wrong_event" && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.35)]">
                        <ShieldAlert className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                          ⛔ WRONG EVENT TICKET
                        </span>
                        <h3 className="text-base font-black text-white">
                          Entry Denied
                        </h3>
                        <p className="text-xs text-rose-300 leading-relaxed max-w-xs">
                          {scanResult.message}
                        </p>
                      </div>
                    </>
                  )}

                  {scanResult.verdict === "already_admitted" && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                        <RotateCcw className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          ⚠️ DUPLICATE ENTRY
                        </span>
                        <h3 className="text-base font-black text-white">
                          Already Checked In
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Guest: <strong>{scanResult.ticket?.attendeeName}</strong>
                        </p>
                        <p className="text-[11px] text-amber-300/80 leading-relaxed max-w-xs">
                          {scanResult.message}
                        </p>
                      </div>
                    </>
                  )}

                  {scanResult.verdict === "pending_approval" && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                        <Hourglass className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          ⏳ PENDING HOST APPROVAL
                        </span>
                        <h3 className="text-base font-black text-white">
                          {scanResult.ticket?.attendeeName}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                          This booking is waiting for your approval. As the creator, you can clear it right now:
                        </p>
                      </div>
                      {scanResult.ticket?.id && (
                        <button
                          type="button"
                          onClick={() => handleApproveAndAdmitFromScan(scanResult.ticket!.id)}
                          disabled={verifying}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:brightness-110 cursor-pointer"
                        >
                          ✓ Approve &amp; Admit Guest Now
                        </button>
                      )}
                    </>
                  )}

                  {(scanResult.verdict === "cancelled" || scanResult.verdict === "not_found") && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                        <XCircle className="w-10 h-10" />
                      </div>
                      <h3 className="text-base font-black text-white">
                        {scanResult.verdict === "cancelled" ? "Cancelled / Void Pass" : "Pass Not Found"}
                      </h3>
                      <p className="text-xs text-rose-300 leading-relaxed max-w-xs">
                        {scanResult.message}
                      </p>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setScanResult(null);
                      lastScannedCodeRef.current = "";
                    }}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Scan Next Pass</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Camera Control Toolbar */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                title="Switch between rear and front cameras"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Flip: {facingMode === "environment" ? "Back Lens" : "Front Lens"}</span>
              </button>

              <button
                type="button"
                onClick={toggleTorch}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  torchOn
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400"
                }`}
                title="Toggle torch for dark night venues"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Flash {torchOn ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* ── Fallback Manual Entry Bar ───────────────────────────────── */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                <span>Manual Pass Verification Fallback</span>
                <span className="text-zinc-500 font-mono text-[10px]">6-8 digit ID or QHQ Code</span>
              </div>
              <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter Ticket ID (e.g. QHQ-619379 or Pass UUID)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
                <button
                  type="submit"
                  disabled={verifying || !manualCode.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer shrink-0 text-center"
                >
                  {verifying ? "Checking..." : "Verify Pass"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── MODE 2: GUESTLIST ROSTER VIEWPORT ───────────────────────────── */}
        {mode === "roster" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {/* Search and Filter Tabs */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search attendee name, city, pass ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterTab === tab.id
                      ? `${accentCls.btn} text-white shadow-md`
                      : "bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      filterTab === tab.id ? "bg-black/30 text-white" : tab.color
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Attendee Cards List */}
            <div className="space-y-2">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const isAdmitted = t.ticket_status === "admitted" || t.ticket_status === "scanned";
                  const isPending = t.ticket_status === "pending";
                  const isCancelled = t.ticket_status === "cancelled";
                  const isProcessing = processingId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAdmitted
                          ? "bg-emerald-500/[0.04] border-emerald-500/25"
                          : isPending
                          ? "bg-amber-500/[0.04] border-amber-500/25"
                          : isCancelled
                          ? "bg-rose-500/[0.03] border-rose-500/20 opacity-60"
                          : "bg-white/[0.02] border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isAdmitted
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : isPending
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                              : isCancelled
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                              : "bg-white/5 border-white/10 text-zinc-400"
                          }`}
                        >
                          {isAdmitted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isPending ? (
                            <Hourglass className="w-5 h-5 animate-pulse" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-white text-xs flex items-center gap-2 flex-wrap">
                            <span className="truncate">{t.profiles?.full_name || "Verified Attendee"}</span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isAdmitted
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : isPending
                                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                  : isCancelled
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                              }`}
                            >
                              {isAdmitted ? "✓ Admitted" : isPending ? "⏳ Pending Review" : isCancelled ? "Cancelled" : "● At Gate"}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                            <span>{t.profiles?.city || "Karachi"}</span>
                            <span>·</span>
                            <span className="font-mono text-zinc-500">#{t.id.slice(0, 8).toUpperCase()}</span>
                            <span>·</span>
                            <span className="text-zinc-500">
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                        {isPending && onApprove && onReject && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(t.id)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(t.id)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {!isPending && !isCancelled && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleToggleAdmit(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm ${
                              isAdmitted
                                ? "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 border border-emerald-400/40"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isProcessing ? "Updating..." : isAdmitted ? "Undo Check-In" : "Admit Attendee"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-xs text-zinc-500 space-y-1">
                  <Users className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                  <p className="font-semibold text-zinc-400">No attendees match this filter</p>
                  <p className="text-[11px] text-zinc-600">
                    Switch to &ldquo;All&rdquo; or scan incoming passes via Camera mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">Strict Event Isolation Active · Event #{eventId ? eventId.slice(0, 8) : "Active"}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanPulse {
          0% {
            top: 5%;
            opacity: 0.2;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 5%;
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}
