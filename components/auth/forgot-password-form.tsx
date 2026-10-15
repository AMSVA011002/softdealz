"use client";

import * as React from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Demo-only reset flow: the request is validated and acknowledged locally
 * because the project has no mail provider wired up.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (sent) {
    return (
      <div className="mt-6 space-y-4">
        <p className="flex items-start gap-2.5 rounded-xl bg-brand-50 p-3.5 text-[0.85rem] text-brand-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>
            If an account exists for <strong className="font-semibold">{email}</strong>, a reset link is on its way.
            Check your spam folder if it doesn&apos;t arrive within a few minutes.
          </span>
        </p>
        <Button variant="outline" fullWidth onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          setError("Enter a valid email address");
          return;
        }

        setPending(true);
        // Simulated round trip so the UI behaves like a real request.
        await new Promise((resolve) => setTimeout(resolve, 600));
        setPending(false);
        setSent(true);
      }}
    >
      <Field label="Email address" htmlFor="reset-email" required error={error ?? undefined}>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            invalid={Boolean(error)}
            className="pl-9"
          />
        </div>
      </Field>

      <Button type="submit" fullWidth loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
