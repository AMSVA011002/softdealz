import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/kit";
import { CategoryManager, type AdminCategoryRow } from "@/components/admin/category-manager";
import { Alert } from "@/components/ui/feedback";
import { listCategories, listCategoriesFlat } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ blocked?: string; deleted?: string }>;
}) {
  const { blocked, deleted } = await searchParams;
  const order = listCategoriesFlat({ activeOnly: false });
  const depthById = new Map(order.map((entry) => [entry.id, entry.depth]));
  const countById = new Map(order.map((entry) => [entry.id, entry.productCount]));

  const categories: AdminCategoryRow[] = listCategories({ activeOnly: false }).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    image: category.image,
    parentId: category.parentId,
    position: category.position,
    color: category.color,
    featured: category.featured,
    isActive: category.isActive,
    productCount: countById.get(category.id) ?? 0,
    depth: depthById.get(category.id) ?? 0,
  }));

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="The department and subcategory tree used across the storefront."
      />

      {blocked === "1" && (
        <div className="mb-4">
          <Alert tone="warning" title="Category still in use">
            Move or delete the products and subcategories inside it before deleting.
          </Alert>
        </div>
      )}
      {deleted === "1" && (
        <div className="mb-4">
          <Alert tone="success" title="Category deleted">
            Navigation and filters have been updated.
          </Alert>
        </div>
      )}

      <CategoryManager categories={categories} />
    </>
  );
}
