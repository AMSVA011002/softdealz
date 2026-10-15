"use client";

import * as React from "react";

/**
 * Last-resort error boundary.
 *
 * `app/error.tsx` cannot catch a failure thrown while rendering the root
 * layout, so this file provides the full HTML document fallback that Next.js
 * needs in that case. It is intentionally dependency-light: if the layout is
 * broken, the UI kit may be too.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Ship this to an error tracker in a real deployment (Sentry, etc.).
    console.error("SoftDealz fatal error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f7f9",
          color: "#111827",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0c800f", margin: 0 }}>SoftDealz</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "1.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#4b5563" }}>
            We hit an unexpected problem loading the store. The issue has been logged — please try again.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "1rem",
                display: "inline-block",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "0.35rem 0.75rem",
                fontSize: "0.78rem",
                color: "#6b7280",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#0c800f",
                color: "#fff",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.7rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the app shell may be broken here; a full page load is intentional */}
            <a
              href="/"
              style={{
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#111827",
                borderRadius: "0.75rem",
                padding: "0.7rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go to homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
