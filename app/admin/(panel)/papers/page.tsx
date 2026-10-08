import { requireEditor } from "@/lib/auth";
import { hiddenBatteries } from "@/lib/wt/visibility";
import { listPapersForAdmin } from "@/lib/wt/db";
import { PapersAdminView } from "./PapersAdminView";

export default async function TestPapersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  // On the page itself, not only in the layout, which a request can skip.
  const who = await requireEditor("/admin/papers");
  const [papers, { error, saved }, hidden] = await Promise.all([
    listPapersForAdmin(),
    searchParams,
    hiddenBatteries(),
  ]);
  return <PapersAdminView papers={papers} hidden={hidden} isAdmin={who.role === "admin"} error={error} saved={saved} />;
}
