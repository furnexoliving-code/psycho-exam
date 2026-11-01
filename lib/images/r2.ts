import { AwsClient } from "aws4fetch";

/**
 * The Cloudflare R2 bucket the pictures are copied to, spoken to over its
 * S3-compatible API with the four variables below (Vercel → Settings →
 * Environment Variables). Server-only: the key must never reach a browser,
 * so no client component imports this file.
 */
export interface R2Settings {
  /** https://<account>.r2.cloudflarestorage.com, as the API token screen shows it. */
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const VARS = ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const;

/** The variables not set yet; empty once R2 is fully set up. */
export function r2Missing(): string[] {
  return VARS.filter((v) => !process.env[v]?.trim());
}

/** The bucket's settings, or null until all four variables are set. */
export function r2Settings(): R2Settings | null {
  if (r2Missing().length > 0) return null;
  const bucket = process.env.R2_BUCKET!.trim();
  // The endpoint however it was pasted: with a trailing slash, without the
  // scheme, or with the bucket's name after it.
  let endpoint = process.env.R2_ENDPOINT!.trim().replace(/\/+$/, "");
  if (endpoint.endsWith(`/${bucket}`)) endpoint = endpoint.slice(0, -(bucket.length + 1));
  if (!/^https?:\/\//i.test(endpoint)) endpoint = `https://${endpoint}`;
  return {
    endpoint,
    bucket,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
  };
}

function client(s: R2Settings): AwsClient {
  return new AwsClient({ accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey, service: "s3", region: "auto" });
}

/** The object's address under the API: path style, each segment of the name escaped. */
function objectUrl(s: R2Settings, key: string): string {
  return `${s.endpoint}/${s.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** A single request may not outlive the batch it runs in (lib/images/mirror.ts). */
const PUT_MS = 15_000;
const HEAD_MS = 10_000;
/** Tries after the first on a 5xx or a 429, a moment apart; then the reply as it is. */
const RETRIES = 2;

/**
 * Signs the request and sends it as a URL with its bytes, never as a
 * Request object. aws4fetch's own fetch hands the global fetch a Request,
 * and on this server that global is Next's, which rebuilds a Request's
 * body as a stream of unknown length: the PUT would go up chunked, with
 * no Content-Length, which the S3 API refuses. Sent as bytes, the length
 * goes with it. The signature covers the headers aws4fetch set, not the
 * length, so it holds either way.
 */
async function send(
  s: R2Settings,
  url: string,
  init: { method: "PUT" | "HEAD"; body?: ArrayBuffer; headers?: Record<string, string>; timeoutMs: number },
): Promise<Response> {
  const aws = client(s);
  for (let attempt = 0; ; attempt++) {
    const signed = await aws.sign(url, { method: init.method, body: init.body, headers: init.headers });
    const res = await fetch(url, {
      method: init.method,
      headers: signed.headers,
      body: init.body,
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs),
    });
    if ((res.status >= 500 || res.status === 429) && attempt < RETRIES) {
      await res.arrayBuffer().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
      continue;
    }
    return res;
  }
}

/** Writes an object with the headers R2 will serve it with. Throws with R2's reason when refused. */
export async function putObject(
  s: R2Settings,
  key: string,
  body: ArrayBuffer,
  headers: { contentType: string; cacheControl: string },
): Promise<void> {
  const res = await send(s, objectUrl(s, key), {
    method: "PUT",
    body,
    headers: { "Content-Type": headers.contentType, "Cache-Control": headers.cacheControl },
    timeoutMs: PUT_MS,
  });
  if (!res.ok) throw new Error(`R2 refused the copy (${res.status}): ${await reason(res)}`);
  // The body is not needed, but an unread body keeps the connection busy.
  await res.arrayBuffer().catch(() => undefined);
}

export interface ObjectHead {
  exists: boolean;
  status: number;
  contentType: string | null;
  cacheControl: string | null;
  bytes: number | null;
}

/** Whether an object is there, and the headers it is served with. */
export async function headObject(s: R2Settings, key: string): Promise<ObjectHead> {
  const res = await send(s, objectUrl(s, key), { method: "HEAD", timeoutMs: HEAD_MS });
  if (res.status !== 200 && res.status !== 404) throw new Error(`R2 refused the check (${res.status}): ${await reason(res)}`);
  return summarize(res);
}

/** The headers of a HEAD or GET reply, from R2's API or from the picture domain in front of it. */
export function summarize(res: Response): ObjectHead {
  const length = res.headers.get("content-length");
  return {
    exists: res.status === 200,
    status: res.status,
    contentType: res.headers.get("content-type"),
    cacheControl: res.headers.get("cache-control"),
    bytes: length && /^\d+$/.test(length) ? Number(length) : null,
  };
}

/** S3 says why in XML; the code and message are the readable part of it. */
async function reason(res: Response): Promise<string> {
  const text = (await res.text().catch(() => "")).replace(/\s+/g, " ").trim();
  const code = /<Code>([^<]*)<\/Code>/.exec(text)?.[1];
  const message = /<Message>([^<]*)<\/Message>/.exec(text)?.[1];
  return [code, message].filter(Boolean).join(": ") || text.slice(0, 200) || res.statusText || "no reason given";
}
