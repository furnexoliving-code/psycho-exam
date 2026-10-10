import { PageSkeleton } from "@/components/student/PageSkeleton";

/** Shown the instant the dashboard is asked for, until its figures arrive. */
export default function Loading() {
  return <PageSkeleton cards={6} />;
}
