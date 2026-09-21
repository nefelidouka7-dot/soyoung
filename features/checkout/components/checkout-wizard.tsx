"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/features/cart/store";
import {
  placeOrderAction,
  validateCheckoutTotals,
} from "@/features/checkout/actions";
import { StripePaymentPanel } from "@/features/checkout/components/stripe-payment-panel";
import { loginAction, registerAction } from "@/features/auth/actions";
import {
  COD_FEE,
  paymentMethodsForShipping,
  shippingFeeFor,
  STANDARD_SHIPPING_FEE,
  STORE_PICKUP,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/checkout-options";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AccountMode = "guest" | "login" | "register";

const fieldClass = "mt-1.5";
const panelClass = "border border-oak/40 bg-bg-muted p-5 sm:p-6";
const sectionTitleClass = "font-serif text-xl text-ink";

function MethodRow({
  selected,
  title,
  description,
  priceLabel,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  priceLabel?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 border px-4 py-3.5 text-left transition-colors ${
        selected
          ? "border-ink bg-bg"
          : "border-oak/30 bg-bg/60 hover:border-oak"
      }`}
    >
      <span
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-ink" : "border-oak"
        }`}
        aria-hidden
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-ink">{title}</span>
          {priceLabel ? (
            <span className="shrink-0 tabular-nums text-sm text-ink">
              {priceLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
      </span>
    </button>
  );
}

export function CheckoutWizard({
  defaultEmail,
  isAuthenticated = false,
  defaultName,
}: {
  defaultEmail?: string | null;
  isAuthenticated?: boolean;
  defaultName?: string | null;
}) {
  const router = useRouter();
  const { dict, t, locale } = useTranslation();
  const STEPS = [dict.checkout.summary, dict.checkout.details] as const;
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [accountMode, setAccountMode] = useState<AccountMode>("guest");
  const [stripeCheckout, setStripeCheckout] = useState<{
    clientSecret: string;
    orderNumber: string;
  } | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState<
    | "invalidCredentials"
    | "checkDetails"
    | "emailExists"
    | "createdSignIn"
    | "invalidEmail"
    | "tooManyRequests"
    | null
  >(null);
  const [serverTotals, setServerTotals] = useState<{
    subtotal: number;
    discountAmount: number;
    shippingAmount: number;
    paymentFee: number;
    total: number;
  } | null>(null);

  const nameParts = (defaultName ?? "").trim().split(/\s+/);
  const [form, setForm] = useState({
    email: defaultEmail ?? "",
    phone: "",
    firstName: nameParts[0] && nameParts[0] !== "" ? nameParts[0] : "",
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "GR",
  });

  const clientSubtotal = useMemo(
    () => items.reduce((n, i) => n + i.price * i.quantity, 0),
    [items]
  );

  const availablePayments = paymentMethodsForShipping(shippingMethod);
  const needsAddress = shippingMethod === "delivery";

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function selectShipping(method: ShippingMethod) {
    setShippingMethod(method);
    const allowed = paymentMethodsForShipping(method);
    const nextPayment = allowed.includes(paymentMethod)
      ? paymentMethod
      : (allowed[0] ?? "card");
    if (nextPayment !== paymentMethod) {
      setPaymentMethod(nextPayment);
    }

    // Optimistic fees so pickup→courier doesn't flash “δωρεάν” from stale server totals.
    setServerTotals((prev) => {
      const subtotal = prev?.subtotal ?? clientSubtotal;
      const discountAmount = prev?.discountAmount ?? 0;
      const afterDiscount = Math.max(0, subtotal - discountAmount);
      const shippingAmount = shippingFeeFor(
        method,
        afterDiscount,
        FREE_SHIPPING_THRESHOLD
      );
      const paymentFee = nextPayment === "cod" ? COD_FEE : 0;
      return {
        subtotal,
        discountAmount,
        shippingAmount,
        paymentFee,
        total: afterDiscount + shippingAmount + paymentFee,
      };
    });
  }

  async function refreshTotals() {
    const res = await validateCheckoutTotals({
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      couponCode: couponCode || undefined,
      shippingMethod,
      paymentMethod,
    });
    if (res.ok) {
      setServerTotals({
        subtotal: res.totals.subtotal,
        discountAmount: res.totals.discountAmount,
        shippingAmount: res.totals.shippingAmount,
        paymentFee: res.totals.paymentFee,
        total: res.totals.total,
      });
      setError(null);
      return true;
    }
    setError(res.error);
    return false;
  }

  useEffect(() => {
    if (items.length === 0) return;
    void refreshTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, shippingMethod, paymentMethod]);

  function validateDetails(): string | null {
    if (!form.email.includes("@")) return dict.checkout.invalidEmail;
    if (!form.firstName || !form.lastName) return dict.checkout.completeContact;
    if (!form.phone.trim()) return dict.checkout.phoneNeeded;
    if (needsAddress && (!form.line1 || !form.city || !form.postalCode)) {
      return dict.checkout.completeAddress;
    }
    return null;
  }

  async function goToPayment() {
    setError(null);
    const detailsError = validateDetails();
    if (detailsError) {
      setError(detailsError);
      return;
    }
    const ok = await refreshTotals();
    if (ok) setStep(1);
  }

  async function placeOrder() {
    setPending(true);
    setError(null);
    const detailsError = validateDetails();
    if (detailsError) {
      setError(detailsError);
      setPending(false);
      setStep(0);
      return;
    }

    const res = await placeOrderAction({
      ...form,
      couponCode: couponCode || undefined,
      shippingMethod,
      paymentMethod,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    if (paymentMethod === "card" && !res.mock && res.clientSecret) {
      setStripeCheckout({
        clientSecret: res.clientSecret,
        orderNumber: res.orderNumber,
      });
      return;
    }

    clear();
    router.push(`/checkout/success?order=${res.orderNumber}`);
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-2xl">{dict.checkout.emptyBag}</p>
        <Link href="/skincare" className="mt-4 inline-block text-sm underline">
          {dict.checkout.continueShopping}
        </Link>
      </div>
    );
  }

  const fallbackShipping = shippingFeeFor(
    shippingMethod,
    clientSubtotal,
    FREE_SHIPPING_THRESHOLD
  );
  const fallbackFee = paymentMethod === "cod" ? COD_FEE : 0;
  const totals = serverTotals ?? {
    subtotal: clientSubtotal,
    discountAmount: 0,
    shippingAmount: fallbackShipping,
    paymentFee: fallbackFee,
    total: clientSubtotal + fallbackShipping + fallbackFee,
  };

  const afterDiscount = Math.max(0, totals.subtotal - totals.discountAmount);
  const remainingForFree = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - afterDiscount
  );
  // Always price the courier option for delivery — never reuse pickup's €0 fee.
  const courierFee = shippingFeeFor(
    "delivery",
    afterDiscount,
    FREE_SHIPPING_THRESHOLD
  );
  const courierPriceLabel =
    courierFee === 0 ? dict.checkout.free : formatPrice(STANDARD_SHIPPING_FEE);

  const resolvedShipping = shippingFeeFor(
    shippingMethod,
    afterDiscount,
    FREE_SHIPPING_THRESHOLD
  );
  const shippingLabel =
    shippingMethod === "pickup"
      ? dict.checkout.free
      : resolvedShipping === 0
        ? dict.checkout.freeShipping
        : formatPrice(resolvedShipping);

  const deliveryTitle =
    shippingMethod === "pickup"
      ? dict.checkout.pickup
      : dict.checkout.delivery;

  const paymentTitle =
    paymentMethod === "cod"
      ? dict.checkout.cashOnDelivery
      : dict.checkout.payByCard;

  const showAddressForm = isAuthenticated || accountMode === "guest";
  const storeHours =
    locale === "el" ? STORE_PICKUP.hours : STORE_PICKUP.hoursEn;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-4 border-b border-oak/30 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">
          {dict.checkout.title}
        </h1>
        <ol className="flex items-center gap-3 text-xs uppercase tracking-[0.14em]">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span
                className={
                  i === step
                    ? "text-ink"
                    : i < step
                      ? "text-sage"
                      : "text-ink-muted"
                }
              >
                <span className="mr-1.5 tabular-nums">{i + 1}</span>
                {s}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="h-px w-6 bg-oak/50" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {step === 0 ? (
            <>
              <section className={panelClass}>
                <h2 className={sectionTitleClass}>
                  {dict.checkout.shippingMethod}
                </h2>
                <div className="mt-5 space-y-2">
                  <MethodRow
                    selected={shippingMethod === "pickup"}
                    title={dict.checkout.pickup}
                    description={`${dict.checkout.pickupDesc} · ${dict.checkout.pickupReady}`}
                    priceLabel={dict.checkout.free}
                    onSelect={() => selectShipping("pickup")}
                  />
                  <MethodRow
                    selected={shippingMethod === "delivery"}
                    title={dict.checkout.delivery}
                    description={`${dict.checkout.deliveryDesc} · ${dict.checkout.deliveryEta}`}
                    priceLabel={courierPriceLabel}
                    onSelect={() => selectShipping("delivery")}
                  />
                </div>
                {shippingMethod === "delivery" && remainingForFree > 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">
                    {t((d) => d.checkout.addMoreToUnlock, {
                      amount: formatPrice(remainingForFree),
                    })}
                  </p>
                ) : null}
                {shippingMethod === "delivery" && remainingForFree === 0 ? (
                  <p className="mt-4 text-sm text-sage">
                    {dict.checkout.freeOnOrder}
                  </p>
                ) : null}
                {shippingMethod === "pickup" ? (
                  <p className="mt-4 text-sm text-ink-muted">
                    {STORE_PICKUP.line1}, {STORE_PICKUP.postalCode}{" "}
                    {STORE_PICKUP.city} · {dict.checkout.pickupHours}:{" "}
                    {storeHours}
                  </p>
                ) : null}
              </section>

              {isAuthenticated ? (
                <div className={`${panelClass} text-sm leading-relaxed`}>
                  {dict.checkout.signedInAs}{" "}
                  <span className="font-medium text-ink">{defaultEmail}</span>.{" "}
                  {dict.checkout.savedToAccount}
                </div>
              ) : (
                <section className={panelClass}>
                  <h2 className={sectionTitleClass}>{dict.checkout.account}</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    {dict.checkout.accountHint}
                  </p>
                  <div
                    className="mt-5 grid grid-cols-3 gap-px border border-oak/40 bg-oak/40"
                    role="tablist"
                    aria-label={dict.checkout.account}
                  >
                    {(
                      [
                        ["guest", dict.checkout.guest],
                        ["login", dict.checkout.signIn],
                        ["register", dict.checkout.register],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        role="tab"
                        aria-selected={accountMode === mode}
                        onClick={() => {
                          setAccountMode(mode);
                          setAuthError(null);
                        }}
                        className={`h-11 bg-bg text-xs uppercase tracking-wide transition-colors ${
                          accountMode === mode
                            ? "bg-ink text-bg"
                            : "text-ink hover:bg-bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {accountMode === "login" ? (
                    <form
                      className="mt-5 space-y-4 border-t border-oak/30 pt-5"
                      action={async (fd) => {
                        setAuthPending(true);
                        setAuthError(null);
                        const res = await loginAction(fd);
                        if (res?.error) setAuthError(res.error);
                        setAuthPending(false);
                      }}
                    >
                      <input type="hidden" name="callbackUrl" value="/checkout" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label htmlFor="login-email">
                            {dict.checkout.email}
                          </Label>
                          <Input
                            id="login-email"
                            name="email"
                            type="email"
                            required
                            className={fieldClass}
                            autoComplete="email"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="login-password">
                            {dict.checkout.password}
                          </Label>
                          <Input
                            id="login-password"
                            name="password"
                            type="password"
                            required
                            className={fieldClass}
                            autoComplete="current-password"
                          />
                        </div>
                      </div>
                      {authError ? (
                        <p className="text-sm text-coral">
                          {dict.auth.errors[authError]}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={authPending}
                      >
                        {authPending
                          ? dict.checkout.signingIn
                          : dict.checkout.signInContinue}
                      </Button>
                    </form>
                  ) : null}

                  {accountMode === "register" ? (
                    <form
                      className="mt-5 space-y-4 border-t border-oak/30 pt-5"
                      action={async (fd) => {
                        setAuthPending(true);
                        setAuthError(null);
                        const res = await registerAction(fd);
                        if (res?.error) setAuthError(res.error);
                        setAuthPending(false);
                      }}
                    >
                      <input type="hidden" name="callbackUrl" value="/checkout" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="reg-firstName">
                            {dict.checkout.firstName}
                          </Label>
                          <Input
                            id="reg-firstName"
                            name="firstName"
                            required
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <Label htmlFor="reg-lastName">
                            {dict.checkout.lastName}
                          </Label>
                          <Input
                            id="reg-lastName"
                            name="lastName"
                            required
                            className={fieldClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="reg-email">
                            {dict.checkout.email}
                          </Label>
                          <Input
                            id="reg-email"
                            name="email"
                            type="email"
                            required
                            className={fieldClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="reg-password">
                            {dict.checkout.password}
                          </Label>
                          <Input
                            id="reg-password"
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            className={fieldClass}
                          />
                          <p className="mt-1 text-xs text-ink-muted">
                            {dict.checkout.passwordHint}
                          </p>
                        </div>
                      </div>
                      {authError ? (
                        <p className="text-sm text-coral">
                          {dict.auth.errors[authError]}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={authPending}
                      >
                        {authPending
                          ? dict.checkout.creating
                          : dict.checkout.createContinue}
                      </Button>
                    </form>
                  ) : null}
                </section>
              )}

              {showAddressForm ? (
                <section className={panelClass}>
                  <h2 className={sectionTitleClass}>
                    {needsAddress
                      ? dict.checkout.contactShipping
                      : dict.checkout.contactDetails}
                  </h2>
                  {!isAuthenticated && accountMode === "guest" ? (
                    <p className="mt-2 text-sm text-ink-muted">
                      {dict.checkout.guestHint}
                    </p>
                  ) : null}

                  {!needsAddress ? (
                    <div className="mt-5 border border-oak/30 bg-bg px-4 py-4 text-sm">
                      <p className="text-xs uppercase tracking-wider text-ink-muted">
                        {dict.checkout.storeAddress}
                      </p>
                      <p className="mt-2 text-ink">{STORE_PICKUP.name}</p>
                      <p className="text-ink-muted">
                        {STORE_PICKUP.line1}, {STORE_PICKUP.postalCode}{" "}
                        {STORE_PICKUP.city}
                      </p>
                      <p className="mt-1 text-ink-muted">
                        {dict.checkout.pickupHours}: {storeHours}
                      </p>
                      <p className="text-ink-muted">{STORE_PICKUP.phone}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email">{dict.checkout.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className={fieldClass}
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{dict.checkout.phoneRequired}</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className={fieldClass}
                        autoComplete="tel"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">{dict.checkout.firstName}</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        className={fieldClass}
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{dict.checkout.lastName}</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        className={fieldClass}
                        autoComplete="family-name"
                      />
                    </div>
                    {needsAddress ? (
                      <>
                        <div className="sm:col-span-2">
                          <Label htmlFor="line1">{dict.checkout.address}</Label>
                          <Input
                            id="line1"
                            value={form.line1}
                            onChange={(e) => update("line1", e.target.value)}
                            className={fieldClass}
                            autoComplete="address-line1"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="line2">{dict.checkout.apartment}</Label>
                          <Input
                            id="line2"
                            value={form.line2}
                            onChange={(e) => update("line2", e.target.value)}
                            className={fieldClass}
                            autoComplete="address-line2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">{dict.checkout.city}</Label>
                          <Input
                            id="city"
                            value={form.city}
                            onChange={(e) => update("city", e.target.value)}
                            className={fieldClass}
                            autoComplete="address-level2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postalCode">
                            {dict.checkout.postalCode}
                          </Label>
                          <Input
                            id="postalCode"
                            value={form.postalCode}
                            onChange={(e) =>
                              update("postalCode", e.target.value)
                            }
                            className={fieldClass}
                            autoComplete="postal-code"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="country">{dict.checkout.country}</Label>
                          <Input
                            id="country"
                            value={form.country}
                            onChange={(e) => update("country", e.target.value)}
                            className={fieldClass}
                            autoComplete="country"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className={panelClass}>
                <h2 className={sectionTitleClass}>{dict.checkout.coupon}</h2>
                <div className="mt-4 flex items-stretch gap-2">
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder={dict.checkout.enterCode}
                    className="min-w-0 flex-1"
                    aria-label={dict.checkout.coupon}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={refreshTotals}
                  >
                    {dict.checkout.apply}
                  </Button>
                </div>
                {totals.discountAmount > 0 ? (
                  <p className="mt-3 text-sm text-sage">
                    {t((d) => d.checkout.discountApplied, {
                      amount: formatPrice(totals.discountAmount),
                    })}
                  </p>
                ) : null}
              </section>
            </>
          ) : null}

          {step === 1 ? (
            <section className={panelClass}>
              <h2 className={sectionTitleClass}>
                {dict.checkout.paymentMethod}
              </h2>
              {!stripeCheckout ? (
                <div className="mt-5 space-y-2">
                  {availablePayments.includes("cod") ? (
                    <MethodRow
                      selected={paymentMethod === "cod"}
                      title={dict.checkout.cashOnDelivery}
                      description={dict.checkout.cashOnDeliveryDesc}
                      priceLabel={`+${formatPrice(COD_FEE)}`}
                      onSelect={() => setPaymentMethod("cod")}
                    />
                  ) : null}
                  {availablePayments.includes("card") ? (
                    <MethodRow
                      selected={paymentMethod === "card"}
                      title={dict.checkout.payByCard}
                      description={dict.checkout.payByCardDesc}
                      onSelect={() => setPaymentMethod("card")}
                    />
                  ) : null}
                </div>
              ) : null}

              {paymentMethod === "card" && !stripeCheckout ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  {dict.checkout.paymentSecure}
                </p>
              ) : null}

              {stripeCheckout ? (
                <div className="mt-5">
                  <p className="mb-4 text-sm text-ink-muted">
                    {dict.checkout.order}{" "}
                    <span className="font-medium text-ink">
                      {stripeCheckout.orderNumber}
                    </span>
                  </p>
                  <p className="mb-4 text-sm text-ink-muted">
                    {dict.checkout.paymentNextStep}
                  </p>
                  <StripePaymentPanel
                    clientSecret={stripeCheckout.clientSecret}
                    orderNumber={stripeCheckout.orderNumber}
                    onSuccess={() => {
                      clear();
                      router.push(
                        `/checkout/success?order=${stripeCheckout.orderNumber}`
                      );
                    }}
                  />
                </div>
              ) : null}

              <p className="mt-5 border-t border-oak/30 pt-4 text-xs leading-relaxed text-ink-muted">
                {dict.checkout.agreeTerms}
              </p>
            </section>
          ) : null}

          {error ? <p className="text-sm text-coral">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-oak/30 pt-6">
            {step === 1 && !stripeCheckout ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(0)}
              >
                {dict.checkout.back}
              </Button>
            ) : null}
            {step === 0 && showAddressForm ? (
              <Button
                type="button"
                className="min-w-[11rem]"
                onClick={goToPayment}
              >
                {dict.checkout.continuePayment}
              </Button>
            ) : null}
            {step === 1 && !stripeCheckout ? (
              <Button
                type="button"
                className="min-w-[11rem]"
                onClick={placeOrder}
                disabled={pending}
              >
                {pending
                  ? dict.checkout.placingOrder
                  : paymentMethod === "card"
                    ? dict.checkout.payNow
                    : dict.checkout.placeOrder}
              </Button>
            ) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className={panelClass}>
            <h2 className={sectionTitleClass}>{dict.checkout.orderSummary}</h2>
            <ul className="mt-5 space-y-3">
              {items.map((i) => (
                <li
                  key={`${i.productId}-${i.variantId}`}
                  className="grid grid-cols-[1fr_auto] items-start gap-3 text-sm"
                >
                  <span className="min-w-0 leading-snug text-ink-muted">
                    <span className="line-clamp-2 text-ink">{i.name}</span>
                    <span className="mt-0.5 block tabular-nums">
                      × {i.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-oak/40 pt-4 text-sm">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <dt className="text-ink-muted">
                  {dict.checkout.selectedDelivery}
                </dt>
                <dd className="text-right text-ink">{deliveryTitle}</dd>
              </div>
              {step >= 1 ? (
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <dt className="text-ink-muted">
                    {dict.checkout.selectedPayment}
                  </dt>
                  <dd className="text-right text-ink">{paymentTitle}</dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-oak/30 pt-3">
                <dt className="text-ink-muted">{dict.checkout.subtotal}</dt>
                <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discountAmount > 0 ? (
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <dt className="text-ink-muted">{dict.checkout.discount}</dt>
                  <dd className="tabular-nums">
                    −{formatPrice(totals.discountAmount)}
                  </dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <dt className="text-ink-muted">{dict.checkout.shipping}</dt>
                <dd className="tabular-nums text-right">{shippingLabel}</dd>
              </div>
              {totals.paymentFee > 0 ? (
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <dt className="text-ink-muted">{dict.checkout.codFee}</dt>
                  <dd className="tabular-nums">
                    {formatPrice(totals.paymentFee)}
                  </dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[1fr_auto] gap-3 border-t border-oak/40 pt-3 text-base font-medium">
                <dt>{dict.checkout.total}</dt>
                <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
