import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/kit";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/lib/data/products";
import { listCategoriesFlat } from "@/lib/data/categories";
import { all } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const product = getProductById(id);
  if (!product) notFound();

  const categories = listCategoriesFlat({ activeOnly: false }).map((category) => ({
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
        title={product.title}
        description={`SKU ${product.sku} · last updated ${formatDateTime(product.updatedAt)}`}
        breadcrumb={[{ label: "Products", href: "/admin/products" }, { label: product.sku }]}
      />
      <ProductForm product={product} categories={categories} brands={brands} saved={saved === "1"} />
    </>
  );
}
