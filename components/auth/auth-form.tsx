"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";

const INITIAL: AuthState = {};

function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
  invalid,
  defaultValue,
}: {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  defaultValue?: string;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        invalid={invalid}
        defaultValue={defaultValue}
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
  );
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  // Only same-site paths are echoed back into the form (the server validates
  // again) — this stops `?next=//evil.com` open-redirect attempts.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : undefined;

  return (
    <form action={formAction} className="mt-7 space-y-4">
      {safeNext && <input type="hidden" name="next" value={safeNext} />}

      {state.error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
          <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-rose-brand" />
          <p className="text-[0.83rem] font-medium text-rose-800">{state.error}</p>
        </div>
      )}

      {mode === "register" && (
        <Field label="Full name" htmlFor="name" required error={state.fieldErrors?.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Nimal Perera"
            required
            defaultValue={state.values?.name}
            invalid={Boolean(state.fieldErrors?.name)}
          />
        </Field>
      )}

      <Field label="Email address" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          defaultValue={state.values?.email}
          invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      {mode === "register" && (
        <Field
          label="Phone number"
          htmlFor="phone"
          required
          error={state.fieldErrors?.phone}
          hint="Used by the courier to reach you on delivery day."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
            required
            defaultValue={state.values?.phone}
            invalid={Boolean(state.fieldErrors?.phone)}
          />
        </Field>
      )}

      <Field label="Password" htmlFor="password" required error={state.fieldErrors?.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
          invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      {mode === "register" && (
        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={state.fieldErrors?.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            invalid={Boolean(state.fieldErrors?.confirmPassword)}
          />
        </Field>
      )}

      {mode === "login" ? (
        <div className="flex items-center justify-between gap-3">
          <Checkbox name="remember" defaultChecked label="Keep me signed in" />
          <Link href="/help#account" className="text-[0.8rem] font-semibold text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
      ) : (
        <Checkbox
          required
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
                privacy policy
              </Link>
            </>
          }
        />
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {mode === "login" ? "Sign in" : "Create my account"}
      </Button>

      {mode === "register" && (
        <p className="text-center text-[0.78rem] text-ink-500">
          New accounts get <span className="font-semibold text-brand-700">10% off</span> their first order with code
          WELCOME10.
        </p>
      )}
    </form>
  );
}
