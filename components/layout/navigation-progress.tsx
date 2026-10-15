"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Click-to-paint navigation feedback.
 *
 * Every storefront route is server-rendered, so between the click and the new
 * page there is a full network round trip during which *nothing* on screen
 * changed — the classic "I clicked and nothing happened" feeling, especially on
 * a slow link. This draws a thin progress bar the moment an internal link is
 * clicked and completes it when the route actually changes.
 *
 * Deliberately not a `loading.tsx` boundary: a boundary flushes the response
 * shell early, which would turn `notFound()` and `redirect()` into 200s. A
 * client-side indicator leaves HTTP semantics untouched.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = React.useState<"idle" | "running" | "done">("idle");
  const timeout = React.useRef<number | undefined>(undefined);

  const start = React.useCallback(() => {
    window.clearTimeout(timeout.current);
    setPhase("running");
    // Safety net: never leave the bar stuck if a navigation is cancelled.
    timeout.current = window.setTimeout(() => setPhase("done"), 10_000);
  }, []);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) return;

      const [targetPath] = href.split(/[?#]/);
      if (targetPath === pathname) return; // same page (e.g. an anchor or a filter re-render)
      start();
    };

    const onPopState = () => setPhase("done");

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.clearTimeout(timeout.current);
    };
  }, [pathname, start]);

  // The route changed: finish the bar, then fade it out.
  React.useEffect(() => {
    if (phase !== "running") return;
    window.clearTimeout(timeout.current);
    setPhase("done");
    timeout.current = window.setTimeout(() => setPhase("idle"), 400);
  }, [pathname, phase]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300 ${
        phase === "done" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="h-full bg-brand-600 shadow-[0_0_10px_rgba(12,128,15,0.55)] transition-[width] ease-out"
        style={{
          width: phase === "done" ? "100%" : "88%",
          transitionDuration: phase === "done" ? "200ms" : "6000ms",
        }}
      />
    </div>
  );
}
