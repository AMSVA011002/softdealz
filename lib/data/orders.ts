import { all, get, newId, nowIso, run, scalar, tx } from "@/lib/db";
import { mapOrder, mapOrderEvent, mapOrderItem } from "@/lib/data/mappers";
import { getCart, calculateTotals, validateCoupon } from "@/lib/data/cart";
import { safeInt } from "@/lib/numbers";
import type {
  Address,
  Order,
  OrderEvent,
  OrderStatus,
  Paginated,
  PaymentMethod,
} from "@/lib/types";

/** Thrown inside the checkout transaction when stock runs out mid-flight. */
class StockError extends Error {}

const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export function statusFlow(): OrderStatus[] {
  return [...ORDER_STATUS_FLOW];
}

function loadItems(orderId: string) {
  return all("SELECT * FROM order_items WHERE order_id = ?", [orderId]).map(mapOrderItem);
}

function loadTimeline(orderId: string): OrderEvent[] {
  return all("SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC", [
    orderId,
  ]).map(mapOrderEvent);
}

export function hydrateOrder(row: Record<string, any>): Order {
  return mapOrder(row, loadItems(String(row.id)), loadTimeline(String(row.id)));
}

export function getOrderByNumber(orderNumber: string): Order | null {
  const row = get("SELECT * FROM orders WHERE order_number = ?", [orderNumber]);
  return row ? hydrateOrder(row) : null;
}

export function getOrderById(id: string): Order | null {
  const row = get("SELECT * FROM orders WHERE id = ?", [id]);
  return row ? hydrateOrder(row) : null;
}

export function listUserOrders(userId: string): Order[] {
  const rows = all("SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC", [userId]);
  return rows.map(hydrateOrder);
}

export function listOrdersAdmin(options: {
  status?: string;
  paymentStatus?: string;
  q?: string;
  page?: number;
  perPage?: number;
  userId?: string;
}): Paginated<Order> {
  const page = safeInt(options.page, 1, 1, 10_000);
  const perPage = safeInt(options.perPage, 15, 5, 100);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.status && options.status !== "ALL") {
    conditions.push("status = ?");
    params.push(options.status);
  }
  if (options.userId) {
    conditions.push("user_id = ?");
    params.push(options.userId);
  }
  if (options.paymentStatus && options.paymentStatus !== "ALL") {
    conditions.push("payment_status = ?");
    params.push(options.paymentStatus);
  }
  if (options.q) {
    conditions.push(
      "(LOWER(order_number) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(email) LIKE ?)",
    );
    const like = `%${options.q.toLowerCase()}%`;
    params.push(like, like, like);
  }

  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = Number(
    get<{ total: number }>(`SELECT COUNT(*) AS total FROM orders ${clause}`, params)?.total ?? 0,
  );
  const rows = all(`SELECT * FROM orders ${clause} ORDER BY placed_at DESC LIMIT ? OFFSET ?`, [
    ...params,
    perPage,
    (page - 1) * perPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return {
    items: rows.map(hydrateOrder),
    total,
    page,
    perPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function generateOrderNumber(): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SD-${stamp}-${random}`;
}

export interface PlaceOrderInput {
  userId: string | null;
  email: string;
  customerName: string;
  phone: string;
  shippingAddress: Address | Record<string, string>;
  billingAddress?: Address | Record<string, string> | null;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  note?: string | null;
}

export interface PlaceOrderResult {
  ok: boolean;
  order?: Order;
  error?: string;
}

/**
 * Creates an order from the customer's cart, decrements stock and records the
 * initial timeline event. Everything happens inside one transaction so a
 * failure can never leave a half-written order behind.
 */
export function placeOrder(input: PlaceOrderInput): PlaceOrderResult {
  if (!input.userId) {
    return { ok: false, error: "Please sign in to place an order" };
  }

  const lines = getCart(input.userId);
  if (lines.length === 0) return { ok: false, error: "Your cart is empty" };

  for (const line of lines) {
    if (line.product.status !== "ACTIVE") {
      return { ok: false, error: `"${line.product.title}" is no longer available` };
    }
    if (line.product.stock < line.quantity) {
      return {
        ok: false,
        error: `Only ${line.product.stock} left of "${line.product.title}"`,
      };
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  // Only a valid coupon is applied, recorded, and counted against its usage
  // limit — an unknown or expired code must never inflate `used_count`.
  let couponCode: string | null = null;
  if (input.couponCode) {
    const coupon = validateCoupon(input.couponCode, subtotal);
    if (!coupon.valid) return { ok: false, error: coupon.error ?? "That coupon is not valid" };
    couponCode = coupon.coupon?.code ?? input.couponCode.trim().toUpperCase();
  }

  const totals = calculateTotals(lines, { couponCode });
  const orderId = newId("ord");
  const orderNumber = generateOrderNumber();
  const placedAt = nowIso();

  try {
    return tx(() => {
      run(
        `INSERT INTO orders (
          id, order_number, user_id, email, customer_name, phone, status, payment_status,
          payment_method, subtotal, shipping_fee, discount, tax, total, coupon_code,
          shipping_address, billing_address, note, placed_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          orderId,
          orderNumber,
          input.userId,
          input.email,
          input.customerName,
          input.phone,
          "PENDING",
          input.paymentMethod === "COD" ? "UNPAID" : "PAID",
          input.paymentMethod,
          totals.subtotal,
          totals.shippingFee,
          totals.discount,
          totals.tax,
          totals.total,
          couponCode,
          JSON.stringify(input.shippingAddress),
          input.billingAddress ? JSON.stringify(input.billingAddress) : null,
          input.note ?? null,
          placedAt,
        ],
      );

      for (const line of lines) {
        run(
          `INSERT INTO order_items (id, order_id, product_id, title, slug, image, sku,
            unit_price, quantity, total) VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            newId("oit"),
            orderId,
            line.product.id,
            line.product.title,
            line.product.slug,
            line.product.images[0] ?? "/images/products/placeholder.svg",
            line.product.sku,
            line.product.price,
            line.quantity,
            line.lineTotal,
          ],
        );

        // Re-check inside the transaction: a conditional update keeps the stock
        // decrement atomic, so two concurrent checkouts can never oversell.
        const decremented = run(
          `UPDATE products SET stock = stock - ?, sold_count = sold_count + ?,
             updated_at = datetime('now')
           WHERE id = ? AND stock >= ?`,
          [line.quantity, line.quantity, line.product.id, line.quantity],
        );

        if (decremented.changes === 0) {
          throw new StockError(`Only ${line.product.stock} left of "${line.product.title}"`);
        }
      }

      run(
        `INSERT INTO order_events (id, order_id, status, message, created_at)
         VALUES (?,?,?,?,?)`,
        [
          newId("oev"),
          orderId,
          "PENDING",
          input.paymentMethod === "COD"
            ? "Order received. Pay cash on delivery."
            : "Order received and payment authorised.",
          placedAt,
        ],
      );

      if (couponCode) {
        run("UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(?)", [couponCode]);
      }

      run("DELETE FROM cart_items WHERE user_id = ?", [input.userId]);

      run(
        `INSERT INTO notifications (id, user_id, title, body, type)
         VALUES (?,?,?,?,?)`,
        [
          newId("ntf"),
          input.userId,
          `Order ${orderNumber} placed`,
          `We received your order for ${lines.length} item(s). Total ${totals.total.toFixed(0)}.`,
          "ORDER",
        ],
      );

      const order = getOrderById(orderId);
      return order ? { ok: true, order } : { ok: false, error: "Order could not be loaded" };
    });
  } catch (error) {
    if (error instanceof StockError) return { ok: false, error: error.message };
    throw error;
  }
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  options: { message?: string; trackingNumber?: string; carrier?: string } = {},
): boolean {
  const order = getOrderById(orderId);
  if (!order) return false;

  const paymentStatus =
    status === "DELIVERED" ? "PAID" : status === "REFUNDED" ? "REFUNDED" : order.paymentStatus;

  const result = run(
    `UPDATE orders SET status = ?, payment_status = ?,
       tracking_number = COALESCE(?, tracking_number),
       carrier = COALESCE(?, carrier),
       updated_at = datetime('now')
     WHERE id = ?`,
    [status, paymentStatus, options.trackingNumber ?? null, options.carrier ?? null, orderId],
  );

  run(
    `INSERT INTO order_events (id, order_id, status, message) VALUES (?,?,?,?)`,
    [
      newId("oev"),
      orderId,
      status,
      options.message ?? `Order marked as ${status.toLowerCase()}.`,
    ],
  );

  if (order.userId) {
    run(
      `INSERT INTO notifications (id, user_id, title, body, type) VALUES (?,?,?,?,?)`,
      [
        newId("ntf"),
        order.userId,
        `Order ${order.orderNumber} updated`,
        options.message ?? `Your order is now ${status.toLowerCase()}.`,
        "ORDER",
      ],
    );
  }

  return result.changes > 0;
}

export function updatePaymentStatus(orderId: string, paymentStatus: string): boolean {
  return (
    run("UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE id = ?", [
      paymentStatus,
      orderId,
    ]).changes > 0
  );
}

export function countOrders(): number {
  return (
    get<{ total: number }>("SELECT COUNT(*) AS total FROM orders")?.total ?? 0
  );
}

export function countPendingOrders(): number {
  return (
    scalar<number>(
      "SELECT COUNT(*) AS total FROM orders WHERE status IN ('PENDING','CONFIRMED','PROCESSING')",
    ) ?? 0
  );
}

export function ordersByStatus(): Array<{ status: string; count: number }> {
  return all("SELECT status, COUNT(*) AS count FROM orders GROUP BY status").map((row) => ({
    status: String(row.status),
    count: Number(row.count),
  }));
}

export function appliedCouponPreview(code: string, subtotal: number) {
  return validateCoupon(code, subtotal);
}
