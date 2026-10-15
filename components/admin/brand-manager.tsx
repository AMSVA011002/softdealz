"use client";

import * as React from "react";
import { useActionState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBrandAction, saveBrandAction, type AdminFormState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  productCount: number;
}

const INITIAL: AdminFormState = {};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function BrandManager({ brands }: { brands: BrandOption[] }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveBrandAction, INITIAL);
  const [editing, setEditing] = React.useState<BrandOption | null>(null);
  const [confirming, setConfirming] = React.useState<BrandOption | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);

  const lastMessage = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (state.success && state.success !== lastMessage.current) {
      lastMessage.current = state.success;
      toast.success(state.success);
      setEditing(null);
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
  }, [state.success, toast]);

  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const startEdit = (brand: BrandOption) => {
    setEditing(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setSlugTouched(true);
  };

  return (
    <div className="space-y-5">
      {editing && (
        <p className="rounded-xl border border-ocean-200 bg-ocean-50 px-3 py-2 text-[0.78rem] text-ocean-800">
          Editing <strong className="font-semibold">{editing.name}</strong>
        </p>
      )}

      <form action={formAction} className="space-y-4">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <Field label="Brand name" htmlFor="brand-name" required error={state.fieldErrors?.name}>
          <Input
            id="brand-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Voltix"
            required
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="brand-slug"
          required
          hint="Used in storefront filters and the logo path"
          error={state.fieldErrors?.slug}
        >
          <Input
            id="brand-slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="voltix"
            required
          />
        </Field>

        <Field
          label="Logo path or public Google Drive link"
          htmlFor="brand-logo"
          hint="Use a /public path, HTTPS image URL, or a Google Drive share link set to Anyone with the link. Leave blank to use /images/brands/{slug}.svg."
          error={state.fieldErrors?.logo}
        >
          <Input
            id="brand-logo"
            name="logo"
            key={editing?.id ?? "new"}
            defaultValue={editing?.logo ?? ""}
            placeholder="/images/brands/voltix.svg"
          />
        </Field>

        {state.error && (
          <p role="alert" className="text-[0.8rem] font-medium text-rose-brand">
            {state.error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          {editing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setName("");
                setSlug("");
                setSlugTouched(false);
              }}
              fullWidth
              className="sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" loading={pending} fullWidth className="sm:w-auto">
            {editing ? (
              <>
                <Pencil className="size-3.5" /> Save brand
              </>
            ) : (
              <>
                <Plus className="size-3.5" /> Add brand
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="border-t border-ink-100 pt-4">
        <h3 className="text-[0.8rem] font-bold uppercase tracking-wide text-ink-500">Quick edit</h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {brands.slice(0, 12).map((brand) => (
            <span
              key={brand.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1 pl-3 pr-1.5 text-[0.78rem]"
            >
              <button
                type="button"
                onClick={() => startEdit(brand)}
                className="font-medium text-ink-700 transition-colors hover:text-brand-700"
              >
                {brand.name}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(brand)}
                aria-label={`Delete ${brand.name}`}
                className="grid size-5 place-items-center rounded-full text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-brand"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`Delete ${confirming?.name ?? "brand"}?`}
        description={
          (confirming?.productCount ?? 0) > 0
            ? `${confirming?.productCount} products use this brand, so it cannot be deleted yet.`
            : "This removes the brand from the storefront filters."
        }
        confirmLabel="Delete brand"
        onConfirm={() => {
          if (!confirming) return;
          const formData = new FormData();
          formData.set("id", confirming.id);
          void deleteBrandAction(formData);
          setConfirming(null);
        }}
      />
    </div>
  );
}
