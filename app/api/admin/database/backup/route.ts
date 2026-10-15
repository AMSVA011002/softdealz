import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { backup } from "node:sqlite";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();

  const directory = await mkdtemp(path.join(tmpdir(), "softdealz-backup-"));
  const backupPath = path.join(directory, "softdealz.sqlite");

  try {
    await backup(getDb(), backupPath);
    const fileStats = await stat(backupPath);
    const download = createReadStream(backupPath);
    download.once("close", () => {
      void rm(directory, { recursive: true, force: true }).catch((error: unknown) => {
        console.error("[softdealz] Could not remove temporary database backup:", error);
      });
    });
    download.once("error", (error: Error) => {
      console.error("[softdealz] Could not stream database backup:", error);
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(Readable.toWeb(download) as ReadableStream, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="softdealz-backup-${timestamp}.sqlite"`,
        "Content-Length": String(fileStats.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[softdealz] Could not create database backup:", error);
    await rm(directory, { recursive: true, force: true }).catch((cleanupError: unknown) => {
      console.error("[softdealz] Could not remove temporary database backup:", cleanupError);
    });
    return new Response("Could not create database backup.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
