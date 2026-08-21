import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const kind = session.metadata?.kind;

        console.log("Stripe webhook: checkout.session.completed", {
          kind,
          metadata: session.metadata,
          hasSubscription: !!session.subscription,
        });

        if (kind === "project_unlock") {
          const projectId = session.metadata?.project_id;
          if (projectId) {
            const { error } = await supabase
              .from("renovation_projects")
              .update({ premium_unlocked: true })
              .eq("id", projectId);
            if (error) throw error;
            console.log("Project unlocked", projectId);
          } else {
            console.warn("checkout.session.completed with kind=project_unlock but no project_id in metadata");
          }
        }

        if (kind === "premium_subscription") {
          const userId = session.metadata?.user_id;
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

          if (!userId || !subscriptionId) {
            console.warn("checkout.session.completed with kind=premium_subscription but missing data", {
              userId,
              subscriptionId,
              rawSubscription: session.subscription,
            });
          } else {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const periodStart = (subscription as unknown as { current_period_start?: number }).current_period_start;
            const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

            const { error } = await supabase.from("user_subscriptions").upsert({
              user_id: userId,
              stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
              stripe_subscription_id: subscriptionId,
              status: "active",
              current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            });
            if (error) throw error;
            console.log("Subscription activated for user", userId);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          const status =
            subscription.status === "active" || subscription.status === "trialing"
              ? "active"
              : subscription.status === "past_due"
                ? "past_due"
                : "canceled";

          const currentPeriodStartRaw = (subscription as unknown as { current_period_start?: number })
            .current_period_start;
          const currentPeriodEndRaw = (subscription as unknown as { current_period_end?: number })
            .current_period_end;

          const { error } = await supabase.from("user_subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
            stripe_subscription_id: subscription.id,
            status,
            current_period_start: currentPeriodStartRaw ? new Date(currentPeriodStartRaw * 1000).toISOString() : null,
            current_period_end: currentPeriodEndRaw ? new Date(currentPeriodEndRaw * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed", event.type, error);
    return NextResponse.json({ error: "Webhook handler error." }, { status: 500 });
  }
}
