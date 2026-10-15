"use client";

import Image from "next/image";
import Link from "next/link";
import { useStoreBranding } from "@/components/providers/store-branding-provider";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/image-url";

/**
 * SoftDealz wordmark — a green price-tag "S" with the blue deal spark.
 * Drawn in pure SVG so it stays razor sharp at any size, up to 4K.
 */
export function Logo({
  className,
  size = "md",
  inverted = false,
  href = "/",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
  href?: string | null;
}) {
  const { storeName, logoUrl } = useStoreBranding();
  const scale = { sm: "text-lg", md: "text-[1.35rem]", lg: "text-3xl" }[size];
  const markSize = { sm: "size-7", md: "size-9", lg: "size-12" }[size];

  const content = (
    <span className={cn("group inline-flex items-center gap-2 select-none", className)}>
      {logoUrl ? (
        <Image
          src={resolveImageUrl(logoUrl)}
          alt={storeName}
          width={180}
          height={48}
          unoptimized
          className="h-9 w-auto max-w-[11rem] object-contain sm:h-10"
        />
      ) : (
        <>
          <span
            className={cn(
              "relative grid shrink-0 place-items-center rounded-[0.7rem] bg-gradient-to-br from-brand-600 to-brand-700 shadow-[0_4px_14px_-6px_rgba(12,128,15,0.8)] transition-transform duration-300 group-hover:scale-105",
              markSize,
            )}
            aria-hidden
          >
            <svg viewBox="0 0 32 32" className="size-[70%]" fill="none">
              <path
                d="M16 3.5 27 8.2v7.4c0 6.3-4.4 11.4-11 13.4C9.4 27 5 21.9 5 15.6V8.2L16 3.5Z"
                fill="white"
                fillOpacity="0.16"
                stroke="white"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M19.6 12.3c-1-.9-2.3-1.4-3.7-1.4-2 0-3.3 1.1-3.3 2.5 0 1.3 1 2 3.4 2.6 2.7.7 4.1 1.7 4.1 3.9 0 2.4-2 4-4.9 4-1.9 0-3.5-.7-4.6-1.8"
                stroke="white"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="23.4" cy="9.4" r="2.1" fill="#0a57a0" stroke="white" strokeWidth="1.2" />
            </svg>
          </span>
          <span className={cn("font-extrabold tracking-tight", scale)}>
            {storeName === "SoftDealz" ? (
              <>
                <span className={inverted ? "text-white" : "text-ink-900"}>soft</span>
                <span className="text-brand-600">dealz</span>
              </>
            ) : (
              <span className={inverted ? "text-white" : "text-ink-900"}>{storeName}</span>
            )}
          </span>
        </>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={`${storeName} home`} className="shrink-0">
      {content}
    </Link>
  );
}
