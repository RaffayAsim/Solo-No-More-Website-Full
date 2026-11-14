import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import SimpleSignIn from "@/components/auth/SimpleSignIn";

export const metadata = {
  title: "Team Sign-in — Solo-No-More",
  robots: { index: false, follow: false },
};

/**
 * Sign-in for the Solo-No-More team. There is no public admin signup: admins are the
 * addresses in ADMIN_EMAILS, and sub-admins are added from Admin → Access & Settings.
 * The /admin pages check access on the server, so a non-admin who signs in here is
 * simply sent to their normal dashboard.
 */
export default function AdminLoginPage() {
  return (
    <div style={{ background: "#060408", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <ShieldCheck size={22} color="#FF8A3D" />
          <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0 }}>Team sign-in</h1>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "0 0 24px", lineHeight: 1.5 }}>
          For Solo-No-More admins and staff. Team accounts are added by the owner — there is no public signup.
        </p>
        <SimpleSignIn destination="/admin" buttonLabel="Sign in to Admin Panel" />
        <p style={{ marginTop: "24px", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.6)" }}>← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
