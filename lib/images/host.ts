/**
 * Where the papers' pictures are served from.
 *
 * Every picture an admin uploads goes into the Supabase bucket, and its
 * link in the database points there. Serving tens of lakhs of picture
 * requests a day from Supabase is what its egress bill counts, so the
 * pictures are also copied to Cloudflare R2 (lib/images/mirror.ts) and,
 * once NEXT_PUBLIC_IMAGE_HOST names the domain in front of that copy,
 * served from there: the links are rewritten as a paper is read, never
 * in the database. Unsetting the variable (and deploying) puts Supabase
 * back in front within minutes — the database never changed.
 */

const BUCKET = "watch-diagrams";

/** The start of every link into the Supabase bucket, or null before the portal is configured. */
export function supabasePicturePrefix(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  return base ? `${base}/storage/v1/object/public/${BUCKET}/` : null;
}

/**
 * The domain pictures are served from (https://img.example.com), or null
 * while Supabase serves them. A value with no scheme is taken as https;
 * anything that is not a bare domain is ignored, with a note in the log,
 * rather than turned into links no browser can follow — Supabase then
 * keeps serving, and Admin → Pictures shows the value refused.
 */
export function imageHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_IMAGE_HOST?.trim().replace(/\/+$/, "");
  if (!raw) return null;
  const host = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!/^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    console.error(`NEXT_PUBLIC_IMAGE_HOST is "${raw}", not a domain such as https://img.example.com; the pictures are served from Supabase.`);
    return null;
  }
  return host;
}

/** The variable as set, for the panel to show beside what was made of it. */
export function imageHostSetting(): string | null {
  return process.env.NEXT_PUBLIC_IMAGE_HOST?.trim() || null;
}

/** A picture's link as the student should fetch it. Any other link is left alone. */
export function rehostUrl(url: string): string {
  const host = imageHost();
  const prefix = supabasePicturePrefix();
  if (!host || !prefix || !url.startsWith(prefix)) return url;
  return `${host}/${url.slice(prefix.length)}`;
}

/** Every picture link inside a text (an article's markdown), rewritten. */
export function rehostText(text: string): string {
  const host = imageHost();
  const prefix = supabasePicturePrefix();
  if (!host || !prefix || !text.includes(prefix)) return text;
  return text.split(prefix).join(`${host}/`);
}

/**
 * Every string anywhere inside a value (a paper: its diagram, the parts'
 * tables, the study screens, each question's picture and option pictures,
 * the instructions' pictures), rewritten. Returns the value itself when
 * there is nothing to do, so a cached paper is not copied for nothing.
 */
export function rehostDeep<T>(value: T): T {
  if (!imageHost() || !supabasePicturePrefix()) return value;
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (typeof value === "string") return rehostUrl(value);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = walk(v);
    return out;
  }
  return value;
}
