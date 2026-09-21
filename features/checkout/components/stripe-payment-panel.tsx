"use client";

import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentFormInner({
  orderNumber,
  onSuccess,
}: {
  orderNumber: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { dict } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);

    const returnUrl = `${window.location.origin}/checkout/success?order=${encodeURIComponent(orderNumber)}`;
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? dict.checkout.paymentFailed);
      setPending(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={!stripe || pending}>
        {pending ? dict.checkout.placingOrder : dict.checkout.payNow}
      </Button>
    </form>
  );
}

export function StripePaymentPanel({
  clientSecret,
  orderNumber,
  onSuccess,
}: {
  clientSecret: string;
  orderNumber: string;
  onSuccess: () => void;
}) {
  const { dict } = useTranslation();
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#8a9a86",
          colorBackground: "#faf4ed",
          colorText: "#2b2927",
          colorDanger: "#e08a79",
          borderRadius: "2px",
          fontFamily: "Manrope, system-ui, sans-serif",
        },
      },
    }),
    [clientSecret]
  );

  if (!stripePromise) {
    return (
      <p className="text-sm text-coral">{dict.checkout.paymentUnavailable}</p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner orderNumber={orderNumber} onSuccess={onSuccess} />
    </Elements>
  );
}
