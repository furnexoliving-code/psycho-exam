import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/wt/categories";

/** The old address of a category's papers: practice is arranged by battery and series now. */
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: id } = await params;
  const category = CATEGORIES.find((c) => c.id === id);
  redirect(category ? `/practice#battery-${category.battery}` : "/practice");
}
