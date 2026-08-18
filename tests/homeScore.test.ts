import { describe, expect, it } from "vitest";
import { computeHomeScore } from "@/lib/homeScore";
import type { RoomAnalysis, RenovationPlan, BudgetSummary } from "@/lib/types";

const analysis: RoomAnalysis = {
  id: "a1",
  projectId: "p1",
  roomType: "living_room",
  roomTypeConfidence: 0.9,
  estimatedAreaM2: 25,
  walls: { description: "murs blancs", material: "plâtre", color: "blanc", condition: "bon" },
  floor: { description: "sol carrelé", material: "carrelage", color: "gris", condition: "usé" },
  ceiling: { description: "plafond blanc", condition: "bon" },
  openings: { doors: 1, windows: 2 },
  furniture: ["canapé", "table basse"],
  fixedElements: ["cheminée", "placard mural"],
  detectedMaterials: ["carrelage", "plâtre", "bois"],
  currentStyle: "classique",
  dominantColors: ["blanc", "gris"],
  notes: "",
  createdAt: new Date().toISOString(),
};

function makePlan(overrides: Partial<RenovationPlan> = {}): RenovationPlan {
  return {
    id: "plan-1",
    projectId: "p1",
    summary: "Salon moderne",
    tasks: overrides.tasks ?? [
      { id: "t1", name: "Peinture", description: "", difficulty: "easy", diyPossible: true, quantityEstimated: 10, unit: "L", requiresProfessional: false, order: 0 },
      { id: "t2", name: "Sol", description: "", difficulty: "medium", diyPossible: true, quantityEstimated: 25, unit: "m2", requiresProfessional: false, order: 1 },
    ],
    requiredMaterialCategories: ["peinture murale", "sol"],
    createdAt: new Date().toISOString(),
    version: 1,
  };
}

describe("computeHomeScore", () => {
  it("returns scores within 0-100", () => {
    const plan = makePlan();
    const budgetSummary: BudgetSummary = {
      userBudgetMax: 5000,
      estimatedProductsTotal: 2500,
      remaining: 2500,
      isOverBudget: false,
      currency: "EUR",
    };
    const score = computeHomeScore(analysis, plan, budgetSummary);
    for (const value of Object.values(score)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("lowers budget efficiency when over budget", () => {
    const plan = makePlan();
    const overBudget: BudgetSummary = {
      userBudgetMax: 1000,
      estimatedProductsTotal: 1500,
      remaining: -500,
      isOverBudget: true,
      currency: "EUR",
    };
    const underBudget: BudgetSummary = {
      userBudgetMax: 5000,
      estimatedProductsTotal: 1500,
      remaining: 3500,
      isOverBudget: false,
      currency: "EUR",
    };
    const overScore = computeHomeScore(analysis, plan, overBudget);
    const underScore = computeHomeScore(analysis, plan, underBudget);
    expect(overScore.budgetEfficiency).toBeLessThan(underScore.budgetEfficiency);
  });

  it("lowers complexity score when many tasks require a professional", () => {
    const easyPlan = makePlan();
    const hardPlan = makePlan({
      tasks: [
        { id: "t1", name: "Électricité", description: "", difficulty: "professional_required", diyPossible: false, quantityEstimated: null, unit: null, requiresProfessional: true, order: 0 },
        { id: "t2", name: "Plomberie", description: "", difficulty: "hard", diyPossible: false, quantityEstimated: null, unit: null, requiresProfessional: true, order: 1 },
      ],
    });
    const easyScore = computeHomeScore(analysis, easyPlan, null);
    const hardScore = computeHomeScore(analysis, hardPlan, null);
    expect(hardScore.renovationComplexity).toBeLessThan(easyScore.renovationComplexity);
  });
});
