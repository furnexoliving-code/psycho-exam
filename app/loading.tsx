/**
 * Shown while a page's server work is still running. Without it a click on a
 * paper or a result sat on the old page with nothing happening, which reads
 * as a dead button.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-[14px] text-gray-600">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-rrb-banner"
        />
        Loading…
      </div>
    </div>
  );
}
