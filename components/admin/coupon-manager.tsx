"use client";

import * as React from "react";
import { useActionState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCouponAction, saveCouponAction, type AdminFormState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import type { Coupon } from "@/lib/types";

const INITIAL: AdminFormState = {};

export interface CouponRow extends Coupon {
  uses: number;
  discountGiven: number;
  expired: boolean;
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveCouponAction, INITIAL);
  const [editing, setEditing] = React.useState<CouponRow | null>(null);
  const [confirming, setConfirming] = React.useState<CouponRow | null>(null);
  const [type, setType] = React.useState<Coupon["type"]>("PERCENT");

  const lastMessage = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (state.success && state.success !== lastMessage.current) {
      lastMessage.current = state.success;
      toast.success(state.success);
      setEditing(null);
      setType("PERCENT");
    }
  }, [state.success, toast]);

  const startEdit = (coupon: CouponRow) => {
    setEditing(coupon);
    setType(coupon.type);
  };

  const reset = () => {
    setEditing(null);
    setType("PERCENT");
  };

  return (
    <div className="space-y-5">
      {editing && (
        <p className="rounded-xl border border-ocean-200 bg-ocean-50 px-3 py-2 text-[0.78rem] text-ocean-800">
          Editing <strong className="font-mono font-semibold">{editing.code}</strong>
        </p>
      )}

      {/* key + defaultValue remount the form when switching between coupons */}
      <form action={formAction} key={editing?.id ?? "new"} className="space-y-4">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" required error={state.fieldErrors?.code}>
            <Input
              id="code"
              name="code"
              defaultValue={editing?.code ?? ""}
              placeholder="WELCOME10"
              required
              className="font-mono uppercase"
            />
          </Field>
          <Field label="Type" htmlFor="type">
            <Select
              id="type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as Coupon["type"])}
            >
              <option value="PERCENT">Percentage off</option>
              <option value="FIXED">Fixed amount off</option>
              <option value="FREE_SHIPPING">Free shipping</option>
            </Select>
          </Field>
        </div>

        <Field label="Description" htmlFor="description" required error={state.fieldErrors?.description}>
          <Textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={editing?.description ?? ""}
            placeholder="10% off your first order"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={type === "PERCENT" ? "Percent off" : type === "FIXED" ? "Amount off (LKR)" : "Value"}
            htmlFor="value"
            error={state.fieldErrors?.value}
          >
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="1"
              defaultValue={editing?.value ?? 0}
              disabled={type === "FREE_SHIPPING"}
            />
          </Field>
          <Field label="Min spend (LKR)" htmlFor="minSpend">
            <Input id="minSpend" name="minSpend" type="number" min="0" step="100" defaultValue={editing?.minSpend ?? 0} />
          </Field>
          <Field label="Max uses" htmlFor="maxUses" hint="0 means unlimited">
            <Input id="maxUses" name="maxUses" type="number" min="0" step="1" defaultValue={editing?.maxUses ?? 0} />
          </Field>
        </div>

        <Field label="Expires on" htmlFor="expiresAt" hint="Leave blank for no expiry">
          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={editing?.expiresAt ? editing.expiresAt.slice(0, 10) : ""}
          />
        </Field>

        <Checkbox
          name="isActive"
          defaultChecked={editing ? editing.isActive : true}
          label="Active"
          description="Shoppers can apply this code at checkout"
        />

        {state.error && (
          <p role="alert" className="text-[0.8rem] font-medium text-rose-brand">
            {state.error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          {editing && (
            <Button type="button" variant="outline" onClick={reset} fullWidth className="sm:w-auto">
              Cancel
            </Button>
          )}
          <Button type="submit" loading={pending} fullWidth className="sm:w-auto">
            {editing ? (
              <>
                <Pencil className="size-3.5" /> Save coupon
              </>
            ) : (
              <>
                <Plus className="size-3.5" /> Create coupon
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="border-t border-ink-100 pt-4">
        <h3 className="text-[0.8rem] font-bold uppercase tracking-wide text-ink-500">Quick manage</h3>
        <ul className="mt-2.5 space-y-2">
          {coupons.length === 0 && <li className="text-[0.82rem] text-ink-500">Nothing to manage yet.</li>}
          {coupons.map((coupon) => (
            <li
              key={coupon.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-white p-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[0.82rem] font-bold text-ink-900">{coupon.code}</span>
                <span className="block text-[0.72rem] text-ink-500">
                  {coupon.uses} use{coupon.uses === 1 ? "" : "s"}
                  {coupon.expired ? " · expired" : coupon.isActive ? " · active" : " · paused"}
                </span>
              </span>
              <Button size="sm" variant="outline" onClick={() => startEdit(coupon)}>
                <Pencil className="size-3" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-brand hover:bg-rose-50"
                onClick={() => setConfirming(coupon)}
              >
                <Trash2 className="size-3" /> Delete
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`Delete ${confirming?.code ?? "coupon"}?`}
        description={
          (confirming?.uses ?? 0) > 0
            ? `${confirming?.uses} orders already used this code. Their discount history is kept.`
            : "This code will stop working immediately."
        }
        confirmLabel="Delete coupon"
        onConfirm={() => {
          if (!confirming) return;
          const formData = new FormData();
          formData.set("id", confirming.id);
          void deleteCouponAction(formData);
          toast.info("Coupon deleted");
          setConfirming(null);
        }}
      />
    </div>
  );
}
