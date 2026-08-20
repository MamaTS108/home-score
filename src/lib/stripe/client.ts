import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/** Lazily creates the Stripe client — never at module load time, so builds don't fail without the key set. */
export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your environment variables (see .env.example)."
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });
  return stripeInstance;
}

export const STRIPE_PRICE_PREMIUM = process.env.STRIPE_PRICE_PREMIUM ?? "";
export const STRIPE_PRICE_UNLOCK_PROJECT = process.env.STRIPE_PRICE_UNLOCK_PROJECT ?? "";
