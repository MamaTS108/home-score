import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { getDesignProvider } from "@/lib/ai/design/generateDesign";
import { generateRenovationPrompt } from "@/lib/ai/design/generateRenovationPrompt";
import { fetchImageAsBase64, errorMessage } from "@/lib/utils";
import { AiConfigError } from "@/lib/ai/client";

export const maxDuration = 60;

/**
 * Regenerates ONLY the AI visualization (a new version), reusing the room
 * analysis and renovation plan already saved for this project. Cheaper and
 * faster than the full pipeline, and gives the user a simple way to retry
 * when a specific render has a problem (e.g. a blocked door/window) — AI
 * image generation has no 100% guarantee of respecting every constraint on
 * every attempt, so a manual "regenerate" is the practical safety net.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const { base64, mediaType } = await fetchImageAsBase64(detail.project.originalImageUrl);
    const nextVersion = detail.designs.length + 1;

    const brief = {
      description: detail.project.description,
      style: detail.project.style,
      budgetMax: detail.project.budgetMax,
      currency: detail.project.currency,
    };

    const prompt = generateRenovationPrompt(
      detail.analysis,
      brief,
      detail.plan,
      nextVersion > 1
        ? "Propose une disposition/organisation des meubles différente de la version précédente (autre agencement, autre placement), tout en gardant le même style, les mêmes matériaux et couleurs déjà demandés."
        : undefined
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
