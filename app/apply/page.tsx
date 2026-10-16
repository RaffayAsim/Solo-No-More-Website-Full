"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { signUpAction } from "@/app/actions/auth";
import { submitMemberApplicationAction, submitPartnerApplicationAction } from "@/app/actions/member-applications";
import {
  Sparkles,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  MapPin,
  AtSign,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  Camera,
  Upload,
  Heart,
  Music,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Building,
  AlertCircle,
} from "lucide-react";

const INTERESTS_OPTIONS = [
  "Music",
  "Comedy",
  "Theatre",
  "Sports",
  "Food & Dining",
  "Art & Culture",
  "Nightlife",
  "Festivals",
  "Networking",
];

const PACKAGES_OPTIONS = [
  {
    id: "explorer",
    name: "Chai Scout / Explorer",
    price: "Free",
    pricePkr: 0,
    desc: "Pay-as-you-go access to open community meetups.",
  },
  {
    id: "pro",
    name: "Solo Pass Pro",
    price: "PKR 3,500/mo",
    pricePkr: 3500,
    popular: true,
    desc: "15 monthly squad hangouts, padel courts, priority radar broadcast.",
  },
  {
    id: "vip",
    name: "VIP Inner Circle",
    price: "PKR 8,500/mo",
    pricePkr: 8500,
    desc: "Unlimited meetups, private supper clubs, concierge hosting.",
  },
];

function ApplyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type");

  // Mode: guest | member | partner
  const [formType, setFormType] = useState<"guest" | "member" | "partner">("member");

  useEffect(() => {
    if (urlType === "guest") setFormType("guest");
    else if (urlType === "partner") setFormType("partner");
    else if (urlType === "member") setFormType("member");
  }, [urlType]);

  // ── GUEST FORM STATE ──
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestFullName, setGuestFullName] = useState("");
  const [guestSocialLink, setGuestSocialLink] = useState("");
  const [guestCity, setGuestCity] = useState("Karachi");
  const [guestVibe, setGuestVibe] = useState("");
  const [showGuestPassword, setShowGuestPassword] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestSuccess, setGuestSuccess] = useState(false);

  // ── MEMBER MULTI-STEP STATE ──
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [memberUsername, setMemberUsername] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberFullName, setMemberFullName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberCity, setMemberCity] = useState("Karachi");
  const [memberGender, setMemberGender] = useState("");
  const [memberVibe, setMemberVibe] = useState("");
  const [memberDob, setMemberDob] = useState("");

  const [memberCnic, setMemberCnic] = useState("");
  const [memberEmergencyName, setMemberEmergencyName] = useState("");
  const [memberEmergencyPhone, setMemberEmergencyPhone] = useState("");
  const [memberInstagram, setMemberInstagram] = useState("");

  const [memberInterests, setMemberInterests] = useState<string[]>([]);
  const [memberPhotoUrl, setMemberPhotoUrl] = useState<string>("");
  const [memberPackage, setMemberPackage] = useState<string>("Solo Pass Pro");
  const [memberPackagePrice, setMemberPackagePrice] = useState<number>(3500);

  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSubmitted, setMemberSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // ── PARTNER FORM STATE ──
  const [partnerBusinessName, setPartnerBusinessName] = useState("");
  const [partnerContactName, setPartnerContactName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerCity, setPartnerCity] = useState("Karachi");
  const [partnerCategory, setPartnerCategory] = useState("Venue / Cafe");
  const [partnerPerks, setPartnerPerks] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);

  // Toggle Interest Tag
  const toggleInterest = (interest: string) => {
    setMemberInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Image Upload handler (Base64 preview)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMemberPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── GUEST SIGNUP HANDLER ──
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError(null);
    setGuestLoading(true);

    const result = await signUpAction({
      email: guestEmail,
      password: guestPassword,
      fullName: guestFullName,
      socialLink: guestSocialLink,
      bio: guestVibe,
      city: guestCity,
    });

    if (!result.success) {
      setGuestError(result.error);
      setGuestLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: guestEmail,
      password: guestPassword,
    });

    if (signInError) {
      setGuestError(signInError.message);
      setGuestLoading(false);
      return;
    }

    setGuestSuccess(true);
    const redirectParam = searchParams.get("redirect");
    const targetUrl = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";
    setTimeout(() => {
      router.push(targetUrl);
    }, 1500);
  };

  // ── MEMBER APPLICATION HANDLER ──
  const handleMemberSubmit = async () => {
    setMemberError(null);
    setMemberLoading(true);

    if (!memberUsername || !memberEmail || !memberFullName || !memberPhone || !memberDob) {
      setMemberError("Please ensure all required personal fields are completed.");
      setMemberLoading(false);
      setStep(1);
      return;
    }

    if (!memberCnic || !memberEmergencyName || !memberEmergencyPhone) {
      setMemberError("Please provide your CNIC and Emergency Contact.");
      setMemberLoading(false);
      setStep(2);
      return;
    }

    const res = await submitMemberApplicationAction({
      username: memberUsername,
      email: memberEmail,
      fullName: memberFullName,
      phone: memberPhone,
      city: memberCity,
      gender: memberGender || "Prefer not to say",
      vibe: memberVibe || "All Future Events",
      dateOfBirth: memberDob,
      cnic: memberCnic,
      emergencyName: memberEmergencyName,
      emergencyPhone: memberEmergencyPhone,
      instagram: memberInstagram,
      interests: memberInterests,
      photoUrl: memberPhotoUrl,
      packageSelected: memberPackage,
      packagePricePkr: memberPackagePrice,
    });

    setMemberLoading(false);

    if (res.success && res.applicationId) {
      setApplicationId(res.applicationId);
      setMemberSubmitted(true);
    } else {
      setMemberError(res.error || "Failed to submit application.");
    }
  };

  // ── PARTNER APPLICATION HANDLER ──
  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerError(null);
    setPartnerLoading(true);

    if (!partnerBusinessName.trim() || !partnerEmail.trim() || !partnerContactName.trim()) {
      setPartnerError("Please fill all required partner details.");
      setPartnerLoading(false);
      return;
    }

    const res = await submitPartnerApplicationAction({
      partnerBusinessName,
      fullName: partnerContactName,
      email: partnerEmail,
      phone: partnerPhone,
      city: partnerCity,
      partnerCategory,
      partnerPerks,
      packageSelected: "Partner Residency",
      packagePricePkr: 0,
    });

    setPartnerLoading(false);

    if (res.success && res.applicationId) {
      setApplicationId(res.applicationId);
      setPartnerSubmitted(true);
    } else {
      setPartnerError(res.error || "Failed to submit partner application.");
    }
  };

  return (
    <div
      style={{
        background: "#060408",
        minHeight: "100vh",
        color: "#FFFFFF",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "700px",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 25%, rgba(255, 90, 31, 0.24) 0%, rgba(255, 90, 31, 0.04) 50%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Dotted Texture Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.16) 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          opacity: 0.7,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Header Bar */}
      <header
        style={{
          position: "relative",
          zIndex: 20,
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
          className="group cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 2px 8px rgba(255, 90, 31, 0.45))" }}
          >
            <path
              d="M14 3C8.477 3 4 7.477 4 13C4 16.866 6.189 20.216 9.4 21.895L7.8 25L13.5 24.2C13.666 24.215 13.832 24.223 14 24.223C19.523 24.223 24 19.746 24 14.223C24 8.7 19.523 3 14 3Z"
              fill="white"
            />
            <circle cx="14" cy="13" r="4.2" fill="#FF5A1F" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "23px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
            }}
          >
            solo-no-more
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)" }} className="hidden sm:inline">
            Already have credentials?
          </span>
          <Link
            href="/login"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              padding: "7px 18px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 800,
              textDecoration: "none",
            }}
            className="hover:bg-white/15"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          position: "relative",
          zIndex: 10,
          padding: "40px 20px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Application Mode Switcher (Guest, Member, Partner) */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "4px",
            display: "inline-flex",
            gap: "4px",
            marginBottom: "36px",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setFormType("guest")}
            style={{
              padding: "9px 18px",
              borderRadius: "12px",
              border: "none",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              background: formType === "guest" ? "#FF5A1F" : "transparent",
              color: formType === "guest" ? "#fff" : "rgba(255,255,255,0.7)",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <User className="w-3.5 h-3.5" /> Sign up as Guest
          </button>
          <button
            type="button"
            onClick={() => setFormType("member")}
            style={{
              padding: "9px 20px",
              borderRadius: "12px",
              border: "none",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              background: formType === "member" ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)" : "transparent",
              color: formType === "member" ? "#fff" : "rgba(255,255,255,0.7)",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: formType === "member" ? "0 4px 15px rgba(255,90,31,0.4)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            <Crown className="w-3.5 h-3.5" /> Apply as Member (Vetted)
          </button>
          <button
            type="button"
            onClick={() => setFormType("partner")}
            style={{
              padding: "9px 18px",
              borderRadius: "12px",
              border: "none",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              background: formType === "partner" ? "#FF5A1F" : "transparent",
              color: formType === "partner" ? "#fff" : "rgba(255,255,255,0.7)",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <Store className="w-3.5 h-3.5" /> Sign up as Partner
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            MODE 1: GUEST SIGNUP (1-STEP FORM)
        ══════════════════════════════════════════════════════ */}
        {formType === "guest" && (
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
              border: "1.5px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "28px",
              padding: "clamp(28px, 4.5vw, 44px)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 90, 31, 0.15)",
                  color: "#FF8A3D",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" /> INSTANT GUEST PASS
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 8px" }}>Sign Up as Guest</h1>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.65)", margin: 0, lineHeight: 1.5 }}>
                Enter your details to explore the live city radar and public meetups instantly.
              </p>
            </div>

            {guestSuccess ? (
              <div style={{ textAlign: "center", padding: "30px 10px" }}>
                <CheckCircle2 className="w-14 h-14 text-[#27C93F] mx-auto mb-3" />
                <h3 style={{ fontSize: "22px", fontWeight: 800 }}>Welcome to the Squad!</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Opening your live radar...</p>
              </div>
            ) : (
              <form onSubmit={handleGuestSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {guestError && (
                  <div
                    style={{
                      background: "rgba(235, 57, 57, 0.15)",
                      border: "1px solid rgba(235, 57, 57, 0.35)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      color: "#FF6B6B",
                      fontSize: "13px",
                    }}
                  >
                    {guestError}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={guestFullName}
                    onChange={(e) => setGuestFullName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      required
                      type={showGuestPassword ? "text" : "password"}
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 42px 12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGuestPassword(!showGuestPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                      }}
                    >
                      {showGuestPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      City *
                    </label>
                    <select
                      value={guestCity}
                      onChange={(e) => setGuestCity(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    >
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Other">Other City</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={guestSocialLink}
                      onChange={(e) => setGuestSocialLink(e.target.value)}
                      placeholder="@handle"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Your Vibe / Preferred Activities
                  </label>
                  <input
                    type="text"
                    value={guestVibe}
                    onChange={(e) => setGuestVibe(e.target.value)}
                    placeholder="e.g. Chai, Padel, Weekend Boardgames"
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={guestLoading}
                  style={{
                    marginTop: "10px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px",
                    color: "#fff",
                    fontSize: "14.5px",
                    fontWeight: 900,
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(255, 90, 31, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  className="hover:scale-[1.02] active:scale-98"
                >
                  <span>{guestLoading ? "CREATING GUEST PROFILE…" : "SIGN UP AS GUEST & EXPLORE"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            MODE 2: MEMBER APPLICATION (MULTI-STEP FORMAT)
        ══════════════════════════════════════════════════════ */}
        {formType === "member" && (
          <div style={{ width: "100%", maxWidth: "660px" }}>
            {memberSubmitted ? (
              /* Success / Confirmation Screen */
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                  border: "1.5px solid rgba(255, 90, 31, 0.45)",
                  borderRadius: "28px",
                  padding: "clamp(32px, 5vw, 54px)",
                  textAlign: "center",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 30px 80px rgba(255, 90, 31, 0.25)",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "rgba(255, 90, 31, 0.2)",
                    border: "2px solid #FF5A1F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <ShieldCheck className="w-9 h-9 text-[#FF8A3D]" />
                </div>
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(255, 90, 31, 0.15)",
                    color: "#FFA05C",
                    padding: "4px 14px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "14px",
                  }}
                >
                  APPLICATION QUEUED · REF: {applicationId}
                </div>
                <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 14px", color: "#FFFFFF" }}>
                  Your Request Has Been Shared with Admin
                </h2>
                <p
                  style={{
                    fontSize: "15.5px",
                    lineHeight: 1.65,
                    color: "rgba(255, 255, 255, 0.8)",
                    maxWidth: "520px",
                    margin: "0 auto 24px",
                  }}
                >
                  New members will be approved by admin, and once your status is approved you will receive an email with bank payment details to proceed. Once verified, you will receive your login credential setup form to create your password and join the queue.
                </p>

                <div
                  style={{
                    background: "rgba(0,0,0,0.45)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "16px",
                    padding: "18px 22px",
                    textAlign: "left",
                    marginBottom: "28px",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#fff", marginBottom: "6px" }}>
                    What Happens Next:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div>1. <strong>Vetting Review:</strong> Our admin team inspects your profile &amp; Instagram.</div>
                    <div>2. <strong>Bank Transfer Details:</strong> You receive bank account information to submit proof.</div>
                    <div>3. <strong>Credential Setup:</strong> Once verified, an instant link unlocks your password creation.</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  <Link
                    href="/"
                    style={{
                      background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                      color: "#fff",
                      padding: "12px 28px",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    Return to Home
                  </Link>
                  <Link
                    href={`/pay/${applicationId}`}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    View Application Portal
                  </Link>
                </div>
              </div>
            ) : (
              /* Multi-Step Application Form Card (As shown in uploaded images) */
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                  border: "1.5px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "28px",
                  padding: "clamp(26px, 4.5vw, 42px)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 30px 80px rgba(0, 0, 0, 0.65)",
                }}
              >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255, 90, 31, 0.15)",
                      border: "1px solid rgba(255, 90, 31, 0.3)",
                      color: "#FFA05C",
                      padding: "5px 16px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 800,
                      marginBottom: "14px",
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" /> Membership Application
                  </div>
                  <h1
                    style={{
                      fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
                      fontSize: "clamp(28px, 4.5vw, 40px)",
                      fontWeight: 900,
                      margin: "0 0 10px",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.15,
                    }}
                  >
                    Join the <span style={{ color: "#FF5A1F" }}>Solo-No-More</span> Family
                  </h1>
                  <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.65)", margin: 0 }}>
                    Complete your application to unlock exclusive access.
                  </p>
                </div>

                {/* Progress Stepper Bar (Matching Uploaded Screenshots) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "36px", padding: "0 10px" }}>
                  {[
                    { num: 1, label: "Personal" },
                    { num: 2, label: "Identity" },
                    { num: 3, label: "Interests" },
                    { num: 4, label: "Photo & Tier" },
                  ].map((s, idx) => {
                    const isDone = step > s.num;
                    const isCurrent = step === s.num;
                    return (
                      <div key={s.num} style={{ display: "flex", alignItems: "center", flex: idx < 3 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: isDone
                                ? "#FF5A1F"
                                : isCurrent
                                ? "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)"
                                : "rgba(255,255,255,0.08)",
                              border: isCurrent
                                ? "2px solid #FFFFFF"
                                : isDone
                                ? "2px solid #FF5A1F"
                                : "1px solid rgba(255,255,255,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isCurrent || isDone ? "#fff" : "rgba(255,255,255,0.5)",
                              fontWeight: 900,
                              fontSize: "13px",
                              boxShadow: isCurrent ? "0 0 16px rgba(255,90,31,0.6)" : "none",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: isCurrent ? 800 : 600,
                              color: isCurrent ? "#FFFFFF" : isDone ? "#FFA05C" : "rgba(255,255,255,0.5)",
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                        {idx < 3 && (
                          <div
                            style={{
                              flex: 1,
                              height: "2px",
                              background: step > idx + 1 ? "#FF5A1F" : "rgba(255,255,255,0.12)",
                              margin: "0 10px",
                              marginBottom: "20px",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {memberError && (
                  <div
                    style={{
                      background: "rgba(235, 57, 57, 0.15)",
                      border: "1px solid rgba(235, 57, 57, 0.35)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      color: "#FF6B6B",
                      fontSize: "13px",
                      marginBottom: "20px",
                    }}
                  >
                    {memberError}
                  </div>
                )}

                {/* ── STEP 1: PERSONAL INFORMATION ── */}
                {step === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <User className="w-5 h-5 text-[#FF5A1F]" />
                      <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Personal Information</h3>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Username *
                        </label>
                        <input
                          required
                          value={memberUsername}
                          onChange={(e) => setMemberUsername(e.target.value)}
                          placeholder="johndoe"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Email *
                        </label>
                        <input
                          required
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="you@example.com"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Full Name *
                        </label>
                        <input
                          required
                          value={memberFullName}
                          onChange={(e) => setMemberFullName(e.target.value)}
                          placeholder="Your full name"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Phone *
                        </label>
                        <input
                          required
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value)}
                          placeholder="+92 300 1234567"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          City *
                        </label>
                        <select
                          value={memberCity}
                          onChange={(e) => setMemberCity(e.target.value)}
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        >
                          <option value="Karachi">Karachi</option>
                          <option value="Lahore">Lahore</option>
                          <option value="Islamabad">Islamabad</option>
                          <option value="Rawalpindi">Rawalpindi</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Gender *
                        </label>
                        <select
                          value={memberGender}
                          onChange={(e) => setMemberGender(e.target.value)}
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-Binary">Non-Binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Select Vibe / Event Type *
                      </label>
                      <input
                        value={memberVibe}
                        onChange={(e) => setMemberVibe(e.target.value)}
                        placeholder="All Future Events, VIP, Rave, etc."
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.45)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>
                        This helps us place you in the right crew queue.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Date of Birth *
                      </label>
                      <input
                        required
                        type="date"
                        value={memberDob}
                        onChange={(e) => setMemberDob(e.target.value)}
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.45)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!memberUsername || !memberEmail || !memberFullName || !memberPhone || !memberDob) {
                            setMemberError("Please fill all required personal information fields.");
                            return;
                          }
                          setMemberError(null);
                          setStep(2);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 28px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        className="hover:scale-105"
                      >
                        <span>Next</span> <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: IDENTITY & EMERGENCY ── */}
                {step === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <ShieldCheck className="w-5 h-5 text-[#FF5A1F]" />
                      <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Identity &amp; Emergency</h3>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                        CNIC Number *
                      </label>
                      <input
                        required
                        value={memberCnic}
                        onChange={(e) => setMemberCnic(e.target.value)}
                        placeholder="XXXXX-XXXXXXX-X"
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.45)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>
                        Format: XXXXX-XXXXXXX-X (Encrypted &amp; kept confidential for community security)
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Emergency Contact Name *
                        </label>
                        <input
                          required
                          value={memberEmergencyName}
                          onChange={(e) => setMemberEmergencyName(e.target.value)}
                          placeholder="Contact name"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                          Emergency Contact Phone *
                        </label>
                        <input
                          required
                          value={memberEmergencyPhone}
                          onChange={(e) => setMemberEmergencyPhone(e.target.value)}
                          placeholder="+92 300 1234567"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                        Instagram Username
                      </label>
                      <input
                        value={memberInstagram}
                        onChange={(e) => setMemberInstagram(e.target.value)}
                        placeholder="@yourusername"
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.45)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!memberCnic || !memberEmergencyName || !memberEmergencyPhone) {
                            setMemberError("Please fill your CNIC and Emergency Contact.");
                            return;
                          }
                          setMemberError(null);
                          setStep(3);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 28px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        className="hover:scale-105"
                      >
                        <span>Next</span> <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: YOUR INTERESTS ── */}
                {step === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <Heart className="w-5 h-5 text-[#FF5A1F]" />
                      <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Your Interests</h3>
                    </div>

                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                      Select the types of events you&apos;re interested in.
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "14px 0" }}>
                      {INTERESTS_OPTIONS.map((interest) => {
                        const selected = memberInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "999px",
                              border: selected ? "1.5px solid #FF5A1F" : "1px solid rgba(255,255,255,0.16)",
                              background: selected ? "linear-gradient(135deg, rgba(255,90,31,0.25) 0%, rgba(255,90,31,0.12) 100%)" : "rgba(255,255,255,0.06)",
                              color: selected ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                              fontSize: "13.5px",
                              fontWeight: selected ? 800 : 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                            }}
                            className="hover:scale-105"
                          >
                            {selected && <Check className="w-3.5 h-3.5 text-[#FF8A3D]" />}
                            <span>{interest}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        style={{
                          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 28px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        className="hover:scale-105"
                      >
                        <span>Next</span> <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: UPLOAD YOUR PHOTO & SELECT PACKAGE ── */}
                {step === 4 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <Camera className="w-5 h-5 text-[#FF5A1F]" />
                      <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Upload Your Photo</h3>
                    </div>

                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                      Upload a clear photo of yourself for your member profile.
                    </p>

                    {/* Dashed Circular Upload Area (As seen in screenshot) */}
                    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                      <label
                        style={{
                          width: "170px",
                          height: "170px",
                          borderRadius: "50%",
                          border: "2px dashed #FF5A1F",
                          background: memberPhotoUrl
                            ? `url(${memberPhotoUrl}) center/cover no-repeat`
                            : "rgba(255,90,31,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 0 25px rgba(255,90,31,0.15)",
                          transition: "all 0.2s ease",
                        }}
                        className="hover:scale-105"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          style={{ display: "none" }}
                        />
                        {!memberPhotoUrl && (
                          <>
                            <Upload className="w-8 h-8 text-[#FF5A1F] mb-2" />
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Click to upload</span>
                          </>
                        )}
                        {memberPhotoUrl && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(0,0,0,0.45)",
                              opacity: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "opacity 0.15s ease",
                            }}
                            className="hover:opacity-100"
                          >
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>Change Photo</span>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* SELECT PACKAGE SECTION */}
                    <div style={{ marginTop: "10px" }}>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#FFFFFF", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Select Membership Package:
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {PACKAGES_OPTIONS.map((pkg) => {
                          const isSel = memberPackage === pkg.name;
                          return (
                            <div
                              key={pkg.id}
                              onClick={() => {
                                setMemberPackage(pkg.name);
                                setMemberPackagePrice(pkg.pricePkr);
                              }}
                              style={{
                                background: isSel ? "linear-gradient(135deg, rgba(255,90,31,0.2) 0%, rgba(255,90,31,0.06) 100%)" : "rgba(255,255,255,0.04)",
                                border: isSel ? "2px solid #FF5A1F" : "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "16px",
                                padding: "14px 18px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                transition: "all 0.15s ease",
                              }}
                              className="hover:border-[#FF5A1F]/60"
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    border: isSel ? "6px solid #FF5A1F" : "2px solid rgba(255,255,255,0.4)",
                                    background: isSel ? "#fff" : "transparent",
                                  }}
                                />
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#fff" }}>{pkg.name}</span>
                                    {pkg.popular && (
                                      <span style={{ fontSize: "9.5px", fontWeight: 900, background: "#FF5A1F", color: "#fff", padding: "2px 8px", borderRadius: "999px" }}>
                                        RECOMMENDED
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{pkg.desc}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "15px", fontWeight: 900, color: "#FFA05C" }}>{pkg.price}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>

                      <button
                        type="button"
                        disabled={memberLoading}
                        onClick={handleMemberSubmit}
                        style={{
                          background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "14px 32px",
                          borderRadius: "14px",
                          fontSize: "14.5px",
                          fontWeight: 900,
                          cursor: "pointer",
                          boxShadow: "0 8px 30px rgba(255, 90, 31, 0.45)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          opacity: memberLoading ? 0.7 : 1,
                        }}
                        className="hover:scale-105 active:scale-98"
                      >
                        <span>{memberLoading ? "SUBMITTING TO ADMIN…" : "Submit Application"}</span>
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            MODE 3: PARTNER REGISTRATION FORM
        ══════════════════════════════════════════════════════ */}
        {formType === "partner" && (
          <div
            style={{
              width: "100%",
              maxWidth: "580px",
              background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
              border: "1.5px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "28px",
              padding: "clamp(28px, 4.5vw, 44px)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 90, 31, 0.15)",
                  color: "#FF8A3D",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                <Store className="w-3.5 h-3.5" /> HOST &amp; VENUE APPLICATION
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 8px" }}>Partner Registration</h1>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.65)", margin: 0, lineHeight: 1.5 }}>
                Host curated meetups, padel tournaments, or secret supper clubs at your space.
              </p>
            </div>

            {partnerSubmitted ? (
              <div style={{ textAlign: "center", padding: "26px 10px" }}>
                <CheckCircle2 className="w-14 h-14 text-[#27C93F] mx-auto mb-3" />
                <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 8px" }}>Partner Request Submitted!</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto 20px" }}>
                  Your partner profile is shared with our curation team. Once approved, you will receive bank settlement and door scanner onboarding instructions.
                </p>
                <Link
                  href="/"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "13.5px",
                    textDecoration: "none",
                  }}
                >
                  Return to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handlePartnerSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {partnerError && (
                  <div
                    style={{
                      background: "rgba(235, 57, 57, 0.15)",
                      border: "1px solid rgba(235, 57, 57, 0.35)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      color: "#FF6B6B",
                      fontSize: "13px",
                    }}
                  >
                    {partnerError}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Business / Venue / Stage Name *
                  </label>
                  <input
                    required
                    value={partnerBusinessName}
                    onChange={(e) => setPartnerBusinessName(e.target.value)}
                    placeholder="e.g. Velocity Padel Club, E-Street Cafe"
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Curator Contact Name *
                    </label>
                    <input
                      required
                      value={partnerContactName}
                      onChange={(e) => setPartnerContactName(e.target.value)}
                      placeholder="e.g. Hamza Tariq"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Phone / WhatsApp *
                    </label>
                    <input
                      required
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Work Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="curator@venue.com"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Partner Category
                    </label>
                    <select
                      value={partnerCategory}
                      onChange={(e) => setPartnerCategory(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    >
                      <option value="Venue / Cafe">Venue / Cafe</option>
                      <option value="Sports / Padel Facility">Sports / Padel Facility</option>
                      <option value="Live Music / DJ Stage">Live Music / DJ Stage</option>
                      <option value="Community Curator">Community Curator</option>
                      <option value="Other">Other Experience</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Proposed Perks or Events for Squad Members
                  </label>
                  <textarea
                    rows={3}
                    value={partnerPerks}
                    onChange={(e) => setPartnerPerks(e.target.value)}
                    placeholder="e.g. 15% discount on coffee, reserved court hours every Friday 8-10 PM"
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                      resize: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={partnerLoading}
                  style={{
                    marginTop: "8px",
                    background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 45%, #E6450A 100%)",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px",
                    color: "#fff",
                    fontSize: "14.5px",
                    fontWeight: 900,
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(255, 90, 31, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  className="hover:scale-[1.02] active:scale-98"
                >
                  <span>{partnerLoading ? "SUBMITTING PARTNER PROFILE…" : "SUBMIT PARTNER APPLICATION"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060408" }} />}>
      <ApplyPageContent />
    </Suspense>
  );
}
