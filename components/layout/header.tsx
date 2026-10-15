"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Phone,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SearchBar } from "@/components/layout/search-bar";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { ButtonLink } from "@/components/ui/button";
import { CountBubble } from "@/components/ui/badge";
import { Dropdown, DropdownDivider, DropdownItem } from "@/components/ui/nav";
import { useShop } from "@/components/providers/shop-provider";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES_MENU = "__all_categories__";

export interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  children: Array<{ id: string; name: string; slug: string; productCount?: number }>;
  productCount?: number;
}

export interface HeaderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
}

export interface HeaderNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export function Header({
  categories,
  user,
  unreadCount,
  notifications,
  announcement,
  supportPhone,
  wishlistCount,
}: {
  categories: HeaderCategory[];
  user: HeaderUser | null;
  unreadCount: number;
  notifications: HeaderNotification[];
  announcement: string;
  supportPhone: string;
  wishlistCount: number;
}) {
  const pathname = usePathname();
  const { cartCount, setCartOpen, wishlistIds } = useShop();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openMega, setOpenMega] = React.useState<string | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  const wishlistTotal = wishlistIds.length || wishlistCount;

  React.useEffect(() => {
    setMobileOpen(false);
    setOpenMega(null);
  }, [pathname]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ---------------- announcement bar ---------------- */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-ocean-600 text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[0.72rem] sm:text-[0.78rem]">
          <p className="truncate font-medium">{announcement}</p>
          <a
            href={`tel:${supportPhone.replace(/\s+/g, "")}`}
            className="hidden shrink-0 items-center gap-1.5 font-semibold hover:underline sm:flex"
          >
            <Phone className="size-3.5" />
            {supportPhone}
          </a>
        </div>
      </div>

      {/* ---------------- main header ---------------- */}
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow",
          scrolled ? "border-ink-200 shadow-soft" : "border-transparent",
        )}
        onMouseLeave={() => setOpenMega(null)}
      >
        <div className="container-page">
          <div className="flex h-16 items-center gap-3 lg:h-20 lg:gap-5">
            {/* mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-ml-1 grid size-10 shrink-0 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <Logo />

            {/* desktop search */}
            <div className="hidden flex-1 lg:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <Link
                href="/track"
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-[0.82rem] font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 xl:flex"
              >
                <Truck className="size-4 text-ocean-600" />
                Track order
              </Link>

              {/* notifications */}
              {user && (
                <Dropdown
                  trigger={({ toggle }) => (
                    <button
                      type="button"
                      onClick={toggle}
                      aria-label="Notifications"
                      className="relative grid size-10 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100"
                    >
                      <Bell className="size-5" />
                      <CountBubble count={unreadCount} />
                    </button>
                  )}
                  panelClassName="w-[19rem] max-w-[calc(100vw-2rem)]"
                >
                  <div className="flex items-center justify-between px-3.5 pb-1.5 pt-2">
                    <p className="text-[0.72rem] font-bold uppercase tracking-wider text-ink-400">Notifications</p>
                    <Link href="/account/notifications" className="text-[0.72rem] font-semibold text-brand-700">
                      View all
                    </Link>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-3.5 py-4 text-[0.82rem] text-ink-500">You are all caught up.</p>
                  ) : (
                    notifications.slice(0, 4).map((entry) => (
                      <Link
                        key={entry.id}
                        href="/account/notifications"
                        className="block border-t border-ink-100 px-3.5 py-2.5 transition-colors hover:bg-ink-50"
                      >
                        <p className="text-[0.82rem] font-semibold text-ink-900">{entry.title}</p>
                        <p className="line-clamp-2-safe text-[0.75rem] text-ink-500">{entry.body}</p>
                      </Link>
                    ))
                  )}
                </Dropdown>
              )}

              {/* wishlist */}
              <Link
                href={user ? "/account/wishlist" : "/login?next=/account/wishlist"}
                aria-label="Wishlist"
                className="relative hidden size-10 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100 sm:grid"
              >
                <Heart className="size-5" />
                <CountBubble count={wishlistTotal} className="bg-ocean-600" />
              </Link>

              {/* cart */}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
                className="relative grid size-10 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100"
              >
                <ShoppingCart className="size-5" />
                <CountBubble count={cartCount} />
              </button>

              {/* account */}
              {user ? (
                <Dropdown
                  className="hidden lg:block"
                  trigger={({ toggle }) => (
                    <button
                      type="button"
                      onClick={toggle}
                      className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-ink-100"
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-full text-[0.78rem] font-bold text-white"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                      </span>
                      <span className="hidden max-w-[7rem] truncate text-[0.83rem] font-semibold text-ink-800 xl:block">
                        {user.name.split(" ")[0]}
                      </span>
                      <ChevronDown className="size-3.5 text-ink-400" />
                    </button>
                  )}
                  panelClassName="w-[15.5rem]"
                >
                  <div className="border-b border-ink-100 px-3.5 pb-2.5 pt-2">
                    <p className="truncate text-[0.85rem] font-semibold text-ink-900">{user.name}</p>
                    <p className="truncate text-[0.75rem] text-ink-500">{user.email}</p>
                  </div>
                  <div className="py-1.5">
                    <DropdownItem href="/account" icon={<User className="size-4" />}>
                      My account
                    </DropdownItem>
                    <DropdownItem href="/account/orders" icon={<Package className="size-4" />}>
                      Orders
                    </DropdownItem>
                    <DropdownItem href="/account/wishlist" icon={<Heart className="size-4" />}>
                      Wishlist
                    </DropdownItem>
                    {user.role === "ADMIN" && (
                      <>
                        <DropdownDivider />
                        <DropdownItem href="/admin" icon={<LayoutDashboard className="size-4" />}>
                          Admin dashboard
                        </DropdownItem>
                      </>
                    )}
                  </div>
                  <DropdownDivider />
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.84rem] text-rose-brand transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </form>
                </Dropdown>
              ) : (
                <div className="hidden items-center gap-2 lg:flex">
                  <ButtonLink href="/login" variant="ghost" size="sm">
                    Sign in
                  </ButtonLink>
                  <ButtonLink href="/register" size="sm">
                    Register
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>

          {/* mobile search */}
          <div className="pb-3 lg:hidden">
            <SearchBar size="md" />
          </div>
        </div>

        {/* ---------------- desktop category nav + mega menu ---------------- */}
        <nav className="hidden border-t border-ink-100 lg:block" aria-label="Product categories">
          <div className="container-page flex flex-wrap items-center gap-x-1 gap-y-0.5 py-1">
            {categories.slice(0, 6).map((category) => (
              <div key={category.id} onMouseEnter={() => setOpenMega(category.slug)}>
                <Link
                  href={`/category/${category.slug}`}
                  onFocus={() => setOpenMega(category.slug)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[0.74rem] font-medium transition-colors xl:px-2.5 xl:text-[0.78rem]",
                    openMega === category.slug
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                  )}
                >
                  {category.name}
                  {category.children.length > 0 && <ChevronDown className="size-3.5 opacity-60" />}
                </Link>
              </div>
            ))}
            {categories.length > 6 && (
              <button
                type="button"
                aria-expanded={openMega === ALL_CATEGORIES_MENU}
                onMouseEnter={() => setOpenMega(ALL_CATEGORIES_MENU)}
                onFocus={() => setOpenMega(ALL_CATEGORIES_MENU)}
                onClick={() => setOpenMega(ALL_CATEGORIES_MENU)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[0.74rem] font-medium transition-colors xl:px-2.5 xl:text-[0.78rem]",
                  openMega === ALL_CATEGORIES_MENU
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                More <ChevronDown className="size-3.5 opacity-60" />
              </button>
            )}
            <Link
              href="/products"
              className="ml-auto rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Shop all deals
            </Link>
          </div>

          {openMega === ALL_CATEGORIES_MENU ? (
            <AllCategoriesMenu categories={categories} onClose={() => setOpenMega(null)} />
          ) : openMega ? (
            <MegaMenu
              category={categories.find((entry) => entry.slug === openMega)!}
              onClose={() => setOpenMega(null)}
            />
          ) : null}
        </nav>
      </header>

      {/* ---------------- mobile menu ---------------- */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} />

      <CartDrawer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Mega menu                                                           */
/* ------------------------------------------------------------------ */

function MegaMenu({ category, onClose }: { category: HeaderCategory; onClose: () => void }) {
  const children = category.children;

  return (
    <div
      className="absolute inset-x-0 top-full z-30 hidden border-b border-ink-200 bg-white shadow-lift lg:block"
      onMouseLeave={onClose}
    >
      <div className="container-page grid grid-cols-12 gap-6 py-6">
        <div className="col-span-3">
          <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-wider text-ink-400">
            Shop {category.name}
          </p>
          <Link
            href={`/category/${category.slug}`}
            className="group block overflow-hidden rounded-xl border border-ink-200"
          >
            <span className="relative block aspect-[16/10] bg-ink-100">
              <Image
                src={category.image ?? "/images/products/placeholder.svg"}
                alt={category.name}
                fill
                sizes="(max-width: 1024px) 30vw, 320px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
            </span>
            <span className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-[0.85rem] font-semibold text-ink-900">All {category.name}</span>
              <span className="text-[0.75rem] font-semibold text-brand-700">
                {category.productCount ?? 0} items
              </span>
            </span>
          </Link>
        </div>

        <div className="col-span-9">
          <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-wider text-ink-400">Browse by type</p>
          <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-ink-50"
              >
                <span className="truncate text-[0.85rem] text-ink-700 group-hover:text-brand-700">
                  {child.name}
                </span>
                <span className="shrink-0 text-[0.72rem] text-ink-400">{child.productCount ?? 0}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AllCategoriesMenu({
  categories,
  onClose,
}: {
  categories: HeaderCategory[];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-x-0 top-full z-30 hidden max-h-[min(75vh,44rem)] overflow-y-auto border-b border-ink-200 bg-white shadow-lift lg:block"
      onMouseLeave={onClose}
    >
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-5 py-6 md:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <section key={category.id} className="min-w-0">
            <Link
              href={`/category/${category.slug}`}
              className="inline-flex rounded-lg px-2.5 py-1.5 text-[0.86rem] font-semibold text-ink-900 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {category.name}
            </Link>
            {category.children.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/category/${child.slug}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[0.8rem] text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-700"
                    >
                      <span className="truncate">{child.name}</span>
                      <span className="shrink-0 text-[0.7rem] text-ink-400">
                        {child.productCount ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile menu                                                         */
/* ------------------------------------------------------------------ */

function MobileMenu({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: HeaderUser | null;
}) {
  const { setCartOpen } = useShop();
  const [tree, setTree] = React.useState<HeaderCategory[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const loaded = React.useRef(false);

  // Fetch the full category tree lazily the first time the drawer opens.
  React.useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;
    void fetch("/api/categories")
      .then((response) => response.json())
      .then((data: { categories?: HeaderCategory[] }) => setTree(data.categories ?? []))
      .catch(() => undefined);
  }, [open]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink-900/45 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(88vw,22rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main menu"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3.5">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {user ? (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-full text-[0.85rem] font-bold text-white"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.85rem] font-semibold text-ink-900">{user.name}</p>
                <Link href="/account" onClick={onClose} className="text-[0.75rem] font-semibold text-brand-700">
                  View account
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-3 grid grid-cols-2 gap-2">
              <ButtonLink href="/login" variant="outline" size="sm" onClick={onClose}>
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm" onClick={onClose}>
                Register
              </ButtonLink>
            </div>
          )}

          <nav className="space-y-0.5">
            <MobileLink href="/products" onClick={onClose} icon={<Package className="size-4 text-ink-400" />}>
              All products
            </MobileLink>
            <MobileLink href="/deals" onClick={onClose} icon={<ShoppingCart className="size-4 text-ink-400" />}>
              Today&apos;s deals
            </MobileLink>
            <MobileLink href="/brands" onClick={onClose} icon={<LayoutDashboard className="size-4 text-ink-400" />}>
              Brands
            </MobileLink>
            <MobileLink href="/track" onClick={onClose} icon={<Truck className="size-4 text-ink-400" />}>
              Track my order
            </MobileLink>
          </nav>

          <div className="my-3 h-px bg-ink-200" />
          <p className="px-3 pb-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-400">
            Shop by category
          </p>

          {tree.length === 0 ? (
            <div className="space-y-2 px-3 py-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton h-9 w-full" />
              ))}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {tree.map((category) => {
                const isOpen = expanded === category.slug;
                return (
                  <li key={category.id}>
                    <div className="flex items-center">
                      <Link
                        href={`/category/${category.slug}`}
                        onClick={onClose}
                        className="min-w-0 flex-1 truncate rounded-lg px-3 py-2.5 text-[0.86rem] font-medium text-ink-700 transition-colors hover:bg-ink-100"
                      >
                        {category.name}
                      </Link>
                      {category.children.length > 0 && (
                        <button
                          type="button"
                          aria-label={`${isOpen ? "Hide" : "Show"} ${category.name} subcategories`}
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : category.slug)}
                          className="grid size-9 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100"
                        >
                          <ChevronDown
                            className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <ul className="mb-1 ml-3 space-y-0.5 border-l border-ink-200 pl-2">
                        {category.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/category/${child.slug}`}
                              onClick={onClose}
                              className="block truncate rounded-lg px-3 py-2 text-[0.82rem] text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="my-3 h-px bg-ink-200" />
          <nav className="space-y-0.5">
            <MobileLink href="/help" onClick={onClose}>
              Help centre
            </MobileLink>
            <MobileLink href="/contact" onClick={onClose}>
              Contact us
            </MobileLink>
          </nav>
        </div>

        <div className="border-t border-ink-200 p-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              setCartOpen(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-[0.88rem] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <ShoppingCart className="size-4" /> View cart
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.86rem] font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
    >
      {icon}
      {children}
    </Link>
  );
}
