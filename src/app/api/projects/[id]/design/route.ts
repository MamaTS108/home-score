import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { getDesignProvider } from "@/lib/ai/design/generateDesign";
import { generateRenovationPrompt } from "@/lib/ai/design/generateRenovationPrompt";
import { fetchImageAsBase64, errorMessage } from "@/lib/utils";
import { AiConfigError } from "@/lib/ai/client";
import { getPremiumStatus } from "@/lib/stripe/isUserPremium";

export const maxDuration = 60;

/** Generations 1 and 2 are free and shown in full. The 3rd is generated as a "teaser" but shown blurred until unlocked. From the 4th onward, generation itself is blocked until the project is unlocked or the user is Premium. */
const FREE_GENERATIONS = 2;
const MAX_TEASER_VERSION = FREE_GENERATIONS + 1;

/**
 * Regenerates ONLY the AI visualization (a new version), reusing the room
 * analysis and renovation plan already saved for this project. Cheaper and
 * faster than the full pipeline, and gives the user a simple way to retry
 * when a specific render has a problem (e.g. a blocked door/window) — AI
 * image generation has no 100% guarantee of respecting every constraint on
 * every attempt, so a manual "regenerate" is the practical safety net.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const source = body?.source === "selected" ? "selected" : "original";
    const sourceDesignId = typeof body?.sourceDesignId === "string" ? body.sourceDesignId : null;

    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);

    const detail = await repo.getProjectDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    if (!detail.analysis || !detail.plan) {
      return NextResponse.json(
        { error: "Générez d'abord une analyse complète avant de régénérer la visualisation." },
        { status: 400 }
      );
    }

    // Server-side enforcement of the free-tier limit — never trust the UI
    // alone, a request could be sent directly to this endpoint.
    if (!detail.project.premiumUnlocked && detail.designs.length >= MAX_TEASER_VERSION) {
      const sessionClient = await createSupabaseServerClient();
      const {
        data: { user },
      } = await sessionClient.auth.getUser();
      const premium = await getPremiumStatus(sessionClient, user?.id ?? null);

      if (!premium.isPremium) {
        return NextResponse.json(
          { error: "Limite gratuite atteinte. Débloquez ce projet ou passez Premium pour continuer.", paywall: true },
          { status: 402 }
        );
      }

      if (premium.quotaExceeded) {
        return NextResponse.json(
          {
            error: `Quota Premium atteint (${premium.generationsLimit} générations ce mois-ci). Débloquez ce projet à l'unité pour continuer, ou patientez le renouvellement de votre abonnement.`,
            paywall: true,
          },
          { status: 402 }
        );
      }
    }

    // "selected" edits whichever version is currently displayed on screen
    // (the right-hand card, or a clicked history thumbnail) — not blindly
    // the most recently generated one.
    const sourceDesign =
      source === "selected"
        ? (detail.designs.find((d) => d.id === sourceDesignId) ?? detail.designs[detail.designs.length - 1])
        : null;
    const baseImageUrl = sourceDesign ? sourceDesign.imageUrl : detail.project.originalImageUrl;

    const { base64, mediaType } = await fetchImageAsBase64(baseImageUrl);
    const nextVersion = detail.designs.length + 1;

    const brief = {
      description: detail.project.description,
      style: detail.project.style,
      budgetMax: detail.project.budgetMax,
      currency: detail.project.currency,
    };

    const defaultAlternativeNote =
      "Propose une disposition/organisation des meubles différente de la version précédente (autre agencement, autre placement), tout en gardant le même style, les mêmes matériaux et couleurs déjà demandés.";

    const prompt = generateRenovationPrompt(
      detail.analysis,
      brief,
      detail.plan,
      note || (nextVersion > 1 && source === "original" ? defaultAlternativeNote : undefined)
    );
    const designProvider = getDesignProvider(supabase);
    const design = await designProvider.generate({
      projectId: id,
      prompt,
      sourceImageUrl: detail.project.originalImageUrl,
      sourceImageBase64: base64,
      sourceImageMediaType: mediaType,
      version: nextVersion,
    });
    await repo.saveDesign(design);

    const updated = await repo.getProjectDetail(id);
    return NextResponse.json({ detail: updated });
  } catch (error) {
    console.error("POST /api/projects/[id]/design failed", error);
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
