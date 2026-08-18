import type { ProjectBrief, RenovationPlan, RoomAnalysis } from "@/lib/types";

/**
 * Turns the room analysis + user brief + plan into a single, image-generation
 * ready prompt. Kept separate from generateDesign.ts so the prompt-crafting
 * logic can be unit tested / iterated on independently of whichever
 * image-generation backend ends up behind DesignProvider.
 */
export function generateRenovationPrompt(
  analysis: RoomAnalysis,
  brief: ProjectBrief,
  plan: RenovationPlan | null,
  iterationNote?: string
): string {
  const parts: string[] = [];

  parts.push(
    `Photorealistic interior renovation visualization of a ${translateRoomType(analysis.roomType)}.`
  );
  parts.push(
    `Keep the original architecture, window and door positions, and overall proportions of the room unchanged.`
  );

  if (analysis.walls.description) parts.push(`Current walls: ${analysis.walls.description}.`);
  if (analysis.floor.description) parts.push(`Current floor: ${analysis.floor.description}.`);

  parts.push(`Target style: ${translateStyle(brief.style)}.`);
  parts.push(`Renovation brief: ${brief.description}`);

  if (plan) {
    const materialHints = plan.requiredMaterialCategories.join(", ");
    if (materialHints) parts.push(`Materials to reflect visually: ${materialHints}.`);
  }

  if (iterationNote) {
    parts.push(`Latest adjustment requested by the user: ${iterationNote}`);
  }

  parts.push("High-quality, realistic lighting, magazine-style interior photography.");

  return parts.join(" ");
}

function translateRoomType(roomType: RoomAnalysis["roomType"]): string {
  const map: Record<RoomAnalysis["roomType"], string> = {
    living_room: "living room",
    kitchen: "kitchen",
    bedroom: "bedroom",
    bathroom: "bathroom",
    hallway: "hallway",
    office: "home office",
    dining_room: "dining room",
    other: "room",
  };
  return map[roomType];
}

function translateStyle(style: ProjectBrief["style"]): string {
  const map: Record<ProjectBrief["style"], string> = {
    modern: "modern",
    scandinavian: "Scandinavian",
    minimalist: "minimalist",
    industrial: "industrial",
    contemporary: "contemporary",
    classic: "classic",
    japandi: "Japandi",
    free: "as described by the user, no fixed style",
  };
  return map[style];
}
