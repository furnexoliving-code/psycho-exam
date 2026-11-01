"use client";

import { useRef, useState } from "react";
import { isMissing, type Failure } from "@/lib/images/failures";
import type { BatchOutcome, Checked, MirrorProgress, Probe } from "@/lib/images/mirror";
import { checkPictures, copyNextBatch, countProgress, retryFailures, testConnection } from "./actions";

/**
 * The pictures' copy on Cloudflare R2, run from here: Copy takes the next
 * three hundred and goes on by itself until every picture is tried, Check
 * looks at the newest copies the way a student's browser will, and the
 * steps at the foot say what to do in which order.
 */
export function PicturesView({
  missing,
  bucket,
  host,
  hostRefused,
  progress: initial,
  failures: recorded,
  progressError,
}: {
  /** The R2 variables not set in the Vercel environment; empty once set up. */
  missing: string[];
  bucket: string | null;
  /** The picture domain the portal serves from, or null while Supabase serves. */
  host: string | null;
  /** The variable as set, when it was refused as not a domain. */
  hostRefused: string | null;
  progress: MirrorProgress | null;
  /** The failures recorded so far (the first twenty by name), so a reload still shows why. */
  failures: Failure[];
  /** Why the count failed: the SQL not run yet, usually. */
  progressError: string | null;
}) {
  const [progress, setProgress] = useState(initial);
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<BatchOutcome | null>(null);
  const [failures, setFailures] = useState<Failure[]>(recorded);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; tone: "good" | "warn" } | null>(null);
  const [domain, setDomain] = useState(host ?? "");
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<Checked[] | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);
  const [probes, setProbes] = useState<Probe[] | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const stop = useRef(false);
  /** Where the next batch starts: the last name the previous one listed. Empty: from the top. */
  const cursor = useRef("");

  const ready = missing.length === 0 && progress !== null;
  /** Every picture tried. */
  const tried = progress !== null && progress.remaining === 0;
  /** Every picture that can be copied is copied: the failures left, if any, are the bucket's own. */
  const complete = tried && progress.failed === progress.missing;
  const mendable = progress ? progress.failed - progress.missing : 0;

  /**
   * One batch, asked for again when the call itself fails — the connection
   * dropped, or the server was swapped under a deploy — a few times, a
   * little longer apart each time. Safe to ask again: each batch writes
   * down what it did as it goes, and the next starts after whatever is
   * already recorded.
   */
  const batch = async () => {
    for (let tries = 0; ; tries++) {
      try {
        return await copyNextBatch(cursor.current);
      } catch (e) {
        if (tries >= 4 || stop.current) throw e;
        const wait = 2 ** tries * 2;
        setNote({ tone: "warn", text: `The connection dropped (${e instanceof Error ? e.message : String(e)}); trying again in ${wait} s…` });
        await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      }
    }
  };

  const copy = async () => {
    stop.current = false;
    setRunning(true);
    setError(null);
    setNote(null);
    try {
      for (;;) {
        const reply = await batch();
        setNote(null);
        if (!reply.ok) {
          setError(reply.error);
          break;
        }
        const outcome = reply.value;
        cursor.current = outcome.last;
        setLast(outcome);
        if (outcome.failed.length > 0) setFailures((f) => [...outcome.failed, ...f].slice(0, 20));
        // The page keeps its own count from what each batch reports; a true
        // one from the database is taken when the run ends.
        const missingNow = outcome.failed.filter(isMissing).length;
        setProgress((p) =>
          p
            ? {
                ...p,
                copied: p.copied + outcome.copied,
                failed: p.failed + outcome.failed.length,
                missing: p.missing + missingNow,
                remaining: Math.max(0, p.remaining - outcome.copied - outcome.failed.length),
              }
            : p,
        );
        if (outcome.listed === 0) {
          // Nothing left after where this run got to. A run that began
          // part-way (after a reload or a retry) looks again from the top
          // before calling the copy done, so nothing before its start, and
          // nothing uploaded meanwhile, is left behind.
          if (cursor.current !== "") {
            cursor.current = "";
            continue;
          }
          const counted = await countProgress().catch(() => null);
          const final = counted && counted.ok ? counted.value : null;
          if (final) setProgress(final);
          const left = final ? final.failed - final.missing : 0;
          const missing = final ? final.missing : 0;
          if (left > 0) {
            setNote({ tone: "warn", text: `Every picture has been tried, but ${left} ${left === 1 ? "was" : "were"} refused. Read the reasons below, press Retry the failed ones, then Copy again.` });
          } else if (missing > 0) {
            setNote({ tone: "good", text: `Every picture is copied. ${missing} ${missing === 1 ? "is" : "are"} missing from Supabase itself, so students never saw ${missing === 1 ? "it" : "them"}; leave ${missing === 1 ? "it" : "them"} be.` });
          } else {
            setNote({ tone: "good", text: "Every picture is copied." });
          }
          break;
        }
        if (stop.current) {
          setNote({ tone: "warn", text: "Stopped. Press Copy to go on from here." });
          break;
        }
        // A batch that copied nothing, and failed for reasons a retry could
        // mend, is the set-up refusing, not the pictures: stop, and show the
        // first reason, rather than mark every picture in the bucket failed.
        const mendable = outcome.failed.filter((f) => !isMissing(f));
        if (outcome.copied === 0 && (mendable.length > 0 || outcome.failed.length === 0)) {
          setError(
            mendable.length > 0
              ? `Nothing was copied: every picture in the batch was refused — "${mendable[0].error}". Fix that (the R2 endpoint and keys in Vercel, usually), press Retry the failed ones, then Copy.`
              : "Nothing was copied in twelve seconds: Supabase or Cloudflare is not answering. Wait a minute and press Copy again; if it keeps happening, check the R2 endpoint and keys in Vercel.",
          );
          break;
        }
      }
    } catch (e) {
      // The call itself failed — the connection dropped, or the server cut
      // the batch off — rather than the copy reporting a failure.
      setError(`The server did not answer five times running (${e instanceof Error ? e.message : String(e)}). Nothing already copied is lost: press Copy to go on from here.`);
    } finally {
      setRunning(false);
    }
  };

  const retry = async () => {
    setError(null);
    setNote(null);
    const reply = await retryFailures().catch((e) => ({ ok: false as const, error: `The server did not answer (${e instanceof Error ? e.message : String(e)}).` }));
    if (!reply.ok) {
      setError(reply.error);
      return;
    }
    setFailures([]);
    cursor.current = "";
    setProgress((p) => (p ? { ...p, remaining: p.remaining + p.failed, failed: 0, missing: 0 } : p));
    setNote({ tone: "warn", text: `${reply.value} failure${reply.value === 1 ? "" : "s"} forgotten. Press Copy to try ${reply.value === 1 ? "it" : "them"} again.` });
  };

  const probe = async () => {
    setProbing(true);
    setProbeError(null);
    setProbes(null);
    try {
      const reply = await testConnection();
      if (!reply.ok) setProbeError(reply.error);
      else setProbes(reply.value);
    } catch (e) {
      setProbeError(`The server did not answer (${e instanceof Error ? e.message : String(e)}).`);
    } finally {
      setProbing(false);
    }
  };

  const check = async () => {
    setChecking(true);
    setCheckError(null);
    setChecked(null);
    try {
      const reply = await checkPictures(domain);
      if (!reply.ok) setCheckError(reply.error);
      else setChecked(reply.value);
    } catch (e) {
      setCheckError(`The server did not answer (${e instanceof Error ? e.message : String(e)}).`);
    } finally {
      setChecking(false);
    }
  };

  const pct = progress && progress.total > 0 ? Math.round(((progress.copied + progress.failed) / progress.total) * 100) : 0;
  const allFound = checked !== null && checked.length > 0 && checked.every((c) => c.exists);
  const buttonLabel = running ? "Copying…" : complete ? "All copied" : tried ? "Nothing left to try: retry the failed ones" : "Copy pictures to Cloudflare";

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Pictures</h1>
      <p className="mt-1 max-w-3xl text-[13px] text-gray-600">
        Every picture an admin uploads goes to Supabase, which stays the master copy. Each is also copied to Cloudflare R2, and the
        portal serves the copy once the picture domain is set, so Supabase is not paid for every picture a student loads.
        <span className="block" lang="hi">हर तस्वीर Supabase में रहती है (मूल प्रति); उसकी एक नक़ल Cloudflare पर जाती है, और picture domain लगते ही students को तस्वीरें वहीं से मिलती हैं।</span>
      </p>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card title="R2 bucket">
          {missing.length === 0 ? (
            <p className="text-[13px] text-green-800">Set up{bucket ? <>: <code className="rounded bg-gray-100 px-1">{bucket}</code></> : null}</p>
          ) : (
            <p className="text-[13px] text-red-700">Not set up. Missing in Vercel: {missing.join(", ")}</p>
          )}
        </Card>
        <Card title="Picture domain">
          {host ? (
            <p className="text-[13px] text-green-800">
              Serving from <code className="rounded bg-gray-100 px-1">{host}</code>
            </p>
          ) : hostRefused ? (
            <p className="text-[13px] text-red-700">
              <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_IMAGE_HOST</code> is <code className="rounded bg-gray-100 px-1">{hostRefused}</code>, not a domain like https://img.example.com. Pictures are served from Supabase until it is.
            </p>
          ) : (
            <p className="text-[13px] text-gray-700">Not set: pictures are served from Supabase.</p>
          )}
        </Card>
        <Card title="Database">
          {progressError ? (
            <p className="text-[13px] text-red-700">
              {/took too long/.test(progressError) ? "The count ran out of time: reload this page in a minute." : <>Not ready: run <code className="rounded bg-gray-100 px-1">supabase/images-r2.sql</code> in the Supabase SQL editor, then reload this page.</>}
              <span className="mt-1 block break-words text-[11px] text-gray-500">{progressError}</span>
            </p>
          ) : (
            <p className="text-[13px] text-green-800">Ready</p>
          )}
        </Card>
      </section>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">The copy</h2>
        {progress ? (
          <>
            <div className={`mt-3 grid grid-cols-2 gap-3 ${progress.missing > 0 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
              <Figure label="In Supabase" value={progress.total} />
              <Figure label="Copied" value={progress.copied} tone="green" />
              <Figure label="Failed" value={progress.failed} tone={mendable > 0 ? "red" : undefined} />
              {progress.missing > 0 && <Figure label="Missing in Supabase" value={progress.missing} />}
              <Figure label="Not tried yet" value={progress.remaining} />
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-[#0d2a6b] transition-[width]" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[11.5px] text-gray-500">
              {pct}% tried
              {last
                ? ` · last batch: ${last.copied} copied${last.failed.length ? `, ${last.failed.length} failed` : ""} in ${last.seconds} s${last.copied ? ` (a picture: ${last.readMs} ms to read, ${last.writeMs} ms to write)` : ""}`
                : ""}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-gray-600">No count yet.</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!ready || running || tried}
            className="rounded bg-[#0d2a6b] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0a2158] disabled:opacity-50"
          >
            {buttonLabel}
          </button>
          {running && (
            <button type="button" onClick={() => (stop.current = true)} className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">
              Stop after this batch
            </button>
          )}
          {progress && progress.failed > 0 && !running && (
            <button type="button" onClick={retry} className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">
              Retry the failed ones
            </button>
          )}
          <button
            type="button"
            onClick={probe}
            disabled={!ready || running || probing}
            className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            title="Times each step of one copy on its own"
          >
            {probing ? "Testing…" : "Test the connection"}
          </button>
        </div>
        {probeError && <p className="mt-2 text-[12.5px] font-semibold text-red-700">{probeError}</p>}
        {probes && (
          <ul className="mt-3 space-y-1 rounded border border-gray-200 bg-gray-50 p-3 text-[12px]">
            {probes.map((p) => (
              <li key={p.what} className="flex flex-wrap gap-x-2">
                <span className={`font-semibold ${p.ok ? "text-green-800" : "text-red-700"}`}>{p.ok ? "✓" : "✗"}</span>
                <span className="text-gray-800">{p.what}</span>
                <span className="text-gray-500">{(p.ms / 1000).toFixed(1)} s</span>
                <span className={`break-all ${p.ok ? "text-gray-600" : "text-red-700"}`}>{p.detail}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11.5px] text-gray-500">
          Each batch copies up to 300 pictures and the next starts by itself. Keep this tab open until it says every picture is copied; closing it
          only pauses — Copy goes on from where it stopped.
          <span className="block" lang="hi">यह tab खुला रखें; बंद करने पर काम रुकता है, मिटता नहीं — दोबारा Copy दबाने पर वहीं से आगे बढ़ता है।</span>
        </p>
        {note && <p className={`mt-2 text-[12.5px] font-semibold ${note.tone === "good" ? "text-green-800" : "text-amber-800"}`}>{note.text}</p>}
        {error && <p className="mt-2 text-[12.5px] font-semibold text-red-700">{error}</p>}
        {failures.length > 0 && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
            <p className="text-[12px] font-semibold text-red-800">
              Refused{progress && progress.failed > failures.length ? ` (${failures.length} of ${progress.failed.toLocaleString("en-IN")})` : ""}:
            </p>
            <ul className="mt-1 space-y-0.5 text-[11.5px] text-red-900">
              {failures.map((f) => (
                <li key={f.name} className="break-all">
                  <code>{f.name}</code> — {f.error}
                  {isMissing(f) && (
                    <span className="text-gray-700">
                      {" "}
                      ({f.error.startsWith("a name") ? "this file name cannot be copied: upload the picture again in its paper" : "already missing from Supabase, so students never saw it; leave it be"})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Check the copies</h2>
        <p className="mt-1 text-[12.5px] text-gray-600">
          Looks at the ten newest copies the way a student&apos;s browser will, through the picture domain below.
          {host ? " The portal serves from the domain shown, so that is the one checked." : " Leave it empty to ask R2 directly instead."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="url"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="https://img.kautilyaonline.com"
            className="w-full max-w-sm rounded border border-gray-300 px-3 py-1.5 text-[13px]"
          />
          <button
            type="button"
            onClick={check}
            disabled={checking || progressError !== null}
            className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50"
          >
            {checking ? "Checking…" : "Check 10 pictures"}
          </button>
        </div>
        {checkError && <p className="mt-2 text-[12.5px] font-semibold text-red-700">{checkError}</p>}
        {checked && (
          <>
            <p className={`mt-3 text-[12.5px] font-semibold ${allFound ? "text-green-800" : "text-red-700"}`}>
              {checked.filter((c) => c.exists).length} of {checked.length} found
              {checked.length ? ` via ${checked[0].via === "domain" ? "the picture domain" : "R2's API"}` : ""}.
            </p>
            <table className="mt-2 w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1 pr-2 font-semibold">Picture</th>
                  <th className="py-1 pr-2 font-semibold">Status</th>
                  <th className="py-1 pr-2 font-semibold">Type</th>
                  <th className="py-1 pr-2 font-semibold">Cache</th>
                  <th className="py-1 font-semibold">Bytes</th>
                </tr>
              </thead>
              <tbody>
                {checked.map((c) => (
                  <tr key={c.name} className="border-t border-gray-100">
                    <td className="py-1 pr-2 break-all">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener" className="text-[#0d2a6b] underline">
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className={`py-1 pr-2 font-semibold ${c.exists ? "text-green-800" : "text-red-700"}`}>
                      {c.status || "no reply"}
                      {c.note && <span className="block font-normal text-gray-500">{c.note}</span>}
                    </td>
                    <td className={`py-1 pr-2 ${c.contentType?.startsWith("image/") ? "text-green-800" : "text-red-700"}`}>{c.contentType ?? "—"}</td>
                    <td className="py-1 pr-2">
                      {/max-age=31536000/.test(c.cacheControl ?? "") ? <span className="font-semibold text-green-800">a year</span> : <span className="text-red-700">{c.cacheControl ?? "none"}</span>}
                    </td>
                    <td className="py-1">{c.bytes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 text-[13px] text-gray-800">
        <h2 className="text-[15px] font-bold text-gray-900">In this order</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>
            Run <code className="rounded bg-gray-100 px-1">supabase/images-r2.sql</code> in the Supabase SQL editor, then reload this page: the Database card turns green.
          </li>
          <li>
            In Vercel, set <code className="rounded bg-gray-100 px-1">R2_ENDPOINT</code>, <code className="rounded bg-gray-100 px-1">R2_ACCESS_KEY_ID</code>,{" "}
            <code className="rounded bg-gray-100 px-1">R2_SECRET_ACCESS_KEY</code> and <code className="rounded bg-gray-100 px-1">R2_BUCKET</code>, redeploy, then reload this page: the R2 card turns
            green. From then on every new upload is copied as it lands.
          </li>
          <li>
            Press Copy and leave the tab open until it says every picture is copied. Press Retry once for any failures; a picture &quot;not in the Supabase bucket&quot; is
            already missing for students too and can be left as it is.
          </li>
          <li>
            In Cloudflare, open R2 → the bucket → Settings → Custom Domains and connect the picture domain (img.kautilyaonline.com; the domain must already be on
            Cloudflare DNS). Wait until it shows Active.
          </li>
          <li>Type that domain above and press Check: ten found, type image/…, cache &quot;a year&quot; in green.</li>
          <li>
            In Vercel, set <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_IMAGE_HOST</code> to the picture domain and redeploy. Once the deploy is live, students load
            pictures from Cloudflare. To go back, remove it and redeploy: pictures come from Supabase again, the database never changed.
          </li>
        </ol>
      </section>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" }) {
  const colour = tone === "green" ? "text-green-800" : tone === "red" ? "text-red-700" : "text-gray-900";
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-0.5 text-[20px] font-bold tabular-nums ${colour}`}>{value.toLocaleString("en-IN")}</p>
    </div>
  );
}
