import type { Metadata } from "next";
import { TrackForm } from "@/components/orders/track-form";
import { Breadcrumbs } from "@/components/ui/nav";
import { SectionHeading } from "@/components/ui/feedback";
import { Accordion } from "@/components/ui/nav";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Enter your SoftDealz order number to see live delivery status, courier details and estimated arrival.",
};

export default async function TrackPage() {
  const user = await getCurrentUser();
  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track order" }]} />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            eyebrow="Order tracking"
            title="Where is my parcel?"
            description={
              user
                ? "Enter the order number for an order placed by this account to see its latest status."
                : "Sign in to the account used to place your order to view private delivery and order details."
            }
            align="center"
          />
          {user ? (
            <TrackForm />
          ) : (
            <div className="card-surface mt-5 p-5 text-center">
              <p className="text-[0.88rem] text-ink-700">
                Order tracking is available only to the account that placed the order.
              </p>
              <ButtonLink href="/login?next=%2Ftrack" className="mt-4">
                Sign in to track your order
              </ButtonLink>
            </div>
          )}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="mb-4 text-fluid-xl font-bold">Delivery questions</h2>
          <Accordion
            items={[
              {
                id: "how-long",
                question: "How long does delivery take?",
                answer:
                  "Orders placed before 2pm are dispatched the same working day. Colombo and suburbs usually arrive in 1–2 working days; other districts take 2–4 working days.",
              },
              {
                id: "no-tracking",
                question: "My tracking number isn't updating",
                answer:
                  "Courier scans can lag by a few hours, especially overnight. If nothing changes for 48 hours, contact support with your order number and we'll chase it with the carrier.",
              },
              {
                id: "cod",
                question: "Can I pay cash on delivery?",
                answer:
                  "Yes — cash on delivery is available in all 25 districts. Please have the exact amount ready; couriers cannot always provide change for large notes.",
              },
              {
                id: "missed",
                question: "What if I miss the delivery?",
                answer:
                  "Couriers attempt delivery up to three times and leave a note each time. You can also call them to rearrange using the number shown on your tracking page.",
              },
            ]}
            defaultOpen={["how-long"]}
          />
        </div>
      </div>
    </div>
  );
}
