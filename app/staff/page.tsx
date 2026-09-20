import { redirect } from "next/navigation";

/** The staff page moved into the panel; the old address still gets there. */
export default function StaffRedirect() {
  redirect("/admin/passwords");
}
