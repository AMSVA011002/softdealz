import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/layout/logo";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/params";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your SoftDealz account to track orders, manage your wishlist and check out faster.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

const PERKS = [
  "Track every order in real time",
  "Save items to a wishlist across devices",
  "One-tap checkout with saved addresses",
  "Member-only coupons and early access",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(safeRedirectPath(next, "/account"));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form */}
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <Logo size="md" />

          <h1 className="mt-8 text-fluid-3xl font-extrabold">Welcome back</h1>
          <p className="mt-2 text-[0.9rem] text-ink-500">
            Sign in to continue shopping, or{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:underline">
              create an account
            </Link>
            .
          </p>

          <AuthForm mode="login" next={next} />

          <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 p-4">
            <p className="text-[0.78rem] font-bold uppercase tracking-wide text-ink-500">Demo accounts</p>
            <ul className="mt-2 space-y-1.5 text-[0.82rem] text-ink-600">
              <li>
                <span className="font-semibold text-ink-900">Customer:</span> customer@softdealz.lk
              </li>
              <li>
                <span className="font-semibold text-ink-900">Admin:</span> admin@softdealz.lk
              </li>
            </ul>
            <p className="mt-2 text-[0.78rem] text-ink-500">
              Password for both: <span className="font-mono font-semibold">Password123!</span>
            </p>
          </div>
        </div>
      </div>

      {/* marketing panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-ocean-600 lg:block">
        <Image
          src="/images/hero/hero-sale.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-35 mix-blend-overlay"
          unoptimized
        />
        <div className="relative z-10 flex h-full flex-col justify-center px-14 py-16 xl:px-20">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-white backdrop-blur">
            <ShieldCheck className="size-3.5" /> Buyer protected
          </span>
          <h2 className="mt-5 max-w-md text-fluid-4xl font-extrabold leading-tight text-white">
            Your account makes shopping effortless
          </h2>
          <ul className="mt-7 space-y-3.5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-[0.92rem] text-white/90">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check className="size-3.5" />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-6">
            <div>
              <p className="text-fluid-2xl font-extrabold text-white">12k+</p>
              <p className="text-[0.75rem] text-white/70">Products listed</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-fluid-2xl font-extrabold text-white">48k+</p>
              <p className="text-[0.75rem] text-white/70">Happy shoppers</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-fluid-2xl font-extrabold text-white">4.8★</p>
              <p className="text-[0.75rem] text-white/70">Average rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
