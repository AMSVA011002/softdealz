-- SoftDealz database schema (SQLite)
-- Applied by `npm run db:migrate`. Idempotent: safe to run repeatedly.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  phone          TEXT,
  role           TEXT NOT NULL DEFAULT 'CUSTOMER',   -- CUSTOMER | VENDOR | ADMIN
  status         TEXT NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE | SUSPENDED
  avatar_color   TEXT NOT NULL DEFAULT '#0c800f',
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS addresses (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Home',
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'Sri Lanka',
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image       TEXT,
  icon        TEXT,                                  -- lucide icon name
  color       TEXT NOT NULL DEFAULT '#0c800f',
  featured    INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  parent_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

CREATE TABLE IF NOT EXISTS brands (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  sku               TEXT NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  short_description TEXT,
  price             REAL NOT NULL,
  compare_at_price  REAL,
  cost_price        REAL,
  currency          TEXT NOT NULL DEFAULT 'LKR',
  stock             INTEGER NOT NULL DEFAULT 0,
  low_stock_alert   INTEGER NOT NULL DEFAULT 5,
  images            TEXT NOT NULL DEFAULT '[]',
  tags              TEXT NOT NULL DEFAULT '',
  rating            REAL NOT NULL DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  sold_count        INTEGER NOT NULL DEFAULT 0,
  view_count        INTEGER NOT NULL DEFAULT 0,
  condition         TEXT NOT NULL DEFAULT 'NEW',
  status            TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | DRAFT | ARCHIVED
  is_featured       INTEGER NOT NULL DEFAULT 0,
  is_flash_deal     INTEGER NOT NULL DEFAULT 0,
  free_shipping     INTEGER NOT NULL DEFAULT 0,
  shipping_fee      REAL NOT NULL DEFAULT 0,
  warranty          TEXT,
  category_id       TEXT NOT NULL REFERENCES categories(id),
  brand_id          TEXT REFERENCES brands(id),
  vendor_id         TEXT,
  specs             TEXT NOT NULL DEFAULT '[]',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price    ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, status);

CREATE TABLE IF NOT EXISTS cart_items (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  order_number     TEXT NOT NULL UNIQUE,
  user_id          TEXT REFERENCES users(id),
  email            TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING',
  payment_status   TEXT NOT NULL DEFAULT 'UNPAID',
  payment_method   TEXT NOT NULL DEFAULT 'COD',
  subtotal         REAL NOT NULL,
  shipping_fee     REAL NOT NULL DEFAULT 0,
  discount         REAL NOT NULL DEFAULT 0,
  tax              REAL NOT NULL DEFAULT 0,
  total            REAL NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'LKR',
  coupon_code      TEXT,
  shipping_address TEXT NOT NULL DEFAULT '{}',
  billing_address  TEXT,
  note             TEXT,
  tracking_number  TEXT,
  carrier          TEXT,
  placed_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date   ON orders(placed_at);

CREATE TABLE IF NOT EXISTS order_items (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  title      TEXT NOT NULL,
  slug       TEXT NOT NULL,
  image      TEXT NOT NULL,
  sku        TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity   INTEGER NOT NULL,
  total      REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_events (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id),
  author_name TEXT NOT NULL,
  rating      INTEGER NOT NULL DEFAULT 5,
  title       TEXT,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'APPROVED',
  helpful     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);

CREATE TABLE IF NOT EXISTS coupons (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  description  TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'PERCENT',  -- PERCENT | FIXED | FREE_SHIPPING
  value        REAL NOT NULL DEFAULT 0,
  min_spend    REAL NOT NULL DEFAULT 0,
  max_uses     INTEGER NOT NULL DEFAULT 0,
  used_count   INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  starts_at    TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'INFO',
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stores the terms shoppers search for, surfaced in the admin dashboard.
CREATE TABLE IF NOT EXISTS search_log (
  id         TEXT PRIMARY KEY,
  term       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_search_log_term ON search_log(term);
