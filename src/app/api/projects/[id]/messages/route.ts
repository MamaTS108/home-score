import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { iterateOnProject } from "@/lib/ai/assistant/renovationAssistant";
import { runFullGeneration } from "@/lib/services/generateProject";
import { fetchImageAsBase64, errorMessage } from "@/lib/utils";
import { AiConfigError } from "@/lib/ai/client";

/**
 * Handles one turn of the "iterate on my project" conversation (section 6):
 * user sends a message ("je veux plus de bois", "budget max 4000€"...),
 * the assistant updates the brief and, if needed, re-runs the full
 * generation chain (new design + new plan + new budget).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { message } = (await request.json()) as { message: string };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message vide." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);

    const detail = await repo.getProjectDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    await repo.saveMessage({ projectId: id, role: "user", content: message });

    const currentBrief = {
      description: detail.project.description,
      style: detail.project.style,
      budgetMax: detail.project.budgetMax,
      currency: detail.project.currency,
    };

    const iteration = await iterateOnProject(message, currentBrief, detail.analysis, detail.plan, detail.messages);

    await repo.updateBrief(id, iteration.updatedBrief);
    await repo.saveMessage({ projectId: id, role: "assistant", content: iteration.reply });

    if (iteration.requiresNewPlan && detail.analysis) {
      const { base64, mediaType } = await fetchImageAsBase64(detail.project.originalImageUrl);
      const nextVersion = detail.designs.length + 1;

      await runFullGeneration(
        supabase,
        id,
        base64,
        mediaType,
        iteration.updatedBrief,
        detail.project.originalImageUrl,
        nextVersion
      );
    }

    const updated = await repo.getProjectDetail(id);
    return NextResponse.json({ detail: updated, reply: iteration.reply });
  } catch (error) {
    console.error("POST /api/projects/[id]/messages failed", error);
    if (error instanceof AiConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
