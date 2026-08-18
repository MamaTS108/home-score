import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeRoom } from "@/lib/ai/vision/analyzeRoom";
import { generatePlan } from "@/lib/ai/renovation/generatePlan";
import { generateRenovationPrompt } from "@/lib/ai/design/generateRenovationPrompt";
import { getDesignProvider } from "@/lib/ai/design/generateDesign";
import { computeProductBudget } from "@/lib/budget/budgetEngine";
import { MockProductProvider } from "@/lib/products/MockProductProvider";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import type { ProjectBrief, ProjectDetail } from "@/lib/types";

const productProvider = new MockProductProvider();

/**
 * Runs the full chain for a project that already has a photo and a brief
 * (description/style/budget): vision analysis -> renovation plan -> product
 * budget -> design visualization. Used both for the initial generation and
 * for re-generation after an assistant iteration.
 */
export async function runFullGeneration(
  supabase: SupabaseClient,
  projectId: string,
  imageBase64: string,
  imageMediaType: "image/jpeg" | "image/png" | "image/webp",
  brief: ProjectBrief,
  originalImageUrl: string,
  nextVersion = 1
): Promise<ProjectDetail> {
  const repo = new ProjectRepository(supabase);

  await repo.updateStatus(projectId, "analyzing");

  const analysis = await analyzeRoom({ projectId, imageBase64, imageMediaType });
  await repo.saveAnalysis(analysis);
  await repo.updateRoomType(projectId, analysis.roomType);

  await repo.updateStatus(projectId, "planning");

  const plan = await generatePlan(projectId, analysis, brief, nextVersion);
  await repo.savePlan(plan);

  const productBudget = await computeProductBudget(plan, productProvider, brief.currency);
  await repo.saveProductBudget(projectId, productBudget);

  const prompt = generateRenovationPrompt(analysis, brief, plan);
  const designProvider = getDesignProvider();
  const design = await designProvider.generate({
    projectId,
    prompt,
    sourceImageUrl: originalImageUrl,
    version: nextVersion,
  });
  await repo.saveDesign(design);

  await repo.updateStatus(projectId, "ready");

  const detail = await repo.getProjectDetail(projectId);
  if (!detail) throw new Error("Project disappeared during generation.");
  return detail;
}
