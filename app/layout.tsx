import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ToastProvider } from "@/components/ui/toast";
import { ShopProvider } from "@/components/providers/shop-provider";
import { Header } from "@/components/layout/header";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Footer } from "@/components/layout/footer";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { StoreBrandingProvider } from "@/components/providers/store-branding-provider";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryTree, listCategories } from "@/lib/data/categories";
import { getCartCount } from "@/lib/data/cart";
import { listNotifications, unreadCount, wishlistIds, allSettings } from "@/lib/data/account";
import { siteUrl } from "@/lib/env";
import { themeColors, themeVariables } from "@/lib/theme";
import { normalizeImageInput } from "@/lib/image-url";

const SITE_URL = siteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const settings = allSettings();
  const storeName = settings.store_name?.trim() || "SoftDealz";
  const title = `${storeName} — Sri Lanka's smartest marketplace`;
  const description =
    settings.store_tagline?.trim() ||
    "Shop electronics, fashion, home, grocery and more on SoftDealz. Island-wide delivery in 2–4 days, free shipping over LKR 25,000 and 7 day easy returns.";

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${storeName}` },
    description,
    keywords: [
      storeName,
      "online shopping Sri Lanka",
      "marketplace",
      "electronics",
      "fashion",
      "home and kitchen",
      "deals",
    ],
    applicationName: storeName,
    icons: { icon: normalizeImageInput(settings.app_icon_url ?? "") || "/icon.svg" },
    openGraph: {
      title,
      description,
      type: "website",
      url: SITE_URL,
      siteName: storeName,
      locale: "en_LK",
      images: [{ url: "/images/hero/hero-sale.jpg", width: 1600, height: 900, alt: `${storeName} deals` }],
    },
    twitter: { card: "summary_large_image", title: storeName, description },
    robots: { index: true, follow: true },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { primary, secondary } = themeColors(allSettings());
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: primary },
      { media: "(prefers-color-scheme: dark)", color: secondary },
    ],
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const settings = allSettings();
  const categoryTree = getCategoryTree();
  const layoutAttributes = {
    "data-storefront-rail-mobile": ["1", "2"].includes(settings.storefront_rail_mobile_cards)
      ? settings.storefront_rail_mobile_cards
      : "2",
    "data-storefront-rail-tablet": ["2", "3"].includes(settings.storefront_rail_tablet_cards)
      ? settings.storefront_rail_tablet_cards
      : "3",
    "data-storefront-rail-desktop": ["3", "4"].includes(settings.storefront_rail_desktop_cards)
      ? settings.storefront_rail_desktop_cards
      : "4",
    "data-storefront-rail-wide": ["3", "4", "5"].includes(settings.storefront_rail_max_cards)
      ? settings.storefront_rail_max_cards
      : "5",
    "data-storefront-grid-wide": ["3", "4", "5"].includes(settings.storefront_grid_columns)
      ? settings.storefront_grid_columns
      : "5",
  };

  const headerCategories = categoryTree.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    image: category.image,
    productCount: category.productCount ?? 0,
    children: (category.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      productCount: child.productCount ?? 0,
    })),
  }));

  const footerCategories = listCategories()
    .filter((category) => !category.parentId)
    .map((category) => ({ id: category.id, name: category.name, slug: category.slug }));

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      {...layoutAttributes}
      style={themeVariables(settings)}
    >
      <body className="flex min-h-dvh flex-col bg-white">
        <ToastProvider>
          <ShopProvider
            initialCartCount={user ? getCartCount(user.id) : 0}
            initialWishlist={user ? wishlistIds(user.id) : []}
            isAuthenticated={Boolean(user)}
          >
            <StoreBrandingProvider
              storeName={settings.store_name?.trim() || "SoftDealz"}
              logoUrl={normalizeImageInput(settings.logo_url ?? "") || ""}
            >
              <StorefrontChrome
                header={
                  <>
                    <a
                      href="#main"
                      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
                    >
                      Skip to content
                    </a>
                    <Header
                      categories={headerCategories}
                      user={
                        user
                          ? {
                              id: user.id,
                              name: user.name,
                              email: user.email,
                              role: user.role,
                              avatarColor: user.avatarColor,
                            }
                          : null
                      }
                      unreadCount={user ? unreadCount(user.id) : 0}
                      notifications={
                        user
                          ? listNotifications(user.id, 4).map((n) => ({
                              id: n.id,
                              title: n.title,
                              body: n.body,
                              createdAt: n.createdAt,
                            }))
                          : []
                      }
                      announcement={
                        settings.announcement ??
                        "Island-wide delivery in 2–4 days · Free shipping over LKR 25,000"
                      }
                      supportPhone={settings.support_phone ?? "+94 11 234 5678"}
                      wishlistCount={user ? wishlistIds(user.id).length : 0}
                    />
                  </>
                }
                footer={<Footer categories={footerCategories} settings={settings} />}
              >
                <NavigationProgress />
                <main id="main" className="flex-1">
                  {children}
                </main>
              </StorefrontChrome>
            </StoreBrandingProvider>
          </ShopProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
