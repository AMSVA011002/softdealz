"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { saveSettingsAction, type AdminFormState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Tabs } from "@/components/ui/nav";
import { AdminPanel } from "@/components/admin/kit";
import { HeroSlidesEditor } from "@/components/admin/hero-slides-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { HeroSlide } from "@/lib/home/hero-slides";
import { resolveImageUrl } from "@/lib/image-url";

const INITIAL: AdminFormState = {};

export function StoreSettingsForm({
  settings,
  heroSlides,
}: {
  settings: Record<string, string>;
  heroSlides: HeroSlide[];
}) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, INITIAL);
  const [tab, setTab] = React.useState("store");

  const value = (key: string, fallback = "") => settings[key] ?? fallback;

  return (
    <form action={formAction}>
      <AdminPanel padded={false}>
        <div className="border-b border-ink-200 px-4 pt-4 sm:px-5">
          <Tabs
            tabs={[
              { id: "store", label: "Store" },
              { id: "shipping", label: "Shipping" },
              { id: "support", label: "Support" },
              { id: "branding", label: "Branding" },
              { id: "hero", label: "Hero carousel" },
              { id: "layout", label: "Storefront layout" },
              { id: "policies", label: "Policies" },
              { id: "system", label: "System" },
            ]}
            active={tab}
            onChange={setTab}
            scrollControls
          />
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {tab === "store" && (
            <>
              <Field label="Store name" htmlFor="store_name">
                <Input id="store_name" name="store_name" defaultValue={value("store_name", "SoftDealz")} />
              </Field>
              <Field label="Tagline" htmlFor="store_tagline" hint="Shown in the header announcement and footer">
                <Input
                  id="store_tagline"
                  name="store_tagline"
                  defaultValue={value("store_tagline", "Sri Lanka's smartest marketplace")}
                />
              </Field>
              <Field label="Announcement bar" htmlFor="announcement" hint="Leave blank to hide the top bar">
                <Textarea
                  id="announcement"
                  name="announcement"
                  rows={2}
                  defaultValue={value(
                    "announcement",
                    "Island-wide delivery in 2–4 days · Free shipping over LKR 25,000",
                  )}
                />
              </Field>
            </>
          )}

          {tab === "shipping" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Free shipping threshold (LKR)"
                  htmlFor="free_shipping_threshold"
                  hint="Carts above this ship free"
                >
                  <Input
                    id="free_shipping_threshold"
                    name="free_shipping_threshold"
                    type="number"
                    min="0"
                    step="500"
                    defaultValue={value("free_shipping_threshold", "25000")}
                  />
                </Field>
                <Field label="Standard shipping fee (LKR)" htmlFor="standard_shipping_fee">
                  <Input
                    id="standard_shipping_fee"
                    name="standard_shipping_fee"
                    type="number"
                    min="0"
                    step="50"
                    defaultValue={value("standard_shipping_fee", "450")}
                  />
                </Field>
              </div>
              <p className="rounded-xl border border-ink-200 bg-ink-50 p-3.5 text-[0.8rem] text-ink-600">
                These values drive the cart summary and checkout totals. Percentages and coupons are configured on the
                coupons screen.
              </p>
            </>
          )}

          {tab === "support" && (
            <>
              <Field label="Support email" htmlFor="support_email">
                <Input id="support_email" name="support_email" type="email" defaultValue={value("support_email", "support@softdealz.lk")} />
              </Field>
              <Field label="Support phone" htmlFor="support_phone">
                <Input id="support_phone" name="support_phone" defaultValue={value("support_phone", "+94 11 234 5678")} />
              </Field>
              <Field label="Warehouse address" htmlFor="address_line">
                <Textarea
                  id="address_line"
                  name="address_line"
                  rows={2}
                  defaultValue={value("address_line", "112 Galle Road, Colombo 03, Sri Lanka")}
                />
              </Field>
            </>
          )}

          {tab === "branding" && (
            <>
              <Field
                label="Logo image"
                htmlFor="logo_url"
                hint="Used throughout the app. Enter a /public path, HTTPS image URL, or Google Drive link shared with Anyone with the link."
                error={state.fieldErrors?.logo_url}
              >
                <Input
                  id="logo_url"
                  name="logo_url"
                  inputMode="url"
                  placeholder="/images/logo.svg"
                  defaultValue={value("logo_url")}
                />
              </Field>
              {value("logo_url") && (
                <div className="flex min-h-16 items-center rounded-xl border border-ink-200 bg-white px-4 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(value("logo_url"))}
                    alt="Current store logo"
                    className="max-h-12 max-w-48 object-contain"
                  />
                </div>
              )}
              <Field
                label="Browser/app icon"
                htmlFor="app_icon_url"
                hint="Optional favicon or app icon image. Enter a /public path, HTTPS image URL, or public Google Drive link."
                error={state.fieldErrors?.app_icon_url}
              >
                <Input
                  id="app_icon_url"
                  name="app_icon_url"
                  inputMode="url"
                  placeholder="/icon.svg"
                  defaultValue={value("app_icon_url")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary theme color" htmlFor="brand_primary" error={state.fieldErrors?.brand_primary}>
                  <Input
                    id="brand_primary"
                    name="brand_primary"
                    type="color"
                    defaultValue={value("brand_primary", "#0c800f")}
                    className="h-11 cursor-pointer p-1"
                  />
                </Field>
                <Field
                  label="Secondary theme color"
                  htmlFor="brand_secondary"
                  error={state.fieldErrors?.brand_secondary}
                >
                  <Input
                    id="brand_secondary"
                    name="brand_secondary"
                    type="color"
                    defaultValue={value("brand_secondary", "#0a57a0")}
                    className="h-11 cursor-pointer p-1"
                  />
                </Field>
              </div>
              <p className="rounded-xl border border-ink-200 bg-ink-50 p-3.5 text-[0.8rem] text-ink-600">
                The logo and colors are applied across storefront, account, and admin interfaces.
              </p>
            </>
          )}

          {tab === "policies" && (
            <>
              {[
                ["policy_terms", "Terms of service"],
                ["policy_privacy", "Privacy policy"],
                ["policy_shipping", "Shipping & delivery policy"],
                ["policy_returns", "Returns & refunds policy"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  htmlFor={key}
                  hint="Format policy content with headings, typography, colors, alignment, lists, links, images, and video embeds. Leave empty to use the built-in policy."
                  error={state.fieldErrors?.[key]}
                >
                  <RichTextEditor
                    id={key}
                    name={key}
                    initialValue={value(key)}
                    minHeight={260}
                    policy
                  />
                </Field>
              ))}
            </>
          )}

          {tab === "hero" && (
            <HeroSlidesEditor slides={heroSlides} error={state.fieldErrors?.hero_slides} />
          )}

          {tab === "layout" && (
            <>
              <Field
                label="Product cards on wide storefront rails"
                htmlFor="storefront_rail_max_cards"
                hint="Sets the maximum cards shown on wide screens. Phones, tablets, and standard desktops use smaller responsive counts."
                error={state.fieldErrors?.storefront_rail_max_cards}
              >
                <select
                  id="storefront_rail_max_cards"
                  name="storefront_rail_max_cards"
                  defaultValue={value("storefront_rail_max_cards", "5")}
                  className="h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
                >
                  <option value="3">3 cards</option>
                  <option value="4">4 cards</option>
                  <option value="5">5 cards</option>
                </select>
              </Field>
              <Field
                label="Product grid columns on wide screens"
                htmlFor="storefront_grid_columns"
                hint="Controls the number of columns in product grids such as Editor's picks, Most popular, and Just landed."
                error={state.fieldErrors?.storefront_grid_columns}
              >
                <select
                  id="storefront_grid_columns"
                  name="storefront_grid_columns"
                  defaultValue={value("storefront_grid_columns", "5")}
                  className="h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
                >
                  <option value="3">3 columns</option>
                  <option value="4">4 columns</option>
                  <option value="5">5 columns</option>
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Cards in rails on phones"
                  htmlFor="storefront_rail_mobile_cards"
                  error={state.fieldErrors?.storefront_rail_mobile_cards}
                >
                  <select
                    id="storefront_rail_mobile_cards"
                    name="storefront_rail_mobile_cards"
                    defaultValue={value("storefront_rail_mobile_cards", "2")}
                    className="h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
                  >
                    <option value="1">1 card</option>
                    <option value="2">2 cards</option>
                  </select>
                </Field>
                <Field
                  label="Cards in rails on tablets"
                  htmlFor="storefront_rail_tablet_cards"
                  error={state.fieldErrors?.storefront_rail_tablet_cards}
                >
                  <select
                    id="storefront_rail_tablet_cards"
                    name="storefront_rail_tablet_cards"
                    defaultValue={value("storefront_rail_tablet_cards", "3")}
                    className="h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
                  >
                    <option value="2">2 cards</option>
                    <option value="3">3 cards</option>
                  </select>
                </Field>
                <Field
                  label="Cards in rails on desktops"
                  htmlFor="storefront_rail_desktop_cards"
                  error={state.fieldErrors?.storefront_rail_desktop_cards}
                >
                  <select
                    id="storefront_rail_desktop_cards"
                    name="storefront_rail_desktop_cards"
                    defaultValue={value("storefront_rail_desktop_cards", "4")}
                    className="h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
                  >
                    <option value="3">3 cards</option>
                    <option value="4">4 cards</option>
                  </select>
                </Field>
              </div>
              <p className="rounded-xl border border-ink-200 bg-ink-50 p-3.5 text-[0.8rem] text-ink-600">
                These settings control responsive product rail density and the column count on product grids. Changes
                apply across the storefront, including Recently viewed and related products.
              </p>
            </>
          )}

          {tab === "system" && (
            <>
              <label className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5">
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  defaultChecked={value("maintenance_mode") === "true"}
                  className="mt-0.5 size-4.5 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-600"
                />
                <span>
                  <span className="block text-[0.85rem] font-semibold text-ink-900">Maintenance mode</span>
                  <span className="mt-0.5 block text-[0.78rem] text-ink-500">
                    Shows a friendly “back soon” notice on the storefront while you work on the catalogue.
                  </span>
                </span>
              </label>
              <p className="text-[0.78rem] text-ink-500">
                Settings are stored in the <span className="font-mono">settings</span> table and read on every request,
                so changes apply instantly.
              </p>
            </>
          )}

          {state.success && (
            <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[0.82rem] font-medium text-brand-800">
              <CheckCircle2 className="size-4" /> {state.success}
            </p>
          )}
          {state.error && (
            <p role="alert" className="text-[0.82rem] font-medium text-rose-brand">
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap gap-2.5 border-t border-ink-100 pt-4">
            <Button type="submit" loading={pending}>
              <Save className="size-4" /> Save settings
            </Button>
            <p className="self-center text-[0.78rem] text-ink-500">
              Fields on other tabs keep their current values when you save.
            </p>
          </div>
        </div>
      </AdminPanel>
    </form>
  );
}
