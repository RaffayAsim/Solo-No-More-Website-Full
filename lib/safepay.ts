import crypto from "crypto";

const SAFEPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_SAFEPAY_PUBLIC_KEY || "sec_80befc29-3269-443f-abd7-dafa6bdd4662";
const SAFEPAY_SECRET_KEY = process.env.SAFEPAY_SECRET_KEY || "556f21c19b40c0d74a38bd0287956ba1645fe873e672209068b445515c60d14e";
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || "sandbox";

const BASE_API_URL =
  SAFEPAY_ENV === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";

const CHECKOUT_URL =
  SAFEPAY_ENV === "production"
    ? "https://getsafepay.com/checkout/pay"
    : "https://sandbox.api.getsafepay.com/checkout/pay";

export interface InitCheckoutOptions {
  amountPkr: number;
  orderId: string;
  customerEmail?: string;
  customerPhone?: string;
  redirectUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

export interface SafepayCheckoutSession {
  success: boolean;
  token?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Initializes a payment order with Safepay merchant API.
 * Returns the tracker token and hosted checkout URL.
 */
export async function initSafepayCheckout(
  options: InitCheckoutOptions
): Promise<SafepayCheckoutSession> {
  try {
    const response = await fetch(`${BASE_API_URL}/order/v1/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY,
      },
      body: JSON.stringify({
        client: SAFEPAY_PUBLIC_KEY,
        amount: Math.round(options.amountPkr),
        currency: "PKR",
        environment: SAFEPAY_ENV,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.data?.token) {
      console.error("[Safepay] Init failed:", data);
      return {
        success: false,
        error: data?.status?.message || "Failed to initialize Safepay checkout.",
      };
    }

    const trackerToken = data.data.token;
    const checkoutUrl = `${CHECKOUT_URL}?beacon=${encodeURIComponent(
      trackerToken
    )}&env=${SAFEPAY_ENV}&order_id=${encodeURIComponent(
      options.orderId
    )}&redirect_url=${encodeURIComponent(
      options.redirectUrl
    )}&cancel_url=${encodeURIComponent(options.cancelUrl)}`;

    return {
      success: true,
      token: trackerToken,
      checkoutUrl,
    };
  } catch (error: any) {
    console.error("[Safepay] Exception:", error);
    return {
      success: false,
      error: error?.message || "Network error connecting to Safepay.",
    };
  }
}

/**
 * Verifies Safepay webhook signature using HMAC-SHA256 and secret key.
 */
export function verifySafepaySignature(payload: string, signature: string): boolean {
  if (!signature || !payload) return false;
  try {
    const computed = crypto
      .createHmac("sha256", SAFEPAY_SECRET_KEY)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}
