/**
 * Checkout integrity test — exercises the money path (cart → coupon → order →
 * stock) against a throw-away database, then proves the shop cannot oversell
 * when several checkouts land at the same moment.
 *
 *   npm run test:orders
 *
 * The throw-away database is a temp file built with a fresh migrate + seed, so
 * the test never reads or writes `data/softdealz.db`. Requires the server to be
 * stopped? No — it is entirely in-process and offline.
 *
 * Modes (internal): with no argument it runs the parent suite and re-executes
 * itself as `racer` children for the concurrency check.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const MODE = process.argv[2] ?? "parent";
const RACERS = 6;
const RACE_STOCK = 3;

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  → ${detail}` : ""}`);
  if (!ok) failures++;
}

const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");

function run(args: string[], env: NodeJS.ProcessEnv) {
  execFileSync(process.execPath, [tsxCli, ...args], {
    env,
    stdio: ["ignore", "ignore", "pipe"],
    cwd: process.cwd(),
  });
}

/* ------------------------------------------------------------------ */
/* Racer child: one concurrent checkout                                */
/* ------------------------------------------------------------------ */

async function racer() {
  const { get } = await import("../lib/db/index");
  const { addToCart } = await import("../lib/data/cart");
  const { placeOrder } = await import("../lib/data/orders");

  const userId = process.env.ORDER_TEST_USER as string;
  const productId = process.env.ORDER_TEST_PRODUCT as string;
  const index = process.env.ORDER_TEST_INDEX as string;
  const ready = process.env.ORDER_TEST_READY as string;
  const go = process.env.ORDER_TEST_GO as string;

  const user = get<{ id: string; email: string; name: string }>(
    "SELECT id, email, name FROM users WHERE id = ?",
    [userId],
  );
  const added = addToCart(userId, productId, 1);
  if (!added.ok) {
    console.log(JSON.stringify({ racer: Number(index), ok: false, error: added.error }));
    return;
  }

  fs.writeFileSync(ready, "");
  const deadline = Date.now() + 30_000;
  while (!fs.existsSync(go)) {
    if (Date.now() > deadline) {
      console.log(JSON.stringify({ racer: Number(index), ok: false, error: "barrier timeout" }));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  try {
    const result = placeOrder({
      userId,
      email: user!.email,
      customerName: user!.name,
      phone: "+94 77 000 0000",
      shippingAddress: {
        fullName: user!.name,
        phone: "+94 77 000 0000",
        line1: "1 Race Road",
        city: "Colombo",
        state: "Western",
        postalCode: "00100",
        country: "Sri Lanka",
      },
      paymentMethod: "COD",
    });
    console.log(
      JSON.stringify({
        racer: Number(index),
        ok: result.ok,
        error: result.error ?? null,
        orderId: result.order?.id ?? null,
      }),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        racer: Number(index),
        ok: false,
        error: `THREW: ${(error as Error).message}`,
      }),
    );
  }
}

/* ------------------------------------------------------------------ */
/* Parent: full suite                                                  */
/* ------------------------------------------------------------------ */

async function parent() {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "softdealz-order-test-"));
  const dbFile = path.join(workDir, "test.db");
  const env = { ...process.env, DATABASE_FILE: dbFile };
  let closeDatabase: (() => void) | undefined;

  try {
    console.log("building a throw-away database…");
    run(["db/migrate.ts"], env);
    run(["db/seed.ts"], env);
    console.log(`  → ${dbFile}\n`);

    // The data layer reads DATABASE_FILE when its module loads, so the env var
    // must be in place before the (dynamic) imports below.
    process.env.DATABASE_FILE = dbFile;
    const { all, get, getDb, run: exec, scalar } = await import("../lib/db/index");
    closeDatabase = () => getDb().close();
    const {
      FREE_SHIPPING_THRESHOLD,
      MAX_LINE_QUANTITY,
      STANDARD_SHIPPING_FEE,
      addToCart,
      calculateTotals,
      getCart,
      setCartQuantity,
      validateCoupon,
    } = await import("../lib/data/cart");
    const { getOrderById, placeOrder, updateOrderStatus, updatePaymentStatus } = await import(
      "../lib/data/orders"
    );
    const { toggleWishlist } = await import("../lib/data/account");

    const user = get<{ id: string; email: string; name: string }>(
      "SELECT id, email, name FROM users WHERE email = 'customer@softdealz.lk'",
    )!;
    const product = get<{ id: string; title: string; price: number }>(
      "SELECT id, title, price FROM products WHERE status = 'ACTIVE' AND stock > 30 ORDER BY price ASC LIMIT 1",
    )!;
    const coupon = get<{ code: string; used_count: number }>(
      "SELECT code, used_count FROM coupons WHERE code = 'WELCOME10'",
    )!;

    console.log(`— cart guards (${product.title}) —`);
    check("cart rejects an unknown product", !addToCart(user.id, "prd_nope", 1).ok);
    const first = addToCart(user.id, product.id, 2);
    check("addToCart accepts a real product", first.ok && first.quantity === 2, JSON.stringify(first));
    const bump = addToCart(user.id, product.id, 3);
    check("addToCart accumulates the line", bump.ok && bump.quantity === 5, JSON.stringify(bump));
    const overCeiling = addToCart(user.id, product.id, 999);
    check(
      "addToCart refuses to pass the per-line ceiling",
      !overCeiling.ok && (bump.quantity ?? 0) <= MAX_LINE_QUANTITY,
      JSON.stringify(overCeiling),
    );
    check(
      "a repeated add cannot creep past the ceiling either",
      !addToCart(user.id, product.id, MAX_LINE_QUANTITY).ok,
    );
    check("no cart line exceeds the ceiling", getCart(user.id).every((l) => l.quantity <= MAX_LINE_QUANTITY));
    check("setCartQuantity sets an absolute amount", setCartQuantity(user.id, product.id, 4).quantity === 4);
    check("setCartQuantity clamps an absurd value", setCartQuantity(user.id, product.id, 999).quantity === MAX_LINE_QUANTITY);
    check("setCartQuantity treats 0 as a removal", setCartQuantity(user.id, product.id, 0).quantity === 0);
    check("setCartQuantity refuses a line that is not in the cart", !setCartQuantity(user.id, product.id, 2).ok);
    check("setCartQuantity refuses an unknown product", !setCartQuantity(user.id, "prd_nope", 1).ok);

    // Restore a line whose value clears WELCOME10's minimum spend.
    const qty = Math.min(MAX_LINE_QUANTITY, Math.max(2, Math.ceil(6_000 / Number(product.price))));
    const restored = addToCart(user.id, product.id, qty);
    check(`line restored to ${qty} units for checkout`, restored.ok && restored.quantity === qty, JSON.stringify(restored));

    console.log("\n— coupons —");
    const lines = getCart(user.id);
    check("totals ignore an unknown coupon", calculateTotals(lines, { couponCode: "NOPE" }).discount === 0);
    check("an expired coupon is refused", !validateCoupon("AVURUDU20", 5_000_000).valid);
    const plain = calculateTotals(lines);
    const discounted = calculateTotals(lines, { couponCode: coupon.code });
    check("a valid coupon discounts the order", discounted.discount > 0 && discounted.total < plain.total);
    check("totals stay money-safe", Number.isFinite(discounted.total) && Math.round(discounted.total * 100) / 100 === discounted.total);
      check(
      "the standard fee applies below the free-shipping threshold",
      discounted.subtotal >= FREE_SHIPPING_THRESHOLD || discounted.shippingFee >= STANDARD_SHIPPING_FEE,
      `subtotal ${discounted.subtotal}, fee ${discounted.shippingFee}`,
    );
    const bigCart = lines.map((line) => ({
      ...line,
      product: { ...line.product, price: FREE_SHIPPING_THRESHOLD + 1_000, shippingFee: 0, freeShipping: false },
    }));
    check(
      "shipping is free once the basket clears the threshold",
      calculateTotals(bigCart).shippingFee === 0,
      `fee ${calculateTotals(bigCart).shippingFee}`,
    );
    check(
      "a total is exactly its parts",
      discounted.total ===
        Math.round((discounted.subtotal - discounted.discount + discounted.shippingFee + discounted.tax) * 100) / 100,
      `${discounted.subtotal} - ${discounted.discount} + ${discounted.shippingFee} + ${discounted.tax} ≠ ${discounted.total}`,
    );
    check(
      "line totals add up to the subtotal",
      Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100 === plain.subtotal,
    );
    check(
      "the free-shipping nudge is the remaining amount",
      plain.freeShippingRemaining === Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - plain.subtotal) * 100) / 100),
    );

    console.log("\n— checkout —");
    const usedBefore = Number(scalar("SELECT used_count FROM coupons WHERE code = 'WELCOME10'"));
    const stockBefore = Number(scalar("SELECT stock FROM products WHERE id = ?", [product.id]));
    const address = {
      fullName: user.name,
      phone: "+94 77 000 0000",
      line1: "1 Test Road",
      city: "Colombo",
      state: "Western",
      postalCode: "00100",
      country: "Sri Lanka",
    };

    const bogus = placeOrder({
      userId: user.id,
      email: user.email,
      customerName: user.name,
      phone: "+94 77 000 0000",
      shippingAddress: address,
      paymentMethod: "COD",
      couponCode: "NOT-A-COUPON",
    });
    check("an order with an invalid coupon is refused", !bogus.ok, JSON.stringify(bogus));
    check("the refused order used no stock", Number(scalar("SELECT stock FROM products WHERE id = ?", [product.id])) === stockBefore);

    const placed = placeOrder({
      userId: user.id,
      email: user.email,
      customerName: user.name,
      phone: "+94 77 000 0000",
      shippingAddress: address,
      paymentMethod: "CARD",
      couponCode: coupon.code,
      note: "leave at the gate",
    });
    check("the order is placed", placed.ok && Boolean(placed.order), JSON.stringify(placed).slice(0, 200));
    const order = placed.order!;
    check("the coupon is recorded on the order", order.couponCode === coupon.code, String(order.couponCode));
    check("the discount is recorded on the order", order.discount > 0, String(order.discount));
    check("a card payment is marked PAID", order.paymentStatus === "PAID", order.paymentStatus);
    check("the order opens with a timeline entry", order.timeline.length === 1, String(order.timeline.length));
    check("order lines snapshot the product", order.items.length === lines.length && order.items[0].title === product.title);
    check("the note is stored", order.note === "leave at the gate", String(order.note));
    check(
      `stock drops by ${qty}`,
      Number(scalar("SELECT stock FROM products WHERE id = ?", [product.id])) === stockBefore - qty,
    );
    check(
      "coupon usage increments exactly once",
      Number(scalar("SELECT used_count FROM coupons WHERE code = 'WELCOME10'")) === usedBefore + 1,
    );
    check("the cart is emptied after checkout", getCart(user.id).length === 0);
    check(
      "the shopper is notified",
      Number(scalar("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND type = 'ORDER'", [user.id])) > 0,
    );
    check("the order appears in the shopper's history", all("SELECT id FROM orders WHERE user_id = ?", [user.id]).length > 0);
    check(
      "an empty cart cannot be checked out",
      !placeOrder({
        userId: user.id,
        email: user.email,
        customerName: user.name,
        phone: "+94 77 000 0000",
        shippingAddress: address,
        paymentMethod: "COD",
      }).ok,
    );

    console.log("\n— wishlist + fulfilment —");
    check("the wishlist rejects an unknown product", !toggleWishlist(user.id, "prd_nope").ok);
    check("the wishlist accepts a real product", toggleWishlist(user.id, product.id).ok);
    check("the order status can be updated", updateOrderStatus(order.id, "SHIPPED", { trackingNumber: "TEST-1", carrier: "TestCourier" }));
    const reloaded = getOrderById(order.id)!;
    check("tracking details are stored", reloaded.trackingNumber === "TEST-1" && reloaded.carrier === "TestCourier");
    check("the payment status can be updated", updatePaymentStatus(order.id, "REFUNDED"));

    console.log("\n— concurrency: no overselling —");
    const raceProduct = get<{ id: string; title: string; stock: number }>(
      "SELECT id, title, stock FROM products WHERE status = 'ACTIVE' ORDER BY stock DESC LIMIT 1",
    )!;
    const racers = all<{ id: string }>(
      "SELECT id FROM users WHERE role = 'CUSTOMER' AND id <> ? ORDER BY created_at LIMIT ?",
      [user.id, RACERS],
    );
    // Give the race product exactly RACE_STOCK units and empty the racers' carts.
    for (const racer of racers) exec("DELETE FROM cart_items WHERE user_id = ?", [racer.id]);
    exec("UPDATE products SET stock = ? WHERE id = ?", [RACE_STOCK, raceProduct.id]);
    console.log(`  ${racers.length} simultaneous checkouts for "${raceProduct.title}" (stock ${RACE_STOCK})`);

    const go = path.join(workDir, "go");
    const readyFiles = racers.map((_, index) => path.join(workDir, `ready-${index}`));
    const children = racers.map((racer, index) =>
      spawn(process.execPath, [tsxCli, "scripts/order-flow-test.ts", "racer"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_FILE: dbFile,
          ORDER_TEST_USER: racer.id,
          ORDER_TEST_PRODUCT: raceProduct.id,
          ORDER_TEST_INDEX: String(index),
          ORDER_TEST_READY: readyFiles[index],
          ORDER_TEST_GO: go,
        },
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );

    const output: string[] = [];
    for (const child of children) {
      child.stdout.on("data", (chunk: Buffer) => output.push(...chunk.toString().trim().split("\n").filter(Boolean)));
    }

    let alive = children.length;
    for (const child of children) child.on("exit", () => (alive -= 1));
    const readyDeadline = Date.now() + 60_000;
    while (readyFiles.some((file) => !fs.existsSync(file)) && alive > 0 && Date.now() < readyDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    fs.writeFileSync(go, ""); // fire the starting gun once every racer is loaded
    await Promise.all(children.map((child) => new Promise((resolve) => child.on("exit", resolve))));
    await new Promise((resolve) => setTimeout(resolve, 200));

    const results = output.map((line) => JSON.parse(line) as { racer: number; ok: boolean; error: string | null; orderId: string | null });
    const won = results.filter((result) => result.ok);
    const lost = results.filter((result) => !result.ok);
    const sold =
      won.length === 0
        ? 0
        : Number(
            scalar(
              `SELECT COALESCE(SUM(quantity), 0) AS n FROM order_items WHERE product_id = ? AND order_id IN (${won
                .map(() => "?")
                .join(",")})`,
              [raceProduct.id, ...won.map((result) => result.orderId)],
            ),
          );
    const left = Number(scalar("SELECT stock FROM products WHERE id = ?", [raceProduct.id]));

    for (const result of results) {
      console.log(`    racer ${result.racer}: ${result.ok ? "order placed" : `blocked — ${result.error}`}`);
    }
    check(`${RACE_STOCK} of ${racers.length} checkouts succeed`, won.length === RACE_STOCK, `succeeded ${won.length}`);
    check(`only ${RACE_STOCK} units leave stock`, sold === RACE_STOCK, `sold ${sold}`);
    check("stock lands on zero, never below", left === 0, `left ${left}`);
    check(
      "the losing shoppers get a readable reason",
      lost.length === 0 || lost.every((result) => typeof result.error === "string" && result.error.length > 0),
    );
  } finally {
    if (closeDatabase) closeDatabase();
    fs.rmSync(workDir, { recursive: true, force: true });
  }

  console.log(failures === 0 ? "\nAll order-flow checks passed." : `\n${failures} order-flow check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

if (MODE === "racer") {
  racer();
} else {
  parent();
}
