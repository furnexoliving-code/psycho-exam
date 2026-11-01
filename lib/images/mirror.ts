import { createAdminClient } from "@/lib/supabase/admin";
import { BAD_NAME, NOT_IN_BUCKET, type Failure } from "./failures";

export type { Failure } from "./failures";
import { imageHost, supabasePicturePrefix } from "./host";
import { headObject, putObject, r2Missing, r2Settings, summarize, type ObjectHead, type R2Settings } from "./r2";

/**
 * The copy of the pictures on Cloudflare R2.
 *
 * The admin's uploads stay in the Supabase bucket, which remains the master
 * copy; each is copied here, and the portal serves the copy once
 * NEXT_PUBLIC_IMAGE_HOST is set (lib/images/host.ts). Two ways in: every
 * new upload is copied as it lands (mirrorUploadedPicture), and Admin →
 * Pictures copies what is not copied yet, a batch at a time, until the
 * two sides match. The image_mirror table (supabase/images-r2.sql)
 * remembers what is copied, so a run can stop and resume, and a failure
 * is shown rather than retried for ever.
 */

/**
 * How a copy is served: kept for a year by the browser and by Cloudflare's
 * edge. Safe because a name is never reused — an upload never overwrites
 * (components/admin/upload.ts), so what a name shows can never change.
 */
const CACHE_CONTROL = "public, max-age=31536000, immutable";
/** One press of Copy: this many pictures at most, this many at once, for at most this long. */
const PER_BATCH = 300;
const AT_ONCE = 8;
/** Well inside the forty seconds a panel action may run. */
const BATCH_MS = 20_000;
/** The newest copies looked at by Check. */
const CHECKED = 10;

/** A read from Supabase may not outlive the batch it runs in. */
const READ_MS = 10_000;


const BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/** A name inside the bucket: folders and a file, no empty or dot segments, nothing that could point outside it. */
export function isObjectName(name: string): boolean {
  if (name.length === 0 || name.length > 300 || /[\x00-\x1f\\?#]/.test(name)) return false;
  return name.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

/** The object's name from its public Supabase link; null for any other link. */
export function nameOfPublicUrl(url: string): string | null {
  const prefix = supabasePicturePrefix();
  if (!prefix || !url.startsWith(prefix)) return null;
  let name: string;
  try {
    name = decodeURIComponent(url.slice(prefix.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  return isObjectName(name) ? name : null;
}

function pathOf(name: string): string {
  return name.split("/").map(encodeURIComponent).join("/");
}

function settings(): R2Settings {
  const r2 = r2Settings();
  if (!r2) throw new Error(`R2 is not set up: ${r2Missing().join(", ")} missing in the Vercel environment`);
  return r2;
}

/** Reads a picture from the Supabase bucket, where the upload put it. */
async function readFromSupabase(name: string, mimetype?: string | null): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const prefix = supabasePicturePrefix();
  if (!prefix) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  const res = await fetch(prefix + pathOf(name), { cache: "no-store", signal: AbortSignal.timeout(READ_MS) });
  // Storage answers a missing object with 400 as often as with 404.
  if (res.status === 400 || res.status === 404) throw new Error(`${NOT_IN_BUCKET} (${res.status})`);
  if (!res.ok) throw new Error(`Supabase refused the read (${res.status})`);
  const header = res.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  let contentType =
    (header.startsWith("image/") ? header : null) ??
    (mimetype?.startsWith("image/") ? mimetype : null) ??
    BY_EXTENSION[extension] ??
    "application/octet-stream";
  // An SVG is a document that can carry script; served as a picture from a
  // domain beside the portal's it would run there. The papers' pictures
  // are rasters, and the upload refuses SVGs; one already in the bucket is
  // copied as plain bytes, which no browser runs.
  if (contentType === "image/svg+xml") contentType = "application/octet-stream";
  return { bytes: await res.arrayBuffer(), contentType };
}

export interface Copied {
  name: string;
  bytes: number;
  contentType: string;
}

async function copyOne(r2: R2Settings, name: string, mimetype?: string | null): Promise<Copied> {
  const { bytes, contentType } = await readFromSupabase(name, mimetype);
  await putObject(r2, name, bytes, { contentType, cacheControl: CACHE_CONTROL });
  return { name, bytes: bytes.byteLength, contentType };
}

/** Copies one picture and records it. Throws when either side refuses; nothing is recorded then. */
export async function mirrorObject(name: string): Promise<Copied> {
  if (!isObjectName(name)) throw new Error(`Not a picture name: ${name.slice(0, 60)}`);
  const copied = await copyOne(settings(), name);
  // The copy is what serves the picture; the record only tells the next
  // batch not to copy it again. A record that cannot be written (the SQL
  // not run yet) costs one repeated copy later, not the upload.
  const { error } = await createAdminClient()
    .from("image_mirror")
    .upsert({ name, bytes: copied.bytes, content_type: copied.contentType, mirrored_at: new Date().toISOString(), error: null }, { onConflict: "name" });
  if (error) console.error(`Picture ${name} copied but not recorded: ${error.message} — has supabase/images-r2.sql been run?`);
  return copied;
}

export interface MirrorProgress {
  /** Pictures in the Supabase bucket. */
  total: number;
  /** Of them, copied. */
  copied: number;
  /** Of them, tried and refused; Retry forgets these so Copy tries again. */
  failed: number;
  /**
   * Of the failed, those no retry can mend: the bucket lists the picture
   * but no longer holds it, or its name cannot be carried. Students never
   * saw these; the copy is complete with them left as they are.
   */
  missing: number;
  /** Of them, not tried yet. */
  remaining: number;
}

/** Where the copy stands, counted in the database. */
export async function mirrorProgress(): Promise<MirrorProgress> {
  const { data, error } = await createAdminClient().rpc("image_mirror_progress");
  if (error) throw new Error(`Could not count the pictures: ${error.message} — run supabase/images-r2.sql in the Supabase SQL editor first`);
  const row = (Array.isArray(data) ? data[0] : data) as Partial<Record<keyof MirrorProgress, number | string>> | undefined;
  const n = (v: number | string | undefined) => Number(v ?? 0) || 0;
  return { total: n(row?.total), copied: n(row?.copied), failed: n(row?.failed), missing: n(row?.missing), remaining: n(row?.remaining) };
}

/** The failures recorded, by name, so a reload still shows why. */
export async function listFailures(limit = 20): Promise<Failure[]> {
  const { data, error } = await createAdminClient().from("image_mirror").select("name, error").not("error", "is", null).order("name").limit(limit);
  if (error) throw new Error(`Could not list the failures: ${error.message}`);
  return (data ?? []).map((r) => ({ name: String(r.name), error: String(r.error ?? "") }));
}

export interface BatchOutcome {
  copied: number;
  failed: Failure[];
  seconds: number;
  progress: MirrorProgress;
}

/** One press of Copy: the next pictures not yet tried, AT_ONCE at a time, until the batch or its time is done. */
export async function mirrorBatch(): Promise<BatchOutcome> {
  const r2 = settings();
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("image_mirror_pending", { p_limit: PER_BATCH });
  if (error) throw new Error(`Could not list the pictures still to copy: ${error.message} — run supabase/images-r2.sql in the Supabase SQL editor first`);

  const started = Date.now();
  const queue: { name: string; mimetype: string | null }[] = [];
  const done: Copied[] = [];
  const failed: Failure[] = [];
  for (const row of (data ?? []) as { name: string; mimetype: string | null }[]) {
    // A name the copy cannot carry is recorded as failed rather than left
    // for every later batch to list again.
    if (isObjectName(row.name)) queue.push(row);
    else failed.push({ name: row.name, error: BAD_NAME });
  }

  await Promise.all(
    Array.from({ length: AT_ONCE }, async () => {
      while (queue.length > 0 && Date.now() - started < BATCH_MS) {
        const row = queue.shift()!;
        try {
          done.push(await copyOne(r2, row.name, row.mimetype));
        } catch (e) {
          failed.push({ name: row.name, error: e instanceof Error ? e.message : String(e) });
        }
      }
    }),
  );

  const now = new Date().toISOString();
  const rows = [
    ...done.map((c) => ({ name: c.name, bytes: c.bytes, content_type: c.contentType, mirrored_at: now, error: null })),
    ...failed.map((f) => ({ name: f.name, bytes: null, content_type: null, mirrored_at: null, error: f.error.slice(0, 500) })),
  ];
  if (rows.length > 0) {
    const { error: writeError } = await supabase.from("image_mirror").upsert(rows, { onConflict: "name" });
    if (writeError) throw new Error(`${done.length} copied, but could not record them: ${writeError.message}`);
  }

  return {
    copied: done.length,
    failed,
    seconds: Math.round((Date.now() - started) / 100) / 10,
    progress: await mirrorProgress(),
  };
}

/** Forgets the failures, so the next Copy tries them again. Returns how many. */
export async function forgetFailures(): Promise<number> {
  const { data, error } = await createAdminClient().from("image_mirror").delete().not("error", "is", null).select("name");
  if (error) throw new Error(`Could not clear the failures: ${error.message}`);
  return data?.length ?? 0;
}

export interface Checked extends ObjectHead {
  name: string;
  /** Where it was looked for: the picture domain, or R2's own API. */
  via: "domain" | "api";
  url: string | null;
  /** Why there was no reply at all (the domain not live yet, usually). */
  note?: string;
}

/**
 * Looks at the newest copies the way a student's browser will: through the
 * picture domain when one is given (or set), else through R2's API.
 */
export async function checkCopies(domain?: string | null): Promise<Checked[]> {
  const { data, error } = await createAdminClient()
    .from("image_mirror")
    .select("name")
    .is("error", null)
    .order("mirrored_at", { ascending: false })
    .limit(CHECKED);
  if (error) throw new Error(`Could not list the copies: ${error.message}`);
  const names = (data ?? []).map((r) => String(r.name)).filter(isObjectName);
  if (names.length === 0) throw new Error("Nothing is copied yet — press Copy first, then Check.");

  const host = (domain ?? "").trim().replace(/\/+$/, "") || imageHost();
  if (host) {
    // The server fetches from the domain typed in: a public name only, no
    // address or bare word that could reach something inside; and once
    // the portal serves from a domain, that one and no other.
    if (!/^https:\/\/(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(host)) throw new Error(`Not a picture domain: ${host.slice(0, 80)} (expected https://img.example.com)`);
    const serving = imageHost();
    if (serving && host.toLowerCase() !== serving.toLowerCase()) throw new Error(`The portal serves pictures from ${serving}; check that domain`);
    return Promise.all(
      names.map(async (name): Promise<Checked> => {
        const url = `${host}/${pathOf(name)}`;
        try {
          const res = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10_000) });
          return { name, via: "domain", url, ...summarize(res) };
        } catch (e) {
          return {
            name,
            via: "domain",
            url,
            exists: false,
            status: 0,
            contentType: null,
            cacheControl: null,
            bytes: null,
            note: `No reply from this domain. In Cloudflare, R2 → the bucket → Settings → Custom Domains: is it connected and Active, and spelt as above? (${e instanceof Error ? e.message : String(e)})`,
          };
        }
      }),
    );
  }

  const r2 = settings();
  return Promise.all(names.map(async (name): Promise<Checked> => ({ name, via: "api", url: null, ...(await headObject(r2, name)) })));
}
