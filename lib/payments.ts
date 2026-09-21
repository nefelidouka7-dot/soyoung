/**
 * Viva.com (Smart Checkout) payment helpers.
 * @see https://developer.viva.com/smart-checkout/smart-checkout-integration
 */

const isDemo = () =>
  (process.env.VIVA_ENV ?? "demo").toLowerCase() !== "production";

function accountsBase() {
  return isDemo()
    ? "https://demo-accounts.vivapayments.com"
    : "https://accounts.vivapayments.com";
}

function apiBase() {
  return isDemo()
    ? "https://demo-api.vivapayments.com"
    : "https://api.vivapayments.com";
}

function checkoutBase() {
  return isDemo()
    ? "https://demo.vivapayments.com"
    : "https://www.vivapayments.com";
}

function webhookKeyUrl() {
  return isDemo()
    ? "https://demo.vivapayments.com/api/messages/config/token"
    : "https://www.vivapayments.com/api/messages/config/token";
}

export function isVivaConfigured() {
  return Boolean(
    process.env.VIVA_CLIENT_ID?.trim() &&
      process.env.VIVA_CLIENT_SECRET?.trim() &&
      process.env.VIVA_SOURCE_CODE?.trim()
  );
}

export type PaymentOrderResult = {
  /** Viva 16-digit order code (store as string). */
  orderCode: string;
  checkoutUrl: string;
  mock: boolean;
};

function assertMockPaymentsAllowed() {
  const allowMock =
    process.env.ALLOW_MOCK_PAYMENTS === "true" ||
    process.env.NODE_ENV !== "production";
  if (!allowMock) {
    throw new Error(
      "Payments are not configured. Set VIVA_CLIENT_ID, VIVA_CLIENT_SECRET, and VIVA_SOURCE_CODE in production."
    );
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.VIVA_CLIENT_ID?.trim();
  const clientSecret = process.env.VIVA_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Missing VIVA_CLIENT_ID / VIVA_CLIENT_SECRET.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "urn:viva:payments:core:api:redirectcheckout",
  });

  const res = await fetch(`${accountsBase()}/connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viva token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

export function getSmartCheckoutUrl(orderCode: string) {
  const color = process.env.VIVA_CHECKOUT_COLOR?.replace("#", "");
  const params = new URLSearchParams({ ref: orderCode });
  if (color) params.set("color", color);
  return `${checkoutBase()}/web/checkout?${params.toString()}`;
}

/** Create a Viva payment order, or a mock ID when keys are absent (dev only). */
export async function createPaymentOrder(input: {
  amountEur: number;
  orderNumber: string;
  email: string;
  fullName: string;
  phone?: string;
  requestLang?: "el-GR" | "en-GB";
}): Promise<PaymentOrderResult> {
  if (!isVivaConfigured()) {
    assertMockPaymentsAllowed();
    const orderCode = `mock_${Date.now()}`;
    return {
      orderCode,
      checkoutUrl: "",
      mock: true,
    };
  }

  const amountCents = Math.round(input.amountEur * 100);
  if (amountCents < 30) {
    throw new Error("Minimum payable amount is €0.30.");
  }

  const token = await getAccessToken();
  const sourceCode = process.env.VIVA_SOURCE_CODE!.trim();

  const res = await fetch(`${apiBase()}/checkout/v2/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountCents,
      customerTrns: `SoYoung order ${input.orderNumber}`,
      merchantTrns: input.orderNumber,
      sourceCode,
      customer: {
        email: input.email,
        fullName: input.fullName,
        phone: input.phone?.replace(/\s/g, "") || undefined,
        countryCode: "GR",
        requestLang: input.requestLang ?? "el-GR",
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viva create order failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { orderCode: number | string };
  const orderCode = String(data.orderCode);

  return {
    orderCode,
    checkoutUrl: getSmartCheckoutUrl(orderCode),
    mock: false,
  };
}

export async function retrieveVivaTransaction(transactionId: string) {
  const token = await getAccessToken();
  const res = await fetch(
    `${apiBase()}/checkout/v2/transactions/${encodeURIComponent(transactionId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viva retrieve transaction failed (${res.status}): ${text}`);
  }
  return (await res.json()) as {
    email?: string;
    amount: number;
    orderCode: number | string;
    statusId: string;
    merchantTrns?: string;
    customerTrns?: string;
  };
}

/** Key pair returned during Viva webhook URL verification (GET). */
export async function getVivaWebhookVerificationKey() {
  const merchantId = process.env.VIVA_MERCHANT_ID?.trim();
  const apiKey = process.env.VIVA_API_KEY?.trim();
  if (!merchantId || !apiKey) {
    throw new Error("Missing VIVA_MERCHANT_ID / VIVA_API_KEY for webhook verify.");
  }
  const basic = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
  const res = await fetch(webhookKeyUrl(), {
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viva webhook key failed (${res.status}): ${text}`);
  }
  return (await res.json()) as { Key?: string; key?: string; [k: string]: unknown };
}
