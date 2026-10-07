import { redirect } from "next/navigation";
import { StudentHeader } from "@/components/StudentHeader";
import { PhotoCard } from "@/components/PhotoCard";
import { NameForm } from "@/components/NameForm";
import { ChangePassword } from "@/components/ChangePassword";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { formatDate } from "@/lib/format-time";

/**
 * The student's own page: photo, name and password are theirs to change;
 * mobile, roll number and validity are the institute's and shown as they
 * stand.
 */
export default async function ProfilePage() {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/profile");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));
  const name = profile.full_name || "Candidate";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <StudentHeader name={name} active="profile" photoUrl={photoUrlOf(profile)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-5">
        <h1 className="text-[22px] font-bold text-gray-900">
          My profile <span className="text-[15px] font-normal text-gray-500" lang="hi">/ मेरी प्रोफ़ाइल</span>
        </h1>
        <p className="mt-1 text-[13px] text-gray-600">
          Your photo, name and password are yours to change. Mobile number, roll number and validity are set by the institute.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section id="photo" className="scroll-mt-4 md:col-span-1">
            <PhotoCard photoUrl={photoUrlOf(profile)} name={name} rollNo={profile.roll_no || ""} phone={profile.phone || ""} />
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
                <dt className="text-gray-500">Roll No</dt>
                <dd className="font-semibold text-gray-900">{profile.roll_no || "—"}</dd>
                <dt className="text-gray-500">Valid till</dt>
                <dd className="font-semibold text-gray-900">{profile.valid_until ? formatDate(profile.valid_until) : "No end date"}</dd>
              </dl>
              <p className="mt-3 text-[11px] text-gray-500">
                To change the mobile number or roll number, ask at the institute.
                <span className="block" lang="hi">मोबाइल नंबर या रोल नंबर बदलवाने के लिए संस्थान से संपर्क करें।</span>
              </p>
            </section>
          </div>
        </div>

        <section id="password" className="scroll-mt-4">
          {profile.phone && <ChangePassword phone={profile.phone} />}
        </section>
      </main>
    </div>
  );
}
