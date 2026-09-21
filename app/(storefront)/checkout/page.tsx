import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getServerDictionary } from "@/lib/i18n/server";
import { CheckoutWizard } from "@/features/checkout/components/checkout-wizard";

export const metadata: Metadata = {
  title: getDictionary().checkout.title,
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const paymentFailed = sp.payment === "failed";
  const dict = paymentFailed ? await getServerDictionary() : null;

  return (
    <div className="container-page py-10 lg:py-14">
      {paymentFailed && dict ? (
        <p className="mb-6 border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {dict.checkout.paymentFailed}
        </p>
      ) : null}
      <CheckoutWizard
        defaultEmail={session?.user?.email}
        isAuthenticated={Boolean(session?.user)}
        defaultName={session?.user?.name}
      />
    </div>
  );
}
