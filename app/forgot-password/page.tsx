import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your SoftDealz account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="surface-brand min-h-screen">
      <div className="container-page py-10 lg:py-16">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <Logo size="md" />
          </div>

          <div className="card-surface mt-6 p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <KeyRound className="size-6" />
            </span>
            <h1 className="mt-4 text-fluid-2xl font-extrabold">Forgot your password?</h1>
            <p className="mt-2 text-[0.88rem] text-ink-500">
              Enter the email on your account and we&apos;ll send a reset link. In this demo build the link is generated
              locally instead of emailed.
            </p>

            <ForgotPasswordForm />

            <div className="mt-6 border-t border-ink-100 pt-5">
              <p className="flex items-start gap-2.5 text-[0.82rem] text-ink-500">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-ocean-600" />
                Remembered it after all?{" "}
                <Link href="/login" className="font-semibold text-brand-700 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <ButtonLink href="/help" variant="outline" size="sm">
              Visit the help centre
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" size="sm">
              Contact support
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
