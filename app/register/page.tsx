import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgePercent, Package, ShieldCheck, Truck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/layout/logo";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/params";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Join SoftDealz free — track orders, save a wishlist, check out faster and get 10% off your first order.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

const BENEFITS = [
  { icon: Truck, title: "Faster checkout", body: "Saved addresses and one-tap reorder" },
  { icon: Package, title: "Order tracking", body: "Live courier updates on every parcel" },
  { icon: BadgePercent, title: "10% welcome discount", body: "Code WELCOME10 for your first order" },
  { icon: ShieldCheck, title: "Buyer protection", body: "7 day returns on eligible items" },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(safeRedirectPath(next, "/account"));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* marketing panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-ocean-800 via-ocean-700 to-brand-600 lg:block">
        <Image
          src="/images/hero/hero-delivery.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-30 mix-blend-overlay"
          unoptimized
        />
        <div className="relative z-10 flex h-full flex-col justify-center px-14 py-16 xl:px-20">
          <Logo size="lg" inverted />
          <h2 className="mt-8 max-w-md text-fluid-4xl font-extrabold leading-tight text-white">
            Join 48,000 shoppers across Sri Lanka
          </h2>
          <p className="mt-4 max-w-md text-fluid-base text-white/85">
            Create a free account in under a minute. No fees, no commitments — just better prices and reliable
            delivery.
          </p>

          <div className="mt-9 grid max-w-md gap-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="flex items-start gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <benefit.icon className="size-5 text-white" />
                </span>
                <span>
                  <span className="block text-[0.88rem] font-semibold text-white">{benefit.title}</span>
                  <span className="block text-[0.78rem] text-white/75">{benefit.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* form */}
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Logo size="md" />
          </div>

          <h1 className="mt-6 text-fluid-3xl font-extrabold lg:mt-0">Create your account</h1>
          <p className="mt-2 text-[0.9rem] text-ink-500">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in instead
            </Link>
            .
          </p>

          <AuthForm mode="register" next={next} />
        </div>
      </div>
    </div>
  );
}
