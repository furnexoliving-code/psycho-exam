import { PageSkeleton } from "@/components/student/PageSkeleton";

/** Shown the instant a practice page is asked for, until its papers arrive. */
export default function Loading() {
  return <PageSkeleton cards={6} />;
}
