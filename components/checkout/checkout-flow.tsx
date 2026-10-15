"use client";

import * as React from "react";
import Image from "next/image";
import { useActionState } from "react";
import {
  AlertCircle,
  BadgePercent,
  Banknote,
  Check,
  CreditCard,
  MapPin,
  Package,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";
import { placeOrderAction, type CheckoutState } from "@/app/actions/shop";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/field";
import { CartSummary } from "@/components/cart/cart-summary";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { Address, CartLine, CartTotals, PaymentMethod } from "@/lib/types";

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}> = [
  {
    id: "COD",
    label: "Cash on delivery",
    description: "Pay the courier when your parcel arrives",
    icon: Banknote,
    badge: "Most popular",
  },
  {
    id: "CARD",
    label: "Credit or debit card",
    description: "Visa, Mastercard and AMEX accepted",
    icon: CreditCard,
  },
  { id: "WALLET", label: "SoftDealz wallet", description: "Use your stored balance instantly", icon: Wallet },
];

const STEPS = [
  { id: 1, label: "Delivery address" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Review & place order" },
];

interface DeliveryValues {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  note: string;
}

const INITIAL: CheckoutState = {};

export function CheckoutFlow({
  user,
  addresses,
  lines,
  totals,
  appliedCoupon = null,
}: {
  user: { name: string; email: string; phone: string };
  addresses: Address[];
  lines: CartLine[];
  totals: CartTotals;
  /** Coupon cookie value, so the order is written with the same discount shown. */
  appliedCoupon?: string | null;
}) {
  const [state, formAction, pending] = useActionState(placeOrderAction, INITIAL);

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>(defaultAddress?.id ?? "new");
  const [step, setStep] = React.useState(1);
  const [method, setMethod] = React.useState<PaymentMethod>("COD");
  const [sameAsDelivery, setSameAsDelivery] = React.useState(true);

  const [values, setValues] = React.useState<DeliveryValues>(() => ({
    fullName: defaultAddress?.fullName ?? user.name,
    phone: defaultAddress?.phone ?? user.phone,
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    postalCode: defaultAddress?.postalCode ?? "",
    country: defaultAddress?.country ?? "Sri Lanka",
    note: "",
  }));

  const update = (key: keyof DeliveryValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((current) => ({ ...current, [key]: event.target.value }));

  /** Choosing a saved address re-fills every field, keeping them editable. */
  const chooseAddress = (id: string) => {
    setSelectedAddressId(id);
    const address = addresses.find((entry) => entry.id === id);
    setValues((current) => ({
      ...current,
      fullName: address?.fullName ?? user.name,
      phone: address?.phone ?? user.phone,
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "Sri Lanka",
    }));
  };

  // Every rule here mirrors the server-side zod schema, so the shopper cannot
  // reach the review step with a field the server will reject.
  const deliveryComplete =
    values.fullName.trim().length > 1 &&
    values.phone.trim().length > 8 &&
    values.line1.trim().length > 3 &&
    values.city.trim().length > 1 &&
    values.state.trim().length > 1 &&
    values.postalCode.trim().length > 2;

  /**
   * Hidden steps stay mounted so their inputs are still submitted, but a
   * `required` control inside a `display:none` subtree makes the browser refuse
   * to submit ("not focusable") with no visible explanation. Only the step the
   * shopper is looking at is marked required — the server validates everything.
   */
  const onStep = (id: number) => step === id;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0">
        {/* ---------------- stepper ---------------- */}
        <ol className="mb-6 flex items-center gap-2 sm:gap-4">
          {STEPS.map((entry, index) => {
            const active = step === entry.id;
            const done = step > entry.id;
            return (
              <li key={entry.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => done && setStep(entry.id)}
                  disabled={!done}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors sm:px-3",
                    done ? "hover:bg-ink-100" : "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-[0.78rem] font-bold",
                      done || active ? "bg-brand-600 text-white" : "bg-ink-200 text-ink-600",
                    )}
                  >
                    {done ? <Check className="size-4" /> : entry.id}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-[0.82rem] font-semibold sm:block",
                      done || active ? "text-ink-900" : "text-ink-500",
                    )}
                  >
                    {entry.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && <span className="h-px flex-1 bg-ink-200" />}
              </li>
            );
          })}
        </ol>

        {/*
          Every step stays mounted — hidden with `hidden` so the browser still
          submits their inputs. Without this, moving to step 3 would drop the
          delivery address from the form payload.
        */}
        <form
          action={formAction}
          className="space-y-5"
          onKeyDown={(event) => {
            // Implicit submission (Enter in a text field) would place the order
            // from step 1 or 2. Only the review step may submit with Enter.
            if (event.key === "Enter" && step !== 3) {
              const tag = (event.target as HTMLElement).tagName;
              if (tag !== "TEXTAREA" && tag !== "BUTTON") event.preventDefault();
            }
          }}
        >
          {appliedCoupon && <input type="hidden" name="couponCode" value={appliedCoupon} />}
          {/* ---------------- step 1 ---------------- */}
          <section className="card-surface p-4 sm:p-5" hidden={step !== 1}>
            <h2 className="text-fluid-lg font-bold">Delivery address</h2>
            <p className="mt-0.5 text-[0.82rem] text-ink-500">
              We deliver island-wide across all 25 districts.
            </p>

            {addresses.length > 0 && (
              <div className="mt-4 space-y-2.5">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors",
                      selectedAddressId === address.id
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20"
                        : "border-ink-200 hover:border-ink-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="addressChoice"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => chooseAddress(address.id)}
                      className="mt-1 size-4 accent-[#0c800f]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.85rem] font-semibold text-ink-900">{address.label}</span>
                        <span className="text-[0.82rem] text-ink-600">{address.fullName}</span>
                        {address.isDefault && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[0.68rem] font-semibold text-brand-700">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-500">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                        {address.postalCode}
                      </span>
                      <span className="mt-0.5 block text-[0.78rem] text-ink-500">{address.phone}</span>
                    </span>
                  </label>
                ))}

                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors",
                    selectedAddressId === "new"
                      ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20"
                      : "border-ink-200 hover:border-ink-300",
                  )}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    value="new"
                    checked={selectedAddressId === "new"}
                    onChange={() => chooseAddress("new")}
                    className="size-4 accent-[#0c800f]"
                  />
                  <span className="text-[0.85rem] font-semibold text-ink-900">Deliver somewhere else</span>
                </label>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required htmlFor="fullName" error={state.fieldErrors?.fullName}>
                <Input
                  id="fullName"
                  name="fullName"
                  value={values.fullName}
                  onChange={update("fullName")}
                  autoComplete="name"
                  required={onStep(1)}
                />
              </Field>
              <Field label="Phone number" required htmlFor="phone" error={state.fieldErrors?.phone}>
                <Input
                  id="phone"
                  name="phone"
                  value={values.phone}
                  onChange={update("phone")}
                  placeholder="+94 77 123 4567"
                  autoComplete="tel"
                  required={onStep(1)}
                />
              </Field>
              <Field
                label="Address line 1"
                required
                htmlFor="line1"
                className="sm:col-span-2"
                error={state.fieldErrors?.line1}
              >
                <Input
                  id="line1"
                  name="line1"
                  value={values.line1}
                  onChange={update("line1")}
                  placeholder="House number and street"
                  autoComplete="address-line1"
                  required={onStep(1)}
                />
              </Field>
              <Field label="Address line 2" htmlFor="line2" className="sm:col-span-2">
                <Input
                  id="line2"
                  name="line2"
                  value={values.line2}
                  onChange={update("line2")}
                  placeholder="Apartment, lane or landmark (optional)"
                />
              </Field>
              <Field label="City" required htmlFor="city" error={state.fieldErrors?.city}>
                <Input
                  id="city"
                  name="city"
                  value={values.city}
                  onChange={update("city")}
                  autoComplete="address-level2"
                  required={onStep(1)}
                />
              </Field>
              <Field label="Province" required htmlFor="state" error={state.fieldErrors?.state}>
                <Input
                  id="state"
                  name="state"
                  value={values.state}
                  onChange={update("state")}
                  autoComplete="address-level1"
                  required={onStep(1)}
                />
              </Field>
              <Field label="Postal code" required htmlFor="postalCode" error={state.fieldErrors?.postalCode}>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={values.postalCode}
                  onChange={update("postalCode")}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required={onStep(1)}
                />
              </Field>
              <Field label="Country" htmlFor="country">
                <Input id="country" name="country" value={values.country} onChange={update("country")} />
              </Field>
              <Field label="Delivery note" htmlFor="note" className="sm:col-span-2">
                <Textarea
                  id="note"
                  name="note"
                  rows={2}
                  value={values.note}
                  onChange={update("note")}
                  placeholder="Gate code, preferred delivery time, landmark…"
                />
              </Field>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="button" onClick={() => setStep(2)} disabled={!deliveryComplete}>
                Continue to payment
              </Button>
              {!deliveryComplete && (
                <p className="text-[0.78rem] text-amber-700">
                  Add name, phone, street, city, province and postal code to continue.
                </p>
              )}
            </div>
          </section>

          {/* ---------------- step 2 ---------------- */}
          <section className="card-surface p-4 sm:p-5" hidden={step !== 2}>
            <h2 className="text-fluid-lg font-bold">Payment method</h2>
            <p className="mt-0.5 text-[0.82rem] text-ink-500">
              This build simulates payment — no real charge is made.
            </p>

            <div className="mt-4 space-y-2.5">
              {PAYMENT_METHODS.map((option) => {
                const Icon = option.icon;
                const active = method === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                      active
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20"
                        : "border-ink-200 hover:border-ink-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.id}
                      checked={active}
                      onChange={() => setMethod(option.id)}
                      className="mt-1 size-4 accent-[#0c800f]"
                    />
                    <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.88rem] font-semibold text-ink-900">{option.label}</span>
                        {option.badge && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[0.68rem] font-semibold text-brand-700">
                            {option.badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[0.8rem] text-ink-500">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {method === "CARD" && (
              <div className="mt-4 grid gap-4 rounded-xl border border-ink-200 bg-ink-50 p-4 sm:grid-cols-2">
                <Field
                  label="Card number"
                  htmlFor="cardNumber"
                  className="sm:col-span-2"
                  hint="Test card: 4242 4242 4242 4242"
                  error={state.fieldErrors?.cardNumber}
                >
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                </Field>
                <Field label="Expiry" htmlFor="cardExpiry">
                  <Input id="cardExpiry" name="cardExpiry" placeholder="MM/YY" autoComplete="cc-exp" />
                </Field>
                <Field label="CVC" htmlFor="cardCvc">
                  <Input id="cardCvc" name="cardCvc" placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                </Field>
                <Field label="Name on card" htmlFor="cardName" className="sm:col-span-2">
                  <Input id="cardName" name="cardName" placeholder={user.name} autoComplete="cc-name" />
                </Field>
              </div>
            )}

            {method === "WALLET" && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-ocean-200 bg-ocean-50 p-4">
                <Smartphone className="mt-0.5 size-5 shrink-0 text-ocean-600" />
                <div>
                  <p className="text-[0.85rem] font-semibold text-ocean-900">Wallet balance: LKR 15,000</p>
                  <p className="mt-0.5 text-[0.8rem] text-ocean-700">
                    Any remainder is collected on delivery. Top up your wallet from the account area.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back to address
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Review order
              </Button>
            </div>
          </section>

          {/* ---------------- step 3 ---------------- */}
          <section className="card-surface p-4 sm:p-5" hidden={step !== 3}>
            <h2 className="text-fluid-lg font-bold">Review your order</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-200 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-ink-400">
                    <MapPin className="size-3.5" /> Delivering to
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[0.75rem] font-semibold text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-[0.85rem] font-semibold text-ink-900">{values.fullName}</p>
                <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-500">
                  {values.line1}
                  {values.line2 ? `, ${values.line2}` : ""}
                  <br />
                  {values.city}, {values.state} {values.postalCode}
                  <br />
                  {values.phone}
                </p>
              </div>

              <div className="rounded-xl border border-ink-200 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-ink-400">
                    <CreditCard className="size-3.5" /> Paying with
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[0.75rem] font-semibold text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-[0.85rem] font-semibold text-ink-900">
                  {PAYMENT_METHODS.find((option) => option.id === method)?.label}
                </p>
                <p className="mt-0.5 text-[0.8rem] text-ink-500">
                  {method === "COD"
                    ? "Please have the exact amount ready"
                    : "Charged when your order is confirmed"}
                </p>
              </div>
            </div>

            <ul className="mt-5 divide-y divide-ink-200">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-3.5 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <Image
                      src={line.product.images[0] ?? "/images/products/placeholder.svg"}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-[0.85rem] font-medium text-ink-900">
                      {line.product.title}
                    </span>
                    <span className="text-[0.78rem] text-ink-500">
                      Qty {line.quantity} · {formatPrice(line.product.price)} each
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.88rem] font-bold text-ink-900">
                    {formatPrice(line.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            {appliedCoupon && totals.discount > 0 && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[0.82rem] font-medium text-brand-800">
                <BadgePercent className="size-4" /> Coupon {appliedCoupon} applied — you save{" "}
                {formatPrice(totals.discount)}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-ink-50 p-3.5">
              <Truck className="size-5 shrink-0 text-brand-600" />
              <p className="text-[0.82rem] text-ink-600">
                Estimated delivery <span className="font-semibold text-ink-900">2–4 working days</span> · carrier
                assigned after dispatch
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <Checkbox
                checked={sameAsDelivery}
                onChange={(event) => setSameAsDelivery(event.target.checked)}
                label="Billing address is the same as delivery"
              />
              {!sameAsDelivery && (
                <p className="rounded-lg bg-ink-50 px-3 py-2 text-[0.78rem] text-ink-600">
                  A billing address can be added from your account after the order is placed.
                </p>
              )}
              <Checkbox
                name="agreeToTerms"
                required={onStep(3)}
                defaultChecked
                label="I agree to the terms of service and return policy"
              />
            </div>

            {state.error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5"
              >
                <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-rose-brand" />
                <div>
                  <p className="text-[0.83rem] font-medium text-rose-800">{state.error}</p>
                  {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-[0.78rem] text-rose-700">
                      {Object.entries(state.fieldErrors).map(([field, message]) => (
                        <li key={field}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit" size="lg" loading={pending}>
                <Package className="size-4" />
                Place order · {formatPrice(totals.total)}
              </Button>
            </div>
          </section>
        </form>

        {/* mobile summary */}
        <div className="mt-6 lg:hidden">
          <CartSummary totals={totals} appliedCoupon={appliedCoupon} showCheckout={false} compact />
        </div>
      </div>

      {/* desktop summary */}
      <div className="hidden lg:sticky lg:top-40 lg:block lg:self-start">
        <CartSummary totals={totals} showCoupon appliedCoupon={appliedCoupon} showCheckout={false} />
        <div className="mt-4 rounded-xl border border-ink-200 bg-white p-4">
          <p className="text-[0.8rem] font-semibold text-ink-900">Order placed as</p>
          <p className="mt-1 text-[0.8rem] text-ink-500">
            {user.name}
            <br />
            {user.email}
          </p>
          <p className="mt-2 text-[0.75rem] text-ink-400">
            Status updates go to this email and your account notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
