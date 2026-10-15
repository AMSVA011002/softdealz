# SoftDealz catalog source

These JSON files are the **single source of truth** for the demo catalog. Two consumers read them:

| Consumer | Command | What it does |
| --- | --- | --- |
| `db/seed.ts` | `npm run db:seed` | Fills SQLite with categories, brands, products, users, orders, reviews, coupons |
| `scripts/generate-assets.mjs` | `npm run assets` | Renders the matching SVG product/category artwork |

Edit the JSON, re-run both commands, and the whole storefront updates.

## Fields

### Category

| Key | Required | Notes |
| --- | --- | --- |
| `name` | ✅ | Display name, e.g. `Electronics` |
| `slug` | ✅ | URL segment, e.g. `electronics` |
| `icon` | ✅ | Pictogram key (see `ICONS` in `scripts/generate-assets.mjs`) |
| `featured` | — | Shows the category in the homepage grid |
| `tagline` | — | Short line under the name |
| `children[]` | ✅ | Subcategories, same shape plus `products[]` |

### Product (compact keys keep these files readable)

| Key | Meaning | Example |
| --- | --- | --- |
| `t` | title | `"Voltix 55\" 4K QLED Smart TV"` |
| `p` | price (LKR) | `289000` |
| `w` | "was" price — drives discount badges (`null` = no discount) | `349000` |
| `b` | brand slug (must exist in `00-brands.json`) | `"voltix"` |
| `i` | pictogram key for the artwork | `"tv"` |
| `s` | stock on hand | `18` |
| `r` | seed rating (0–5) | `4.7` |
| `f` | `1` = featured on the homepage, `0` = normal | `1` |

Adding a pictogram: add a stroke path set to `ICONS` in `scripts/generate-assets.mjs`, then reference its key from a product or category `icon`.
