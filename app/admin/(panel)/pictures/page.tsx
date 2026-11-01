import { requireAdmin } from "@/lib/auth";
import { imageHost, imageHostSetting } from "@/lib/images/host";
import { listFailures, mirrorProgress, type Failure, type MirrorProgress } from "@/lib/images/mirror";
import { r2Missing } from "@/lib/images/r2";
import { PicturesView } from "./PicturesView";

/** Counting seventy thousand objects, and a batch of copies, take a few seconds each. */
export const maxDuration = 40;

/** The pictures' copy on Cloudflare: how far it has got, and the buttons that move it. */
export default async function PicturesPage() {
  await requireAdmin("/admin/pictures");
  let progress: MirrorProgress | null = null;
  let failures: Failure[] = [];
  let progressError: string | null = null;
  try {
    progress = await mirrorProgress();
    if (progress.failed > 0) failures = await listFailures();
  } catch (error) {
    progressError = error instanceof Error ? error.message : String(error);
  }
  return (
    <PicturesView
      missing={r2Missing()}
      bucket={process.env.R2_BUCKET?.trim() || null}
      host={imageHost()}
      hostRefused={imageHost() ? null : imageHostSetting()}
      progress={progress}
      failures={failures}
      progressError={progressError}
    />
  );
}
