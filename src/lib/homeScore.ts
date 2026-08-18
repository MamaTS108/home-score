import type { BudgetSummary, HomeScoreBreakdown, RenovationPlan, RoomAnalysis } from "@/lib/types";

/**
 * Home Score is a secondary, gamified indicator (section 16) — never the
 * core of the product. It's computed deterministically from data we already
 * have (analysis, plan, budget), not via an extra AI call, so it stays cheap
 * and explainable.
 */
export function computeHomeScore(
  analysis: RoomAnalysis,
  plan: RenovationPlan,
  budgetSummary: BudgetSummary | null
): HomeScoreBreakdown {
  const designPotential = scoreDesignPotential(analysis);
  const renovationComplexity = scoreComplexity(plan);
  const budgetEfficiency = scoreBudgetEfficiency(budgetSummary);

  const overall = Math.round(
    designPotential * 0.4 + renovationComplexity * 0.3 + budgetEfficiency * 0.3
  );

  return {
    overall: clampScore(overall),
    designPotential: clampScore(designPotential),
    renovationComplexity: clampScore(renovationComplexity),
    budgetEfficiency: clampScore(budgetEfficiency),
  };
}

function scoreDesignPotential(analysis: RoomAnalysis): number {
  // More detectable structure (materials, fixed elements, decent confidence)
  // means the AI has more to work with -> higher design potential.
  let score = 50;
  score += Math.min(analysis.detectedMaterials.length * 5, 20);
  score += Math.min(analysis.fixedElements.length * 3, 15);
  score += Math.round(analysis.roomTypeConfidence * 15);
  return score;
}

function scoreComplexity(plan: RenovationPlan): number {
  // Higher score = more manageable (less complex) project.
  const total = plan.tasks.length || 1;
  const hard = plan.tasks.filter((t) => t.difficulty === "hard" || t.requiresProfessional).length;
  const ratio = hard / total;
  return Math.round(100 - ratio * 70);
}

function scoreBudgetEfficiency(budgetSummary: BudgetSummary | null): number {
  if (!budgetSummary || budgetSummary.userBudgetMax === null) return 70;
  if (budgetSummary.userBudgetMax <= 0) return 50;

  const usageRatio = budgetSummary.estimatedProductsTotal / budgetSummary.userBudgetMax;

  if (usageRatio <= 0.7) return 90;
  if (usageRatio <= 1) return 75;
  if (usageRatio <= 1.2) return 45;
  return 25;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
