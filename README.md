# SoftDealz

A full-stack, fully responsive online marketplace — storefront, checkout, customer accounts and a complete admin dashboard — built with Next.js 16, React 19, Tailwind CSS v4 and an embedded SQLite database (no external services, no API keys).

**Theme:** `#0c800f` (green) · `#0a57a0` (blue) · `#ffffff`

## Project benefits

- **One application for the whole shop:** storefront, customer accounts, checkout, and store administration share one codebase and database.
- **Quick to run and easy to host:** the database is an embedded SQLite file; there is no separate database server, payment account, or third-party API key required for the demo.
- **Manageable without editing code:** administrators can maintain products, stock, orders, customers, promotions, store branding, policies, and storefront layout from the dashboard.
- **Built to protect customer and order data:** role-aware access, ownership checks, input validation, rate limits, security headers, and database backup/restore are included.
- **Responsive and discoverable:** mobile-first layouts, accessible UI building blocks, product/category SEO metadata, and generated sitemap/robots files are included.
- **Testable before deployment:** type checking, linting, smoke tests, and checkout-integrity tests cover the main workflows.

---

## Quick start

```bash
npm install          # Node >= 24 LTS (uses the built-in node:sqlite module)
npm run db:setup     # create the schema and seed 320 products, 29 users, 140 orders
npm run dev          # apply schema migrations and start at http://localhost:3000
```

Optional:

```bash
npm run dev:turbo     # same as `dev`, with Turbopack (first compile per route is ~2x faster)
npm run assets        # regenerate the SVG product / category / brand artwork
npm run db:seed:force # wipe the demo tables and rebuild the demo dataset
npm run db:reset      # delete the configured database file, then migrate + seed (destructive)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (flat config, next/core-web-vitals + typescript)
npm run verify        # typecheck + lint + production build
npm run build         # production build (applies schema migrations; never inserts demo data)
npm start             # serve the production build on 0.0.0.0:3000
npm run smoke         # end-to-end HTTP checks against a running server
npm run test:orders   # checkout integrity: cart, coupons, orders, no overselling
```

Production builds (`npm run build` and `npm run verify`) require `AUTH_SECRET` to be set in the environment. Use a secret manager or generate a random local value with `openssl rand -hex 32`.

The toolchain uses TypeScript 6 and ESLint 9, the newest versions supported by the current Next 16 lint stack. TypeScript 7 is rejected by its parser, while ESLint 10 violates the React/Next plugins' declared peer ranges.

### Development mode is not a performance measurement

`npm run dev` compiles each route **on first visit**, so the very first click on a link can sit there for
1–9 seconds before anything appears — on a cold server the home page alone takes ~7 s to compile:

```
○ Compiling / ...
✓ Compiled / in 7.2s (1204 modules)
 GET / 200 in 8652ms
```

That is the dev server working as designed, not the app being slow. Two things make this confusing:

- **Clearing the browser cache appears to "fix" it.** It doesn't — the routes you already visited are compiled
  on the server, so they answer in ~0.4 s; the next *unvisited* route is slow again, and editing a file
  (or restarting the dev server) recompiles.
- **Console noise looks like errors.** Development-only output such as `Download the React DevTools…` and
  `main-app.js?v=…` chunk URLs never appear in a production build, and the browser's
  `[Intervention] Images loaded lazily…` notice is an informational message about `loading="lazy"`
  images (the hero image is eager, everything below the fold is deliberately lazy).

To judge real speed, measure the production build — that is what a deployment runs:

```bash
npm run build && npm start        # ~50-110 ms per page, no compilation step
```

### Demo accounts

All seeded accounts use the password **`Password123!`**

| Role | Email |
| --- | --- |
| Administrator | `admin@softdealz.lk` |
| Manager (admin) | `manager@softdealz.lk` |
| Vendor | `vendor@softdealz.lk` |
| Shopper | `customer@softdealz.lk` |

Coupons to try: `WELCOME10`, `SOFTDEALZ15`, `FREESHIP`, `FLASH5K` (and `AVURUDU20`, expired).

---

## What's included

### Storefront
- **Homepage** — hero carousel, category tiles, value props, flash-deal rail with live countdown, featured grid, trending and new-arrival rails, brand strip, testimonials, recently viewed.
- **Catalogue** — listing pages for `/products`, `/category/[slug]`, `/search` and `/deals` with faceted filtering (category, brand, price, condition), sorting, active-filter chips and pagination.
- **Product page** — gallery, pricing and discount badges, stock state, delivery checker, specifications, customer reviews with rating breakdown, related products.
- **Cart & checkout** — cart drawer and full cart page, server-side coupons, free-shipping progress, saved addresses, 3-step checkout (delivery → shipping → review) with cash-on-delivery **or simulated card payment**, order confirmation and tracking.
- **Accounts** — registration and sign-in, dashboard, order history and detail with a live status timeline, wishlist, address book, reviews, notifications and settings (profile, password, preferences). The forgot-password screen is a demo-only UI; it does not send email or change passwords.
- **Public tracking** — look up an order with its number plus the email or phone it was placed with (rate limited, so order details are never enumerable).
- **Contact and newsletter** — contact form messages are saved as admin notifications; newsletter sign-ups are stored for administrators to review.
- **Content pages** — help centre, about, contact, shipping, returns, terms of service, privacy policy, 404 and error boundaries.

### Admin dashboard (`/admin`, admins only)
Dashboard KPIs with hand-rolled SVG charts, products (list / create / edit / feature / delete), categories, brands, inventory with inline stock adjustment, review moderation, orders (list, filters, detail, status + tracking updates, customer messaging), customers (roles, suspension, notifications, spend history), coupons, analytics, newsletter subscribers and store settings.

Store settings include store identity and contact details, brand colors and logo/icon, announcement, shipping fees and free-shipping threshold, policy text, homepage hero slides and storefront card/grid layout. Administrators can view table counts and recent searches, download a consistent SQLite backup, and restore a validated backup. Everything revalidates instantly — the storefront reflects an admin edit on the next request.

### Backend
- **Data layer** — `node:sqlite` with WAL, 16 tables, idempotent migrations and a deterministic seeder driven by the JSON catalogue in `db/catalog/`.
- **Server actions** for all mutations (auth, account, cart, checkout, admin) plus REST-ish route handlers under `app/api/` for the cart, wishlist, coupons, search, newsletter, tracking and categories.
- **Auth** — bcrypt password hashing with signed JWTs (`jose`) in an httpOnly cookie, role-aware proxy, ownership checks on every private record, and rate limiting on sign-in, sign-up, checkout, reviews, coupons, tracking and newsletter endpoints.
- **Validation** — zod schemas on every action and every JSON body, with field-level errors surfaced in the UI. Query parameters are sanitised centrally (`lib/params.ts`) so a malformed URL can never reach SQLite.
- **SEO** — `metadataBase`, canonical URLs, Open Graph/Twitter cards, `robots.txt` and a generated `sitemap.xml`.

Available JSON endpoints include:

| Endpoint | Capability |
| --- | --- |
| `/api/cart` | Read and update shopping cart |
| `/api/wishlist` | Read and update wishlist |
| `/api/coupon` | Validate a coupon |
| `/api/search` | Search products |
| `/api/categories` | Fetch the category tree |
| `/api/track` | Look up a shipment using order details |
| `/api/newsletter` | Subscribe to the newsletter |
| `/api/products/recently-viewed` | Fetch active products by recently viewed IDs |
| `/api/images/google-drive/[id]` | Safely proxy public Google Drive product images |
| `/api/admin/database/backup` | Download an admin-only SQLite backup |
| `/api/admin/database/restore` | Validate and restore an admin-uploaded SQLite backup |

---

## Project structure

```
app/                 routes: storefront, account, admin, api, server actions
components/          UI kit, layout, product, shop, cart, checkout, account, admin
proxy.ts             role-aware request proxy and nonce-based security headers
lib/
  db/                node:sqlite wrapper (get/all/run/tx/savepoints)
  data/              query layer: products, categories, cart, orders, coupons,
                     reviews, account, analytics, facets, mappers
  auth.ts            sessions, password hashing, user CRUD
  env.ts             AUTH_SECRET resolution, site URL, currency
  params.ts          query-parameter + redirect sanitising
  rate-limit.ts      in-process rate limiter
  numbers.ts         numeric coercion for SQL parameters
  format.ts          LKR currency, dates, slugs
db/                  schema.sql, migrate.ts, seed.ts, catalog/*.json
scripts/             SVG artwork generator, HTTP smoke test, checkout integrity test
public/images/       generated product, category, brand and hero artwork
```

Swapping the datastore (e.g. Postgres) means rewriting `lib/db/index.ts` — every query in `lib/data/*` goes through it.

## Frameworks and technologies

| Area | Technology | Use in this project |
| --- | --- | --- |
| Web framework | Next.js 16 App Router | Pages, layouts, server rendering, metadata, route handlers, and server actions |
| UI | React 19 | Storefront, account, checkout, and admin components |
| Language | TypeScript 6 | Strictly typed application and database code |
| Styling | Tailwind CSS v4 | Responsive utility styling and the custom theme in `app/globals.css` |
| Database | Node.js 24 `node:sqlite` / SQLite | Embedded persistent database, WAL mode, SQL data access and backups |
| Authentication | `jose`, `bcryptjs` | Signed session tokens and password hashing |
| Validation and input safety | Zod, `sanitize-html` | Form/API validation and safe rich-text content |
| UI utilities | `lucide-react`, `clsx`, `tailwind-merge` | Icons, conditional classes, and class-name merging |
| Development and checks | npm, ESLint 9, TypeScript, `tsx` | Scripts, linting, type checks, database scripts, and tests |

The runtime data layer uses SQLite directly through `node:sqlite`; Prisma is not required to run the application. No external service is required for the demo. In particular, card payment is simulated and the forgot-password experience does not send email.

## Modify the project

Most day-to-day store changes can be made through the administrator dashboard without changing source code:

- **Products and stock:** use `/admin/products` and `/admin/inventory`. Product records support price, compare-at price, category, brand, condition, status, stock, specifications, tags, up to 20 images, and flash-deal status.
- **Categories, brands, coupons and reviews:** use their corresponding `/admin` pages to manage catalogue organization, promotions, and review visibility.
- **Orders and customers:** use `/admin/orders` and `/admin/customers` to update fulfilment/payment states, tracking information, roles, account status, and customer notifications.
- **Store appearance and policies:** use `/admin/settings` for branding, announcement, hero carousel, homepage layout, shipping configuration, and policy content.
- **Backups:** download or restore a SQLite backup from `/admin/settings`. Restore replaces the current database; download a backup first and confirm the uploaded file belongs to this application/schema.

For code and design changes:

1. Copy `.env.example` to `.env.local` and configure `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, or `NEXT_PUBLIC_CURRENCY` as needed.
2. Edit routes in `app/`, UI in `components/`, and shared data access in `lib/data/`. Keep database reads and writes behind the existing data/database helpers and validate mutations with Zod.
3. Change theme tokens and global styling in `app/globals.css`; Tailwind CSS v4 is configured through CSS and `postcss.config.mjs`.
4. Add or change starter/demo catalogue records in `db/catalog/*.json` and adjust seeding behavior in `db/seed.ts`. Seeder catalog files are not the live store database: changes made there affect the demo data only when a seed is run.
5. For a schema change, edit `db/schema.sql` and add a safe, repeatable migration in `db/migrate.ts` so existing database files are upgraded without dropping their records.
6. Run `npm run verify`; for checkout or order changes also run `npm run test:orders`. Use `npm run smoke` against a running server for route/API checks.

### Keep the current store data

The live local store data is held in `data/softdealz.db` (or the path selected by `DATABASE_FILE`). Normal development, build, and start commands apply schema migrations but do not reseed an existing database. To preserve current products, accounts, orders, and settings:

- Prefer the admin dashboard for live catalogue and store updates.
- Do **not** run `npm run db:seed:force` or `npm run db:reset` against a database whose data you want to keep; both are destructive demo-data operations.
- Back up the database before schema work, restore operations, or other risky changes. When copying the raw SQLite file while the app is running, include its `-wal` and `-shm` files; the admin backup download creates a consistent single-file backup.
- Test migrations and data imports against a separate copy of the database first. Never use demo seeding as a production data migration.

---

## Responsive design

Layouts are tuned for phones (360–430px), tablets (768px), laptops (1024–1536px) and large/4K displays (1920px+ and 2560px+ via the custom `3xl`/`4xl` breakpoints). Navigation collapses to a drawer, tables become stacked cards, and the grid scales from one to six columns.

---

## Environment

Copy `.env.example` to `.env.local` and adjust if needed:

```
AUTH_SECRET="…"                 # openssl rand -hex 32 — required in production
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_CURRENCY="LKR"
```

`NEXT_PUBLIC_SITE_URL` drives canonical URLs, Open Graph images, `robots.txt` and `sitemap.xml`. In development, an unset `AUTH_SECRET` is generated and stored at `data/.auth-secret` (0600). Production requires an explicit secret of at least 32 characters before both build and start so a generated development key can never be baked into a release. No third-party keys are required — payments are intentionally simulated.

### Data safety

`db/seed.ts` creates demo accounts with public example passwords and is **disabled in production**. Production builds migrate the schema but never seed demo users or overwrite order data. For local development, `npm run db:setup` creates the demo catalogue and accounts. In production, bootstrap the first administrator once instead:

```bash
npm run db:migrate
ADMIN_EMAIL="admin@example.com" ADMIN_NAME="Store Admin" ADMIN_PASSWORD="a-long-unique-password" npm run db:create-admin
npm run db:seed:force  # destructive demo-only reseed; disabled in production
npm run db:reset       # destructive local reset; demo seeding is disabled in production
```

Keep production credentials in your deployment secret manager, never in shell history or committed files. Back up `data/softdealz.db` (plus `-wal`/`-shm`) before any destructive local reset.

---

## Testing

```bash
npm run verify   # typecheck + eslint + production build
npm start &      # serve the build
npm run smoke    # ~45 HTTP checks: pages, APIs, auth, and regressions
```

`npm run smoke` signs in as the seeded demo accounts (it reads `AUTH_SECRET`, or the generated `data/.auth-secret`), walks every public page, exercises the cart/wishlist/newsletter/tracking APIs with valid **and** malformed input, and asserts the private areas stay private. Run it against a seeded database.

`npm run test:orders` needs no server: it builds a throw-away database with a real migrate + seed, then drives the money path directly — cart guards, coupon validation, order placement (stock, coupon usage, notifications, timeline), wishlist and fulfilment updates — and finishes with six simultaneous checkouts against three units of stock to prove the shop can never oversell.

---

## Deployment

The app is a standard Next.js server application — deploy it anywhere Node 24 LTS runs (VPS, Docker, Fly.io, Railway, Render, a VM behind Nginx). GitHub Pages/static export is **not** supported: server actions, route handlers, proxy and `node:sqlite` all need a Node process.

Inject `AUTH_SECRET` (a randomly generated value such as `openssl rand -hex 32`), `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` from your deployment secret manager before these commands:

```bash
npm ci
npm run db:migrate
npm run db:create-admin   # one-time initial administrator
npm run build
npm start                 # listens on 0.0.0.0:3000 and re-applies migrations
```

- Mount a persistent volume for `data/` before running migrations or starting the app. Configure a strong `AUTH_SECRET` (at least 32 characters) in production.
- Set `AUTH_SECRET` explicitly so sessions survive moving between hosts.
- Configure the trusted reverse proxy to overwrite `X-Real-IP`; rate limits use that trusted address first. Do not pass untrusted client-supplied forwarding headers through unchanged.
- Terminate TLS at your proxy; the app sends a nonce-based Content Security Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a strict `Permissions-Policy`.
- CI (`.github/workflows/ci.yml`) runs typecheck → lint → build → live smoke test → checkout integrity test on every push and pull request.

### Operational limits before live commerce

This implementation is single-host: SQLite needs a persistent local volume, and the in-memory rate limiter is not shared across replicas. Do not horizontally scale it without replacing those layers with a production datastore and shared limiter. Card payments are simulated; integrate and verify a real payment provider (including webhooks and idempotency) before accepting real funds.
