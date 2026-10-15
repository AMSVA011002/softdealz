"use client";

import * as React from "react";
import { Check, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function NewsletterForm({ className }: { className?: string }) {
  const toast = useToast();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string; message?: string };

      if (!data.ok) {
        toast.error("Could not subscribe", data.error);
        setStatus("idle");
        return;
      }

      setStatus("done");
      setEmail("");
      toast.success("Subscribed", data.message);
    } catch {
      toast.error("Network error", "Please try again in a moment.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className={`flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 ${className ?? ""}`}>
        <Check className="size-4 shrink-0 text-brand-600" />
        <p className="text-[0.82rem] font-medium text-brand-800">
          You&apos;re on the list. Watch your inbox on Friday.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-11 min-w-0 flex-1 rounded-xl border border-ink-300 bg-white px-3.5 text-[0.85rem] transition-colors hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 text-[0.84rem] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          <span className="hidden sm:inline">Subscribe</span>
        </button>
      </div>
      <p className="mt-2 text-[0.72rem] text-ink-500">
        By subscribing you agree to our{" "}
        <a href="/privacy" className="underline hover:text-brand-700">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
