"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Eye, ImageIcon, Info, Save, Trash2 } from "lucide-react";
import { saveProductAction, type AdminFormState } from "@/app/actions/admin";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { Product } from "@/lib/types";
import { resolveImageUrl } from "@/lib/image-url";

export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

const INITIAL: AdminFormState = {};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function ProductForm({
  product,
  categories,
  brands,
  saved,
}: {
  product?: Product;
  categories: CategoryOption[];
  brands: Array<{ id: string; name: string }>;
  saved?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveProductAction, INITIAL);
  const editing = Boolean(product);

  const [title, setTitle] = React.useState(product?.title ?? "");
  const [slug, setSlug] = React.useState(product?.slug ?? "");
  const [slugLocked, setSlugLocked] = React.useState(editing);
  const [price, setPrice] = React.useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = React.useState(
    product?.compareAtPrice ? String(product.compareAtPrice) : "",
  );
  const [images, setImages] = React.useState((product?.images ?? []).join("\n"));

  const suggestedSlug = slugify(title || "");
  const previewImages = images
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const discount =
    Number(price) > 0 && Number(compareAt) > Number(price)
      ? Math.round(((Number(compareAt) - Number(price)) / Number(compareAt)) * 100)
      : 0;

  const specsValue = React.useMemo(() => {
    if (!product?.specs?.length) return "";
    const richText = product.specs.find((spec) => "type" in spec && spec.type === "richText");
    if (richText && "html" in richText) return richText.html;
    return product.specs
      .filter((spec): spec is { label: string; value: string } => "label" in spec)
      .map((spec) => `<p><strong>${spec.label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong> ${spec.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
      .join("");
  }, [product]);

  return (
    <form action={formAction} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      {(saved || state.success) && (
        <Alert tone="success" title={state.success ?? "Product saved"}>
          Your changes are live on the storefront.
        </Alert>
      )}

      {state.error && (
        <Alert tone="danger" title="Could not save">
          {state.error}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-5">
          {/* basics */}
          <section className="card-surface p-4 sm:p-5">
            <h2 className="text-[0.95rem] font-bold">Product details</h2>
            <div className="mt-4 space-y-4">
              <Field label="Title" htmlFor="title" required error={state.fieldErrors?.title}>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!slugLocked) setSlug(slugify(event.target.value));
                  }}
                  required
                  invalid={Boolean(state.fieldErrors?.title)}
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                required
                hint={editing ? "Changing the slug breaks existing links." : "Used in the product URL"}
                error={state.fieldErrors?.slug}
              >
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    name="slug"
                    value={slug}
                    onChange={(event) => {
                      setSlugLocked(true);
                      setSlug(event.target.value);
                    }}
                    required
                    invalid={Boolean(state.fieldErrors?.slug)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSlug(suggestedSlug);
                      setSlugLocked(false);
                    }}
                  >
                    Suggest
                  </Button>
                </div>
              </Field>

              <Field label="Short description" htmlFor="shortDescription" hint="One line shown on cards and listings">
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={product?.shortDescription ?? ""}
                  placeholder="Noise cancelling, 40 hour battery"
                />
              </Field>

              <Field
                label="Full description"
                htmlFor="description"
                required
                error={state.fieldErrors?.description}
                hint="Write at least a couple of sentences."
              >
                <RichTextEditor
                  id="description"
                  name="description"
                  initialValue={product?.description ?? ""}
                  invalid={Boolean(state.fieldErrors?.description)}
                  minHeight={220}
                  policy
                />
              </Field>
            </div>
          </section>

          {/* pricing */}
          <section className="card-surface p-4 sm:p-5">
            <h2 className="text-[0.95rem] font-bold">Pricing</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Price (LKR)" htmlFor="price" required error={state.fieldErrors?.price}>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                  invalid={Boolean(state.fieldErrors?.price)}
                />
              </Field>
              <Field
                label="Compare at price"
                htmlFor="compareAtPrice"
                hint={discount > 0 ? `${discount}% off badge` : "Optional 'was' price"}
              >
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={compareAt}
                  onChange={(event) => setCompareAt(event.target.value)}
                />
              </Field>
              <Field label="Cost price" htmlFor="costPrice" hint="For margin reporting only">
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product?.costPrice ?? ""}
                />
              </Field>
            </div>
          </section>

          {/* media */}
          <section className="card-surface p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-bold">
              <ImageIcon className="size-4 text-brand-600" /> Images
            </h2>
            <p className="mt-1 text-[0.8rem] text-ink-500">
              One image URL per line. Use a /public path, HTTPS image URL, or Google Drive link shared with Anyone
              with the link. Leave blank to use generated artwork.
            </p>
            <Field
              label="Image URLs"
              htmlFor="images"
              className="mt-4"
              error={state.fieldErrors?.images}
            >
              <Textarea
                id="images"
                name="images"
                rows={4}
                value={images}
                onChange={(event) => setImages(event.target.value)}
                placeholder="/images/products/my-product.svg"
              />
            </Field>
            {previewImages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {previewImages.map((image) => (
                  <span
                    key={image}
                    className="relative size-20 overflow-hidden rounded-xl border border-ink-200 bg-ink-50"
                  >
                    <Image src={resolveImageUrl(image)} alt="" fill sizes="80px" className="object-cover" unoptimized />
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* specs + tags */}
          <section className="card-surface p-4 sm:p-5">
            <h2 className="text-[0.95rem] font-bold">Specifications &amp; tags</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Field
                label="Specifications"
                htmlFor="specs"
                hint="Use the toolbar to format text, create bullet lists, or number steps."
              >
                <RichTextEditor
                  id="specs"
                  name="specs"
                  initialValue={specsValue}
                  minHeight={220}
                  policy
                />
              </Field>
              <Field label="Tags" htmlFor="tags" hint="Comma separated, used for search and related products">
                <Textarea
                  id="tags"
                  name="tags"
                  rows={6}
                  defaultValue={(product?.tags ?? []).join(", ")}
                  placeholder="wireless, noise cancelling, over-ear"
                />
              </Field>
            </div>
          </section>
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          <section className="card-surface p-4">
            <h2 className="text-[0.9rem] font-bold">Publish</h2>
            <div className="mt-3.5 space-y-3.5">
              <Field label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={product?.status ?? "ACTIVE"}>
                  <option value="ACTIVE">Active — visible in the shop</option>
                  <option value="DRAFT">Draft — hidden from shoppers</option>
                  <option value="ARCHIVED">Archived — retired product</option>
                </Select>
              </Field>

              <Field
                label="SKU"
                htmlFor="sku"
                hint={
                  product
                    ? "Assigned automatically and cannot be changed."
                    : "A unique SKU will be assigned automatically when the product is created."
                }
              >
                <Input
                  id="sku"
                  defaultValue={product?.sku ?? ""}
                  placeholder="Generated when product is created"
                  disabled
                />
              </Field>

              <Field label="Condition" htmlFor="condition">
                <Select id="condition" name="condition" defaultValue={product?.condition ?? "NEW"}>
                  <option value="NEW">New</option>
                  <option value="REFURBISHED">Refurbished</option>
                  <option value="USED">Used</option>
                </Select>
              </Field>

              <div className="flex flex-col gap-2.5 pt-1">
                <Button type="submit" loading={pending} fullWidth>
                  <Save className="size-4" /> {editing ? "Save changes" : "Create product"}
                </Button>
                {editing && (
                  <ButtonLink href={`/product/${product?.slug}`} variant="outline" fullWidth size="sm">
                    <Eye className="size-3.5" /> View on storefront
                  </ButtonLink>
                )}
              </div>

              {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
                <ul className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-[0.76rem] text-rose-800">
                  {Object.entries(state.fieldErrors).map(([field, message]) => (
                    <li key={field}>
                      <strong className="font-semibold">{field}</strong>: {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card-surface p-4">
            <h2 className="text-[0.9rem] font-bold">Organisation</h2>
            <div className="mt-3.5 space-y-3.5">
              <Field label="Category" htmlFor="categoryId" required error={state.fieldErrors?.categoryId}>
                <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} required>
                  <option value="">Choose a category…</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {"— ".repeat(category.depth)}
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Brand" htmlFor="brandId">
                <Select id="brandId" name="brandId" defaultValue={product?.brandId ?? ""}>
                  <option value="">No brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Warranty" htmlFor="warranty" hint="e.g. 12 months official warranty">
                <Input id="warranty" name="warranty" defaultValue={product?.warranty ?? ""} />
              </Field>
            </div>
          </section>

          <section className="card-surface p-4">
            <h2 className="text-[0.9rem] font-bold">Inventory &amp; delivery</h2>
            <div className="mt-3.5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock" htmlFor="stock" required error={state.fieldErrors?.stock}>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={product?.stock ?? 0}
                    required
                  />
                </Field>
                <Field label="Low stock alert" htmlFor="lowStockAlert">
                  <Input
                    id="lowStockAlert"
                    name="lowStockAlert"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={product?.lowStockAlert ?? 5}
                  />
                </Field>
              </div>

              <Field label="Shipping fee (LKR)" htmlFor="shippingFee" hint="Ignored when free shipping is on">
                <Input
                  id="shippingFee"
                  name="shippingFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product?.shippingFee ?? 0}
                />
              </Field>

              <div className="space-y-2.5 border-t border-ink-100 pt-3">
                <Checkbox
                  name="freeShipping"
                  defaultChecked={product?.freeShipping}
                  label="Free shipping"
                  description="Deliver this item at no cost"
                />
                <Checkbox
                  name="isFeatured"
                  defaultChecked={product?.isFeatured}
                  label="Featured product"
                  description="Highlight on the homepage"
                />
                <Checkbox
                  name="isFlashDeal"
                  defaultChecked={product?.isFlashDeal}
                  label="Flash deal"
                  description="Show in the storefront flash deals section. Requires a compare-at price higher than the sale price."
                />
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-ink-700">
              <Info className="size-4 text-ocean-600" /> Pricing preview
            </p>
            <p className="mt-2 text-fluid-xl font-extrabold text-brand-700">
              {price ? `LKR ${Number(price).toLocaleString("en-LK")}` : "LKR 0"}
            </p>
            {discount > 0 && (
              <p className="mt-1 text-[0.8rem] text-ink-500">
                <span className="line-through">{Number(compareAt).toLocaleString("en-LK")}</span> ·{" "}
                <span className="font-semibold text-brand-700">{discount}% off</span>
              </p>
            )}
          </div>

          {editing && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
              <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-rose-800">
                <Trash2 className="size-4" /> Danger zone
              </p>
              <p className="mt-1 text-[0.75rem] text-rose-700">
                Deleting removes the product from the catalogue. Orders keep their historical items.
              </p>
              <ButtonLink
                href={`/admin/products?delete=${product?.id}`}
                variant="outline"
                size="sm"
                className="mt-2.5 border-rose-300 text-rose-700 hover:border-rose-500 hover:bg-rose-100"
                fullWidth
              >
                Delete product
              </ButtonLink>
            </div>
          )}

          <p className="flex items-center gap-1.5 px-1 text-[0.74rem] text-ink-400">
            <CheckCircle2 className="size-3.5" /> Changes are saved to the local database instantly.
          </p>
          <Link href="/admin/products" className="block px-1 text-[0.78rem] font-semibold text-brand-700 hover:underline">
            Back to all products
          </Link>
        </div>
      </div>
    </form>
  );
}
