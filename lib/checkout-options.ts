export const SHIPPING_METHODS = ["delivery", "pickup"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const PAYMENT_METHODS = ["card", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STANDARD_SHIPPING_FEE = 4.9;
export const COD_FEE = 2;

/** Physical store used for pickup orders. */
export const STORE_PICKUP = {
  name: "SoYoung Kolonaki",
  line1: "12 Kolonaki Square",
  line2: undefined as string | undefined,
  city: "Athens",
  postalCode: "10673",
  country: "GR",
  phone: "+30 210 000 0000",
  hours: "Δευ–Σαβ 10:00–20:00",
  hoursEn: "Mon–Sat 10:00–20:00",
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
  if (afterDiscount >= freeThreshold || afterDiscount === 0) return 0;
  return STANDARD_SHIPPING_FEE;
}
