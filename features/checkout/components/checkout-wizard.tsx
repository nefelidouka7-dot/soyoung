"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import {
  placeOrderAction,
  validateCheckoutTotals,
} from "@/features/checkout/actions";
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
import { shakeFieldsById, guardRequiredForm } from "@/lib/field-shake";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AccountMode = "guest" | "login" | "register";

const fieldClass = "mt-1.5 bg-transparent";
const panelClass = "py-7";
const sectionTitleClass = "font-serif text-xl text-ink";
const summaryClass =
  "border border-oak/35 bg-oak-soft/40 p-5 sm:p-6";

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
          ? "border-ink bg-oak-soft/40"
          : "border-oak/40 bg-transparent hover:border-oak"
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [couponPending, setCouponPending] = useState(false);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [accountMode, setAccountMode] = useState<AccountMode>("guest");
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
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function messageForField(id: string) {
    if (id === "email") return dict.checkout.invalidEmail;
    if (id === "phone") return dict.checkout.phoneNeeded;
    if (id === "firstName") return dict.checkout.firstNameNeeded;
    if (id === "lastName") return dict.checkout.lastNameNeeded;
    if (id === "line1") return dict.checkout.addressNeeded;
    if (id === "city") return dict.checkout.cityNeeded;
    if (id === "postalCode") return dict.checkout.postalNeeded;
    return dict.checkout.completeAddress;
  }

  function showMissingFields(ids: string[]) {
    const next: Record<string, string> = {};
    for (const id of ids) next[id] = messageForField(id);
    setFieldErrors(next);
    setError(null);
    shakeFieldsById(ids);
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

  function couponRejectionText(
    rejection: {
      reason: string;
      minOrderAmount?: number;
    } | null
  ) {
    if (!rejection) return dict.checkout.couponInvalid;
    switch (rejection.reason) {
      case "expired":
        return dict.checkout.couponExpired;
      case "not_started":
        return dict.checkout.couponNotStarted;
      case "usage_limit":
        return dict.checkout.couponUsageLimit;
      case "min_order":
        return t((d) => d.checkout.couponMinOrder, {
          amount: formatPrice(rejection.minOrderAmount ?? 0),
        });
      default:
        return dict.checkout.couponInvalid;
    }
  }

  async function refreshTotals(opts?: { fromCouponApply?: boolean }) {
    const code = couponCode.trim() || undefined;
    const res = await validateCheckoutTotals({
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      couponCode: code,
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

      if (code) {
        if (res.totals.couponCode && res.totals.discountAmount > 0) {
          setAppliedCoupon(res.totals.couponCode);
          setCouponMessage({
            tone: "ok",
            text: t((d) => d.checkout.discountApplied, {
              amount: formatPrice(res.totals.discountAmount),
            }),
          });
        } else if (opts?.fromCouponApply || appliedCoupon) {
          setAppliedCoupon(null);
          setCouponMessage({
            tone: "error",
            text: couponRejectionText(res.totals.couponRejection),
          });
        }
      } else {
        setAppliedCoupon(null);
        if (!opts?.fromCouponApply) setCouponMessage(null);
      }

      return true;
    }
    setError(res.error);
    return false;
  }

  async function applyCoupon() {
    setCouponPending(true);
    await refreshTotals({ fromCouponApply: true });
    setCouponPending(false);
  }

  function removeCoupon() {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponMessage(null);
    void validateCheckoutTotals({
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      shippingMethod,
      paymentMethod,
    }).then((res) => {
      if (res.ok) {
        setServerTotals({
          subtotal: res.totals.subtotal,
          discountAmount: res.totals.discountAmount,
          shippingAmount: res.totals.shippingAmount,
          paymentFee: res.totals.paymentFee,
          total: res.totals.total,
        });
      }
    });
  }

  useEffect(() => {
    if (items.length === 0) return;
    void refreshTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, shippingMethod, paymentMethod]);

  function missingContactFields() {
    const missing: string[] = [];
    if (!form.email.includes("@")) missing.push("email");
    if (!form.firstName.trim()) missing.push("firstName");
    if (!form.lastName.trim()) missing.push("lastName");
    if (!form.phone.trim()) missing.push("phone");
    return missing;
  }

  function missingAddressFields() {
    if (!needsAddress) return [];
    const missing: string[] = [];
    if (!form.line1.trim()) missing.push("line1");
    if (!form.city.trim()) missing.push("city");
    if (!form.postalCode.trim()) missing.push("postalCode");
    return missing;
  }

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
    const missing = missingContactFields();
    if (missing.length > 0) {
      showMissingFields(missing);
      return;
    }
    setFieldErrors({});
    const ok = await refreshTotals();
    if (ok) setStep(1);
  }

  async function placeOrder() {
    setPending(true);
    setError(null);
    const contactMissing = missingContactFields();
    const addressMissing = missingAddressFields();
    const detailsError = validateDetails();
    if (detailsError) {
      setPending(false);
      if (addressMissing.length > 0) {
        setStep(1);
        window.setTimeout(() => showMissingFields(addressMissing), 50);
      } else if (contactMissing.length > 0) {
        setStep(0);
        window.setTimeout(() => showMissingFields(contactMissing), 50);
      }
      return;
    }
    setFieldErrors({});

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

    if (paymentMethod === "card" && !res.mock && res.checkoutUrl) {
      clear();
      window.location.assign(res.checkoutUrl);
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

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

      <div className="mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 lg:order-1">
          {error ? (
            <p className="mb-5 text-sm text-coral" role="alert">
              {error}
            </p>
          ) : null}
          <div className="divide-y divide-oak/30">
          {step === 0 ? (
            <>
              {isAuthenticated ? (
                <div className={`${panelClass} text-sm leading-relaxed text-ink-muted first:pt-0`}>
                  {dict.checkout.signedInAs}{" "}
                  <span className="font-medium text-ink">{defaultEmail}</span>.{" "}
                  {dict.checkout.savedToAccount}
                </div>
              ) : (
                <section className={`${panelClass} first:pt-0`}>
                  <h2 className={sectionTitleClass}>{dict.checkout.account}</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    {dict.checkout.accountHint}
                  </p>
                  <div
                    className="mt-5 grid grid-cols-3 gap-px border border-oak/40 bg-oak/35"
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
                        className={`h-11 text-xs uppercase tracking-wide transition-colors ${
                          accountMode === mode
                            ? "bg-ink font-bold text-white"
                            : "bg-bg text-ink hover:bg-oak-soft/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {accountMode === "login" ? (
                    <form
                      className="mt-5 space-y-4 border-t border-oak/30 pt-5"
                      noValidate
                      onSubmit={guardRequiredForm}
                      action={async (fd) => {
                        setAuthPending(true);
                        setAuthError(null);
                        const res = await loginAction(null, fd);
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
                      noValidate
                      onSubmit={guardRequiredForm}
                      action={async (fd) => {
                        setAuthPending(true);
                        setAuthError(null);
                        const res = await registerAction(null, fd);
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
                    {dict.checkout.contactDetails}
                  </h2>
                  {!isAuthenticated && accountMode === "guest" ? (
                    <p className="mt-2 text-sm text-ink-muted">
                      {dict.checkout.guestHint}
                    </p>
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
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={
                          fieldErrors.email ? "email-error" : undefined
                        }
                      />
                      {fieldErrors.email ? (
                        <p
                          id="email-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.email}
                        </p>
                      ) : null}
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
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={
                          fieldErrors.phone ? "phone-error" : undefined
                        }
                      />
                      {fieldErrors.phone ? (
                        <p
                          id="phone-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.phone}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <Label htmlFor="firstName">{dict.checkout.firstName}</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        className={fieldClass}
                        autoComplete="given-name"
                        aria-invalid={Boolean(fieldErrors.firstName)}
                        aria-describedby={
                          fieldErrors.firstName ? "firstName-error" : undefined
                        }
                      />
                      {fieldErrors.firstName ? (
                        <p
                          id="firstName-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.firstName}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <Label htmlFor="lastName">{dict.checkout.lastName}</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        className={fieldClass}
                        autoComplete="family-name"
                        aria-invalid={Boolean(fieldErrors.lastName)}
                        aria-describedby={
                          fieldErrors.lastName ? "lastName-error" : undefined
                        }
                      />
                      {fieldErrors.lastName ? (
                        <p
                          id="lastName-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.lastName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              <section className={panelClass}>
                <h2 className={sectionTitleClass}>{dict.checkout.coupon}</h2>
                <div className="mt-4 flex items-stretch gap-2">
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    placeholder={dict.checkout.enterCode}
                    className="min-w-0 flex-1 bg-transparent uppercase"
                    aria-label={dict.checkout.coupon}
                    autoComplete="off"
                  />
                  {appliedCoupon ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={removeCoupon}
                    >
                      {dict.checkout.removeCoupon}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      disabled={couponPending || !couponCode.trim()}
                      onClick={() => void applyCoupon()}
                    >
                      {dict.checkout.apply}
                    </Button>
                  )}
                </div>
                {couponMessage ? (
                  <p
                    className={`mt-3 text-sm ${
                      couponMessage.tone === "ok"
                        ? "text-sage-dark"
                        : "text-coral"
                    }`}
                    role="status"
                  >
                    {couponMessage.text}
                  </p>
                ) : null}
              </section>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <section className={`${panelClass} first:pt-0`}>
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
                  <div className="mt-5 border border-oak/35 bg-oak-soft/30 px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                        {dict.checkout.freeShippingProgress}
                      </p>
                      <p className="text-xs tabular-nums text-ink-muted">
                        {formatPrice(afterDiscount)} /{" "}
                        {formatPrice(FREE_SHIPPING_THRESHOLD)}
                      </p>
                    </div>
                    <div className="mt-2.5 h-1 w-full overflow-hidden bg-oak/25">
                      <div
                        className="h-full bg-sage-dark/80 transition-[width] duration-500 ease-out"
                        style={{
                          width: `${Math.min(
                            100,
                            (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2.5 text-sm text-ink">
                      {t((d) => d.checkout.addMoreToUnlock, {
                        amount: formatPrice(remainingForFree),
                      })}
                    </p>
                  </div>
                ) : null}
                {shippingMethod === "delivery" && remainingForFree === 0 ? (
                  <div className="mt-5 flex items-start gap-3 border border-oak/35 bg-oak-soft/40 px-4 py-3.5">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                        {dict.checkout.unlocked}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-ink">
                        {dict.checkout.freeOnOrder}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {dict.checkout.freeOnOrderHint}
                      </p>
                    </div>
                  </div>
                ) : null}
                {shippingMethod === "pickup" ? (
                  <div className="mt-4 space-y-3 text-sm text-ink-muted">
                    <p>
                      {STORE_PICKUP.line1}, {STORE_PICKUP.postalCode}{" "}
                      {STORE_PICKUP.city}
                      {" · "}
                      <a
                        href={`tel:${STORE_PICKUP.phone.replace(/\s/g, "")}`}
                        className="text-ink underline-offset-2 hover:underline"
                      >
                        {STORE_PICKUP.phone}
                      </a>
                    </p>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                        {dict.checkout.pickupHours}
                      </p>
                      <dl className="mt-2 space-y-1">
                        {STORE_PICKUP.schedule.map((row) => (
                          <div
                            key={row.dayEn}
                            className="grid grid-cols-[6.5rem_1fr] gap-3 sm:grid-cols-[7.5rem_1fr]"
                          >
                            <dt className="text-ink">
                              {locale === "el" ? row.dayEl : row.dayEn}
                            </dt>
                            <dd>
                              {locale === "el" ? row.hoursEl : row.hoursEn}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                ) : null}
              </section>


              {needsAddress ? (
                <section className={panelClass}>
                  <h2 className={sectionTitleClass}>
                    {dict.checkout.contactShipping}
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="line1">{dict.checkout.address}</Label>
                      <Input
                        id="line1"
                        value={form.line1}
                        onChange={(e) => update("line1", e.target.value)}
                        className={fieldClass}
                        autoComplete="address-line1"
                        aria-invalid={Boolean(fieldErrors.line1)}
                        aria-describedby={
                          fieldErrors.line1 ? "line1-error" : undefined
                        }
                      />
                      {fieldErrors.line1 ? (
                        <p
                          id="line1-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.line1}
                        </p>
                      ) : null}
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
                        aria-invalid={Boolean(fieldErrors.city)}
                        aria-describedby={
                          fieldErrors.city ? "city-error" : undefined
                        }
                      />
                      {fieldErrors.city ? (
                        <p
                          id="city-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.city}
                        </p>
                      ) : null}
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
                        aria-invalid={Boolean(fieldErrors.postalCode)}
                        aria-describedby={
                          fieldErrors.postalCode
                            ? "postalCode-error"
                            : undefined
                        }
                      />
                      {fieldErrors.postalCode ? (
                        <p
                          id="postalCode-error"
                          className="mt-1.5 text-sm text-coral"
                          role="alert"
                        >
                          {fieldErrors.postalCode}
                        </p>
                      ) : null}
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
                  </div>
                </section>
              ) : null}

            <section className={panelClass}>
              <h2 className={sectionTitleClass}>
                {dict.checkout.paymentMethod}
              </h2>
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

              {paymentMethod === "card" ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  {dict.checkout.paymentSecure}
                </p>
              ) : null}

              <p className="mt-5 border-t border-oak/30 pt-4 text-xs leading-relaxed text-ink-muted">
                {dict.checkout.agreeTerms}
              </p>
            </section>
            </>
          ) : null}
          </div>

          <div className="mt-6">
            {step === 0 && showAddressForm ? (
              <div className="flex justify-end lg:hidden">
                <button
                  type="button"
                  onClick={goToPayment}
                  className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-sage px-7 text-[11px] uppercase tracking-[0.16em] font-bold text-white shadow-[0_14px_34px_-16px_rgba(43,41,39,0.45)] transition-colors hover:bg-sage-dark sm:w-auto sm:min-w-[15rem]"
                >
                  {dict.checkout.continuePayment}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
                    strokeWidth={1.75}
                  />
                </button>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 w-full sm:w-auto"
                  onClick={() => setStep(0)}
                >
                  {dict.checkout.back}
                </Button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={pending}
                  className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-sage px-7 text-[11px] uppercase tracking-[0.16em] font-bold text-white shadow-[0_14px_34px_-16px_rgba(43,41,39,0.45)] transition-colors hover:bg-sage-dark disabled:pointer-events-none disabled:opacity-50 sm:min-w-[14rem] sm:w-auto"
                >
                  {pending
                    ? dict.checkout.placingOrder
                    : dict.checkout.placeOrder}
                  {!pending ? (
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
                      strokeWidth={1.75}
                    />
                  ) : null}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="order-1 lg:sticky lg:top-24 lg:order-2">
          <div className={summaryClass}>
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

          {step === 0 && showAddressForm ? (
            <button
              type="button"
              onClick={goToPayment}
              className="group mt-4 hidden h-12 w-full items-center justify-center gap-2.5 bg-sage px-7 text-[11px] uppercase tracking-[0.16em] font-bold text-white shadow-[0_14px_34px_-16px_rgba(43,41,39,0.45)] transition-colors hover:bg-sage-dark lg:inline-flex"
            >
              {dict.checkout.continuePayment}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
