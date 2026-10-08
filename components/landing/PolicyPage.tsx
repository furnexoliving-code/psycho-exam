import { PublicFooter, PublicHeader } from "@/components/landing/LandingPage";

/** A plain policy page: heading, a note, and sections of paragraphs. */
export function PolicyPage({ title, titleHi, updated, sections }: { title: string; titleHi: string; updated: string; sections: { h: string; p: string[] }[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <h1 className="text-[32px] font-extrabold text-gray-900">{title}</h1>
        <p className="text-[15px] text-gray-500" lang="hi">{titleHi}</p>
        <p className="mt-2 text-[12px] text-gray-500">Last updated: {updated}</p>
        {sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-[20px] font-bold text-gray-900">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-2 text-[15px] leading-relaxed text-gray-700">{t}</p>
            ))}
          </section>
        ))}
      </main>
      <PublicFooter />
    </div>
  );
}
