"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

/**
 * Routes whose *server* markup embeds cart or wishlist state.
 *
 * `router.refresh()` re-renders the whole route on the server and re-streams its
 * RSC payload — 50–135 KB on the storefront — so it used to make every
 * "Add to cart" click feel heavy. Everywhere else the header badge, the cart
 * drawer and the wishlist hearts are driven by client state that has already
 * been updated from the API response, so no refresh is needed.
 */
const SERVER_CART_ROUTES = ["/cart", "/checkout"];
const SERVER_WISHLIST_ROUTES = ["/account/wishlist"];

/**
 * Client-side shop state.
 *
 * The server stays the source of truth (cart rows live in SQLite), while this
 * provider keeps the header badge, wishlist hearts and add-to-cart buttons
 * instantly responsive. Every mutation hits the REST API, then we ask Next to
 * refresh server components so prices, stock and totals stay accurate.
 */
interface ShopState {
  cartCount: number;
  wishlistIds: string[];
  cartOpen: boolean;
  isAuthenticated: boolean;
  pendingProductId: string | null;
  setCartOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number, title?: string) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string, title?: string) => Promise<boolean>;
  refresh: () => void;
}

const ShopContext = React.createContext<ShopState | null>(null);

export function useShop() {
  const context = React.useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside <ShopProvider>");
  return context;
}

export function ShopProvider({
  children,
  initialCartCount = 0,
  initialWishlist = [],
  isAuthenticated = false,
}: {
  children: React.ReactNode;
  initialCartCount?: number;
  initialWishlist?: string[];
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const onServerRenderedRoute = React.useCallback(
    (routes: string[]) => routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    [pathname],
  );
  const [cartCount, setCartCount] = React.useState(initialCartCount);
  const [wishlistIds, setWishlistIds] = React.useState<string[]>(initialWishlist);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [pendingProductId, setPendingProductId] = React.useState<string | null>(null);

  // Keep client state in sync when the server re-renders with fresh values.
  React.useEffect(() => setCartCount(initialCartCount), [initialCartCount]);
  React.useEffect(() => setWishlistIds(initialWishlist), [initialWishlist]);

  const refresh = React.useCallback(() => router.refresh(), [router]);

  const addToCart = React.useCallback<ShopState["addToCart"]>(
    async (productId, quantity = 1, title) => {
      if (!isAuthenticated) {
        toast.info("Please sign in", "Create an account or sign in to start shopping.");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return false;
      }

      setPendingProductId(productId);
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const data = (await response.json()) as { ok: boolean; count?: number; error?: string };

        if (!response.ok || !data.ok) {
          toast.error("Could not add to cart", data.error ?? "Please try again in a moment.");
          return false;
        }

        setCartCount(data.count ?? cartCount + quantity);
        toast.success("Added to cart", title ? `${title} is in your cart.` : undefined);
        setCartOpen(true);
        if (onServerRenderedRoute(SERVER_CART_ROUTES)) refresh();
        return true;
      } catch {
        toast.error("Network error", "We could not reach the server. Please try again.");
        return false;
      } finally {
        setPendingProductId(null);
      }
    },
    [cartCount, isAuthenticated, onServerRenderedRoute, refresh, router, toast],
  );

  const setQuantity = React.useCallback<ShopState["setQuantity"]>(
    async (productId, quantity) => {
      setPendingProductId(productId);
      try {
        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const data = (await response.json()) as { ok: boolean; count?: number; error?: string };
        if (data.ok) {
          setCartCount(data.count ?? 0);
          if (onServerRenderedRoute(SERVER_CART_ROUTES)) refresh();
        } else {
          toast.error("Could not update quantity", data.error);
        }
      } finally {
        setPendingProductId(null);
      }
    },
    [onServerRenderedRoute, refresh, toast],
  );

  const removeItem = React.useCallback<ShopState["removeItem"]>(
    async (productId) => {
      setPendingProductId(productId);
      try {
        const response = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
        });
        const data = (await response.json()) as { ok: boolean; count?: number };
        if (data.ok) {
          setCartCount(data.count ?? 0);
          toast.info("Removed from cart");
          if (onServerRenderedRoute(SERVER_CART_ROUTES)) refresh();
        }
      } finally {
        setPendingProductId(null);
      }
    },
    [onServerRenderedRoute, refresh, toast],
  );

  const toggleWishlist = React.useCallback<ShopState["toggleWishlist"]>(
    async (productId, title) => {
      if (!isAuthenticated) {
        toast.info("Please sign in", "Sign in to save items to your wishlist.");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return false;
      }

      setPendingProductId(productId);
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = (await response.json()) as { ok: boolean; added?: boolean; error?: string };

        if (!data.ok) {
          toast.error("Wishlist unavailable", data.error);
          return false;
        }

        setWishlistIds((current) =>
          data.added ? [...current, productId] : current.filter((id) => id !== productId),
        );
        toast.success(
          data.added ? "Saved to wishlist" : "Removed from wishlist",
          data.added && title ? title : undefined,
        );
        if (onServerRenderedRoute(SERVER_WISHLIST_ROUTES)) refresh();
        return Boolean(data.added);
      } finally {
        setPendingProductId(null);
      }
    },
    [isAuthenticated, onServerRenderedRoute, refresh, router, toast],
  );

  const value = React.useMemo<ShopState>(
    () => ({
      cartCount,
      wishlistIds,
      cartOpen,
      isAuthenticated,
      pendingProductId,
      setCartOpen,
      addToCart,
      setQuantity,
      removeItem,
      toggleWishlist,
      refresh,
    }),
    [
      cartCount,
      wishlistIds,
      cartOpen,
      isAuthenticated,
      pendingProductId,
      addToCart,
      setQuantity,
      removeItem,
      toggleWishlist,
      refresh,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
