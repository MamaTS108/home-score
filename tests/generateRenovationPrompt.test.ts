import { describe, expect, it } from "vitest";
import { generateRenovationPrompt } from "@/lib/ai/design/generateRenovationPrompt";
import type { ProjectBrief, RenovationPlan, RoomAnalysis } from "@/lib/types";

function makeAnalysis(overrides: Partial<RoomAnalysis> = {}): RoomAnalysis {
  return {
    id: "a1",
    projectId: "p1",
    roomType: overrides.roomType ?? "kitchen",
    roomTypeConfidence: 0.9,
    estimatedAreaM2: 12,
    walls: overrides.walls ?? { description: "murs blancs", material: null, color: "blanc", condition: null },
    floor: overrides.floor ?? { description: "carrelage", material: null, color: null, condition: null },
    ceiling: { description: "plafond blanc", condition: null },
    openings: { doors: 1, windows: 1 },
    furniture: overrides.furniture ?? ["table"],
    fixedElements: overrides.fixedElements ?? ["radiateur"],
    detectedMaterials: [],
    currentStyle: null,
    dominantColors: [],
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

function makeBrief(overrides: Partial<ProjectBrief> = {}): ProjectBrief {
  return {
    description: overrides.description ?? "Je veux une cuisine moderne blanche et bois.",
    style: overrides.style ?? "modern",
    budgetMax: "budgetMax" in overrides ? overrides.budgetMax! : 4000,
    currency: "EUR",
  };
}

describe("generateRenovationPrompt", () => {
  it("always leads with the fixed system constraints, never just the raw user text", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief(), null);
    expect(prompt.indexOf("SYSTEM CONSTRAINTS")).toBe(0);
    expect(prompt).toContain("Never obstruct or block a door, window, staircase");
    expect(prompt).toContain("USER RENOVATION REQUEST:");
    // The user's text must appear strictly after the system constraints section.
    expect(prompt.indexOf("SYSTEM CONSTRAINTS")).toBeLessThan(prompt.indexOf("USER RENOVATION REQUEST:"));
  });

  it("includes the priority order so conflicting instructions resolve safely", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief(), null);
    expect(prompt).toContain("priority order below only governs how to resolve conflicts");
    expect(prompt).toContain("(1) preserve real structure");
  });

  it("makes applying the visible renovation mandatory, not just preservation", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief(), null);
    expect(prompt).toContain("MANDATORY: you must actually apply the requested renovation");
    expect(prompt).toContain("clearly and visibly different from the original");
  });

  it("clarifies that furniture layout can be freely reorganized, unlike fixed architecture", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief(), null);
    expect(prompt).toContain("FURNITURE LAYOUT IS DIFFERENT FROM ARCHITECTURE");
    expect(prompt).toContain("A full furniture reorganization is a legitimate, encouraged renovation outcome");
  });

  it("includes room analysis grounding derived from vision, not invented", () => {
    const analysis = makeAnalysis({ fixedElements: ["radiateur", "cheminée"] });
    const prompt = generateRenovationPrompt(analysis, makeBrief(), null);
    expect(prompt).toContain("ROOM ANALYSIS");
    expect(prompt).toContain("radiateur, cheminée");
  });

  it("selects the low budget tier under 2000", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief({ budgetMax: 1000 }), null);
    expect(prompt).toContain("Low budget tier");
  });

  it("selects the mid budget tier between 2000 and 8000", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief({ budgetMax: 4000 }), null);
    expect(prompt).toContain("Mid budget tier");
  });

  it("selects the premium budget tier above 8000", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief({ budgetMax: 20000 }), null);
    expect(prompt).toContain("Premium budget tier");
  });

  it("handles no budget specified gracefully", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief({ budgetMax: null }), null);
    expect(prompt).toContain("not specified");
  });

  it("carries the iteration note forward as an addition, not a replacement", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief(), null, "je veux plus de bois");
    expect(prompt).toContain("Latest adjustment requested by the user");
    expect(prompt).toContain("je veux plus de bois");
    // original request must still be present alongside the iteration note
    expect(prompt).toContain("Je veux une cuisine moderne blanche et bois.");
  });

  it("does not force a style when the user picked 'free'", () => {
    const prompt = generateRenovationPrompt(makeAnalysis(), makeBrief({ style: "free" }), null);
    expect(prompt).toContain("no fixed style constraint");
  });
});
