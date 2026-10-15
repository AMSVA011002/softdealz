"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, User } from "lucide-react";
import {
  updatePasswordAction,
  updateProfileAction,
  type FormState,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/field";
import { Tabs } from "@/components/ui/nav";

const INITIAL: FormState = {};

function PasswordField({
  id,
  name,
  label,
  hint,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <Field label={label} htmlFor={id} required hint={hint} error={error}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          invalid={Boolean(error)}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}

export function SettingsForm({ user }: { user: { name: string; email: string; phone: string } }) {
  const [tab, setTab] = React.useState("profile");
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, INITIAL);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePasswordAction, INITIAL);
  const [marketing, setMarketing] = React.useState(true);
  const [orderUpdates, setOrderUpdates] = React.useState(true);

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-ink-200 px-4 pt-4 sm:px-5">
        <Tabs
          tabs={[
            { id: "profile", label: "Profile" },
            { id: "security", label: "Password" },
            { id: "preferences", label: "Preferences" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="p-4 sm:p-5">
        {tab === "profile" && (
          <form action={profileAction} className="max-w-lg space-y-4">
            <div className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink-700">
              <User className="size-4 text-brand-600" /> Personal details
            </div>

            <Field label="Full name" htmlFor="name" required error={profileState.fieldErrors?.name}>
              <Input id="name" name="name" defaultValue={user.name} required invalid={Boolean(profileState.fieldErrors?.name)} />
            </Field>

            <Field label="Email address" htmlFor="email" hint="Contact support to change the email on your account.">
              <Input id="email" value={user.email} disabled readOnly />
            </Field>

            <Field label="Phone number" htmlFor="phone" error={profileState.fieldErrors?.phone}>
              <Input id="phone" name="phone" defaultValue={user.phone} placeholder="+94 77 123 4567" />
            </Field>

            {profileState.success && (
              <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-[0.82rem] font-medium text-brand-800">
                <CheckCircle2 className="size-4" /> {profileState.success}
              </p>
            )}
            {profileState.error && (
              <p role="alert" className="text-[0.82rem] font-medium text-rose-brand">
                {profileState.error}
              </p>
            )}

            <Button type="submit" loading={profilePending}>
              Save changes
            </Button>
          </form>
        )}

        {tab === "security" && (
          <form action={passwordAction} className="max-w-lg space-y-4">
            <div className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink-700">
              <KeyRound className="size-4 text-brand-600" /> Change your password
            </div>

            <PasswordField
              id="currentPassword"
              name="currentPassword"
              label="Current password"
              autoComplete="current-password"
              error={passwordState.fieldErrors?.currentPassword}
            />
            <PasswordField
              id="newPassword"
              name="newPassword"
              label="New password"
              hint="At least 8 characters. Mix letters, numbers and symbols."
              autoComplete="new-password"
              error={passwordState.fieldErrors?.newPassword}
            />
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              error={passwordState.fieldErrors?.confirmPassword}
            />

            {passwordState.success && (
              <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-[0.82rem] font-medium text-brand-800">
                <CheckCircle2 className="size-4" /> {passwordState.success}
              </p>
            )}

            <Button type="submit" loading={passwordPending}>
              Update password
            </Button>
          </form>
        )}

        {tab === "preferences" && (
          <div className="max-w-lg space-y-5">
            <div>
              <p className="text-[0.82rem] font-semibold text-ink-700">Notifications</p>
              <p className="mt-0.5 text-[0.78rem] text-ink-500">
                Choose what lands in your inbox and account notifications.
              </p>
            </div>

            <div className="space-y-4">
              <Switch
                checked={orderUpdates}
                onChange={setOrderUpdates}
                label="Order updates"
                description="Dispatch, delivery and delay alerts for your orders"
              />
              <Switch
                checked={marketing}
                onChange={setMarketing}
                label="Deals and offers"
                description="Flash sales, coupon codes and seasonal promotions"
              />
            </div>

            <div className="rounded-xl border border-ink-200 bg-ink-50 p-3.5">
              <p className="text-[0.8rem] text-ink-600">
                Preference changes are stored on this device in the demo build. Connect an email provider to make them
                permanent.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
