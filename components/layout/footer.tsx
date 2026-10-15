import Link from "next/link";
import {
  AtSign,
  Camera,
  CirclePlay,
  Clock,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Truck,
  Undo2,
  CreditCard,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";

export interface FooterCategory {
  id: string;
  name: string;
  slug: string;
}

const HELP_LINKS = [
  { label: "Help centre", href: "/help" },
  { label: "Track your order", href: "/track" },
  { label: "Shipping & delivery", href: "/shipping" },
  { label: "Returns & refunds", href: "/returns" },
  { label: "Contact us", href: "/contact" },
  { label: "Warranty claims", href: "/help#warranty" },
];

const COMPANY_LINKS = [
  { label: "About SoftDealz", href: "/about" },
  { label: "Careers", href: "/about#careers" },
  { label: "Sell on SoftDealz", href: "/contact?topic=sell" },
  { label: "Terms of service", href: "/terms" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Cookie settings", href: "/privacy#cookies" },
];

const TRUST_ITEMS = [
  { icon: Truck, title: "Island-wide delivery", body: "2–4 working days to your door" },
  { icon: Undo2, title: "7 day easy returns", body: "Changed your mind? No problem" },
  { icon: ShieldCheck, title: "Buyer protection", body: "Every order is covered" },
  { icon: CreditCard, title: "Secure payments", body: "Cards, wallets or cash on delivery" },
];

export function Footer({
  categories,
  settings,
}: {
  categories: FooterCategory[];
  settings: Record<string, string>;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50 lg:mt-24">
      {/* trust strip */}
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[0.85rem] font-semibold text-ink-900">{item.title}</p>
                <p className="text-[0.76rem] leading-snug text-ink-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* brand + contact */}
          <div className="lg:col-span-4">
            <Logo size="md" />
            <p className="mt-4 max-w-sm text-[0.85rem] leading-relaxed text-ink-600">
              {settings.store_tagline ??
                "Sri Lanka's smartest marketplace"} — thousands of products from vetted sellers, with the prices and
              delivery you actually want.
            </p>

            <ul className="mt-5 space-y-2.5 text-[0.82rem] text-ink-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <span>{settings.address_line ?? "Colombo, Sri Lanka"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-brand-600" />
                <a href={`tel:${(settings.support_phone ?? "").replace(/\s+/g, "")}`} className="hover:text-brand-700">
                  {settings.support_phone ?? "+94 11 234 5678"}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-brand-600" />
                <a href={`mailto:${settings.support_email ?? "support@softdealz.lk"}`} className="hover:text-brand-700">
                  {settings.support_email ?? "support@softdealz.lk"}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-brand-600" />
                <span>Support: Mon–Sat, 8:30am – 8:00pm</span>
              </li>
            </ul>

            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: AtSign, label: "Facebook", href: "https://facebook.com" },
                { icon: Camera, label: "Instagram", href: "https://instagram.com" },
                { icon: Share2, label: "X", href: "https://x.com" },
                { icon: CirclePlay, label: "YouTube", href: "https://youtube.com" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-9 place-items-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-colors hover:border-brand-500 hover:text-brand-600"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* categories */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-[0.78rem] font-bold uppercase tracking-wider text-ink-900">
              Shop by category
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.83rem] sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-2.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className="text-ink-600 transition-colors hover:text-brand-700">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* help + company */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-[0.78rem] font-bold uppercase tracking-wider text-ink-900">Help</h2>
              <ul className="space-y-2.5 text-[0.83rem]">
                {HELP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ink-600 transition-colors hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-[0.78rem] font-bold uppercase tracking-wider text-ink-900">Company</h2>
              <ul className="space-y-2.5 text-[0.83rem]">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ink-600 transition-colors hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* newsletter */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-[0.78rem] font-bold uppercase tracking-wider text-ink-900">
              Deals in your inbox
            </h2>
            <p className="mb-3 text-[0.83rem] leading-relaxed text-ink-600">
              Join 40,000+ shoppers getting early access to flash sales and coupon codes. One email a week, no spam.
            </p>
            <NewsletterForm />

            <div className="mt-6 rounded-xl border border-ink-200 bg-white p-3.5">
              <p className="text-[0.72rem] font-bold uppercase tracking-wider text-ink-400">We accept</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["VISA", "Mastercard", "AMEX", "Cash on delivery", "Wallet"].map((method) => (
                  <span
                    key={method}
                    className="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-[0.66rem] font-semibold text-ink-600"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-200">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-[0.76rem] text-ink-500">
            © {year} {settings.store_name ?? "SoftDealz"}. All rights reserved.
          </p>
          <p className="text-[0.76rem] text-ink-500">
            Built for mobile, tablet, laptop and 4K displays ·{" "}
            <Link href="/privacy" className="hover:text-brand-700">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="hover:text-brand-700">
              Terms
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-ink-200/70">
        <p className="container-page py-3 text-center text-[0.76rem] text-ink-500">
          Designed and created by{" "}
          <a
            href="https://sva.onhercules.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-600 transition-colors hover:text-brand-700"
          >
            Susitha Viraj Aravinda
          </a>
        </p>
      </div>
    </footer>
  );
}
