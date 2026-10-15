import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";
import { getDb, restoreDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BACKUP_BYTES = 256 * 1024 * 1024;
const SQLITE_HEADER = "SQLite format 3\0";
const REQUIRED_TABLES = [
  "users",
  "addresses",
  "categories",
  "brands",
  "products",
  "cart_items",
  "wishlist_items",
  "orders",
  "order_items",
  "order_events",
  "reviews",
  "coupons",
  "notifications",
  "settings",
  "newsletter_subscribers",
  "search_log",
];

function invalidBackup(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  await requireAdmin();

  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return invalidBackup("Upload a SQLite backup file.");
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BACKUP_BYTES + 1024 * 1024) {
    return invalidBackup("Backup files must be 256 MB or smaller.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("[softdealz] Could not read database restore upload:", error);
    return invalidBackup("The uploaded form could not be read.");
  }

  const uploadedFile = formData.get("backup");
  if (!(uploadedFile instanceof File)) return invalidBackup("Choose a SQLite backup file.");
  if (uploadedFile.size === 0) return invalidBackup("The selected backup file is empty.");
  if (uploadedFile.size > MAX_BACKUP_BYTES) {
    return invalidBackup("Backup files must be 256 MB or smaller.", 413);
  }
  if (formData.get("confirmation") !== "RESTORE") {
    return invalidBackup("Type RESTORE to confirm replacing the current database.");
  }

  const directory = await mkdtemp(path.join(tmpdir(), "softdealz-upload-"));
  const uploadPath = path.join(directory, "upload.sqlite");

  try {
    const bytes = Buffer.from(await uploadedFile.arrayBuffer());
    if (bytes.subarray(0, SQLITE_HEADER.length).toString("ascii") !== SQLITE_HEADER) {
      return invalidBackup("This file is not a valid SQLite database.");
    }

    await writeFile(uploadPath, bytes, { flag: "wx" });
    const database = new DatabaseSync(uploadPath, { readOnly: true });
    try {
      const integrity = database.prepare("PRAGMA integrity_check").all() as { integrity_check: string }[];
      if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
        return invalidBackup("The SQLite backup failed its integrity check.");
      }

      const tables = new Set(
        (database
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
          .all() as { name: string }[]).map((table) => table.name),
      );
      if (REQUIRED_TABLES.some((table) => !tables.has(table))) {
        return invalidBackup("This backup does not contain the required SoftDealz database tables.");
      }

      const currentTables = new Set(
        (getDb()
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
          .all() as { name: string }[]).map((table) => table.name),
      );
      if (tables.size !== currentTables.size || [...currentTables].some((table) => !tables.has(table))) {
        return invalidBackup("This backup uses a different database schema than the current application.");
      }

      for (const table of tables) {
        const quotedName = `"${table.replace(/"/g, '""')}"`;
        const backupColumns = (database.prepare(`PRAGMA table_info(${quotedName})`).all() as { name: string }[])
          .map((column) => column.name)
          .sort();
        const currentColumns = (
          getDb().prepare(`PRAGMA table_info(${quotedName})`).all() as { name: string }[]
        )
          .map((column) => column.name)
          .sort();
        if (backupColumns.length !== currentColumns.length ||
          backupColumns.some((column, index) => column !== currentColumns[index])) {
          return invalidBackup("This backup uses a different database schema than the current application.");
        }
      }

      const foreignKeyViolations = database.prepare("PRAGMA foreign_key_check").all();
      if (foreignKeyViolations.length > 0) {
        return invalidBackup("The backup contains inconsistent database references.");
      }
    } finally {
      database.close();
    }

    await restoreDatabase(uploadPath);
    return Response.json(
      { success: true, message: "Database restored successfully." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[softdealz] Could not restore database:", error);
    return Response.json(
      { error: "Could not restore the database. Check the server logs before retrying." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    await rm(directory, { recursive: true, force: true }).catch((error: unknown) => {
      console.error("[softdealz] Could not remove uploaded database backup:", error);
    });
  }
}
