import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { runFullGeneration } from "@/lib/services/generateProject";
import { fetchImageAsBase64, errorMessage } from "@/lib/utils";

// Vision analysis + plan + design generation run sequentially and can
// exceed Vercel's default 10s function timeout on the Hobby plan.
export const maxDuration = 60;
import { AiConfigError } from "@/lib/ai/client";

/**
 * Runs ANALYSE IA -> PROPOSITION DE DESIGN -> TRAVAUX -> PRODUITS -> BUDGET
 * for a project that already has a photo + a saved brief.
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
    if (!detail.project.description) {
      return NextResponse.json(
        { error: "Ajoutez d'abord une description de votre projet." },
        { status: 400 }
      );
    }

    const { base64, mediaType } = await fetchImageAsBase64(detail.project.originalImageUrl);
    const nextVersion = detail.designs.length + 1;

    const result = await runFullGeneration(
      supabase,
      id,
      base64,
      mediaType,
      {
        description: detail.project.description,
        style: detail.project.style,
        budgetMax: detail.project.budgetMax,
        currency: detail.project.currency,
      },
      detail.project.originalImageUrl,
      nextVersion
    );

    return NextResponse.json({ detail: result });
  } catch (error) {
    console.error("POST /api/projects/[id]/generate failed", error);
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
