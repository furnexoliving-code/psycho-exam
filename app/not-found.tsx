import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-[14px] text-gray-600">
        There is nothing at this address. The paper may have been unpublished or
        the link mistyped.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
      >
        Go to my tests
      </Link>
    </main>
  );
}
