"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { contactAction } from "@/app/actions/shop";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const TOPICS = [
  "Order or delivery question",
  "Return or refund",
  "Product enquiry",
  "Bulk / corporate order",
  "Partnership",
  "Something else",
];

export function ContactForm() {
  const [state, formAction, pending] = useActionState(contactAction, {} as { status?: string; error?: string });

  if (state.status) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-brand-600">
          <CheckCircle2 className="size-6" />
        </span>
        <p className="mt-3 text-[0.95rem] font-bold text-brand-900">Message received</p>
        <p className="mt-1.5 text-[0.85rem] text-brand-800">{state.status}</p>
        <p className="mt-3 text-[0.78rem] text-brand-700">
          Our support team also sees this in the admin dashboard, so nothing gets lost.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" required>
          <Input id="name" name="name" required autoComplete="name" placeholder="Nimal Perera" />
        </Field>
        <Field label="Email address" htmlFor="email" required>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </Field>
      </div>

      <Field label="What is it about?" htmlFor="subject">
        <Select id="subject" name="subject" defaultValue={TOPICS[0]}>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Message"
        htmlFor="message"
        required
        hint="At least a sentence or two so we can help properly."
      >
        <Textarea
          id="message"
          name="message"
          rows={6}
          required
          placeholder="Hi SoftDealz, I ordered a pair of headphones last week and…"
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[0.82rem] font-medium text-rose-800">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={pending} fullWidth>
        <Send className="size-4" /> Send message
      </Button>

      <p className="text-center text-[0.75rem] text-ink-400">
        We use your details only to answer this enquiry. No marketing unless you opt in.
      </p>
    </form>
  );
}
