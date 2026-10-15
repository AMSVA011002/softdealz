"use client";

import * as React from "react";
import { AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function DatabaseRestoreForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [confirmation, setConfirmation] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  async function restore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || confirmation !== "RESTORE" || pending) return;

    setPending(true);
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.set("backup", file);
    formData.set("confirmation", confirmation);

    try {
      const response = await fetch("/api/admin/database/restore", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not restore the database.");
        return;
      }

      setSuccess(result.message ?? "Database restored. Refreshing the admin page…");
      window.location.reload();
    } catch (caught) {
      console.error("[softdealz] Database restore request failed:", caught);
      setError("The restore request failed. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={restore} className="mt-4 space-y-3 border-t border-ink-100 pt-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[0.8rem] text-amber-950">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4 shrink-0" /> Restoring replaces all current store data.
        </p>
        <p className="mt-1">
          Download a backup of the current database first. Only restore a trusted SoftDealz SQLite backup.
        </p>
      </div>
      <label className="block text-[0.8rem] font-semibold text-ink-700" htmlFor="database-backup">
        SQLite backup file
      </label>
      <Input
        id="database-backup"
        type="file"
        accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3"
        onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
        className="h-auto py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-[0.78rem] file:font-semibold"
      />
      <label className="block text-[0.8rem] font-semibold text-ink-700" htmlFor="restore-confirmation">
        Type RESTORE to confirm
      </label>
      <Input
        id="restore-confirmation"
        value={confirmation}
        onChange={(event) => setConfirmation(event.currentTarget.value)}
        autoComplete="off"
        placeholder="RESTORE"
      />
      {error && <p role="alert" className="text-[0.8rem] font-medium text-rose-brand">{error}</p>}
      {success && <p role="status" className="text-[0.8rem] font-medium text-brand-700">{success}</p>}
      <Button type="submit" variant="danger" loading={pending} disabled={!file || confirmation !== "RESTORE"}>
        <Upload className="size-4" /> Restore database
      </Button>
      <p className="text-[0.75rem] text-ink-500">Maximum file size: 256 MB.</p>
    </form>
  );
}
