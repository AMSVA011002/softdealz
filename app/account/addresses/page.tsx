import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { AddressManager } from "@/components/account/address-manager";
import { getCurrentUser } from "@/lib/auth";
import { listAddresses } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "My addresses",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const addresses = listAddresses(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-fluid-2xl font-extrabold">Delivery addresses</h1>
        <p className="mt-0.5 text-[0.85rem] text-ink-500">
          Save addresses to check out in seconds. Your default is preselected at checkout.
        </p>
      </div>

      <AddressManager
        addresses={addresses}
        user={{ name: user.name, phone: user.phone ?? "" }}
      />

      <div className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4">
        <MapPin className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p className="text-[0.82rem] text-ink-500">
          We deliver to all 25 districts in Sri Lanka. Delivery usually takes 2–4 working days, and cash on delivery is
          available everywhere.
        </p>
      </div>
    </div>
  );
}
