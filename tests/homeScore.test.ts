import { describe, expect, it } from "vitest";
import { computeHomeScore } from "@/lib/homeScore";
import type { RoomAnalysis, RenovationPlan } from "@/lib/types";

function makeAnalysis(overrides: Partial<RoomAnalysis> = {}): RoomAnalysis {
  return {
    id: "a1",
    projectId: "p1",
    roomType: "living_room",
    roomTypeConfidence: 0.9,
    estimatedAreaM2: 25,
    walls: overrides.walls ?? { description: "murs blancs en bon état", material: "plâtre", color: "blanc", condition: "bon" },
    floor: overrides.floor ?? { description: "sol carrelé", material: "carrelage", color: "gris", condition: "bon" },
    ceiling: overrides.ceiling ?? { description: "plafond blanc", condition: "bon" },
    openings: { doors: 1, windows: 2 },
    furniture: [],
    fixedElements: [],
    detectedMaterials: [],
    currentStyle: null,
    dominantColors: [],
    notes: overrides.notes ?? "",
    createdAt: new Date().toISOString(),
  };
}

function makePlan(requiredMaterialCategories: string[] = []): RenovationPlan {
  return {
    id: "plan-1",
    projectId: "p1",
    summary: "Rénovation",
    tasks: [],
    requiredMaterialCategories,
    createdAt: new Date().toISOString(),
    version: 1,
  };
}

describe("computeHomeScore (energy focus)", () => {
  it("returns all scores within 0-100", () => {
    const score = computeHomeScore(makeAnalysis(), makePlan(["isolation", "chauffage", "fenêtres"]));
    for (const value of Object.values(score)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("scores isolation higher when the plan addresses insulation", () => {
    const analysis = makeAnalysis();
    const withInsulation = computeHomeScore(analysis, makePlan(["isolation"]));
    const withoutInsulation = computeHomeScore(analysis, makePlan([]));
    expect(withInsulation.isolation).toBeGreaterThan(withoutInsulation.isolation);
  });

  it("scores windows higher when the plan replaces them", () => {
    const analysis = makeAnalysis();
    const withWindows = computeHomeScore(analysis, makePlan(["fenêtres"]));
    const withoutWindows = computeHomeScore(analysis, makePlan([]));
    expect(withWindows.ouvertures).toBeGreaterThan(withoutWindows.ouvertures);
  });

  it("scores heating/ventilation higher when either is addressed", () => {
    const analysis = makeAnalysis();
    const withHeating = computeHomeScore(analysis, makePlan(["chauffage"]));
    const withVentilation = computeHomeScore(analysis, makePlan(["ventilation"]));
    const withNeither = computeHomeScore(analysis, makePlan([]));
    expect(withHeating.chauffageVentilation).toBeGreaterThan(withNeither.chauffageVentilation);
    expect(withVentilation.chauffageVentilation).toBeGreaterThan(withNeither.chauffageVentilation);
  });

  it("lowers the isolation baseline when vision detects an obvious weakness", () => {
    const weakAnalysis = makeAnalysis({
      walls: { description: "murs sans isolation, très froids", material: null, color: null, condition: "vétuste" },
    });
    const goodAnalysis = makeAnalysis();
    const weakScore = computeHomeScore(weakAnalysis, makePlan([]));
    const goodScore = computeHomeScore(goodAnalysis, makePlan([]));
    expect(weakScore.isolation).toBeLessThan(goodScore.isolation);
  });

  it("lowers the windows baseline when single glazing is detected", () => {
    const singleGlazing = makeAnalysis({
      walls: { description: "fenêtres en simple vitrage visibles", material: null, color: null, condition: null },
    });
    const goodAnalysis = makeAnalysis();
    const weakScore = computeHomeScore(singleGlazing, makePlan([]));
    const goodScore = computeHomeScore(goodAnalysis, makePlan([]));
    expect(weakScore.ouvertures).toBeLessThan(goodScore.ouvertures);
  });

  it("computes overall as the average of the three dimensions", () => {
    const score = computeHomeScore(makeAnalysis(), makePlan(["isolation", "chauffage", "fenêtres"]));
    const expectedAverage = Math.round((score.isolation + score.chauffageVentilation + score.ouvertures) / 3);
    expect(score.overall).toBe(expectedAverage);
  });
});
