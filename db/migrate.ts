/**
 * Applies db/schema.sql to the configured SQLite file.
 * Run with: npm run db:migrate
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const schemaPath = path.join(root, "db", "schema.sql");
const dbPath =
  process.env.DATABASE_FILE ?? path.join(root, "data", "softdealz.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const schema = fs.readFileSync(schemaPath, "utf8");
const db = new DatabaseSync(dbPath);
db.exec(schema);

const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
if (!productColumns.some((column) => column.name === "is_flash_deal")) {
  db.exec("ALTER TABLE products ADD COLUMN is_flash_deal INTEGER NOT NULL DEFAULT 0");
  db.exec(
    `UPDATE products
        SET is_flash_deal = 1
      WHERE status = 'ACTIVE'
        AND compare_at_price IS NOT NULL
        AND compare_at_price > price`,
  );
}
db.exec("CREATE INDEX IF NOT EXISTS idx_products_flash_deal ON products(is_flash_deal, status)");

const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all()
  .map((row) => (row as { name: string }).name);

console.log(`✔ schema applied to ${path.relative(root, dbPath)}`);
console.log(`  ${tables.length} tables: ${tables.join(", ")}`);
db.close();
