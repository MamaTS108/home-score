import type { ProjectBrief, RenovationPlan, RoomAnalysis } from "@/lib/types";

/**
 * Builds the final image-edit prompt sent to the design model.
 *
 * IMPORTANT (by design, not negotiable via user input): the user's free-text
 * request is never sent to the model on its own. The final prompt is always
 * assembled as:
 *
 *   SYSTEM CONSTRAINTS (architectural preservation — fixed, highest priority)
 *   + ROOM ANALYSIS (grounding, from vision)
 *   + USER RENOVATION REQUEST
 *   + BUDGET TIER GUIDANCE
 *   + STYLE
 *
 * This is what keeps a request like "put a wardrobe in front of the window"
 * from actually blocking the window in the render — the system constraints
 * outrank the user's placement request, they don't replace it.
 *
 * Kept separate from generateDesign.ts so this prompt-crafting logic can be
 * unit tested / iterated on independently of whichever image backend is
 * behind DesignProvider.
 */

/**
 * Fixed architectural-preservation contract. This block is never modified
 * by user input and always takes priority over the renovation request when
 * the two conflict (e.g. furniture placement vs. keeping a door usable).
 */
const SYSTEM_CONSTRAINTS = `SYSTEM CONSTRAINTS (highest priority — apply before anything else):

Transform this exact real interior into a realistic post-renovation visualization based on the user's renovation request below.

MANDATORY: you must actually apply the requested renovation and produce an image that is clearly and visibly different from the original in the ways the user asked for (materials, colors, furniture, fixtures, lighting, style). Returning the original photo unchanged, or with only imperceptible differences, is a failure — the whole point of this tool is to show a real visual transformation. The preservation rules below constrain HOW you make the change (never a reason to skip making it). This applies with equal force when editing an already-renovated image (a second or later iteration): do not treat the current image as "finished" and resist further changes — if a priority change is specified below, apply it as decisively as you would on a fresh photo.

Preserve the exact identity, geometry, architecture, perspective, camera position, room proportions, walls, ceiling, doors, windows, openings and visible structural constraints of the original photograph BY DEFAULT. Do not redesign or reconstruct the room's fixed architecture (walls, ceiling, floor plan, door and window positions) UNLESS the user's request explicitly asks for a structural change (e.g. "knock down this wall", "open up the space", "merge with the next room", "remove this wall"). When the user explicitly requests a structural change: apply it fully and realistically — remove/open the specified wall, extend the floor and ceiling continuously across the newly merged space, adjust lighting and sightlines accordingly, and keep everything else (the remaining walls, the windows, the camera position and perspective) consistent with the original photo. An explicit structural request always overrides the "preserve architecture" default for that specific element only — every other unmentioned structural element still stays fixed.

FURNITURE LAYOUT IS DIFFERENT FROM ARCHITECTURE: unlike walls/doors/windows, furniture, storage, fixtures and movable elements ARE allowed to be freely rearranged, replaced, added, removed or reorganized whenever the user's request asks for it (e.g. "reorganize the room to save space", "propose a different layout") — this is not a structural change and is not restricted by the architecture-preservation rule above. A full furniture reorganization is a legitimate, encouraged renovation outcome when requested; only the fixed architecture (walls, doors, windows) must stay untouched while you do it, unless a structural change was itself explicitly requested as described above.

Do not move, remove, create, enlarge or resize doors or windows unless the user explicitly requests it. Keep every non-requested structural element unchanged (radiators, columns, beams, staircases, visible outlets, visible plumbing).

Never obstruct or block a door, window, staircase, essential passage, radiator or access point with new furniture or fixtures — not even if the user's request implies a placement that would do so. If a requested placement would block an opening or passage, reinterpret it into the closest placement that keeps the opening fully usable, rather than following the literal placement.

Preserve realistic circulation and sufficient space for doors and windows to open normally. Do not create artificially narrow passages or block circulation areas with furniture.

Keep furniture and architectural elements that the user did not ask to modify — but everything the user's request (below) touches (materials, colors, cabinets, countertops, flooring, fixtures, furniture, lighting, decor, furniture placement/layout) must be actually replaced/updated in the image, not left as-is. If the user asks for a reorganization or a different layout, treat the entire furniture arrangement as open to change, not just individual pieces.

Any new furniture or fixture must have realistic proportions and must physically fit within the visible space relative to the walls, doors, windows, ceiling height and available surface. Do not generate disproportionate furniture or fixtures that could not physically be installed.

All generated elements must be physically plausible: resting correctly on the floor, realistically lit with coherent shadows, correctly positioned relative to walls, respecting perspective. No floating objects, no objects passing through walls or furniture, no merged or malformed objects.

Maintain the original camera position, perspective, framing and approximate field of view so the generated image can be directly compared with the original photograph.

Natural light direction should stay plausible for the same window positions, but you may brighten, warm or otherwise improve the lighting mood as part of the renovation style.

If you cannot confidently determine the structure, dimensions or nature of an element from the source image, preserve it as-is rather than inventing a replacement — never hallucinate structure.

Apply only the requested renovation: materials, colors, furniture, lighting and decorative changes. Do not renovate parts of the room the user did not ask to change.

The final result must look like a real photograph of the user's actual home after renovation — professional real-estate photography quality, photorealistic materials, lighting and shadows — never a generic interior-design image or a newly invented room that merely resembles the original.

Applying the user's renovation request is mandatory, not optional — the priority order below only governs how to resolve conflicts between it and the structural constraints, never whether to apply it: (1) preserve real structure, (2) never block doors/windows/passages, (3) preserve perspective and camera position, (4) respect proportions and physical plausibility, (5) apply the user's renovation request, (6) apply the requested style, (7) respect the budget tier, (8) add decorative details.`;

export function generateRenovationPrompt(
  analysis: RoomAnalysis,
  brief: ProjectBrief,
  plan: RenovationPlan | null,
  iterationNote?: string
): string {
  const sections: string[] = [SYSTEM_CONSTRAINTS];

  sections.push(buildRoomAnalysisSection(analysis));
  sections.push(buildUserRequestSection(brief, plan, iterationNote));
  sections.push(buildBudgetSection(brief));
  sections.push(buildStyleSection(brief));

  return sections.join("\n\n");
}

function buildRoomAnalysisSection(analysis: RoomAnalysis): string {
  const lines = [
    `ROOM ANALYSIS (from the source photo, for grounding only — the image itself is the real reference):`,
    `- Room type: ${translateRoomType(analysis.roomType)}`,
  ];
  if (analysis.walls.description) lines.push(`- Current walls: ${analysis.walls.description}`);
  if (analysis.floor.description) lines.push(`- Current floor: ${analysis.floor.description}`);
  if (analysis.ceiling.description) lines.push(`- Ceiling: ${analysis.ceiling.description}`);
  if (analysis.openings.doors !== null || analysis.openings.windows !== null) {
    const doors = analysis.openings.doors ?? "an unspecified number of";
    const windows = analysis.openings.windows ?? "an unspecified number of";
    lines.push(
      `- Openings detected: ${doors} door(s) and ${windows} window(s), at their current visible positions, sizes and orientation. These exact openings must remain fully visible, unobstructed, unresized and in the same position in the output — do not let new cabinets, furniture or fixtures cover, narrow or reduce any of them, even partially.`
    );
  }
  if (analysis.fixedElements.length > 0) {
    lines.push(`- Fixed elements to preserve unless changed below: ${analysis.fixedElements.join(", ")}`);
  }
  if (analysis.furniture.length > 0) {
    lines.push(`- Existing furniture visible: ${analysis.furniture.join(", ")}`);
  }
  return lines.join("\n");
}

function buildUserRequestSection(brief: ProjectBrief, plan: RenovationPlan | null, iterationNote?: string): string {
  const lines: string[] = [];

  if (iterationNote) {
    lines.push(
      `PRIORITY CHANGE FOR THIS SPECIFIC GENERATION (this is the main thing being checked — it MUST be clearly, unmistakably visible in the output, even if the base image already looks finished):`,
      iterationNote,
      "",
      `ORIGINAL PROJECT REQUEST (context, still applies, but the priority change above takes precedence if there's any tension):`,
      brief.description
    );
  } else {
    lines.push(`USER RENOVATION REQUEST:`, brief.description);
  }

  if (plan) {
    const materialHints = plan.requiredMaterialCategories.join(", ");
    if (materialHints) lines.push(`Materials involved in the plan: ${materialHints}.`);
  }

  return lines.join("\n");
}

function buildBudgetSection(brief: ProjectBrief): string {
  if (brief.budgetMax === null) {
    return `USER BUDGET: not specified — use your judgement for a mid-range, realistic renovation.`;
  }

  const tier = budgetTier(brief.budgetMax);
  return [`USER BUDGET: ${brief.budgetMax} ${brief.currency}.`, tier].join("\n");
}

/**
 * Keeps the visual result honest relative to what the budget could actually
 * buy (spec section 10): a render for a 1 000€ budget should not look like a
 * 50 000€ gut renovation. Thresholds are intentionally simple and tuned for
 * single-room residential renovations.
 */
function budgetTier(budgetMax: number): string {
  if (budgetMax < 2000) {
    return `Low budget tier: favor paint, hardware/handle changes, lighting fixtures, small furniture, affordable coverings and simple, low-cost renovation solutions. Avoid implying a full floor or cabinetry replacement unless explicitly requested.`;
  }
  if (budgetMax < 8000) {
    return `Mid budget tier: flooring replacement, a new kitchen or bathroom, new furniture, lighting and storage are reasonable. Keep materials realistic for a mid-range renovation, not premium/luxury.`;
  }
  return `Premium budget tier: premium materials, higher-end furniture, custom joinery, premium fixtures and refined finishes are reasonable.`;
}

function buildStyleSection(brief: ProjectBrief): string {
  if (brief.style === "free") {
    return `PREFERRED STYLE: no fixed style constraint — follow the user's renovation request above as the primary style guide.`;
  }
  return `PREFERRED STYLE: ${translateStyle(brief.style)}. Apply this primarily to colors, materials, furniture, textiles, lighting, decoration and finishes — not to the room's structure.`;
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
