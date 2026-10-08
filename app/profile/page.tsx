import { redirect } from "next/navigation";
import { StudentHeader } from "@/components/StudentHeader";
import { PhotoCard } from "@/components/PhotoCard";
import { NameForm } from "@/components/NameForm";
import { ChangePassword } from "@/components/ChangePassword";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import Link from "next/link";
import { formatDate } from "@/lib/format-time";
import { enrollmentActive, enrollmentsOf, KIND_LABEL } from "@/lib/packages";

/**
 * The student's own page: photo, name and password are theirs to change;
 * the mobile number is the institute's and shown as it stands.
 */
export default async function ProfilePage() {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/profile");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));
  const name = profile.full_name || "Candidate";
  const enrollments = await enrollmentsOf(profile.id);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <StudentHeader name={name} active="profile" photoUrl={photoUrlOf(profile)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-5">
        <h1 className="text-[22px] font-bold text-gray-900">
          My profile <span className="text-[15px] font-normal text-gray-500" lang="hi">/ मेरी प्रोफ़ाइल</span>
        </h1>
        <p className="mt-1 text-[13px] text-gray-600">
          Your photo, name and password are yours to change. The mobile number is set by the institute.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section id="photo" className="scroll-mt-4 md:col-span-1">
            <PhotoCard photoUrl={photoUrlOf(profile)} name={name} phone={profile.phone || ""} />
          </section>

          <div className="space-y-4">
            <section id="name" className="scroll-mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-[15px] font-bold text-gray-900">
                Name <span className="font-normal text-gray-500" lang="hi">/ नाम</span>
              </h2>
              <div className="mt-3">
                <NameForm name={profile.full_name || ""} />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-[15px] font-bold text-gray-900">
                Account <span className="font-normal text-gray-500" lang="hi">/ खाता</span>
              </h2>
              <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
                <dt className="text-gray-500">Mobile</dt>
                <dd className="font-semibold text-gray-900">{profile.phone || "—"}</dd>
              </dl>
              <p className="mt-3 text-[11px] text-gray-500">
                To change the mobile number, ask at the institute.
                <span className="block" lang="hi">मोबाइल नंबर बदलवाने के लिए संस्थान से संपर्क करें।</span>
              </p>
            </section>
          </div>
        </div>

        <section id="password" className="scroll-mt-4">
          {profile.phone && <ChangePassword phone={profile.phone} />}
        </section>

        <section id="packages" className="mt-4 scroll-mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-bold text-gray-900">
            My packages <span className="font-normal text-gray-500" lang="hi">/ मेरे पैकेज</span>
          </h2>
          {enrollments.length === 0 ? (
            <p className="mt-2 text-[13px] text-gray-600">
              No package yet: the free Full Mock is open. <Link href="/packages" className="font-semibold text-[#0d2a6b] underline">See packages and prices</Link>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {enrollments.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 py-2.5 text-[13px]">
                  <span className="font-semibold text-gray-900">{e.package.name}</span>
                  <span className="text-gray-500">{KIND_LABEL[e.package.kind]}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${enrollmentActive(e) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {enrollmentActive(e) ? (e.expiresAt ? `Active till ${formatDate(e.expiresAt)}` : "Active · no expiry") : `Expired ${formatDate(e.expiresAt as string)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/packages" className="mt-3 inline-block text-[13px] font-semibold text-[#0d2a6b] underline">All packages →</Link>
        </section>
      </main>
    </div>
  );
}
