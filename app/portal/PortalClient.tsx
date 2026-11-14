"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mic2, Store } from "lucide-react";
import { submitPartnerApplicationAction } from "@/app/actions/member-applications";
import EmailVerifyBox from "@/components/forms/EmailVerifyBox";
import SimpleSignIn, { fieldInput, fieldLabel, primaryButton } from "@/components/auth/SimpleSignIn";
import {
  checkBusinessName,
  checkEmail,
  checkInstagram,
  checkPersonName,
  checkPkMobile,
} from "@/lib/signup-validation";

type Kind = "partner" | "artist";
type Mode = "apply" | "signin";

const CATEGORIES: Record<Kind, string[]> = {
  partner: ["Cafe / Restaurant", "Rooftop / Lounge", "Sports / Padel Facility", "Brand / Sponsor", "Community Curator", "Other"],
  artist: ["DJ / Producer", "Band", "Singer / Musician", "Stand-up Comedian", "Spoken Word / Poet", "Other Performer"],
};

const COPY: Record<Kind, { title: string; blurb: string; name: string; namePh: string; extra: string; extraPh: string; dest: string }> = {
  partner: {
    title: "Partners & Venues",
    blurb: "Host Solo-No-More squads at your cafe, court or venue, offer member perks and list events.",
    name: "Business / venue name",
    namePh: "e.g. E-Street Cafe",
    extra: "Perks or events you'd offer members (optional)",
    extraPh: "e.g. 15% off for squads, reserved courts on Fridays 8–10 PM",
    dest: "/dashboard/partner",
  },
  artist: {
    title: "Artists & Performers",
    blurb: "Play Solo-No-More events, list your own gigs, sell tickets and scan guests at the door.",
    name: "Artist / stage name",
    namePh: "e.g. DJ Noor",
    extra: "Links to your work (optional)",
    extraPh: "SoundCloud, YouTube or Spotify links",
    dest: "/dashboard/artist",
  },
};

export default function PortalClient() {
  const params = useSearchParams();
  const [kind, setKind] = useState<Kind>(params.get("type") === "artist" ? "artist" : "partner");
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signin" ? "signin" : "apply");

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailToken, setEmailToken] = useState<string | null>(null);
  const [city, setCity] = useState("Karachi");
  const [category, setCategory] = useState("");
  const [instagram, setInstagram] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const c = COPY[kind];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem =
      checkBusinessName(businessName, c.name) ||
      checkPersonName(contactName, "Your full name") ||
      checkPkMobile(phone, "Phone / WhatsApp") ||
      checkEmail(email) ||
      (emailToken ? null : 'Please verify your email: tap "Send verification code" and enter the 6-digit code.') ||
      (category ? null : "Please choose a category.") ||
      checkInstagram(instagram, kind === "artist");
    if (problem) return setError(problem);

    setBusy(true);
    try {
      const res = await submitPartnerApplicationAction({
        email,
        fullName: contactName,
        phone,
        city,
        partnerBusinessName: businessName,
        partnerCategory: kind === "artist" ? `Artist — ${category}` : category,
        partnerPerks: extra,
        instagram,
        packageSelected: kind === "artist" ? "Artist Residency" : "Partner Residency",
        packagePricePkr: 0,
        emailVerifiedToken: emailToken || undefined,
      });
      if (res.success && res.applicationId) setDoneId(res.applicationId);
      else setError(res.error || "Could not submit. Please try again.");
    } catch {
      setError("Could not reach the server. Please refresh the page and try again.");
    } finally {
      setBusy(false);
    }
  };

  const tab = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "12px 10px",
    background: active ? "#FF5A1F" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.7)",
    border: "1px solid " + (active ? "#FF5A1F" : "rgba(255,255,255,0.14)"),
    fontWeight: 800,
    fontSize: "13.5px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  });

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#fff" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px clamp(16px, 4vw, 40px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="solo-no-more" style={{ height: "40px", width: "auto" }} />
        </Link>
        <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", color: "#FFA05C" }}>PARTNER &amp; ARTIST PORTAL</span>
      </header>

      <main style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 16px 80px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button type="button" style={tab(kind === "partner")} onClick={() => { setKind("partner"); setCategory(""); setError(null); }}>
            <Store size={16} /> Partner / Venue
          </button>
          <button type="button" style={tab(kind === "artist")} onClick={() => { setKind("artist"); setCategory(""); setError(null); }}>
            <Mic2 size={16} /> Artist
          </button>
        </div>

        <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{c.title}</h1>
        <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.7)", margin: "0 0 24px", lineHeight: 1.55 }}>{c.blurb}</p>

        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.12)", marginBottom: "24px" }}>
          {(["apply", "signin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              style={{
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${mode === m ? "#FF5A1F" : "transparent"}`,
                color: mode === m ? "#fff" : "rgba(255,255,255,0.55)",
                fontWeight: 800,
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {m === "apply" ? "Apply" : "Sign in"}
            </button>
          ))}
        </div>

        {mode === "signin" ? (
          <SimpleSignIn destination={c.dest} buttonLabel={`Sign in to ${kind === "artist" ? "Artist" : "Partner"} Hub`} />
        ) : doneId ? (
          <div style={{ border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.07)", padding: "24px", textAlign: "center" }}>
            <CheckCircle2 size={40} color="#34D399" style={{ margin: "0 auto 10px" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 8px" }}>Application received</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 16px" }}>
              Our team reviews every {kind === "artist" ? "artist" : "partner"} personally. Once approved, we&apos;ll email you a link to set your
              password — then sign in here.
            </p>
            <Link href={`/pay/${doneId}`} style={{ color: "#FFA05C", fontWeight: 800, fontSize: "13.5px" }}>
              Check application status →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }} noValidate>
            {error && (
              <div role="alert" style={{ background: "rgba(235,57,57,0.15)", border: "1px solid rgba(235,57,57,0.35)", padding: "10px 14px", color: "#FF6B6B", fontSize: "13px" }}>
                {error}
              </div>
            )}
            <div>
              <label style={fieldLabel} htmlFor="p-name">{c.name} *</label>
              <input id="p-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={c.namePh} style={fieldInput} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div>
                <label style={fieldLabel} htmlFor="p-contact">Your full name *</label>
                <input id="p-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="As on your CNIC" style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel} htmlFor="p-phone">Phone / WhatsApp *</label>
                <input id="p-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" style={fieldInput} />
              </div>
            </div>
            <div>
              <label style={fieldLabel} htmlFor="p-email">{kind === "artist" ? "Email" : "Work email"} *</label>
              <input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldInput} />
              <EmailVerifyBox email={email} verifiedToken={emailToken} onVerified={setEmailToken} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div>
                <label style={fieldLabel} htmlFor="p-city">City *</label>
                <select id="p-city" value={city} onChange={(e) => setCity(e.target.value)} style={{ ...fieldInput, background: "#120d16" }}>
                  {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Other"].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={fieldLabel} htmlFor="p-cat">{kind === "artist" ? "What do you do?" : "Category"} *</label>
                <select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...fieldInput, background: "#120d16" }}>
                  <option value="">Choose…</option>
                  {CATEGORIES[kind].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={fieldLabel} htmlFor="p-ig">Instagram {kind === "artist" ? "*" : "(optional)"}</label>
              <input id="p-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel} htmlFor="p-extra">{c.extra}</label>
              <textarea id="p-extra" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={c.extraPh} style={{ ...fieldInput, resize: "vertical" }} />
            </div>
            <button type="submit" disabled={busy} style={{ ...primaryButton, opacity: busy ? 0.7 : 1 }}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? "Submitting…" : "Submit application"}
            </button>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Already approved? <button type="button" onClick={() => setMode("signin")} style={{ background: "none", border: "none", padding: 0, color: "#FFA05C", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}>Sign in</button>
            </p>
          </form>
        )}

        <p style={{ marginTop: "32px", fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>
          Looking to join hangouts as a member? <Link href="/apply" style={{ color: "#FFA05C" }}>Member &amp; guest signup →</Link>
        </p>
      </main>
    </div>
  );
}
