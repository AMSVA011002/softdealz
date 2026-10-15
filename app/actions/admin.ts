"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { newId, run, get } from "@/lib/db";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/data/products";
import { setReviewStatus, deleteReview } from "@/lib/data/reviews";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/data/orders";
import { createCoupon, deleteCoupon, updateCoupon } from "@/lib/data/coupons";
import { pushNotification, setSetting } from "@/lib/data/account";
import { safeFloat } from "@/lib/numbers";
import { isHexColor } from "@/lib/theme";
import { heroSlidesSchema } from "@/lib/home/hero-slides";
import { normalizeImageInput } from "@/lib/image-url";
import { richTextPlainText, sanitizeRichTextHtml } from "@/lib/rich-text";
import type { OrderStatus, Spec } from "@/lib/types";

/** Upper bound for any stock/quantity field an admin can post. */
const MAX_STOCK = 1_000_000;

export interface AdminFormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

async function requireAdminOrThrow() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/account");
  return user;
}

function collectErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  });
  return fieldErrors;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const productSchema = z.object({
  title: z.string().min(3, "Give the product a title"),
  slug: z
    .string()
    .min(3, "Add a URL slug")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  description: z.string().min(1, "Write a product description"),
  shortDescription: z.string().optional().or(z.literal("")),
  price: z.coerce.number().positive("Price must be greater than zero"),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().min(1, "Choose a category"),
  brandId: z.string().optional().or(z.literal("")),
  condition: z.enum(["NEW", "REFURBISHED", "USED"]).default("NEW"),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
  warranty: z.string().optional().or(z.literal("")),
  shippingFee: z.coerce.number().nonnegative().default(0),
  tags: z.string().optional().or(z.literal("")),
  isFlashDeal: z.boolean(),
  specs: z.string().max(40_000, "Specifications are too long").optional().or(z.literal("")),
  images: z.string().optional().or(z.literal("")).superRefine((value, context) => {
    const images = (value ?? "").split("\n").map((image) => image.trim()).filter(Boolean);
    if (images.length > 20) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Use 20 images or fewer" });
    }
    images.forEach((image, index) => {
      if (image.length > 2048 || normalizeImageInput(image) === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Use a /public path, HTTPS image URL, or public Google Drive share link",
        });
      }
    });
  }),
});

function parseSpecs(raw: string | undefined): Spec[] {
  if (!raw) return [];
  const html = sanitizeRichTextHtml(raw);
  return richTextPlainText(html) ? [{ type: "richText", html }] : [];
}

function parseImages(raw: string | undefined, title: string) {
  const fromInput = (raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((image) => normalizeImageInput(image) ?? image);
  if (fromInput.length) return fromInput;

  const slug = title
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return [`/images/products/${slug}.svg`];
}

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdminOrThrow();

  const payload = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    price: formData.get("price") ?? 0,
    compareAtPrice: formData.get("compareAtPrice") ? formData.get("compareAtPrice") : undefined,
    costPrice: formData.get("costPrice") ? formData.get("costPrice") : undefined,
    stock: formData.get("stock") ?? 0,
    lowStockAlert: formData.get("lowStockAlert") ?? 5,
    categoryId: String(formData.get("categoryId") ?? ""),
    brandId: formData.get("brandId") ? String(formData.get("brandId")) : "",
    condition: String(formData.get("condition") ?? "NEW"),
    status: String(formData.get("status") ?? "ACTIVE"),
    warranty: String(formData.get("warranty") ?? ""),
    shippingFee: formData.get("shippingFee") ?? 0,
    tags: String(formData.get("tags") ?? ""),
    isFlashDeal: formData.get("isFlashDeal") === "on",
    specs: String(formData.get("specs") ?? ""),
    images: String(formData.get("images") ?? ""),
  };

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Some fields need attention" };
  }

  const description = sanitizeRichTextHtml(parsed.data.description);
  if (richTextPlainText(description).length < 20) {
    return {
      fieldErrors: { description: "Write at least a couple of sentences." },
      error: "Some fields need attention",
    };
  }

  const id = formData.get("id") ? String(formData.get("id")).trim() : null;
  const compareAt =
    parsed.data.compareAtPrice && parsed.data.compareAtPrice > 0
      ? safeFloat(parsed.data.compareAtPrice, 0, 100_000_000) ?? null
      : null;
  if (parsed.data.isFlashDeal && (!compareAt || compareAt <= parsed.data.price)) {
    return {
      fieldErrors: {
        compareAtPrice: "Set a compare-at price higher than the sale price to add this product to flash deals.",
      },
      error: "Some fields need attention",
    };
  }

  const freeShipping = formData.get("freeShipping") === "on";

  const input: ProductInput = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description,
    shortDescription: parsed.data.shortDescription || null,
    price: safeFloat(parsed.data.price, 0, 100_000_000) ?? 0,
    compareAtPrice: compareAt,
    costPrice: safeFloat(parsed.data.costPrice, 0, 100_000_000) ?? null,
    stock: safeFloat(parsed.data.stock, 0, MAX_STOCK) ?? 0,
    lowStockAlert: safeFloat(parsed.data.lowStockAlert, 0, MAX_STOCK) ?? 5,
    images: parseImages(parsed.data.images, parsed.data.title),
    tags: parsed.data.tags ? parsed.data.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    condition: parsed.data.condition,
    status: parsed.data.status,
    isFeatured: formData.get("isFeatured") === "on",
    isFlashDeal: parsed.data.isFlashDeal,
    freeShipping,
    shippingFee: freeShipping ? 0 : safeFloat(parsed.data.shippingFee, 0, 1_000_000) ?? 0,
    warranty: parsed.data.warranty || null,
    categoryId: parsed.data.categoryId,
    brandId: parsed.data.brandId || null,
    specs: parseSpecs(parsed.data.specs),
  };

  try {
    if (id) {
      updateProduct(id, input);
    } else {
      createProduct(input);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("UNIQUE") && message.includes("slug")) {
      return { fieldErrors: { slug: "That slug is already used by another product" } };
    }
    if (message.includes("UNIQUE") && message.includes("sku")) {
      return { error: "Could not generate a unique SKU. Please try again." };
    }
    return { error: `Could not save the product: ${message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/deals");

  redirect(id ? `/admin/products/${id}?saved=1` : "/admin/products?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  if (id) deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/deals");
  redirect("/admin/products?deleted=1");
}

export async function toggleProductFieldAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  if (!id || !["is_featured", "free_shipping", "is_flash_deal"].includes(field)) return;

  if (field === "is_flash_deal") {
    const product = get<{ is_flash_deal: number; compare_at_price: number | null; price: number }>(
      "SELECT is_flash_deal, compare_at_price, price FROM products WHERE id = ?",
      [id],
    );
    if (!product) return;
    if (
      !product.is_flash_deal &&
      (product.compare_at_price === null || product.compare_at_price <= product.price)
    ) {
      redirect(
        `/admin/products?flashDealError=${encodeURIComponent(
          "Set a compare-at price higher than the sale price before adding a product to flash deals.",
        )}`,
      );
    }
  }

  const column =
    field === "is_featured" ? "is_featured" : field === "is_flash_deal" ? "is_flash_deal" : "free_shipping";
  run(`UPDATE products SET ${column} = CASE ${column} WHEN 1 THEN 0 ELSE 1 END WHERE id = ?`, [id]);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/deals");
}

export async function adjustStockAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const rawAbsolute = formData.get("stock");
  const rawDelta = formData.get("delta");

  // Absolute stock wins when supplied; otherwise apply the +/- delta. Both
  // paths are sanitised — a non-numeric value used to write `NaN` (i.e. NULL)
  // into a NOT NULL column and blow up the action.
  if (rawAbsolute !== null && rawAbsolute !== undefined && String(rawAbsolute).trim() !== "") {
    const absolute = safeFloat(rawAbsolute, 0, MAX_STOCK);
    if (absolute === undefined) return;
    run("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?", [
      Math.trunc(absolute),
      id,
    ]);
  } else if (rawDelta !== null && rawDelta !== undefined && String(rawDelta).trim() !== "") {
    const delta = safeFloat(rawDelta, -MAX_STOCK, MAX_STOCK);
    if (delta === undefined) return;
    run(
      "UPDATE products SET stock = MAX(0, MIN(?, stock + ?)), updated_at = datetime('now') WHERE id = ?",
      [MAX_STOCK, Math.trunc(delta), id],
    );
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

const categorySchema = z.object({
  name: z.string().min(2, "Give the category a name"),
  slug: z
    .string()
    .min(2, "Add a URL slug")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().optional().or(z.literal("")),
  image: z.string().max(2048).optional().or(z.literal("")).refine(
    (value) => normalizeImageInput(value ?? "") !== null,
    "Use a /public path, HTTPS image URL, or public Google Drive share link",
  ),
  icon: z.string().optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).default(0),
  color: z.string().optional().or(z.literal("")),
});

export async function saveCategoryAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdminOrThrow();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    image: formData.get("image") ?? "",
    icon: formData.get("icon") ?? "",
    parentId: formData.get("parentId") ?? "",
    position: formData.get("position") ?? 0,
    color: formData.get("color") ?? "#0c800f",
  });

  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Some fields need attention" };
  }

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const featured = formData.get("featured") === "on" ? 1 : 0;
  const isActive = formData.get("isActive") === "on" ? 1 : 0;
  const parentId = parsed.data.parentId || null;

  if (id && parentId === id) {
    return { fieldErrors: { parentId: "A category cannot be its own parent" } };
  }

  try {
    if (id) {
      run(
        `UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, image = ?, parent_id = ?,
           position = ?, color = ?, featured = ?, is_active = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          parsed.data.name,
          parsed.data.slug,
          parsed.data.description || null,
          parsed.data.icon || null,
          parsed.data.image ? normalizeImageInput(parsed.data.image) : `/images/categories/${parsed.data.slug}.svg`,
          parentId,
          parsed.data.position,
          parsed.data.color || "#0c800f",
          featured,
          isActive,
          id,
        ],
      );
    } else {
      run(
        `INSERT INTO categories (id, name, slug, description, icon, image, parent_id, position,
           color, featured, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newId("cat"),
          parsed.data.name,
          parsed.data.slug,
          parsed.data.description || null,
          parsed.data.icon || null,
          parsed.data.image ? normalizeImageInput(parsed.data.image) : `/images/categories/${parsed.data.slug}.svg`,
          parentId,
          parsed.data.position,
          parsed.data.color || "#0c800f",
          featured,
          isActive,
        ],
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("UNIQUE")) {
      return { fieldErrors: { slug: "That slug is already in use" } };
    }
    return { error: message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { success: id ? "Category updated" : "Category created" };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const productCount = get<{ total: number }>("SELECT COUNT(*) AS total FROM products WHERE category_id = ?", [id]);
  const childCount = get<{ total: number }>("SELECT COUNT(*) AS total FROM categories WHERE parent_id = ?", [id]);
  if ((productCount?.total ?? 0) > 0 || (childCount?.total ?? 0) > 0) {
    // Refuse rather than cascade-delete live catalog data.
    redirect("/admin/categories?blocked=1");
  }

  run("DELETE FROM categories WHERE id = ?", [id]);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories?deleted=1");
}

/* ------------------------------------------------------------------ */
/* Brands                                                             */
/* ------------------------------------------------------------------ */

const brandSchema = z.object({
  name: z.string().min(2, "Give the brand a name"),
  slug: z
    .string()
    .min(2, "Add a URL slug")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  logo: z.string().max(2048).optional().or(z.literal("")).refine(
    (value) => normalizeImageInput(value ?? "") !== null,
    "Use a /public path, HTTPS image URL, or public Google Drive share link",
  ),
});

export async function saveBrandAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdminOrThrow();

  const parsed = brandSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    logo: formData.get("logo") ?? "",
  });

  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Some fields need attention" };
  }

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const logo =
    (parsed.data.logo && normalizeImageInput(parsed.data.logo)) || `/images/brands/${parsed.data.slug}.svg`;

  try {
    if (id) {
      run("UPDATE brands SET name = ?, slug = ?, logo = ? WHERE id = ?", [
        parsed.data.name,
        parsed.data.slug,
        logo,
        id,
      ]);
    } else {
      run("INSERT INTO brands (id, name, slug, logo) VALUES (?,?,?,?)", [
        newId("brd"),
        parsed.data.name,
        parsed.data.slug,
        logo,
      ]);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("UNIQUE")) {
      return { fieldErrors: { name: "That brand name or slug is already taken" } };
    }
    return { error: message };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/deals");
  return { success: id ? "Brand updated" : "Brand created" };
}

export async function deleteBrandAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const inUse =
    get<{ total: number }>("SELECT COUNT(*) AS total FROM products WHERE brand_id = ?", [id])?.total ?? 0;
  if (inUse > 0) {
    // Products would be orphaned — refuse and surface the reason.
    redirect("/admin/brands?blocked=1");
  }

  run("DELETE FROM brands WHERE id = ?", [id]);
  revalidatePath("/admin/brands");
  revalidatePath("/");
  redirect("/admin/brands?deleted=1");
}

/* ------------------------------------------------------------------ */
/* Orders                                                             */
/* ------------------------------------------------------------------ */

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdminOrThrow();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const carrier = formData.get("carrier") ? String(formData.get("carrier")) : undefined;
  const trackingNumber = formData.get("trackingNumber") ? String(formData.get("trackingNumber")) : undefined;
  const message = formData.get("message") ? String(formData.get("message")) : undefined;

  if (!orderId || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  updateOrderStatus(orderId, status as OrderStatus, { carrier, trackingNumber, message });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdminOrThrow();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("paymentStatus") ?? "");
  if (!orderId || !["UNPAID", "PAID", "REFUNDED", "FAILED"].includes(status)) return;

  updatePaymentStatus(orderId, status);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

/* ------------------------------------------------------------------ */
/* Reviews                                                            */
/* ------------------------------------------------------------------ */

export async function moderateReviewAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["APPROVED", "PENDING", "REJECTED"].includes(status)) return;

  setReviewStatus(id, status);
  revalidatePath("/admin/reviews");
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  if (id) deleteReview(id);
  revalidatePath("/admin/reviews");
}

/* ------------------------------------------------------------------ */
/* Coupons                                                            */
/* ------------------------------------------------------------------ */

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon codes need at least 3 characters")
    .regex(/^[A-Z0-9-]+$/, "Use uppercase letters, numbers and hyphens"),
  description: z.string().min(3, "Describe the offer"),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.coerce.number().min(0).default(0),
  minSpend: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().min(0).default(0),
  expiresAt: z.string().optional().or(z.literal("")),
});

export async function saveCouponAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdminOrThrow();

  const parsed = couponSchema.safeParse({
    code: String(formData.get("code") ?? "").toUpperCase(),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "PERCENT"),
    value: formData.get("value") ?? 0,
    minSpend: formData.get("minSpend") ?? 0,
    maxUses: formData.get("maxUses") ?? 0,
    expiresAt: formData.get("expiresAt") ?? "",
  });

  if (!parsed.success) {
    return { fieldErrors: collectErrors(parsed.error), error: "Some fields need attention" };
  }

  const id = formData.get("id") ? String(formData.get("id")) : null;

  // The date input posts `YYYY-MM-DD`; anything else is rejected rather than
  // stored as an unusable string that would break expiry comparisons.
  const rawExpiry = parsed.data.expiresAt?.trim();
  if (rawExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(rawExpiry)) {
    return { fieldErrors: { expiresAt: "Choose a valid expiry date" } };
  }
  if (rawExpiry && Number.isNaN(new Date(`${rawExpiry}T23:59:59`).getTime())) {
    return { fieldErrors: { expiresAt: "That is not a real calendar date" } };
  }

  const input = {
    ...parsed.data,
    isActive: formData.get("isActive") === "on",
    expiresAt: rawExpiry ? `${rawExpiry} 23:59:59` : null,
  };

  try {
    if (id) updateCoupon(id, input);
    else createCoupon(input);
  } catch {
    return { fieldErrors: { code: "That coupon code already exists" } };
  }

  revalidatePath("/admin/coupons");
  revalidatePath("/");
  return { success: id ? "Coupon updated" : "Coupon created" };
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdminOrThrow();
  const id = String(formData.get("id") ?? "");
  if (id) deleteCoupon(id);
  revalidatePath("/admin/coupons");
}

/* ------------------------------------------------------------------ */
/* Customers                                                          */
/* ------------------------------------------------------------------ */

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdminOrThrow();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !["CUSTOMER", "VENDOR", "ADMIN"].includes(role)) return;
  if (userId === admin.id) return; // never demote yourself

  run("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?", [role, userId]);
  revalidatePath("/admin/customers");
}

export async function toggleUserStatusAction(formData: FormData) {
  const admin = await requireAdminOrThrow();
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === admin.id) return;

  run(
    `UPDATE users SET status = CASE status WHEN 'ACTIVE' THEN 'SUSPENDED' ELSE 'ACTIVE' END,
       updated_at = datetime('now') WHERE id = ?`,
    [userId],
  );
  revalidatePath("/admin/customers");
}

export async function notifyUserAction(formData: FormData) {
  await requireAdminOrThrow();
  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "Message from SoftDealz");
  const body = String(formData.get("body") ?? "");
  if (!userId || body.trim().length < 3) return;

  pushNotification(userId, title, body, "INFO");
  revalidatePath("/admin/customers");
}

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

export async function saveSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdminOrThrow();

  const keys = [
    "store_name",
    "store_tagline",
    "support_email",
    "support_phone",
    "address_line",
    "announcement",
    "free_shipping_threshold",
    "standard_shipping_fee",
    "maintenance_mode",
    "logo_url",
    "app_icon_url",
    "brand_primary",
    "brand_secondary",
    "policy_terms",
    "policy_privacy",
    "policy_shipping",
    "policy_returns",
    "hero_slides",
    "storefront_rail_max_cards",
    "storefront_grid_columns",
    "storefront_rail_mobile_cards",
    "storefront_rail_tablet_cards",
    "storefront_rail_desktop_cards",
  ];

  const fieldErrors: Record<string, string> = {};
  const layoutSettings: Record<string, string[]> = {
    storefront_rail_max_cards: ["3", "4", "5"],
    storefront_grid_columns: ["3", "4", "5"],
    storefront_rail_mobile_cards: ["1", "2"],
    storefront_rail_tablet_cards: ["2", "3"],
    storefront_rail_desktop_cards: ["3", "4"],
  };
  for (const [key, allowedValues] of Object.entries(layoutSettings)) {
    if (formData.has(key) && !allowedValues.includes(String(formData.get(key) ?? ""))) {
      fieldErrors[key] = "Choose one of the available layout options";
    }
  }
  if (formData.has("hero_slides")) {
    try {
      const parsed = heroSlidesSchema.safeParse(JSON.parse(String(formData.get("hero_slides") ?? "")));
      if (!parsed.success) {
        fieldErrors.hero_slides = parsed.error.issues[0]?.message ?? "Check the hero carousel settings";
      } else {
        formData.set("hero_slides", JSON.stringify(parsed.data));
      }
    } catch {
      fieldErrors.hero_slides = "The hero carousel settings could not be read";
    }
  }
  for (const key of ["brand_primary", "brand_secondary"]) {
    if (formData.has(key) && !isHexColor(String(formData.get(key) ?? ""))) {
      fieldErrors[key] = "Choose a valid six-digit hex color";
    }
  }

  for (const key of ["logo_url", "app_icon_url"]) {
    if (!formData.has(key)) continue;
    const value = String(formData.get(key) ?? "").trim();
    const normalized = normalizeImageInput(value);
    if (normalized === null) fieldErrors[key] = "Use a /public path, HTTPS image URL, or public Google Drive share link";
    if (value.length > 2048) fieldErrors[key] = "Image URL is too long";
    if (normalized !== null) formData.set(key, normalized);
  }

  for (const key of ["policy_terms", "policy_privacy", "policy_shipping", "policy_returns"]) {
    if (!formData.has(key)) continue;
    const rawValue = String(formData.get(key) ?? "");
    if (rawValue.length > 100_000) {
      fieldErrors[key] = "Policy content is too large. Keep it under 100,000 characters before formatting.";
      continue;
    }
    const sanitized = sanitizeRichTextHtml(rawValue);
    if (sanitized.length > 30_000) {
      fieldErrors[key] = "Policy content must be 30,000 characters or fewer after formatting";
      continue;
    }
    formData.set(key, sanitized);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Some settings need attention" };
  }

  keys.forEach((key) => {
    if (formData.has(key)) {
      const value = formData.get(key);
      setSetting(key, value === "on" ? "true" : String(value ?? "").trim());
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/");
  for (const path of ["/privacy", "/terms", "/shipping", "/returns"]) {
    revalidatePath(path);
  }
  return { success: "Settings saved" };
}
