"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getApplicationByIdAction, submitApplicationPaymentAction, MemberApplicationRecord } from "@/app/actions/member-applications";
import {
  CreditCard,
  Building,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

export default function ApplicationPaymentPage() {
  const params = useParams();
  const id = params?.id as string;

  const [application, setApplication] = useState<MemberApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [proofImage, setProofImage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    async function loadApp() {
      if (!id) return;
      setLoading(true);
      const data = await getApplicationByIdAction(id);
      setApplication(data);
      setLoading(false);
    }
    loadApp();
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setErrorMsg("Transaction Reference (TID / IBFT Ref) is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitApplicationPaymentAction(id, {
      transactionRef: transactionRef.trim(),
      paymentMethod,
      proofImageUrl: proofImage || undefined,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccessSubmitted(true);
      const updated = await getApplicationByIdAction(id);
      setApplication(updated);
    } else {
      setErrorMsg(res.error || "Failed to submit payment proof.");
    }
  };

  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#FFFFFF", position: "relative", padding: "40px 20px 80px" }}>
      {/* Background Radial Glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "600px",
          background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(255, 90, 31, 0.22) 0%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 900, color: "#fff" }}>
              solo-no-more
            </span>
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 8px" }}>
            Membership Payment &amp; Verification
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
            Application Reference: <span style={{ fontFamily: "monospace", color: "#FF8A3D" }}>{id}</span>
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Clock className="w-8 h-8 text-[#FF5A1F] animate-spin mx-auto mb-3" />
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading application records...</p>
          </div>
        ) : !application ? (
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "20px", padding: "30px", textAlign: "center" }}>
            <AlertCircle className="w-12 h-12 text-[#FF6B6B] mx-auto mb-3" />
            <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Application Not Found</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)" }}>
              We could not find an application with reference ID {id}.
            </p>
            <Link
              href="/apply"
              style={{
                display: "inline-block",
                marginTop: "16px",
                background: "#FF5A1F",
                color: "#fff",
                padding: "10px 22px",
                borderRadius: "10px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Start New Application
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1.5px solid rgba(255,255,255,0.14)",
              borderRadius: "26px",
              padding: "clamp(26px, 4vw, 40px)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Applicant Summary */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Applicant</span>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#fff" }}>{application.fullName}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)" }}>{application.email}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Selected Tier</span>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#FFA05C" }}>{application.packageSelected}</div>
                <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff" }}>PKR {application.packagePricePkr.toLocaleString()}</div>
              </div>
            </div>

            {/* STATUS 1: PENDING ADMIN APPROVAL */}
            {application.status === "pending_admin_approval" && (
              <div style={{ textAlign: "center", padding: "20px 10px" }}>
                <Clock className="w-12 h-12 text-[#FF8A3D] mx-auto mb-3" />
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Review in Progress</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto" }}>
                  Your profile and curation answers are currently under review by our admin team. Once approved, the bank payment instructions will appear on this page automatically.
                </p>
              </div>
            )}

            {/* STATUS 2: PAYMENT PENDING (Bank Details Display + Submission Form) */}
            {application.status === "payment_pending" && (
              <div>
                <div style={{ background: "rgba(255,90,31,0.12)", border: "1px solid rgba(255,90,31,0.3)", borderRadius: "16px", padding: "18px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Building className="w-5 h-5 text-[#FF8A3D]" />
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Official Bank Account Transfer Details:</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Bank Name:</span>
                      <span style={{ fontWeight: 800, color: "#fff" }}>Meezan Bank Limited</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Account Title:</span>
                      <span style={{ fontWeight: 800, color: "#fff" }}>Solo-No-More Club</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>IBAN:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 900, fontFamily: "monospace", color: "#FFA05C" }}>PK36MEZN0001010203040506</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("PK36MEZN0001010203040506", "iban")}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
                        >
                          {copiedField === "iban" ? <Check className="w-4 h-4 text-[#27C93F]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Raast ID (Phone):</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 900, fontFamily: "monospace", color: "#FFA05C" }}>03001234567</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("03001234567", "raast")}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
                        >
                          {copiedField === "raast" ? <Check className="w-4 h-4 text-[#27C93F]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>Total Amount:</span>
                      <span style={{ fontSize: "18px", fontWeight: 900, color: "#27C93F" }}>PKR {application.packagePricePkr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Proof Submission Form */}
                <form onSubmit={handlePaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Submit Payment Screenshot &amp; Reference</h3>

                  {errorMsg && (
                    <div style={{ background: "rgba(235,57,57,0.15)", border: "1px solid rgba(235,57,57,0.3)", borderRadius: "10px", padding: "10px 14px", color: "#FF6B6B", fontSize: "13px" }}>
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Transaction Reference (TID / IBFT Ref ID) *
                    </label>
                    <input
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. MEZN123456789 or Raast ID"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
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
                      Upload Payment Screenshot Proof
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        color: "#fff",
                        fontSize: "13px",
                      }}
                    />
                    {proofImage && (
                      <div style={{ marginTop: "10px", width: "120px", height: "120px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.3)" }}>
                        <img src={proofImage} alt="Payment Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      marginTop: "10px",
                      background: "linear-gradient(135deg, #FF6F26 0%, #FF5A1F 100%)",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "12px",
                      fontSize: "14.5px",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(255,90,31,0.4)",
                    }}
                  >
                    {submitting ? "SUBMITTING PROOF…" : "CONFIRM PAYMENT PROOF"}
                  </button>
                </form>
              </div>
            )}

            {/* STATUS 3: PAYMENT SUBMITTED */}
            {application.status === "payment_submitted" && (
              <div style={{ textAlign: "center", padding: "24px 10px" }}>
                <CheckCircle2 className="w-14 h-14 text-[#27C93F] mx-auto mb-3" />
                <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 8px" }}>Payment Proof Received!</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto 20px" }}>
                  Your transaction TID (<strong>{application.transactionRef}</strong>) is queued with admin verification. Once verified, your credential setup link will unlock right here.
                </p>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Verified automatically during business hours (typically &lt; 2 hours).
                </div>
              </div>
            )}

            {/* STATUS 4: APPROVED & TOKEN ISSUED */}
            {application.status === "approved" && application.inviteToken && (
              <div style={{ textAlign: "center", padding: "24px 10px" }}>
                <Sparkles className="w-14 h-14 text-[#27C93F] mx-auto mb-3" />
                <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 8px" }}>Payment Verified!</h3>
                <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto 24px" }}>
                  Congratulations! Your membership payment has been verified. You can now configure your password to activate your account.
                </p>
                <Link
                  href={`/create-credentials?token=${application.inviteToken}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #27C93F 0%, #1FB837 100%)",
                    color: "#fff",
                    padding: "14px 32px",
                    borderRadius: "14px",
                    fontSize: "15px",
                    fontWeight: 900,
                    textDecoration: "none",
                    boxShadow: "0 8px 30px rgba(39, 201, 63, 0.45)",
                  }}
                  className="hover:scale-105"
                >
                  <span>Create Your Password &amp; Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* STATUS 5: CREDENTIALS CREATED */}
            {application.status === "credentials_created" && (
              <div style={{ textAlign: "center", padding: "24px 10px" }}>
                <CheckCircle2 className="w-14 h-14 text-[#27C93F] mx-auto mb-3" />
                <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 8px" }}>Account Active!</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", marginBottom: "20px" }}>
                  Your account credentials have already been configured.
                </p>
                <Link
                  href="/login"
                  style={{
                    display: "inline-block",
                    background: "#FF5A1F",
                    color: "#fff",
                    padding: "12px 28px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Sign In to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
