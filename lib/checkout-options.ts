export const SHIPPING_METHODS = ["delivery", "pickup"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const PAYMENT_METHODS = ["card", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STANDARD_SHIPPING_FEE = 4.9;
export const COD_FEE = 2;

/** Physical store used for pickup orders. */
export const STORE_PICKUP = {
  name: "SoYoung Κοζάνη",
  line1: "Μακεδονομάχων 21",
  line2: undefined as string | undefined,
  city: "Κοζάνη",
  postalCode: "50100",
  country: "GR",
  phone: "+30 2461 025391",
  schedule: [
    {
      dayEl: "Δευτέρα",
      dayEn: "Monday",
      hoursEl: "10:00–14:30",
      hoursEn: "10:00 a.m.–2:30 p.m.",
    },
    {
      dayEl: "Τρίτη",
      dayEn: "Tuesday",
      hoursEl: "10:00–14:00, 17:30–21:00",
      hoursEn: "10:00 a.m.–2:00 p.m., 5:30–9:00 p.m.",
    },
    {
      dayEl: "Τετάρτη",
      dayEn: "Wednesday",
      hoursEl: "10:00–14:30",
      hoursEn: "10:00 a.m.–2:30 p.m.",
    },
    {
      dayEl: "Πέμπτη",
      dayEn: "Thursday",
      hoursEl: "10:00–14:00, 17:30–21:00",
      hoursEn: "10:00 a.m.–2:00 p.m., 5:30–9:00 p.m.",
    },
    {
      dayEl: "Παρασκευή",
      dayEn: "Friday",
      hoursEl: "10:00–14:00, 17:30–21:00",
      hoursEn: "10:00 a.m.–2:00 p.m., 5:30–9:00 p.m.",
    },
    {
      dayEl: "Σάββατο",
      dayEn: "Saturday",
      hoursEl: "10:00–15:00",
      hoursEn: "10:00 a.m.–3:00 p.m.",
    },
    {
      dayEl: "Κυριακή",
      dayEn: "Sunday",
      hoursEl: "Κλειστά",
      hoursEn: "Closed",
    },
  ],
} as const;

/** @deprecated use STORE_PICKUP */
export const STORE_PICKUP_ADDRESS = STORE_PICKUP;

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return (
    typeof value === "string" &&
    (SHIPPING_METHODS as readonly string[]).includes(value)
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

/** COD only makes sense with courier delivery. */
export function paymentMethodsForShipping(
  shippingMethod: ShippingMethod
): PaymentMethod[] {
  if (shippingMethod === "pickup") return ["card"];
  return ["card", "cod"];
}

export function isPaymentAllowed(
  shippingMethod: ShippingMethod,
  paymentMethod: PaymentMethod
): boolean {
  return paymentMethodsForShipping(shippingMethod).includes(paymentMethod);
}

export function isOfflinePayment(method: PaymentMethod): boolean {
  return method === "cod";
}

export function shippingFeeFor(
  shippingMethod: ShippingMethod,
  afterDiscount: number,
  freeThreshold: number
): number {
  if (shippingMethod === "pickup") return 0;
  if (afterDiscount >= freeThreshold) return 0;
  return STANDARD_SHIPPING_FEE;
}
