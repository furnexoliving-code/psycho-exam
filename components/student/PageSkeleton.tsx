/**
 * What a student's page looks like while its figures are fetched: the
 * header bar and grey blocks where the cards will be. It is sent at once,
 * so the page is seen to open before a single query has answered; the
 * real page then takes its place.
 */
export function PageSkeleton({ cards = 4, hero = true }: { cards?: number; hero?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50" aria-busy="true" aria-label="Loading">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-10 w-auto" draggable={false} />
          <div className="flex items-center gap-3">
            <span className="hidden h-3 w-16 rounded bg-gray-200 sm:block" />
            <span className="hidden h-3 w-16 rounded bg-gray-200 sm:block" />
            <span className="h-9 w-9 rounded-full bg-gray-200" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-5 py-6">
        {hero && <div className="h-28 rounded-[14px] bg-gray-200" />}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="rounded-[14px] border border-gray-200 bg-white p-4">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-3 h-6 w-32 rounded bg-gray-200" />
              <div className="mt-4 h-3 w-full rounded bg-gray-100" />
              <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
