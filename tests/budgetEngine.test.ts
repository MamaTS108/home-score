import { describe, expect, it } from "vitest";
import {
  computeBudgetSummary,
  computeProductBudget,
  deriveMaterialRequirements,
  suggestOptimizationTargets,
  summarizeLines,
} from "@/lib/budget/budgetEngine";
import { MockProductProvider } from "@/lib/products/MockProductProvider";
import type { ProductLine, RenovationPlan, RenovationTask } from "@/lib/types";

function makeTask(overrides: Partial<RenovationTask>): RenovationTask {
  return {
    id: overrides.id ?? "task-1",
    name: overrides.name ?? "Peinture",
    description: overrides.description ?? "Peindre les murs",
    difficulty: overrides.difficulty ?? "medium",
    diyPossible: overrides.diyPossible ?? true,
    quantityEstimated: overrides.quantityEstimated ?? 10,
    unit: overrides.unit ?? "L",
    requiresProfessional: overrides.requiresProfessional ?? false,
    order: overrides.order ?? 0,
  };
}

function makePlan(overrides: Partial<RenovationPlan> = {}): RenovationPlan {
  return {
    id: overrides.id ?? "plan-1",
    projectId: overrides.projectId ?? "project-1",
    summary: overrides.summary ?? "Salon moderne chaleureux",
    tasks: overrides.tasks ?? [
      makeTask({ id: "t1", name: "peinture murale", quantityEstimated: 10, unit: "L" }),
      makeTask({ id: "t2", name: "sol", quantityEstimated: 25, unit: "m2" }),
      makeTask({ id: "t3", name: "plinthes", quantityEstimated: 20, unit: "m" }),
    ],
    requiredMaterialCategories: overrides.requiredMaterialCategories ?? [
      "peinture murale",
      "sol",
      "plinthes",
      "accessoires",
    ],
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    version: overrides.version ?? 1,
  };
}

describe("deriveMaterialRequirements", () => {
  it("matches plan categories to task quantities", () => {
    const plan = makePlan();
    const requirements = deriveMaterialRequirements(plan);

    expect(requirements).toContainEqual({ category: "peinture murale", quantity: 10, unit: "L" });
    expect(requirements).toContainEqual({ category: "sol", quantity: 25, unit: "m2" });
    expect(requirements).toContainEqual({ category: "plinthes", quantity: 20, unit: "m" });
  });

  it("defaults to quantity 1 / unit 'unit' when no task matches a category", () => {
    const plan = makePlan({
      tasks: [],
      requiredMaterialCategories: ["rangement"],
    });
    const requirements = deriveMaterialRequirements(plan);
    expect(requirements).toEqual([{ category: "rangement", quantity: 1, unit: "unit" }]);
  });
});

describe("computeProductBudget (with MockProductProvider)", () => {
  it("resolves plan categories into priced product lines", async () => {
    const provider = new MockProductProvider();
    const plan = makePlan();

    const budget = await computeProductBudget(plan, provider);

    expect(budget.lines.length).toBeGreaterThan(0);
    expect(budget.currency).toBe("EUR");
    expect(budget.estimatedProductsTotal).toBeCloseTo(budget.materials + budget.accessories, 5);
    // every line total should equal quantity * unit price
    for (const line of budget.lines) {
      expect(line.estimatedTotal).toBeCloseTo(line.quantity * line.estimatedUnitPrice, 5);
    }
  });

  it("skips categories with no catalog match instead of throwing", async () => {
    const provider = new MockProductProvider();
    const plan = makePlan({ requiredMaterialCategories: ["catégorie-inexistante-xyz"] });

    const budget = await computeProductBudget(plan, provider);
    expect(budget.lines).toEqual([]);
    expect(budget.estimatedProductsTotal).toBe(0);
  });
});

describe("summarizeLines", () => {
  it("splits materials vs accessories correctly", () => {
    const lines: ProductLine[] = [
      { id: "1", productId: "p1", name: "Parquet", category: "sol", quantity: 25, unit: "m2", estimatedUnitPrice: 22, estimatedTotal: 550, currency: "EUR", provider: "mock" },
      { id: "2", productId: "p2", name: "Visserie", category: "accessoires", quantity: 1, unit: "unit", estimatedUnitPrice: 25, estimatedTotal: 25, currency: "EUR", provider: "mock" },
    ];
    const budget = summarizeLines(lines);
    expect(budget.materials).toBe(550);
    expect(budget.accessories).toBe(25);
    expect(budget.estimatedProductsTotal).toBe(575);
  });
});

describe("computeBudgetSummary", () => {
  it("computes remaining budget when under budget", () => {
    const productBudget = summarizeLines([
      { id: "1", productId: "p1", name: "Parquet", category: "sol", quantity: 25, unit: "m2", estimatedUnitPrice: 22, estimatedTotal: 550, currency: "EUR", provider: "mock" },
    ]);
    const summary = computeBudgetSummary(productBudget, 1000);
    expect(summary.remaining).toBe(450);
    expect(summary.isOverBudget).toBe(false);
  });

  it("detects over-budget projects", () => {
    const productBudget = summarizeLines([
      { id: "1", productId: "p1", name: "Parquet", category: "sol", quantity: 25, unit: "m2", estimatedUnitPrice: 22, estimatedTotal: 550, currency: "EUR", provider: "mock" },
    ]);
    const summary = computeBudgetSummary(productBudget, 300);
    expect(summary.remaining).toBe(-250);
    expect(summary.isOverBudget).toBe(true);
  });

  it("returns null remaining when the user set no budget", () => {
    const productBudget = summarizeLines([]);
    const summary = computeBudgetSummary(productBudget, null);
    expect(summary.remaining).toBeNull();
    expect(summary.isOverBudget).toBe(false);
  });
});

describe("suggestOptimizationTargets", () => {
  it("returns the largest lines first", () => {
    const productBudget = summarizeLines([
      { id: "1", productId: "p1", name: "Parquet", category: "sol", quantity: 25, unit: "m2", estimatedUnitPrice: 22, estimatedTotal: 550, currency: "EUR", provider: "mock" },
      { id: "2", productId: "p2", name: "Peinture", category: "peinture murale", quantity: 10, unit: "L", estimatedUnitPrice: 15, estimatedTotal: 150, currency: "EUR", provider: "mock" },
      { id: "3", productId: "p3", name: "Rangement", category: "rangement", quantity: 1, unit: "unit", estimatedUnitPrice: 220, estimatedTotal: 220, currency: "EUR", provider: "mock" },
    ]);
    const targets = suggestOptimizationTargets(productBudget, 2);
    expect(targets.map((l) => l.id)).toEqual(["1", "3"]);
  });
});
