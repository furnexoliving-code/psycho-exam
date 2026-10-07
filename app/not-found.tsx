import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-[14px] text-gray-600">
          There is nothing at this address. The paper may have been unpublished or the link mistyped.
        </p>
        <p className="mt-1 text-[13px] text-gray-500" lang="hi">इस पते पर कुछ नहीं है। लिंक गलत हो सकता है या पेपर हटा दिया गया हो।</p>
        <Link
          href="/dashboard"
          className="mt-6 rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Go to my dashboard
        </Link>
      </main>
    </div>
  );
}
