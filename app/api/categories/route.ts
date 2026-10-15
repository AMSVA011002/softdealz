import { getCategoryTree } from "@/lib/data/categories";
import { ok } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 300;

/** Category tree used by the mobile navigation drawer. */
export async function GET() {
  const categories = getCategoryTree().map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    image: category.image,
    productCount: category.productCount ?? 0,
    children: (category.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      productCount: child.productCount ?? 0,
    })),
  }));

  return ok({ categories });
}
