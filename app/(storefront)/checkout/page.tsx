import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { CheckoutWizard } from "@/features/checkout/components/checkout-wizard";

export const metadata: Metadata = {
  title: getDictionary().checkout.title,
};

export default async function CheckoutPage() {
  const session = await auth();
  return (
    <div className="container-page py-10 lg:py-14">
      <CheckoutWizard
        defaultEmail={session?.user?.email}
        isAuthenticated={Boolean(session?.user)}
        defaultName={session?.user?.name}
      />
    </div>
  );
}
