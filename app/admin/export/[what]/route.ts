import { NextResponse } from "next/server";
import { requireResults } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, indianDay } from "@/lib/format-time";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { scoreOutOf30, type MockTestResult } from "@/lib/wt/mock";
import { logAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * The institute's own copy of its data, as a CSV the panel downloads:
 * every paper result, every Full Mock result, or the student list. Read
 * a page at a time and streamed as it goes, so a file of any size leaves
 * without being held whole, and opened in Excel with the Hindi names
 * intact (the byte-order mark at the start sees to that).
 */
const PAGE = 1000;

export async function GET(_req: Request, { params }: { params: Promise<{ what: string }> }) {
  const { what } = await params;
  if (what !== "results" && what !== "mocks" && what !== "students") return new NextResponse(null, { status: 404 });
  await requireResults(`/admin/results`);
  await logAction("export", what);

  const day = indianDay(Date.now());
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => controller.enqueue(encoder.encode(line));
      write("﻿");
      try {
        if (what === "results") await results(write);
        else if (what === "mocks") await mocks(write);
        else await students(write);
      } catch (error) {
        write(`\n"Export stopped: ${cell(error instanceof Error ? error.message : String(error))}"\n`);
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kautilya-${what}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

/** A CSV cell: quoted, with quotes doubled, and never read by Excel as a formula. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
const row = (values: unknown[]) => values.map(cell).join(",") + "\n";

type Write = (line: string) => void;

/** Names and mobiles for a set of account ids, in one query per page. */
async function namesOf(ids: string[]): Promise<Map<string, { name: string; phone: string }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out = new Map<string, { name: string; phone: string }>();
  for (let at = 0; at < unique.length; at += PAGE) {
    const { data } = await createAdminClient()
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", unique.slice(at, at + PAGE));
    for (const p of data ?? []) {
      out.set(p.id as string, { name: (p.full_name as string) ?? "", phone: (p.phone as string) ?? "" });
    }
  }
  return out;
}

async function results(write: Write): Promise<void> {
  const supabase = createAdminClient();
  const { data: papers } = await supabase.from("watch_papers").select("id, display_name, category");
  const paperOf = new Map((papers ?? []).map((p) => [p.id as string, p]));
  write(row(["Submitted (IST)", "Student", "Mobile", "Battery", "Paper", "Marks", "Out of", "Attempted", "Time (sec)", "Attempt id"]));
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("watch_attempts")
      .select("id, paper_id, user_id, marks, total, attempted, duration_sec, submitted_at")
      .order("submitted_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    const who = await namesOf(data.map((a) => a.user_id as string));
    for (const a of data) {
      const paper = paperOf.get(a.paper_id as string);
      const category = (paper?.category as string) ?? "watch";
      const battery = CATEGORIES.find((c) => c.id === category)?.battery ?? 2;
      const person = who.get(a.user_id as string);
      write(
        row([
          formatDateTime(a.submitted_at as string),
          person?.name ?? "(deleted account)",
          person?.phone ?? "",
          `Test ${battery} - ${BATTERIES.find((b) => b.id === battery)?.title ?? ""}`,
          paper?.display_name ?? "(deleted paper)",
          a.marks,
          a.total,
          a.attempted,
          a.duration_sec ?? "",
          a.id,
        ]),
      );
    }
    if (data.length < PAGE) break;
  }
}

async function mocks(write: Write): Promise<void> {
  const supabase = createAdminClient();
  const { data: mockRows } = await supabase.from("mock_tests").select("id, name");
  const mockName = new Map((mockRows ?? []).map((m) => [m.id as string, m.name as string]));
  write(
    row([
      "Submitted (IST)", "Student", "Mobile", "Full Mock", "Score out of 30", "Composite T", "Qualified",
      "T1 Memory", "T2 Following Directions", "T3 Depth Perception", "T4 Power of Observation", "T5 Perceptual Speed",
      "Total marks", "Time (min)",
    ]),
  );
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("mock_results")
      .select("id, mock_id, user_id, tests, composite, qualified, duration_sec, submitted_at")
      .order("submitted_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    const who = await namesOf(data.map((r) => r.user_id as string));
    for (const r of data) {
      const tests = (Array.isArray(r.tests) ? r.tests : []) as MockTestResult[];
      const t = (battery: number) => {
        const one = tests.find((x) => x.battery === battery);
        return one?.tScore === null || one?.tScore === undefined ? "" : one.tScore.toFixed(1);
      };
      const out30 = scoreOutOf30(tests);
      const person = who.get(r.user_id as string);
      write(
        row([
          formatDateTime(r.submitted_at as string),
          person?.name ?? "(deleted account)",
          person?.phone ?? "",
          mockName.get(r.mock_id as string) ?? "(deleted mock)",
          out30 === null ? "" : out30.toFixed(1),
          r.composite === null ? "" : Number(r.composite).toFixed(1),
          r.qualified === null ? "Not measured" : r.qualified ? "Yes" : "No",
          t(1), t(2), t(3), t(4), t(5),
          tests.reduce((s, x) => s + (x.marks ?? 0), 0),
          r.duration_sec ? Math.round(Number(r.duration_sec) / 60) : "",
        ]),
      );
    }
    if (data.length < PAGE) break;
  }
}

async function students(write: Write): Promise<void> {
  const supabase = createAdminClient();
  write(row(["Name", "Mobile", "Registered (IST)", "Last seen (IST)", "Account", "Photo"]));
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const s of data) {
      write(
        row([
          s.full_name ?? "",
          s.phone ?? "",
          s.created_at ? formatDateTime(s.created_at as string) : "",
          s.last_seen_at ? formatDateTime(s.last_seen_at as string) : "",
          s.is_active === false ? "Off" : "On",
          s.photo_path ? "Yes" : "No",
        ]),
      );
    }
    if (data.length < PAGE) break;
  }
}
