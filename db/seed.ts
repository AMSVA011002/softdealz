/**
 * SoftDealz seeder — builds a complete, believable marketplace dataset:
 * categories, brands, products, customers, staff, orders across the last
 * 90 days, reviews, coupons and notifications.
 *
 *   npm run db:setup      (migrate + seed; no-op when data already exists)
 *   npm run db:seed:force (wipe the demo tables and rebuild from the catalog)
 *   npm run db:reset      (delete the database file, then migrate + seed)
 *
 * Data safety: seeding DELETES the demo tables first. It therefore refuses to
 * run against a database that already holds data unless `--force` is passed,
 * so a production `npm run build` can never wipe real orders.
 */
import bcrypt from "bcryptjs";
import { run, tx, newId, nowIso, getDb, get } from "../lib/db/index";
import { loadCatalog, flattenProducts, type RawProduct } from "./catalog";

const CURRENCY = "LKR";
const PASSWORD = "Password123!";

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-randomness so seeds are reproducible           */
/* ------------------------------------------------------------------ */

function makeRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = makeRandom(20261013);
const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

function daysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, intBetween(0, 59), intBetween(0, 59), 0);
  return date.toISOString().replace("T", " ").slice(0, 19);
}

/* ------------------------------------------------------------------ */
/* Content banks                                                       */
/* ------------------------------------------------------------------ */

const CUSTOMER_NAMES = [
  "Nimal Perera", "Sanduni Fernando", "Kasun Jayasinghe", "Dilani Wickramasinghe",
  "Tharindu Silva", "Ishara Gunasekara", "Ravindu Bandara", "Amaya Rathnayake",
  "Chathura Weerasinghe", "Hasini Dissanayake", "Lahiru Mendis", "Nadeesha Kumari",
  "Sahan Ekanayake", "Piumi Herath", "Dinesh Rajapaksa", "Thilini Abeywickrama",
  "Ashan Peiris", "Malsha Senanayake", "Ruwan Karunaratne", "Gayathri Nawaratne",
  "Isuru Ariyasinghe", "Nethmi Sooriyaarachchi", "Buddhika Alwis", "Sachini Gamage",
];

const CITIES: Array<{ city: string; state: string; postal: string }> = [
  { city: "Colombo", state: "Western", postal: "00100" },
  { city: "Negombo", state: "Western", postal: "11500" },
  { city: "Gampaha", state: "Western", postal: "11000" },
  { city: "Kandy", state: "Central", postal: "20000" },
  { city: "Galle", state: "Southern", postal: "80000" },
  { city: "Jaffna", state: "Northern", postal: "40000" },
  { city: "Kurunegala", state: "North Western", postal: "60000" },
  { city: "Batticaloa", state: "Eastern", postal: "30000" },
  { city: "Matara", state: "Southern", postal: "81000" },
  { city: "Anuradhapura", state: "North Central", postal: "50000" },
];

const STREETS = [
  "Temple Road", "Main Street", "Galle Road", "Lake Drive", "Hospital Road",
  "Station Road", "Beach Road", "Kandy Road", "Flower Lane", "Park Avenue",
];

const REVIEW_BODIES = [
  "Exactly as described and it arrived two days early. Very happy with this purchase.",
  "Great value for the price. Build quality feels premium and it works perfectly.",
  "Delivery was quick and the packaging was solid. Would buy from SoftDealz again.",
  "Works well for everyday use. Nothing flashy but very reliable so far.",
  "Slightly better than I expected. The finish is neat and everything was included.",
  "Good product overall. Took a day longer to arrive than the estimate, but no complaints.",
  "I compared a few options before choosing this one and I'm glad I did.",
  "Perfect gift. The recipient loved it and it looked exactly like the photos.",
  "Solid performance after a month of daily use. Still looks brand new.",
  "Customer support helped me sort out a size question quickly. Product is great.",
];

const REVIEW_TITLES = [
  "Excellent buy", "Worth every rupee", "Very satisfied", "Great quality",
  "Would recommend", "Better than expected", "Solid product", "Happy customer",
];

const SPEC_TEMPLATES: Record<string, Array<{ label: string; value: string }>> = {
  default: [
    { label: "Warranty", value: "12 months official warranty" },
    { label: "Delivery", value: "2–4 working days island-wide" },
    { label: "Returns", value: "7 day easy return window" },
  ],
  electronics: [
    { label: "Power", value: "100–240V AC, 50/60Hz" },
    { label: "Warranty", value: "24 months official warranty" },
    { label: "In the box", value: "Unit, remote, power cable, manual" },
  ],
  clothing: [
    { label: "Material", value: "100% combed cotton" },
    { label: "Fit", value: "Regular fit, true to size" },
    { label: "Care", value: "Machine wash cold, do not bleach" },
  ],
  footwear: [
    { label: "Upper", value: "Breathable engineered mesh" },
    { label: "Sole", value: "High-rebound EVA with rubber outsole" },
    { label: "Sizes", value: "UK 6 – UK 12" },
  ],
  grocery: [
    { label: "Storage", value: "Store in a cool, dry place" },
    { label: "Shelf life", value: "12 months from packing" },
    { label: "Origin", value: "Produced in Sri Lanka" },
  ],
};

function specsFor(categorySlug: string, price: number) {
  const bank =
    categorySlug.startsWith("elect")
      ? SPEC_TEMPLATES.electronics
      : ["fashion", "footwear", "beauty-personal-care", "jewellery-watches"].includes(categorySlug)
        ? SPEC_TEMPLATES.clothing
        : ["grocery"].includes(categorySlug)
          ? SPEC_TEMPLATES.grocery
          : SPEC_TEMPLATES.default;

  return [
    ...bank,
    { label: "SKU group", value: `SD-${categorySlug.slice(0, 3).toUpperCase()}-${Math.round(price / 100)}` },
  ];
}

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

const catalog = loadCatalog();
const leaves = flattenProducts(catalog);

console.log(`Seeding SoftDealz from ${catalog.categories.length} categories…`);

const counts = {
  categories: 0,
  brands: 0,
  products: 0,
  users: 0,
  orders: 0,
  reviews: 0,
};

/**
 * Guard: only seed an empty database. `--force` (or SEED_FORCE=1) is required to
 * overwrite existing rows, which is what keeps `build`/`db:setup` non-destructive.
 */
function hasExistingData(): boolean {
  try {
    const existing = get<{ total: number }>(
      "SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM orders) + (SELECT COUNT(*) FROM products) AS total",
    );
    return Number(existing?.total ?? 0) > 0;
  } catch {
    console.error(
      "✖ The database has no schema yet. Run `npm run db:migrate` first (or use `npm run db:setup`).",
    );
    process.exit(1);
  }
}

const forced = process.argv.includes("--force") || process.env.SEED_FORCE === "1";

if (process.env.NODE_ENV === "production") {
  throw new Error("The demo seeder is disabled in production. Use `npm run db:create-admin` to provision an administrator.");
}

if (hasExistingData() && !forced) {
  console.log(
    "ℹ Database already contains data — skipping seed.\n" +
      "  Use `npm run db:seed:force` or `npm run db:reset` to rebuild the demo dataset.",
  );
  process.exit(0);
}

const passwordHash = bcrypt.hashSync(PASSWORD, 10);

tx(() => {
  /* ---------------- wipe owned tables ---------------- */
  const db = getDb();
  db.exec(`
    DELETE FROM order_events;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM reviews;
    DELETE FROM cart_items;
    DELETE FROM wishlist_items;
    DELETE FROM notifications;
    DELETE FROM addresses;
    DELETE FROM coupons;
    DELETE FROM newsletter_subscribers;
    DELETE FROM search_log;
    DELETE FROM products;
    DELETE FROM brands;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM settings;
  `);

  /* ---------------- settings ---------------- */
  const settings: Record<string, string> = {
    store_name: "SoftDealz",
    store_tagline: "Sri Lanka's smartest marketplace",
    support_email: "support@softdealz.lk",
    support_phone: "+94 11 234 5678",
    address_line: "142 Galle Road, Colombo 03, Sri Lanka",
    currency: CURRENCY,
    free_shipping_threshold: "25000",
    standard_shipping_fee: "450",
    announcement: "Island-wide delivery in 2–4 days · Free shipping over LKR 25,000",
    maintenance_mode: "false",
  };
  Object.entries(settings).forEach(([key, value]) => {
    run("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
  });

  /* ---------------- brands ---------------- */
  const brandIdBySlug = new Map<string, string>();
  catalog.brands.forEach((brand) => {
    const id = newId("brd");
    brandIdBySlug.set(brand.slug, id);
    run("INSERT INTO brands (id, name, slug, logo) VALUES (?,?,?,?)", [
      id,
      brand.name,
      brand.slug,
      `/images/brands/${brand.slug}.svg`,
    ]);
    counts.brands += 1;
  });

  /* ---------------- users ---------------- */
  const staff: Array<{ id: string; name: string; email: string; role: string }> = [];
  const staffSeed = [
    { name: "Amara Silva", email: "admin@softdealz.lk", role: "ADMIN" },
    { name: "Ruwan Silva", email: "manager@softdealz.lk", role: "ADMIN" },
    { name: "Ishara Perera", email: "vendor@softdealz.lk", role: "VENDOR" },
  ];

  staffSeed.forEach((member, index) => {
    const id = newId("usr");
    staff.push({ id, name: member.name, email: member.email, role: member.role });
    run(
      `INSERT INTO users (id, email, password_hash, name, phone, role, avatar_color, email_verified, created_at)
       VALUES (?,?,?,?,?,?,?,1,?)`,
      [
        id,
        member.email,
        passwordHash,
        member.name,
        `+94 7${index}${intBetween(1000000, 9999999)}`,
        member.role,
        ["#0c800f", "#0a57a0", "#7c3aed"][index],
        daysAgo(400 - index * 20),
      ],
    );
    counts.users += 1;
  });

  const customerSeed = [
    { name: "Nimal Perera", email: "customer@softdealz.lk", phone: "+94 77 123 4567" },
  ];
  CUSTOMER_NAMES.forEach((name) => {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
    if (!customerSeed.find((entry) => entry.name === name)) {
      customerSeed.push({ name, email: `${slug}@example.com`, phone: `+94 7${intBetween(10000000, 99999999)}` });
    }
  });

  const customers: Array<{ id: string; name: string; email: string; phone: string }> = [];

  customerSeed.forEach((customer, index) => {
    const id = newId("usr");
    const createdAt = daysAgo(intBetween(index === 0 ? 200 : 5, index === 0 ? 260 : 170));
    customers.push({ id, name: customer.name, email: customer.email, phone: customer.phone });

    run(
      `INSERT INTO users (id, email, password_hash, name, phone, role, avatar_color, email_verified, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id,
        customer.email,
        passwordHash,
        customer.name,
        customer.phone,
        "CUSTOMER",
        ["#0c800f", "#0a57a0", "#db2777", "#ea580c", "#0891b2", "#7c3aed"][index % 6],
        index % 3 === 0 ? 1 : 0,
        createdAt,
      ],
    );
    counts.users += 1;

    // 1–2 saved addresses
    const addressCount = intBetween(1, 2);
    for (let a = 0; a < addressCount; a += 1) {
      const place = pick(CITIES);
      run(
        `INSERT INTO addresses (id, user_id, label, full_name, phone, line1, line2, city, state,
          postal_code, country, is_default, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newId("adr"),
          id,
          a === 0 ? "Home" : "Office",
          customer.name,
          customer.phone,
          `${intBetween(1, 240)} ${pick(STREETS)}`,
          a === 0 ? `Lane ${intBetween(1, 12)}` : `Floor ${intBetween(1, 9)}`,
          place.city,
          place.state,
          place.postal,
          "Sri Lanka",
          a === 0 ? 1 : 0,
          createdAt,
        ],
      );
    }
  });

  // A couple of suspended accounts so the admin moderation view has content
  ["spam.account@example.com", "abandoned.cart@example.com"].forEach((email, index) => {
    const id = newId("usr");
    run(
      `INSERT INTO users (id, email, password_hash, name, phone, role, status, avatar_color, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        id,
        email,
        passwordHash,
        index === 0 ? "Flagged Account" : "Idle Shopper",
        `+94 7${intBetween(10000000, 99999999)}`,
        "CUSTOMER",
        "SUSPENDED",
        "#64748b",
        daysAgo(intBetween(60, 200)),
      ],
    );
    counts.users += 1;
  });

  /* ---------------- categories ---------------- */
  const categoryIdBySlug = new Map<string, string>();
  const childIdsByParentSlug = new Map<string, string[]>();

  catalog.categories.forEach((parent, parentIndex) => {
    const parentId = newId("cat");
    categoryIdBySlug.set(parent.slug, parentId);
    run(
      `INSERT INTO categories (id, name, slug, description, image, icon, featured, color, position,
        is_active, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,1,?)`,
      [
        parentId,
        parent.name,
        parent.slug,
        parent.tagline ?? null,
        `/images/categories/${parent.slug}.svg`,
        parent.icon,
        parent.featured ? 1 : 0,
        ["#0c800f", "#0a57a0", "#0c800f", "#0a57a0"][parentIndex % 4],
        parentIndex,
        daysAgo(300),
      ],
    );
    counts.categories += 1;

    const childIds: string[] = [];
    parent.children.forEach((child, childIndex) => {
      const childId = newId("cat");
      categoryIdBySlug.set(child.slug, childId);
      childIds.push(childId);
      run(
        `INSERT INTO categories (id, name, slug, description, image, icon, featured, color, position, is_active, parent_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`,
        [
          childId,
          child.name,
          child.slug,
          `${child.name} from ${parent.name}`,
          `/images/categories/${parent.slug}.svg`,
          child.icon,
          0,
          "#0a57a0",
          childIndex,
          parentId,
          daysAgo(300),
        ],
      );
      counts.categories += 1;
    });

    childIdsByParentSlug.set(parent.slug, childIds);
  });

  /* ---------------- products ---------------- */
  const productRows: Array<{ id: string; title: string; slug: string; price: number; sku: string; images: string; categorySlug: string; freeShipping: number; createdAt: string }> = [];

  leaves.forEach(({ parent, child, product: item }, index) => {
    const categoryId = categoryIdBySlug.get(child.slug)!;
    const id = newId("prd");
    const slug = item.t
      .toLowerCase()
      .replace(/["']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70);
    const sku = `SD-${String(index + 1001).padStart(5, "0")}`;
    const freeShipping = item.p >= 5000 ? 1 : 0;
    const createdAt = daysAgo(intBetween(1, 180));
    const stock = item.s ?? intBetween(5, 120);
    const rating = item.r ?? Number(between(3.9, 4.9).toFixed(1));
    const reviewCount = intBetween(4, 64);
    const soldCount = Math.floor(Number(item.f ?? 0) === 1 ? between(120, 900) : between(3, 260));
    const images = JSON.stringify([
      `/images/products/${slug}.svg`,
      `/images/products/${slug}-alt.svg`,
    ]);

    run(
      `INSERT INTO products (
        id, title, slug, sku, description, short_description, price, compare_at_price, cost_price,
        currency, stock, low_stock_alert, images, tags, rating, review_count, sold_count, view_count,
        condition, status, is_featured, free_shipping, shipping_fee, warranty, category_id, brand_id,
        specs, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        item.t,
        slug,
        sku,
        buildDescription(item, parent.name, child.name),
        `${parent.name} · ${child.name} · Ships in 2–4 working days`,
        item.p,
        item.w ?? null,
        Math.round(item.p * between(0.58, 0.78)),
        CURRENCY,
        stock,
        intBetween(3, 10),
        images,
        [parent.name, child.name, brandNameOf(item.b), item.f ? "featured" : ""].filter(Boolean).join(","),
        rating,
        reviewCount,
        soldCount,
        intBetween(80, 5200),
        rand() > 0.93 ? "REFURBISHED" : "NEW",
        rand() > 0.96 ? "DRAFT" : "ACTIVE",
        item.f ?? 0,
        freeShipping,
        freeShipping ? 0 : intBetween(250, 650),
        pick([
          "12 months warranty",
          "24 months warranty",
          "6 months warranty",
          "No warranty — as described",
          "12 months service warranty",
        ]),
        categoryId,
        brandIdBySlug.get(item.b) ?? null,
        JSON.stringify(specsFor(parent.slug, item.p)),
        createdAt,
        createdAt,
      ],
    );

    productRows.push({
      id,
      title: item.t,
      slug,
      price: item.p,
      sku,
      images,
      categorySlug: parent.slug,
      freeShipping,
      createdAt,
    });
    counts.products += 1;
  });

  function brandNameOf(slug: string) {
    return catalog.brands.find((brand) => brand.slug === slug)?.name ?? slug;
  }

  function buildDescription(item: RawProduct, parentName: string, childName: string) {
    return [
      `${item.t} — a standout pick in our ${childName} range.`,
      `SoftDealz sources this ${parentName.toLowerCase()} item from a vetted supplier and inspects it before it leaves the warehouse, so what arrives matches what you see here.`,
      `Ideal for everyday use, it balances build quality with a price that makes sense. Backed by our 7 day easy-return promise and island-wide delivery with live tracking.`,
    ].join("\n\n");
  }

  /* ---------------- reviews ---------------- */
  productRows.forEach((product) => {
    const reviewTotal = intBetween(2, 6);
    for (let r = 0; r < reviewTotal; r += 1) {
      const customer = pick(customers);
      const rating = rand() > 0.22 ? intBetween(4, 5) : intBetween(2, 3);
      run(
        `INSERT INTO reviews (id, product_id, user_id, author_name, rating, title, body, status, helpful, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          newId("rev"),
          product.id,
          rand() > 0.3 ? customer.id : null,
          rand() > 0.3 ? customer.name : pick(["Verified buyer", "SoftDealz shopper", "Anonymous"]),
          rating,
          pick(REVIEW_TITLES),
          pick(REVIEW_BODIES),
          rand() > 0.88 ? "PENDING" : "APPROVED",
          intBetween(0, 42),
          daysAgo(intBetween(1, 150)),
        ],
      );
      counts.reviews += 1;
    }
  });

  // Recompute denormalised rating/review counters from approved reviews only
  db.exec(`
    UPDATE products SET
      rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews
                          WHERE reviews.product_id = products.id AND reviews.status = 'APPROVED'), 0),
      review_count = COALESCE((SELECT COUNT(*) FROM reviews
                          WHERE reviews.product_id = products.id AND reviews.status = 'APPROVED'), 0);
  `);

  /* ---------------- coupons ---------------- */
  const coupons = [
    { code: "WELCOME10", description: "10% off your first order", type: "PERCENT", value: 10, min: 5000, uses: 0, expiresIn: 90 },
    { code: "SOFTDEALZ15", description: "15% off orders over LKR 25,000", type: "PERCENT", value: 15, min: 25000, uses: 500, expiresIn: 45 },
    { code: "FREESHIP", description: "Free island-wide delivery", type: "FREE_SHIPPING", value: 0, min: 3000, uses: 0, expiresIn: 60 },
    { code: "FLASH5K", description: "LKR 5,000 off orders over LKR 75,000", type: "FIXED", value: 5000, min: 75000, uses: 200, expiresIn: 14 },
    { code: "AVURUDU20", description: "New Year 20% off — expired", type: "PERCENT", value: 20, min: 10000, uses: 100, expiresIn: -20 },
  ];

  coupons.forEach((coupon) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + coupon.expiresIn);
    run(
      `INSERT INTO coupons (id, code, description, type, value, min_spend, max_uses, used_count, is_active, starts_at, expires_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newId("cpn"),
        coupon.code,
        coupon.description,
        coupon.type,
        coupon.value,
        coupon.min,
        coupon.uses,
        intBetween(0, 24),
        coupon.expiresIn > 0 ? 1 : 0,
        daysAgo(Math.abs(coupon.expiresIn) + 5),
        expires.toISOString().replace("T", " ").slice(0, 19),
        daysAgo(Math.abs(coupon.expiresIn) + 10),
      ],
    );
  });

  /* ---------------- orders ---------------- */
  const ORDER_COUNT = 140;
  const statuses: Array<{ status: string; weight: number; payment: string }> = [
    { status: "DELIVERED", weight: 42, payment: "PAID" },
    { status: "SHIPPED", weight: 14, payment: "PAID" },
    { status: "PROCESSING", weight: 12, payment: "PAID" },
    { status: "CONFIRMED", weight: 10, payment: "PAID" },
    { status: "PENDING", weight: 12, payment: "UNPAID" },
    { status: "CANCELLED", weight: 6, payment: "FAILED" },
    { status: "REFUNDED", weight: 4, payment: "REFUNDED" },
  ];
  const weightedStatuses = statuses.flatMap((entry) => Array.from({ length: entry.weight }, () => entry));
  const carriers = ["SoftDealz Express", "Pronto Courier", "Domex", "Koombiyo"];

  const orderIdByIndex: Array<{ id: string; userId: string; number: string; total: number; status: string; placedAt: string }> = [];

  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const customer = pick(customers);
    const daysBack = intBetween(0, 89);
    const placedAt = daysAgo(daysBack, intBetween(8, 21));
    const entry = pick(weightedStatuses);
    const orderId = newId("ord");
    const orderNumber = `SD-${new Date(placedAt.replace(" ", "T")).getFullYear()}${String(
      new Date(placedAt.replace(" ", "T")).getMonth() + 1,
    ).padStart(2, "0")}${String(new Date(placedAt.replace(" ", "T")).getDate()).padStart(2, "0")}-${1000 + i}`;

    const itemCount = intBetween(1, 4);
    const chosen: typeof productRows = [];
    for (let n = 0; n < itemCount; n += 1) {
      const product = pick(productRows);
      if (!chosen.find((entry2) => entry2.id === product.id)) chosen.push(product);
    }

    const lines = chosen.map((product) => {
      const quantity = intBetween(1, 3);
      return { product, quantity, total: product.price * quantity };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const shippingFee = subtotal >= 25000 ? 0 : 450;
    const discount = rand() > 0.78 ? Math.round(subtotal * (rand() > 0.5 ? 0.1 : 0.15)) : 0;
    const total = Math.max(0, subtotal - discount + shippingFee);
    const paymentMethod = rand() > 0.55 ? "COD" : rand() > 0.4 ? "CARD" : "WALLET";
    const paymentStatus = entry.status === "DELIVERED" && paymentMethod === "COD" ? "PAID" : entry.payment;
    const place = pick(CITIES);

    run(
      `INSERT INTO orders (
        id, order_number, user_id, email, customer_name, phone, status, payment_status, payment_method,
        subtotal, shipping_fee, discount, tax, total, currency, coupon_code, shipping_address,
        billing_address, note, tracking_number, carrier, placed_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderId,
        orderNumber,
        customer.id,
        customer.email,
        customer.name,
        customer.phone,
        entry.status,
        paymentStatus,
        paymentMethod,
        subtotal,
        shippingFee,
        discount,
        0,
        subtotal - discount + shippingFee,
        CURRENCY,
        discount > 0 ? pick(["WELCOME10", "SOFTDEALZ15", "FLASH5K"]) : null,
        JSON.stringify({
          fullName: customer.name,
          phone: customer.phone,
          line1: `${intBetween(1, 240)} ${pick(STREETS)}`,
          city: place.city,
          state: place.state,
          postalCode: place.postal,
          country: "Sri Lanka",
        }),
        null,
        rand() > 0.85 ? "Please call before delivery." : null,
        ["SHIPPED", "DELIVERED"].includes(entry.status) ? `TRK${intBetween(100000000, 999999999)}` : null,
        ["SHIPPED", "DELIVERED"].includes(entry.status) ? pick(carriers) : null,
        placedAt,
        placedAt,
      ],
    );

    lines.forEach((line) => {
      run(
        `INSERT INTO order_items (id, order_id, product_id, title, slug, image, sku, unit_price, quantity, total)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          newId("oit"),
          orderId,
          line.product.id,
          line.product.title,
          line.product.slug,
          (JSON.parse(line.product.images) as string[])[0],
          line.product.sku,
          line.product.price,
          line.quantity,
          line.total,
        ],
      );
    });

    // Timeline reflects the current status
    const flow = [
      { status: "PENDING", message: "Order received. Awaiting confirmation.", offset: 0 },
      { status: "CONFIRMED", message: "Payment confirmed and order accepted.", offset: 1 },
      { status: "PROCESSING", message: "Packing your items at the SoftDealz warehouse.", offset: 2 },
      { status: "SHIPPED", message: "Handed to the courier. Tracking is now live.", offset: 3 },
      { status: "DELIVERED", message: "Delivered. Thank you for shopping with SoftDealz.", offset: 5 },
    ];
    const cancels = [
      { status: "CANCELLED", message: "Order cancelled at the customer's request." },
      { status: "REFUNDED", message: "Refund processed back to the original payment method." },
    ];

    const events =
      entry.status === "CANCELLED" || entry.status === "REFUNDED"
        ? [
            { status: "PENDING", message: "Order received. Awaiting confirmation.", offset: 0 },
            { status: entry.status, offset: 1, message: entry.status === "CANCELLED" ? cancels[0].message : cancels[1].message },
          ]
        : flow.filter((step) => {
            const order = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
            return order.indexOf(step.status) <= order.indexOf(entry.status);
          });

    events.forEach((event) => {
      const date = new Date(placedAt.replace(" ", "T"));
      date.setDate(date.getDate() + event.offset);
      run(
        `INSERT INTO order_events (id, order_id, status, message, created_at) VALUES (?,?,?,?,?)`,
        [newId("oev"), orderId, event.status, event.message, date.toISOString().replace("T", " ").slice(0, 19)],
      );
    });

    orderIdByIndex.push({ id: orderId, userId: customer.id, number: orderNumber, total, status: entry.status, placedAt });
    counts.orders += 1;
  }

  /* ---------------- notifications ---------------- */
  customers.slice(0, 12).forEach((customer, index) => {
    const order = orderIdByIndex.find((entry) => entry.userId === customer.id);
    run(
      `INSERT INTO notifications (id, user_id, title, body, type, read, created_at) VALUES (?,?,?,?,?,?,?)`,
      [
        newId("ntf"),
        customer.id,
        order ? `Order ${order.number} is on the way` : "Welcome to SoftDealz",
        order
          ? "Your parcel has left our Colombo warehouse and tracking is live."
          : "Enjoy 10% off your first order with code WELCOME10.",
        order ? "ORDER" : "PROMO",
        index % 3 === 0 ? 0 : 1,
        daysAgo(intBetween(0, 20)),
      ],
    );
  });

  /* ---------------- admin@ notification ---------------- */
  run(
    `INSERT INTO notifications (id, user_id, title, body, type, created_at) VALUES (?,?,?,?,?,?)`,
    [
      newId("ntf"),
      staff[0].id,
      "Dashboard seeded",
      `${counts.products} products and ${counts.orders} orders are ready to explore.`,
      "INFO",
      nowIso(),
    ],
  );

  /* ---------------- newsletter + search log ---------------- */
  ["hello@example.com", "shopper@example.com", "deals@example.com", "newsletter@example.com"].forEach((email) => {
    run("INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?,?,?)", [
      newId("sub"),
      email,
      daysAgo(intBetween(1, 90)),
    ]);
  });

  ["wireless headphones", "cricket bat", "air fryer", "smart tv", "running shoes", "rice cooker", "yoga mat", "bluetooth speaker"].forEach(
    (term) => {
      const hits = intBetween(3, 40);
      for (let h = 0; h < hits; h += 1) {
        run("INSERT INTO search_log (id, term, created_at) VALUES (?,?,?)", [
          newId("slog"),
          term,
          daysAgo(intBetween(0, 60)),
        ]);
      }
    },
  );
});

console.log(`
✔ SoftDealz seed complete
  categories : ${counts.categories}
  brands     : ${counts.brands}
  products   : ${counts.products}
  users      : ${counts.users}
  orders     : ${counts.orders}
  reviews    : ${counts.reviews}

Demo accounts (password: ${PASSWORD})
  admin@softdealz.lk      → full admin dashboard
  manager@softdealz.lk    → admin dashboard
  vendor@softdealz.lk     → vendor account
  customer@softdealz.lk   → customer with order history
`);
