/** Domain types shared by the storefront, the REST API and the admin dashboard. */

export type Role = "CUSTOMER" | "VENDOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  avatarColor: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  color: string;
  featured: boolean;
  position: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  productCount?: number;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export type Spec =
  | { label: string; value: string }
  | { type: "richText"; html: string };

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  currency: string;
  stock: number;
  lowStockAlert: number;
  images: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  condition: "NEW" | "REFURBISHED" | "USED";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  isFeatured: boolean;
  isFlashDeal: boolean;
  freeShipping: boolean;
  shippingFee: number;
  warranty: string | null;
  categoryId: string;
  brandId: string | null;
  vendorId: string | null;
  specs: Spec[];
  createdAt: string;
  updatedAt: string;
  // joined / derived
  categoryName?: string;
  categorySlug?: string;
  brandName?: string;
  discountPercent?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  helpful: number;
  createdAt: string;
  productTitle?: string;
  productSlug?: string;
}

export interface CartLine {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
  lineTotal: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  title: string;
  slug: string;
  image: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  status: string;
  message: string;
  createdAt: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";
export type PaymentMethod = "COD" | "CARD" | "WALLET";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  couponCode: string | null;
  shippingAddress: Address | Record<string, string>;
  billingAddress: Address | Record<string, string> | null;
  note: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
  timeline: OrderEvent[];
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSpend: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface ProductFilters {
  q?: string;
  category?: string; // slug (includes descendants)
  brand?: string[]; // slugs
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  condition?: string[];
  inStock?: boolean;
  freeShipping?: boolean;
  onSale?: boolean;
  flashDealsOnly?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export type SortKey =
  | "relevance"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "popular";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
