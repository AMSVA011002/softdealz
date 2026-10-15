/**
 * SoftDealz data layer.
 *
 * Uses Node's built-in SQLite driver (`node:sqlite`) — no native modules to
 * compile, no external service, and no binary downloads, which keeps
 * `npm install && npm run dev` reproducible anywhere.
 *
 * Everything the app does with the database funnels through the small typed
 * helpers below, so swapping in Postgres/MySQL later only means rewriting this
 * file (the SQL in `lib/data/*` is kept close to ANSI).
 */
import { backup, DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.DATABASE_FILE ??
  path.join(process.cwd(), "data", "softdealz.db");

type Row = Record<string, unknown>;
export type Params = unknown[];

function coerce(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      // SQLite silently mangles NaN/Infinity, and `node:sqlite` reports the
      // resulting failure as an opaque "datatype mismatch". Fail loudly here so
      // the offending query is obvious in the logs.
      throw new Error(`Refusing to bind a non-finite number (${String(value)}) to a SQL parameter`);
    }
    return value;
  }
  if (typeof value === "string" || value instanceof Uint8Array) return value;
  if (typeof value === "bigint") return Number(value);
  throw new Error(`Unsupported SQL parameter type: ${typeof value}`);
}

function normalise(params: Params): unknown[] {
  return params.map(coerce);
}

/** One-off sanity check so a missing migration is obvious in the logs. */
function reportSchemaState(database: DatabaseSync, wasCreated: boolean) {
  try {
    const row = database
      .prepare("SELECT COUNT(*) AS tables FROM sqlite_master WHERE type = 'table' AND name = 'products'")
      .get() as { tables?: number } | undefined;

    if (Number(row?.tables ?? 0) === 0) {
      console.warn(
        `[softdealz] ${path.relative(process.cwd(), DB_PATH)} has no schema. ` +
          "Run `npm run db:migrate` (safe on an existing database) or `npm run db:setup`.",
      );
    } else if (wasCreated) {
      console.warn("[softdealz] created a new database file — seed it with `npm run db:seed` for demo data.");
    }
  } catch {
    /* schema introspection is best-effort */
  }
}

function createConnection(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const existed = fs.existsSync(/*turbopackIgnore: true*/ DB_PATH);
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA busy_timeout = 5000;");
  if (!existed) reportSchemaState(database, true);
  return database;
}

// Cache across hot reloads in dev so we never open hundreds of handles.
const globalForDb = globalThis as unknown as { __softdealzDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__softdealzDb) {
    globalForDb.__softdealzDb = createConnection();
  }
  return globalForDb.__softdealzDb;
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  const directory = fs.mkdtempSync(path.join(path.dirname(DB_PATH), ".softdealz-restore-"));
  const candidatePath = path.join(directory, "restored.db");
  const previousPath = path.join(directory, "previous.db");
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  let currentDatabaseClosed = false;
  let movedCurrentDatabase = false;

  try {
    await backup(source, candidatePath);

    const activeDatabase = getDb();
    activeDatabase.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    activeDatabase.close();
    delete globalForDb.__softdealzDb;
    currentDatabaseClosed = true;

    fs.renameSync(DB_PATH, previousPath);
    movedCurrentDatabase = true;
    fs.renameSync(candidatePath, DB_PATH);
    globalForDb.__softdealzDb = createConnection();
  } catch (error) {
    if (currentDatabaseClosed) {
      try {
        if (movedCurrentDatabase) {
          fs.rmSync(DB_PATH, { force: true });
          fs.renameSync(previousPath, DB_PATH);
        }
        globalForDb.__softdealzDb = createConnection();
      } catch (recoveryError) {
        console.error("[softdealz] Could not recover the database after a failed restore:", recoveryError);
        throw new Error("Database restore failed and automatic recovery was unsuccessful.", {
          cause: error,
        });
      }
    }
    throw error;
  } finally {
    source.close();
    try {
      fs.rmSync(directory, { recursive: true, force: true });
    } catch (error) {
      console.error("[softdealz] Could not remove temporary restore files:", error);
    }
  }
}

/** Run a statement, return all rows. */
export function all<T = Row>(sql: string, params: Params = []): T[] {
  const stmt = getDb().prepare(sql);
  return stmt.all(...(normalise(params) as never[])) as T[];
}

/** Run a statement, return the first row (or null). */
export function get<T = Row>(sql: string, params: Params = []): T | null {
  const stmt = getDb().prepare(sql);
  const row = stmt.get(...(normalise(params) as never[]));
  return (row as T) ?? null;
}

/** Run a statement, return metadata. */
export function run(sql: string, params: Params = []) {
  const stmt = getDb().prepare(sql);
  const result = stmt.run(...(normalise(params) as never[]));
  return {
    changes: Number(result.changes ?? 0),
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
  };
}

/** Execute a single scalar count/value. */
export function scalar<T = number>(sql: string, params: Params = []): T | null {
  const row = get<Record<string, T>>(sql, params);
  if (!row) return null;
  const keys = Object.keys(row);
  return keys.length ? (row[keys[0]] as T) : null;
}

let transactionDepth = 0;

/**
 * Wrap a set of writes in a transaction, rolling back automatically on error.
 * Nested calls use SAVEPOINTs (SQLite rejects a bare `BEGIN` inside another
 * transaction, which used to turn a composed write into a hard failure).
 */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  const isNested = transactionDepth > 0;
  const savepoint = `sp_${transactionDepth}_${Date.now().toString(36)}`;

  // Top-level transactions take the write lock up front (`BEGIN IMMEDIATE`).
  // A deferred transaction that reads first and only then writes can fail
  // instantly with SQLITE_BUSY rather than waiting out `busy_timeout`, which
  // surfaces to a shopper as "database is locked" during concurrent checkouts.
  // Nested calls get a SAVEPOINT, since SQLite rejects a bare BEGIN inside a
  // transaction.
  db.exec(isNested ? `SAVEPOINT ${savepoint}` : "BEGIN IMMEDIATE");
  transactionDepth += 1;

  try {
    const result = fn();
    transactionDepth -= 1;
    db.exec(isNested ? `RELEASE ${savepoint}` : "COMMIT");
    return result;
  } catch (error) {
    transactionDepth = Math.max(0, transactionDepth - 1);
    try {
      db.exec(isNested ? `ROLLBACK TO ${savepoint}` : "ROLLBACK");
      if (isNested) db.exec(`RELEASE ${savepoint}`);
    } catch {
      /* transaction already unwound by SQLite */
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Short, sortable, collision-resistant id with a readable prefix. */
/** Convenience row counter used by the admin settings screen. */
export function countRows(table: string, where?: string): number {
  const clause = where ? ` WHERE ${where}` : "";
  return scalar<number>(`SELECT COUNT(*) AS total FROM ${table}${clause}`) ?? 0;
}

export function newId(prefix = "id"): string {
  const time = Date.now().toString(36);
  return `${prefix}_${time}${randomBytes(12).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

/** Parse a JSON text column defensively. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toBool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}
