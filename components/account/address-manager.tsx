"use client";

import * as React from "react";
import { useActionState } from "react";
import { Home, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  deleteAddressAction,
  saveAddressAction,
  type FormState,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import type { Address } from "@/lib/types";

const INITIAL: FormState = {};

export function AddressManager({
  addresses,
  user,
}: {
  addresses: Address[];
  user: { name: string; phone: string };
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveAddressAction, INITIAL);
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [confirming, setConfirming] = React.useState<Address | null>(null);

  const open = creating || editing !== null;

  // Close the dialog and toast once the action reports success.
  const lastMessage = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (state.success && state.success !== lastMessage.current) {
      lastMessage.current = state.success;
      toast.success(state.success);
      setCreating(false);
      setEditing(null);
    }
  }, [state.success, toast]);

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-6" />}
          title="No saved addresses yet"
          description="Add your first delivery address so checkout only takes a few seconds."
          action={<Button onClick={() => setCreating(true)}>Add an address</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="card-surface flex flex-col p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      {address.label.toLowerCase() === "home" ? (
                        <Home className="size-4" />
                      ) : (
                        <MapPin className="size-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-[0.85rem] font-bold text-ink-900">{address.label}</p>
                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-700">
                          <Star className="size-3 fill-current" /> Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[0.83rem] font-semibold text-ink-800">{address.fullName}</p>
                <p className="mt-0.5 text-[0.8rem] leading-relaxed text-ink-500">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                </p>
                <p className="mt-1.5 text-[0.8rem] text-ink-500">{address.phone}</p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                  <Button size="sm" variant="outline" onClick={() => setEditing(address)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-brand hover:bg-rose-50"
                    onClick={() => setConfirming(address)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex min-h-[13rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 bg-white/60 p-5 text-ink-500 transition-colors hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-ink-100">
                <Plus className="size-5" />
              </span>
              <span className="text-[0.85rem] font-semibold">Add another address</span>
            </button>
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={close}
        title={editing ? "Edit address" : "Add a delivery address"}
        description="We only use this to deliver your orders."
      >
        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="addressId" value={editing.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" htmlFor="label" hint="e.g. Home, Office">
              <Input id="label" name="label" defaultValue={editing?.label ?? "Home"} />
            </Field>
            <Field label="Full name" required htmlFor="fullName" error={state.fieldErrors?.fullName}>
              <Input id="fullName" name="fullName" defaultValue={editing?.fullName ?? user.name} required />
            </Field>
            <Field label="Phone" required htmlFor="phone" error={state.fieldErrors?.phone}>
              <Input id="phone" name="phone" defaultValue={editing?.phone ?? user.phone} required />
            </Field>
            <Field label="Postal code" required htmlFor="postalCode" error={state.fieldErrors?.postalCode}>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={editing?.postalCode ?? ""}
                inputMode="numeric"
                required
              />
            </Field>
            <Field
              label="Address line 1"
              required
              htmlFor="line1"
              className="sm:col-span-2"
              error={state.fieldErrors?.line1}
            >
              <Input id="line1" name="line1" defaultValue={editing?.line1 ?? ""} required />
            </Field>
            <Field label="Address line 2" htmlFor="line2" className="sm:col-span-2">
              <Input id="line2" name="line2" defaultValue={editing?.line2 ?? ""} />
            </Field>
            <Field label="City" required htmlFor="city" error={state.fieldErrors?.city}>
              <Input id="city" name="city" defaultValue={editing?.city ?? ""} required />
            </Field>
            <Field label="Province" required htmlFor="state" error={state.fieldErrors?.state}>
              <Input id="state" name="state" defaultValue={editing?.state ?? ""} required />
            </Field>
            <Field label="Country" htmlFor="country" className="sm:col-span-2">
              <Input id="country" name="country" defaultValue={editing?.country ?? "Sri Lanka"} />
            </Field>
          </div>

          <Checkbox name="isDefault" defaultChecked={editing?.isDefault} label="Use as my default delivery address" />

          {state.error && (
            <p role="alert" className="text-[0.8rem] font-medium text-rose-brand">
              {state.error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={close} fullWidth className="sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={pending} fullWidth className="sm:w-auto">
              {editing ? "Save changes" : "Save address"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Delete this address?"
        description={`${confirming?.label ?? "This address"} will be removed from your account.`}
        confirmLabel="Delete address"
        onConfirm={() => {
          if (!confirming) return;
          const formData = new FormData();
          formData.set("addressId", confirming.id);
          void deleteAddressAction(formData);
          toast.info("Address deleted");
          setConfirming(null);
        }}
      />
    </div>
  );
}
