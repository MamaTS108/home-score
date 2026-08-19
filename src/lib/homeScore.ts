import { ENERGY_CATEGORIES } from "@/lib/products/catalog";
import type { HomeScoreBreakdown, RenovationPlan, RoomAnalysis } from "@/lib/types";

export function computeHomeScore(analysis: RoomAnalysis, plan: RenovationPlan): HomeScoreBreakdown {
  const categories = new Set(plan.requiredMaterialCategories);

  const isolation = scoreDimension(categories.has(ENERGY_CATEGORIES.insulation), analysis, [
    "simple vitrage",
    "mono vitrage",
    "non isolé",
    "sans isolation",
    "isolation absente",
    "vétuste",
  ]);

  const heatingAddressed = categories.has(ENERGY_CATEGORIES.heating) || categories.has(ENERGY_CATEGORIES.ventilation);
  const chauffageVentilation = scoreDimension(heatingAddressed, analysis, [
    "ancien système de chauffage",
    "pas de ventilation",
    "absence de vmc",
    "chaudière ancienne",
  ]);

  const ouvertures = scoreDimension(categories.has(ENERGY_CATEGORIES.windows), analysis, [
    "simple vitrage",
    "mono vitrage",
    "fenêtre ancienne",
    "fenêtres anciennes",
  ]);

  const overall = Math.round((isolation + chauffageVentilation + ouvertures) / 3);

  return {
    overall: clampScore(overall),
    isolation: clampScore(isolation),
    chauffageVentilation: clampScore(chauffageVentilation),
    ouvertures: clampScore(ouvertures),
  };
}

function scoreDimension(addressedByPlan: boolean, analysis: RoomAnalysis, weaknessKeywords: string[]): number {
  const haystack = [
    analysis.walls.description,
    analysis.walls.condition ?? "",
    analysis.floor.description,
    analysis.floor.condition ?? "",
    analysis.ceiling.description,
    analysis.ceiling.condition ?? "",
    analysis.notes,
  ]
    .join(" ")
    .toLowerCase();

  const hasWeakness = weaknessKeywords.some((keyword) => haystack.includes(keyword));

  let score = hasWeakness ? 35 : 60;
  if (addressedByPlan) score += 35;

  return score;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
