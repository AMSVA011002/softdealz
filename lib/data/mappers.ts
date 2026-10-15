import { parseJson, toBool } from "@/lib/db";
import { resolveImageUrl } from "@/lib/image-url";
import type {
  Address,
  Category,
  Order,
  OrderEvent,
  OrderItem,
  Product,
  Review,
  Spec,
  User,
} from "@/lib/types";

type Row = Record<string, any>;

export function mapUser(row: Row): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? null,
    role: row.role,
    status: row.status,
    avatarColor: row.avatar_color ?? "#0c800f",
    emailVerified: toBool(row.email_verified),
    createdAt: row.created_at,
  };
}

export function mapAddress(row: Row): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 ?? null,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: toBool(row.is_default),
  };
}

export function mapCategory(row: Row): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    image: row.image ? resolveImageUrl(String(row.image)) : null,
    icon: row.icon ?? null,
    color: row.color ?? "#0c800f",
    featured: toBool(row.featured),
    position: row.position ?? 0,
    isActive: toBool(row.is_active),
    parentId: row.parent_id ?? null,
    createdAt: row.created_at,
    productCount:
      row.product_count === undefined ? undefined : Number(row.product_count),
  };
}

export function mapProduct(row: Row): Product {
  const price = Number(row.price ?? 0);
  const compareAt = row.compare_at_price == null ? null : Number(row.compare_at_price);
  const discountPercent =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : undefined;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    sku: row.sku,
    description: row.description ?? "",
    shortDescription: row.short_description ?? null,
    price,
    compareAtPrice: compareAt,
    costPrice: row.cost_price == null ? null : Number(row.cost_price),
    currency: row.currency ?? "LKR",
    stock: Number(row.stock ?? 0),
    lowStockAlert: Number(row.low_stock_alert ?? 5),
    images: parseJson<string[]>(row.images, []).map(resolveImageUrl),
    tags: String(row.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    soldCount: Number(row.sold_count ?? 0),
    viewCount: Number(row.view_count ?? 0),
    condition: row.condition ?? "NEW",
    status: row.status ?? "ACTIVE",
    isFeatured: toBool(row.is_featured),
    isFlashDeal: toBool(row.is_flash_deal),
    freeShipping: toBool(row.free_shipping),
    shippingFee: Number(row.shipping_fee ?? 0),
    warranty: row.warranty ?? null,
    categoryId: row.category_id,
    brandId: row.brand_id ?? null,
    vendorId: row.vendor_id ?? null,
    specs: parseJson<Spec[]>(row.specs, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryName: row.category_name ?? undefined,
    categorySlug: row.category_slug ?? undefined,
    brandName: row.brand_name ?? undefined,
    discountPercent,
  };
}

export function mapReview(row: Row): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id ?? null,
    authorName: row.author_name,
    rating: Number(row.rating ?? 5),
    title: row.title ?? null,
    body: row.body,
    status: row.status ?? "APPROVED",
    helpful: Number(row.helpful ?? 0),
    createdAt: row.created_at,
    productTitle: row.product_title ?? undefined,
    productSlug: row.product_slug ?? undefined,
  };
}

export function mapOrderItem(row: Row): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id ?? null,
    title: row.title,
    slug: row.slug,
    image: row.image ? resolveImageUrl(String(row.image)) : "",
    sku: row.sku,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    total: Number(row.total),
  };
}

export function mapOrderEvent(row: Row): OrderEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  };
}

export function mapOrder(row: Row, items: OrderItem[] = [], timeline: OrderEvent[] = []): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id ?? null,
    email: row.email,
    customerName: row.customer_name,
    phone: row.phone,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: row.currency ?? "LKR",
    couponCode: row.coupon_code ?? null,
    shippingAddress: parseJson<Record<string, string>>(row.shipping_address, {}),
    billingAddress: row.billing_address
      ? parseJson<Record<string, string>>(row.billing_address, {})
      : null,
    note: row.note ?? null,
    trackingNumber: row.tracking_number ?? null,
    carrier: row.carrier ?? null,
    placedAt: row.placed_at,
    updatedAt: row.updated_at,
    items,
    timeline,
  };
}
