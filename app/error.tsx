"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface the error for debugging; a real deployment would ship this to a logger.
    console.error("SoftDealz error boundary:", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4 py-14">
      <div className="w-full max-w-lg text-center">
        <Logo size="md" />

        <span className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-brand">
          <AlertTriangle className="size-7" />
        </span>

        <h1 className="mt-5 text-fluid-3xl font-extrabold">Something went wrong</h1>
        <p className="mt-3 text-fluid-base text-ink-600">
          An unexpected error interrupted this page. It&apos;s been logged — try again, and if it keeps happening our team
          is one message away.
        </p>

        {error.digest && (
          <p className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-[0.75rem] text-ink-500">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={reset}>
            <RefreshCw className="size-4" /> Try again
          </Button>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-300 bg-white px-5 text-[0.88rem] font-semibold text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            <Home className="size-4" /> Go to homepage
          </Link>
        </div>

        <p className="mt-6 text-[0.82rem] text-ink-500">
          Still stuck?{" "}
          <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
            Contact support
          </Link>{" "}
          and quote the reference above.
        </p>
      </div>
    </div>
  );
}
