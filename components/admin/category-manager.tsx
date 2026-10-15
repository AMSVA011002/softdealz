"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ChevronDown, ChevronRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCategoryAction,
  saveCategoryAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/format";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  position: number;
  color: string | null;
  featured: boolean;
  isActive: boolean;
  productCount: number;
  depth: number;
}

const INITIAL: AdminFormState = {};

export function CategoryManager({ categories }: { categories: AdminCategoryRow[] }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveCategoryAction, INITIAL);
  const [editing, setEditing] = React.useState<AdminCategoryRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [confirming, setConfirming] = React.useState<AdminCategoryRow | null>(null);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const open = creating || editing !== null;

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

  const parents = categories.filter((category) => category.depth === 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-ink-500">
          {categories.filter((category) => category.depth === 0).length} departments ·{" "}
          {categories.filter((category) => category.depth > 0).length} subcategories
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New category
        </Button>
      </div>

      <div className="space-y-2.5">
        {parents.map((parent) => {
          const children = categories.filter((category) => category.parentId === parent.id);
          const isCollapsed = collapsed[parent.id];

          return (
            <div key={parent.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
              <div className="flex flex-wrap items-center gap-3 p-3.5">
                {children.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [parent.id]: !prev[parent.id] }))}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? `Expand ${parent.name}` : `Collapse ${parent.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-700"
                  >
                    {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                ) : (
                  <span className="grid size-7 shrink-0 place-items-center text-ink-300" aria-hidden>
                    <FolderTree className="size-3.5" />
                  </span>
                )}

                <span
                  className="size-9 shrink-0 rounded-xl"
                  style={{ backgroundColor: parent.color ?? "#0c800f" }}
                  aria-hidden
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.88rem] font-bold text-ink-900">{parent.name}</p>
                    {parent.featured && (
                      <Badge tone="brand" size="sm">
                        Featured
                      </Badge>
                    )}
                    {!parent.isActive && (
                      <Badge tone="neutral" size="sm">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[0.72rem] text-ink-400">/{parent.slug}</p>
                </div>

                <span className="shrink-0 text-[0.78rem] text-ink-500">
                  {formatNumber(parent.productCount)} products
                </span>

                <div className="flex shrink-0 gap-1.5">
                  <Link
                    href={`/category/${parent.slug}`}
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-[0.75rem] font-semibold text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditing(parent)}
                    aria-label={`Edit ${parent.name}`}
                    className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(parent)}
                    aria-label={`Delete ${parent.name}`}
                    className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-brand"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {!isCollapsed && children.length > 0 && (
                <ul className="divide-y divide-ink-100 border-t border-ink-100 bg-ink-50/60">
                  {children.map((child) => (
                    <li key={child.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 pl-8 sm:pl-12">
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.83rem] font-medium text-ink-800">{child.name}</p>
                        <p className="font-mono text-[0.7rem] text-ink-400">/{child.slug}</p>
                      </div>
                      <span className="shrink-0 text-[0.75rem] text-ink-500">
                        {formatNumber(child.productCount)}
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(child)}
                          aria-label={`Edit ${child.name}`}
                          className="grid size-7 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-700"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(child)}
                          aria-label={`Delete ${child.name}`}
                          className="grid size-7 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-brand"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit ${editing.name}` : "New category"}
        description="Categories drive storefront navigation, filters and the sitemap."
        size="lg"
      >
        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required error={state.fieldErrors?.name}>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
            </Field>
            <Field label="Slug" htmlFor="slug" required error={state.fieldErrors?.slug}>
              <Input id="slug" name="slug" defaultValue={editing?.slug ?? ""} required />
            </Field>
            <Field
              label="Parent category"
              htmlFor="parentId"
              hint="Leave empty for a top level department"
              error={state.fieldErrors?.parentId}
            >
              <Select id="parentId" name="parentId" defaultValue={editing?.parentId ?? ""}>
                <option value="">Top level (no parent)</option>
                {categories
                  .filter((category) => category.id !== editing?.id && category.depth === 0)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Icon name" htmlFor="icon" hint="Lucide icon, e.g. Headphones">
              <Input id="icon" name="icon" defaultValue={editing?.icon ?? ""} placeholder="Headphones" />
            </Field>
            <Field
              label="Category image"
              htmlFor="image"
              hint="Use a /public path, HTTPS image URL, or public Google Drive share link."
              error={state.fieldErrors?.image}
            >
              <Input
                id="image"
                name="image"
                defaultValue={editing?.image ?? ""}
                placeholder="/images/categories/electronics.svg"
              />
            </Field>
            <Field label="Accent colour" htmlFor="color">
              <div className="flex gap-2">
                <input
                  type="color"
                  name="color"
                  id="color"
                  defaultValue={editing?.color ?? "#0c800f"}
                  className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-ink-300 bg-white p-1"
                />
                <Input type="text" defaultValue={editing?.color ?? "#0c800f"} readOnly aria-hidden tabIndex={-1} />
              </div>
            </Field>
            <Field label="Position" htmlFor="position" hint="Lower numbers appear first">
              <Input id="position" name="position" type="number" min="0" defaultValue={editing?.position ?? 0} />
            </Field>
            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={editing?.description ?? ""}
                placeholder="Short blurb shown on the category page."
              />
            </Field>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Checkbox
              name="featured"
              defaultChecked={editing?.featured ?? false}
              label="Featured category"
              description="Show in the homepage category tiles"
            />
            <Checkbox
              name="isActive"
              defaultChecked={editing?.isActive ?? true}
              label="Active"
              description="Visible to shoppers"
            />
          </div>

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
              {editing ? "Save category" : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`Delete ${confirming?.name ?? "category"}?`}
        description={
          (confirming?.productCount ?? 0) > 0
            ? "This category still contains products, so it cannot be deleted. Move them first."
            : "This removes the category from navigation. This cannot be undone."
        }
        confirmLabel="Delete category"
        onConfirm={() => {
          if (!confirming) return;
          const formData = new FormData();
          formData.set("id", confirming.id);
          void deleteCategoryAction(formData);
          setConfirming(null);
        }}
      />
    </div>
  );
}
