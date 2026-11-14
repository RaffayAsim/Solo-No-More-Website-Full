import React from "react";

/**
 * Turns the admin's simple post formatting into React elements (never raw HTML, so a
 * pasted <script> is shown as text, not run):
 *   blank line → new paragraph · "## " / "### " headings · "- " or "1. " list items
 *   "> " quote · **bold** · [link text](https://… or /path)
 */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyBase}-b${i++}`} style={{ color: "#fff" }}>{m[1]}</strong>);
    else {
      const external = /^https?:\/\//i.test(m[3]) && !m[3].includes("solonomore.online");
      out.push(
        <a key={`${keyBase}-a${i++}`} href={m[3]} style={{ color: "#FF8A3D", textDecoration: "underline" }} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {m[2]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderBlogBody(body: string): React.ReactNode[] {
  const blocks = String(body || "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  const nodes: React.ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
    if (!lines.length) return;
    const k = `blk${bi}`;
    const first = lines[0].trim();
    if (first.startsWith("### ")) {
      nodes.push(<h3 key={k} style={{ fontSize: "20px", fontWeight: 800, margin: "28px 0 10px", color: "#fff" }}>{inline(first.slice(4), k)}</h3>);
      if (lines.length > 1) nodes.push(...renderBlogBody(lines.slice(1).join("\n")));
    } else if (first.startsWith("## ")) {
      nodes.push(<h2 key={k} style={{ fontSize: "24px", fontWeight: 900, margin: "36px 0 12px", color: "#fff", letterSpacing: "-0.01em" }}>{inline(first.slice(3), k)}</h2>);
      if (lines.length > 1) nodes.push(...renderBlogBody(lines.slice(1).join("\n")));
    } else if (lines.every((l) => /^\s*[-*] /.test(l))) {
      nodes.push(
        <ul key={k} style={{ margin: "0 0 18px", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*[-*] /, ""), `${k}-${i}`)}</li>)}
        </ul>
      );
    } else if (lines.every((l) => /^\s*\d+[.)] /.test(l))) {
      nodes.push(
        <ol key={k} style={{ margin: "0 0 18px", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+[.)] /, ""), `${k}-${i}`)}</li>)}
        </ol>
      );
    } else if (lines.every((l) => l.startsWith(">"))) {
      nodes.push(
        <blockquote key={k} style={{ margin: "0 0 18px", padding: "4px 0 4px 16px", borderLeft: "3px solid #FF5A1F", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
          {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), k)}
        </blockquote>
      );
    } else {
      nodes.push(<p key={k} style={{ margin: "0 0 18px" }}>{inline(lines.join(" "), k)}</p>);
    }
  });
  return nodes;
}

/** Plain text of a post (for word counts and descriptions). */
export function blogPlainText(body: string): string {
  return String(body || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*>`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
