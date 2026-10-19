import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Waitlist VIP Access | Solo-No-More — Find Your Vibe IRL",
  description:
    "Join the waitlist for Solo-No-More. Claim your early bird founding member pass and unlock exclusive IRL squad meetups.",
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
