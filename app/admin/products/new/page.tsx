import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/kit";
import { ProductForm } from "@/components/admin/product-form";
import { listCategoriesFlat } from "@/lib/data/categories";
import { all } from "@/lib/db";

export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = listCategoriesFlat().map((category) => ({
    id: category.id,
    name: category.name,
    depth: category.depth,
  }));
  const brands = all("SELECT id, name FROM brands ORDER BY name").map((row) => ({
    id: String(row.id),
    name: String(row.name),
  }));

  return (
    <>
      <AdminPageHeader
        title="New product"
        description="Add an item to the catalogue. It appears on the storefront as soon as it is active."
        breadcrumb={[{ label: "Products", href: "/admin/products" }, { label: "New" }]}
      />
      <ProductForm categories={categories} brands={brands} />
    </>
  );
}
