import type { Metadata } from "next";
import { getAllTags } from "@/src/core/lib/posts";
import { ThemedTagList } from "@/src/core/ThemeResolver";

export const metadata: Metadata = { title: "标签" };

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-text">标签</h1>
      <ThemedTagList tags={tags} />
    </>
  );
}
