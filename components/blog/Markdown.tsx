import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A small Markdown renderer for the articles: headings, paragraphs,
 * bullet and numbered lists, quotes, pictures, links, bold, italic and
 * inline code. It builds React elements, never raw HTML, so nothing an
 * author types can become a script. Anything it does not know is shown
 * as plain text.
 */
export function Markdown({ text }: { text: string }) {
  return <>{blocks(text).map((b, i) => render(b, i))}</>;
}

type Block =
  | { kind: "h"; level: number; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "img"; alt: string; src: string }
  | { kind: "hr" };

function blocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(t);
    if (h) {
      out.push({ kind: "h", level: h[1].length, text: h[2] });
      i++;
      continue;
    }
    if (/^(---|\*\*\*)$/.test(t)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(t);
    if (img) {
      out.push({ kind: "img", alt: img[1], src: img[2] });
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      out.push({ kind: "ul", items });
      continue;
    }
    if (/^\d+[.)]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      out.push({ kind: "ol", items });
      continue;
    }
    if (/^>\s?/.test(t)) {
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        parts.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push({ kind: "quote", text: parts.join(" ") });
      continue;
    }
    // A paragraph runs to the next blank line or block.
    const parts: string[] = [];
    while (i < lines.length) {
      const s = lines[i].trim();
      if (!s || /^(#{1,4})\s+/.test(s) || /^[-*]\s+/.test(s) || /^\d+[.)]\s+/.test(s) || /^>\s?/.test(s) || /^!\[/.test(s) || /^(---|\*\*\*)$/.test(s)) break;
      parts.push(s);
      i++;
    }
    out.push({ kind: "p", text: parts.join(" ") });
  }
  return out;
}

function render(b: Block, key: number): ReactNode {
  switch (b.kind) {
    case "h": {
      const cls = b.level <= 2 ? "mt-10 text-[26px] font-extrabold text-gray-900" : b.level === 3 ? "mt-8 text-[20px] font-bold text-gray-900" : "mt-6 text-[17px] font-bold text-gray-900";
      const id = slugOf(b.text);
      if (b.level <= 2) return <h2 key={key} id={id} className={cls}>{inline(b.text)}</h2>;
      if (b.level === 3) return <h3 key={key} id={id} className={cls}>{inline(b.text)}</h3>;
      return <h4 key={key} id={id} className={cls}>{inline(b.text)}</h4>;
    }
    case "p":
      return <p key={key} className="mt-4 text-[17px] leading-[1.75] text-gray-800">{inline(b.text)}</p>;
    case "ul":
      return (
        <ul key={key} className="mt-4 list-disc space-y-1.5 pl-6 text-[17px] leading-[1.7] text-gray-800">
          {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="mt-4 list-decimal space-y-1.5 pl-6 text-[17px] leading-[1.7] text-gray-800">
          {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </ol>
      );
    case "quote":
      return <blockquote key={key} className="mt-5 border-l-4 border-[#ff9933] bg-[#fff7ed] px-5 py-3 text-[16px] italic text-gray-800">{inline(b.text)}</blockquote>;
    case "img":
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={safeUrl(b.src) ?? ""} alt={b.alt} loading="lazy" className="mt-6 w-full rounded-xl border border-gray-200" />;
    case "hr":
      return <hr key={key} className="my-8 border-gray-200" />;
  }
}

/** Bold, italic, code, links and pictures inside a line. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<b key={k++}>{tok.slice(2, -2)}</b>);
    else if (tok.startsWith("`")) out.push(<code key={k++} className="rounded bg-gray-100 px-1 text-[15px]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("*")) out.push(<i key={k++}>{tok.slice(1, -1)}</i>);
    else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      if (link) {
        const href = safeUrl(link[2]);
        if (!href) out.push(link[1]);
        else if (href.startsWith("/")) out.push(<Link key={k++} href={href} className="font-semibold text-[#0d2a6b] underline">{link[1]}</Link>);
        else out.push(<a key={k++} href={href} className="font-semibold text-[#0d2a6b] underline" rel="noopener">{link[1]}</a>);
      } else out.push(tok);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Only web addresses and paths on this site; anything else is dropped. */
function safeUrl(raw: string): string | null {
  if (raw.startsWith("/")) return raw.startsWith("//") ? null : raw;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function slugOf(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** The headings of an article, for a table of contents. */
export function headingsOf(text: string): { id: string; text: string }[] {
  return blocks(text)
    .filter((b): b is Extract<Block, { kind: "h" }> => b.kind === "h" && b.level <= 2)
    .map((b) => ({ id: slugOf(b.text), text: b.text }));
}
