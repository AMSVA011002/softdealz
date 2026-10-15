import fs from "node:fs";
import path from "node:path";

if (process.env.NODE_ENV === "production") {
  throw new Error("Database reset is disabled in production.");
}

const configuredPath =
  process.env.DATABASE_FILE ?? path.join(process.cwd(), "data", "softdealz.db");
const databasePath = path.resolve(configuredPath);

for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(`${databasePath}${suffix}`, { force: true });
}

console.log(`Removed database and SQLite sidecars at ${databasePath}.`);
