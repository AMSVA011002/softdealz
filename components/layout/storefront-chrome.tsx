"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function StorefrontChrome({
  header,
  children,
  footer,
}: {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdminRoute && header}
      {children}
      {!isAdminRoute && footer}
    </>
  );
}
