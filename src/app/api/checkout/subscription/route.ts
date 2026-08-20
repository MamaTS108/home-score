import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_PREMIUM } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_PRICE_PREMIUM) {
      return NextResponse.json(
        { error: "L'abonnement Premium n'est pas encore configuré (STRIPE_PRICE_PREMIUM manquant)." },
        { status: 503 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous pour souscrire à Premium." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const returnTo = typeof body?.returnTo === "string" ? body.returnTo : "/app";

    const origin = request.nextUrl.origin;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [{ price: STRIPE_PRICE_PREMIUM, quantity: 1 }],
      success_url: `${origin}${returnTo}?checkout=success`,
      cancel_url: `${origin}${returnTo}?checkout=canceled`,
      metadata: { user_id: user.id, kind: "premium_subscription" },
      subscription_data: { metadata: { user_id: user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/checkout/subscription failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
