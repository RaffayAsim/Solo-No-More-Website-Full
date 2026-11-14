import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Default social-share card for every page that does not set its own image.
export const alt = "Solo-No-More — Never go out alone again. Find your people IRL.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  let logo: string | null = null;
  try {
    const buf = await readFile(join(process.cwd(), "public", "logo.png"));
    logo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {}

  const squad = ["#FF5A1F", "#FFA05C", "#C8FF00", "#FFFFFF"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#060408",
          backgroundImage: "radial-gradient(ellipse 70% 60% at 85% 20%, rgba(255,90,31,0.45), transparent 70%)",
          padding: "64px 72px",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" height={64} style={{ height: 64 }} />
          ) : (
            <div style={{ fontSize: 40, fontWeight: 800 }}>solo-no-more</div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            {squad.map((c) => (
              <div key={c} style={{ width: 44, height: 52, background: c, display: "flex" }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>Never go out alone again.</div>
          <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, color: "#FF6F26" }}>Find your people IRL.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, color: "rgba(255,255,255,0.8)" }}>
          <div style={{ display: "flex" }}>Padel · Chai runs · Gigs · Food walks — Karachi, Lahore & Islamabad</div>
          <div style={{ display: "flex", color: "#FFA05C", fontWeight: 800 }}>solonomore.online</div>
        </div>
      </div>
    ),
    size
  );
}
