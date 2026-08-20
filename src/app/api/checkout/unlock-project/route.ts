import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_UNLOCK_PROJECT } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { errorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_PRICE_UNLOCK_PROJECT) {
      return NextResponse.json(
        { error: "Le déblocage à l'unité n'est pas encore configuré (STRIPE_PRICE_UNLOCK_PROJECT manquant)." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const projectId = typeof body?.projectId === "string" ? body.projectId : null;
    if (!projectId) {
      return NextResponse.json({ error: "projectId manquant." }, { status: 400 });
    }

    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous pour débloquer ce projet." }, { status: 401 });
    }

    // Confirm the project exists and belongs to this user before charging anyone.
    const adminClient = createSupabaseAdminClient();
    const repo = new ProjectRepository(adminClient);
    const detail = await repo.getProjectDetail(projectId);
    if (!detail || detail.project.userId !== user.id) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    if (detail.project.premiumUnlocked) {
      return NextResponse.json({ error: "Ce projet est déjà débloqué." }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [{ price: STRIPE_PRICE_UNLOCK_PROJECT, quantity: 1 }],
      success_url: `${origin}/renovate/${projectId}/design?checkout=success`,
      cancel_url: `${origin}/renovate/${projectId}/design?checkout=canceled`,
      metadata: { user_id: user.id, project_id: projectId, kind: "project_unlock" },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/checkout/unlock-project failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
