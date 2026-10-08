import Image from "next/image";
import Link from "next/link";
import plan from "@/public/landing/plan.jpg";
import exam from "@/public/landing/exam.jpg";
import result from "@/public/landing/result.jpg";
import mocks from "@/public/landing/mocks.jpg";
import { KIND_LABEL, rupees, type Package } from "@/lib/packages";
import { WhatsAppButton } from "@/components/WhatsAppButton";

/**
 * The public front page: what the portal is, for whom, and how to join.
 * Plain server-rendered markup, so search engines read every word; the
 * only interactive pieces are native <details> for the FAQ.
 *
 * Contact details are placeholders until the institute supplies them.
 */
import { CONTACT } from "@/lib/contact";
export { CONTACT };

export const TESTS = [
  { n: 1, slug: "memory-test", en: "Memory Test", hi: "स्मृति परीक्षण", what: "Study pictures for a minute, then recall them from memory." },
  { n: 2, slug: "following-directions-test", en: "Following Directions Test", hi: "निर्देश पालन परीक्षण", what: "Watch, Letter and Number Tables: read the rule, find the answer." },
  { n: 3, slug: "depth-perception-test", en: "Depth Perception Test", hi: "गहराई बोध परीक्षण", what: "Count the hidden cubes in a stacked figure." },
  { n: 4, slug: "power-of-observation-test", en: "Power of Observation Test", hi: "अवलोकन शक्ति परीक्षण", what: "Spot how a figure is placed or what has changed." },
  { n: 5, slug: "perceptual-speed-test", en: "Perceptual Speed Test", hi: "प्रत्यक्ष गति परीक्षण", what: "Match the same figure fast, against the clock." },
];

export const SERIES = [
  {
    slug: "alp",
    name: "RRB ALP Psycho Test",
    hi: "असिस्टेंट लोको पायलट",
    exam: "CBAT · 5 test batteries",
    status: "live" as const,
    note: "Sectional, Full Mock or Combo package · admission through Kautilya Classes",
  },
  {
    slug: "asm",
    name: "RRB ASM / Station Master Psycho Test",
    hi: "स्टेशन मास्टर",
    exam: "NTPC CBAT",
    status: "soon" as const,
    note: "Test series coming soon",
  },
  {
    slug: "train-operator",
    name: "Train Operator Psycho Test",
    hi: "ट्रेन ऑपरेटर",
    exam: "Psychometric test",
    status: "soon" as const,
    note: "Test series coming soon",
  },
];

export const FAQ = [
  {
    q: "What is the RRB ALP psycho test (CBAT)?",
    a: "After CBT 2, every Assistant Loco Pilot candidate sits the Computer Based Aptitude Test, conducted on the RDSO pattern. It has five test batteries: Memory, Following Directions, Depth Perception, Power of Observation and Perceptual Speed. A T-Score of 42 in every battery is compulsory, and the CBAT carries 30% weight in the final merit.",
  },
  {
    q: "Is the portal the same as the real exam screen?",
    a: "Yes. The test tabs, the Sections row, the Time Left clock, the candidate photo, Save and Submit, the break screen between tests and the instructions in Hindi and English follow the hall screen, so there is nothing new to get used to on exam day.",
  },
  {
    q: "What is a T-Score and why 42?",
    a: "T-Score compares your marks with everyone who took the same paper: 50 is the average. The railway needs at least 42 in each of the five tests. The portal scores every paper the same way and colours it red below 42, amber from 42 to 59 and green at 60 and above.",
  },
  {
    q: "How do I get a login?",
    a: "Accounts are issued by Kautilya Classes. Message our team on WhatsApp with your name and mobile number; the number becomes your login ID and you get your first password the same day. Kautilya Classes students get it from the office. Then add your photo and set your own password from My profile.",
  },
  {
    q: "Does it work on a mobile phone?",
    a: "The dashboard, results and practice papers work on any phone, tablet or laptop. For Full Mock Tests a laptop or desktop is recommended, because that is how the exam hall is.",
  },
  {
    q: "What does it cost?",
    a: "Choose a package: Sectional tests, Full Mock Tests, or both together (the Combo). Prices are on the packages page; admission and payment are through the Kautilya Classes team on WhatsApp. Kautilya Classes ALP students get their package from the institute. The two-minute sample test on this site is free and needs no login.",
  },
];

const Y = "#ff9933";

export function LandingPage({ packages = [] }: { packages?: Package[] }) {
  return (
    <div className="bg-white text-gray-900">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d2a6b] text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#1b3f8f] opacity-70" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-12 md:grid-cols-[1.05fr_1fr] md:pb-20 md:pt-16">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.25em]" style={{ color: Y }}>
              RRB ALP CBAT · As per RDSO pattern
            </p>
            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.1] sm:text-[44px] md:text-[52px]">
              Railway Psycho Test practice, exactly like the exam hall
            </h1>
            <p className="mt-3 text-[18px] text-[#c9d3e6]" lang="hi">
              रेलवे ALP साइको टेस्ट (CBAT) की तैयारी, असली परीक्षा जैसी स्क्रीन पर
            </p>
            <ul className="mt-6 space-y-2 text-[15px] text-[#e6ebf5]">
              <li className="flex gap-2"><Check /> All 5 tests of the CBAT, in the hall&apos;s order</li>
              <li className="flex gap-2"><Check /> Full Mock Tests with the real timing and break screens</li>
              <li className="flex gap-2"><Check /> Instant result with the same T-Score the railway uses</li>
              <li className="flex gap-2"><Check /> Instructions in Hindi and English</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demo" className="rounded-md px-6 py-3 text-[15px] font-bold text-[#0d2a6b] shadow hover:brightness-95" style={{ background: Y }}>
                Try a 2-minute sample test · no login
              </Link>
              <Link href="/login" className="rounded-md border border-white/40 px-6 py-3 text-[15px] font-semibold text-white hover:bg-white/10">
                Student Login
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-[#9fb0d4]">Packages from {packages.length ? rupees(Math.min(...packages.map((p) => p.priceInr))) : "₹399"} · New papers every week · Admission on WhatsApp</p>
          </div>
          <div className="relative">
            <Image src={exam} alt="The portal's exam screen for the Memory Test, laid out like the RRB CBAT hall screen" priority className="rounded-lg border border-white/20 shadow-2xl" sizes="(min-width: 768px) 560px, 100vw" />
          </div>
        </div>
        <div className="h-[5px]" style={{ background: "linear-gradient(90deg,#ff9933 33%,#ffffff 33% 66%,#138808 66%)" }} aria-hidden="true" />
      </section>

      {/* Trust strip */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 py-6 text-center sm:grid-cols-5">
          {[
            ["5", "test batteries, as per RDSO"],
            ["Full Mock", "in the hall's order"],
            ["T-Score", "scored like the railway"],
            ["Hindi + English", "on every screen"],
            ["Phone & laptop", "works on both"],
          ].map(([big, small]) => (
            <div key={big}>
              <div className="text-[20px] font-extrabold text-[#0d2a6b]">{big}</div>
              <div className="text-[12px] text-gray-600">{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Test series */}
      <section id="test-series" className="mx-auto max-w-6xl px-5 py-14">
        <Eyebrow>Test series · टेस्ट सीरीज़</Eyebrow>
        <h2 className="mt-2 text-[28px] font-extrabold text-gray-900 sm:text-[34px]">One portal for every railway psycho test</h2>
        <p className="mt-2 max-w-2xl text-[15px] text-gray-600">Pick the exam you are preparing for. Each series has its own practice papers and Full Mock Tests; a student sees only the series on their account.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {SERIES.map((s) => (
            <div key={s.slug} className={`rounded-xl border p-6 ${s.status === "live" ? "border-[#0d2a6b] bg-white shadow-md" : "border-gray-200 bg-gray-50"}`}>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${s.status === "live" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                {s.status === "live" ? "Available now" : "Coming soon"}
              </span>
              <h3 className="mt-3 text-[19px] font-bold text-gray-900">
                {s.status === "live" ? <Link href="/rrb-alp-psycho-test" className="hover:underline">{s.name}</Link> : s.name}
              </h3>
              <p className="text-[14px] text-gray-500" lang="hi">{s.hi} · {s.exam}</p>
              <p className="mt-3 text-[14px] text-gray-700">{s.note}</p>
              {s.status === "live" ? (
                <Link href="/packages" className="mt-5 inline-block rounded-md bg-[#0d2a6b] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#0a2158]">
                  Packages & prices →
                </Link>
              ) : (
                <a href={CONTACT.whatsapp} className="mt-5 inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 hover:bg-gray-100">
                  Notify me on WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Five tests */}
      <section id="tests" className="bg-[#f4f6fb]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Eyebrow>The 5 tests · पाँच टेस्ट</Eyebrow>
          <h2 className="mt-2 text-[28px] font-extrabold text-gray-900 sm:text-[34px]">Every test of the RRB ALP CBAT, in the same order</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TESTS.map((t) => (
              <Link key={t.n} href={`/psycho-test/${t.slug}`} className="rounded-xl border-t-4 bg-white p-5 shadow-sm hover:shadow-md" style={{ borderColor: Y }}>
                <div className="text-[28px] font-extrabold" style={{ color: Y }}>0{t.n}</div>
                <h3 className="mt-1 text-[16px] font-bold leading-tight text-gray-900">{t.en}</h3>
                <p className="text-[13px] text-gray-500" lang="hi">{t.hi}</p>
                <p className="mt-2 text-[13px] text-gray-700">{t.what}</p>
                <p className="mt-2 text-[12px] font-bold text-[#0d2a6b]">Pattern, tips & sample →</p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[14px] text-gray-600">
            Pass needs <b>T-Score 42</b> in each test. The CBAT carries <b>30%</b> of the final ALP merit; CBT 2 carries 70%.
          </p>
        </div>
      </section>

      {/* Features with screenshots */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-14">
        <Eyebrow>What you get · क्या मिलेगा</Eyebrow>
        <h2 className="mt-2 text-[28px] font-extrabold text-gray-900 sm:text-[34px]">Built like an exam, coached like a class</h2>
        <div className="mt-10 space-y-16">
          <Feature
            img={plan}
            alt="Dashboard with Today's plan: the weakest test first, next goal, and the paper to open"
            title="The dashboard tells you what to do today"
            hi="आज का प्लान: सबसे कमज़ोर टेस्ट सबसे ऊपर"
            points={[
              "Today's plan sorts your five tests weakest first and names the paper to open.",
              "Next goal in plain words: “+24 more to T-Score 42 (pass)”.",
              "Each test tile shows your best T-Score and the last three days.",
            ]}
          />
          <Feature
            img={mocks}
            alt="Full Mock Tests page with Open now, Upcoming and Completed groups"
            title="Full Mock Tests: a rehearsal of exam day"
            hi="पाँचों टेस्ट एक बार में, असली क्रम और समय के साथ"
            points={[
              "All five tests in one sitting with the real timing and break screens.",
              "Mocks open on a schedule; a scorecard out of 30 says qualified or not.",
              "A leaderboard across the batch for every mock.",
            ]}
            flip
          />
          <Feature
            img={result}
            alt="Result page showing T-Score, score tiles and accuracy by question type"
            title="Instant result, and where the marks went"
            hi="सबमिट करते ही रिज़ल्ट, रेलवे वाला T-Score"
            points={[
              "T-Score with a meter, scored the way the railway does.",
              "Accuracy by question type, weakest first; review every question.",
              "Download the scorecard as an image or share it on WhatsApp.",
            ]}
          />
        </div>
      </section>

      {/* T-score */}
      <section className="bg-[#0d2a6b] text-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Eyebrow light>T-Score · the one number that matters</Eyebrow>
          <h2 className="mt-2 text-[28px] font-extrabold sm:text-[34px]">The portal scores you the way the railway does</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Below 42", "Not qualified", "#f87171", "Shown in red. Today's plan puts this test first. लाल = अभी पास नहीं।"],
              ["42 to 59", "Passed", "#fbbf24", "Cleared the railway cut-off. 50 is the average student. पीला = पास।"],
              ["60 and above", "Our target", "#4ade80", "A safe margin on exam day and a strong 30% in the final merit. हरा = लक्ष्य पूरा।"],
            ].map(([range, label, color, text]) => (
              <div key={range} className="rounded-xl border border-white/15 bg-white/5 p-6">
                <div className="text-[13px] font-bold uppercase tracking-wider" style={{ color }}>{label}</div>
                <div className="mt-1 text-[36px] font-extrabold" style={{ color }}>{range}</div>
                <p className="mt-2 text-[14px] text-[#c9d3e6]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#f4f6fb]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Eyebrow>Packages & prices · पैकेज और कीमत</Eyebrow>
          <h2 className="mt-2 text-[28px] font-extrabold text-gray-900 sm:text-[34px]">Pick a package. Admission on WhatsApp.</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-gray-600">Kautilya Classes students get their package from the institute. New students: message our team, and your login and package are set up the same day.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="flex flex-col rounded-xl border-2 border-dashed border-green-400 bg-green-50 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">New student?</p>
              <h3 className="mt-1 text-[20px] font-extrabold text-gray-900">Join on WhatsApp</h3>
              <p className="mt-3 flex-1 text-[13px] text-gray-700">Send your name and mobile number. Our team sets up your login and the package you choose, the same day.</p>
              <p className="text-[12px] text-gray-500" lang="hi">नाम और मोबाइल नंबर भेजें, टीम उसी दिन लॉगिन और पैकेज चालू कर देगी।</p>
              <a href={CONTACT.whatsapp} className="mt-4 rounded-md bg-green-600 px-4 py-2.5 text-center text-[14px] font-bold text-white hover:bg-green-700">Message our team</a>
            </div>
            {packages.map((p) => (
              <div key={p.id} className={`flex flex-col rounded-xl border bg-white p-6 ${p.kind === "combo" ? "border-[#0d2a6b] shadow-md" : "border-gray-200"}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8102e]">{KIND_LABEL[p.kind]}</p>
                <h3 className="mt-1 text-[20px] font-extrabold leading-tight text-gray-900">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[32px] font-extrabold text-[#0d2a6b]">{rupees(p.priceInr)}</span>
                  {p.mrpInr && p.mrpInr > p.priceInr && <span className="text-[14px] text-gray-400 line-through">{rupees(p.mrpInr)}</span>}
                </div>
                <p className="text-[12px] text-gray-500">{p.validityDays ? `${p.validityDays} days` : "No expiry"}</p>
                <p className="mt-2 flex-1 text-[13px] text-gray-700">{p.description}</p>
                <Link href="/packages" className={`mt-4 rounded-md px-4 py-2.5 text-center text-[14px] font-bold ${p.kind === "combo" ? "bg-[#0d2a6b] text-white hover:bg-[#0a2158]" : "border border-[#0d2a6b] text-[#0d2a6b] hover:bg-[#eef2fb]"}`}>
                  {p.kind === "combo" ? "Best value · Details" : "Details"}
                </Link>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-[13px] text-gray-500 md:col-span-3">
                Package prices are set in the admin panel (Packages) and appear here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-14">
        <Eyebrow>How to start · कैसे शुरू करें</Eyebrow>
        <h2 className="mt-2 text-[28px] font-extrabold text-gray-900 sm:text-[34px]">Three steps and the first test is running</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Message our team on WhatsApp", "Send your name and mobile number. The team sets up your login and package the same day. Kautilya Classes students get theirs from the office.", "WhatsApp पर नाम और मोबाइल नंबर भेजें।"],
            ["Sign in and set up", "Open kautilyaonline.com, sign in with your mobile number, upload your photo and set your own password.", "साइन इन करें, फोटो लगाएँ, पासवर्ड बदलें।"],
            ["Follow Today's plan", "Open the paper the dashboard points to, every day, until all five tests are green.", "रोज़ आज का प्लान खोलें।"],
          ].map(([t, d, h], i) => (
            <li key={t} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-[40px] font-extrabold leading-none" style={{ color: Y }}>{i + 1}</div>
              <h3 className="mt-2 text-[18px] font-bold text-gray-900">{t}</h3>
              <p className="mt-1 text-[14px] text-gray-700">{d}</p>
              <p className="mt-1 text-[13px] text-gray-500" lang="hi">{h}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#f4f6fb]">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <Eyebrow>FAQ · अक्सर पूछे जाने वाले सवाल</Eyebrow>
          <h2 className="mt-2 text-[28px] font-extrabold text-gray-900 sm:text-[34px]">Questions students ask</h2>
          <div className="mt-6 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-[16px] font-semibold text-gray-900 marker:content-none">
                  <span className="mr-2 inline-block text-[#0d2a6b] transition group-open:rotate-90">▸</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-6 text-[14px] leading-relaxed text-gray-700">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="rounded-2xl bg-[#0d2a6b] px-6 py-10 text-center text-white md:px-12">
          <h2 className="text-[28px] font-extrabold sm:text-[34px]">Start today. Be ready for the hall.</h2>
          <p className="mt-2 text-[17px] text-[#c9d3e6]" lang="hi">आज ही शुरू करें। परीक्षा हॉल के लिए तैयार रहें।</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-md px-6 py-3 text-[15px] font-bold text-[#0d2a6b]" style={{ background: Y }}>Student Login</Link>
            <a href={CONTACT.whatsapp} className="rounded-md border border-white/40 px-6 py-3 text-[15px] font-semibold text-white hover:bg-white/10">Ask on WhatsApp</a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 bg-white/95 shadow-[0_1px_8px_rgba(13,42,107,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-10 w-auto" draggable={false} />
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[15px] font-bold text-[#0d2a6b]">KAUTILYA CLASSES</span>
            <span className="mt-1 block truncate text-[8.5px] font-bold tracking-[0.2em] text-[#c8102e]">RAILWAY PSYCHO TEST PORTAL</span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-6 text-[14px] font-semibold text-gray-700 md:flex" aria-label="Main">
          <a href="#test-series" className="hover:text-[#0d2a6b]">Test series</a>
          <a href="#tests" className="hover:text-[#0d2a6b]">5 tests</a>
          <a href="#features" className="hover:text-[#0d2a6b]">Features</a>
          <a href="#pricing" className="hover:text-[#0d2a6b]">Prices</a>
          <a href="#faq" className="hover:text-[#0d2a6b]">FAQ</a>
        </nav>
        <Link href="/login" className="ml-auto rounded-md bg-[#0d2a6b] px-4 py-2 text-[14px] font-bold text-white hover:bg-[#0a2158] md:ml-6">
          Student Login
        </Link>
      </div>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#ff9933 33%,#ffffff 33% 66%,#138808 66%)" }} aria-hidden="true" />
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 pb-16 md:pb-0">
      <WhatsAppButton />
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3">
        <div>
          <div className="text-[15px] font-bold text-[#0d2a6b]">KAUTILYA CLASSES</div>
          <p className="mt-1 text-[13px] text-gray-600">Railway Psycho Test Portal · as per RDSO pattern. Practice for the RRB ALP CBAT, with ASM and Train Operator test series coming soon.</p>
        </div>
        <div className="text-[13px] text-gray-700">
          <div className="font-bold text-gray-900">Contact</div>
          <p className="mt-1">{CONTACT.address}</p>
          <p>Phone / WhatsApp: {CONTACT.phone}</p>
          <p>Email: {CONTACT.email}</p>
        </div>
        <div className="text-[13px] text-gray-700">
          <div className="font-bold text-gray-900">Links</div>
          <ul className="mt-1 space-y-1">
            <li><Link href="/login" className="hover:underline">Student Login</Link></li>
            <li><a href="#test-series" className="hover:underline">Test series</a></li>
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
            <li><Link href="/packages" className="hover:underline">Packages & prices</Link></li>
            <li><Link href="/rrb-alp-psycho-test" className="hover:underline">RRB ALP psycho test guide</Link></li>
            <li><Link href="/demo" className="hover:underline">2-minute sample test</Link></li>
            <li><Link href="/blog" className="hover:underline">Articles & guides</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms of Use</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:underline">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-[12px] text-gray-500">
        © {new Date().getFullYear()} Kautilya Classes · kautilyaonline.com. Not affiliated with the Railway Recruitment Boards or RDSO; the test pattern is followed for practice.
      </div>
    </footer>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[12px] font-bold uppercase tracking-[0.25em] ${light ? "" : "text-[#c8102e]"}`} style={light ? { color: Y } : undefined}>{children}</p>;
}

function Check() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[#0d2a6b]" style={{ background: Y }} aria-hidden="true">✓</span>
  );
}

function Feature({ img, alt, title, hi, points, flip = false }: { img: typeof plan; alt: string; title: string; hi: string; points: string[]; flip?: boolean }) {
  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
      <Image src={img} alt={alt} className="rounded-lg border border-gray-200 shadow-lg" sizes="(min-width: 768px) 560px, 100vw" />
      <div>
        <h3 className="text-[24px] font-extrabold text-gray-900">{title}</h3>
        <p className="mt-1 text-[15px] text-gray-500" lang="hi">{hi}</p>
        <ul className="mt-4 space-y-2 text-[15px] text-gray-700">
          {points.map((p) => (
            <li key={p} className="flex gap-2"><Check /> {p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
