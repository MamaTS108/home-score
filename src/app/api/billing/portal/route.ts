import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { errorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous d'abord." }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: sub } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement actif à gérer." }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/compte`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("POST /api/billing/portal failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
