"use client";

import * as React from "react";

interface StoreBranding {
  storeName: string;
  logoUrl: string;
}

const StoreBrandingContext = React.createContext<StoreBranding>({
  storeName: "SoftDealz",
  logoUrl: "",
});

export function StoreBrandingProvider({
  storeName,
  logoUrl,
  children,
}: StoreBranding & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ storeName, logoUrl }), [storeName, logoUrl]);
  return <StoreBrandingContext.Provider value={value}>{children}</StoreBrandingContext.Provider>;
}

export function useStoreBranding() {
  return React.useContext(StoreBrandingContext);
}
