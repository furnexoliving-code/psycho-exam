import { redirect } from "next/navigation";
import { DEFAULT_TEST_ID } from "@/lib/tests";

export default function Home() {
  redirect(`/exam/${DEFAULT_TEST_ID}/instructions`);
}
