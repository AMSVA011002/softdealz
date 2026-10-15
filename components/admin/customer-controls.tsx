"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { updateUserRoleAction, toggleUserStatusAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/** Role picker that submits itself when the value changes. */
export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const [pending, setPending] = React.useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setPending(true);
        try {
          await updateUserRoleAction(formData);
        } finally {
          setPending(false);
        }
      }}
      className="inline-flex items-center gap-1.5"
    >
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={pending}
        aria-label="Account role"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={cn(
          "rounded-lg border py-1.5 pl-2.5 pr-6 text-[0.75rem] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:opacity-60",
          role === "ADMIN"
            ? "border-brand-300 bg-brand-50 text-brand-800"
            : role === "VENDOR"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-ink-300 bg-white text-ink-700",
        )}
      >
        <option value="CUSTOMER">Customer</option>
        <option value="VENDOR">Vendor</option>
        <option value="ADMIN">Admin</option>
      </select>
      {pending && <Loader2 className="size-3.5 animate-spin text-brand-600" aria-label="Saving" />}
    </form>
  );
}

/** Suspend / reactivate toggle. */
export function UserStatusForm({ userId, status }: { userId: string; status: string }) {
  const [pending, setPending] = React.useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setPending(true);
        try {
          await toggleUserStatusAction(formData);
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-2 py-1 text-[0.72rem] font-semibold text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : status === "ACTIVE" ? "Suspend" : "Reactivate"}
      </button>
    </form>
  );
}
