import type { Metadata } from "next";
import { getAllCategories } from "@/src/core/lib/posts";
import { ThemedCategoryList } from "@/src/core/ThemeResolver";

export const metadata: Metadata = { title: "分类" };

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-text">分类</h1>
      <ThemedCategoryList categories={categories} />
    </>
  );
}
