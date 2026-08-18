import { randomUUID } from "crypto";
import { callClaudeForJson } from "@/lib/ai/client";
import type { RoomAnalysis, RoomType } from "@/lib/types";

const SYSTEM_PROMPT = `Tu es un assistant de vision spécialisé dans l'analyse de photos de pièces d'habitation pour une application de rénovation.

RÈGLES STRICTES :
- Tu observes une photo, tu ne mesures jamais rien avec précision. Toute dimension doit rester une estimation approximative.
- Tu ne dois JAMAIS présenter une estimation comme une mesure exacte.
- Si un élément n'est pas visible ou identifiable, retourne null plutôt que d'inventer.
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans balises markdown.

Format de réponse JSON attendu :
{
  "roomType": "living_room" | "kitchen" | "bedroom" | "bathroom" | "hallway" | "office" | "dining_room" | "other",
  "roomTypeConfidence": number (0 à 1),
  "estimatedAreaM2": number | null,
  "walls": { "description": string, "material": string | null, "color": string | null, "condition": string | null },
  "floor": { "description": string, "material": string | null, "color": string | null, "condition": string | null },
  "ceiling": { "description": string, "condition": string | null },
  "openings": { "doors": number | null, "windows": number | null },
  "furniture": string[],
  "fixedElements": string[],
  "detectedMaterials": string[],
  "currentStyle": string | null,
  "dominantColors": string[],
  "notes": string
}`;

interface RawVisionResult {
  roomType: RoomType;
  roomTypeConfidence: number;
  estimatedAreaM2: number | null;
  walls: RoomAnalysis["walls"];
  floor: RoomAnalysis["floor"];
  ceiling: RoomAnalysis["ceiling"];
  openings: RoomAnalysis["openings"];
  furniture: string[];
  fixedElements: string[];
  detectedMaterials: string[];
  currentStyle: string | null;
  dominantColors: string[];
  notes: string;
}

export interface AnalyzeRoomInput {
  projectId: string;
  imageBase64: string;
  imageMediaType: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Runs a vision analysis pass on the uploaded room photo.
 * This is the "UNDERSTAND" step of the PHOTO -> UNDERSTAND -> IMAGINE -> PLAN
 * -> MATERIALS -> BUDGET chain (section 28).
 */
export async function analyzeRoom(input: AnalyzeRoomInput): Promise<RoomAnalysis> {
  const raw = await callClaudeForJson<RawVisionResult>({
    system: SYSTEM_PROMPT,
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: input.imageMediaType,
          data: input.imageBase64,
        },
      },
      {
        type: "text",
        text: "Analyse cette photo de pièce et retourne le JSON demandé.",
      },
    ],
    maxTokens: 1500,
  });

  return {
    id: randomUUID(),
    projectId: input.projectId,
    roomType: raw.roomType,
    roomTypeConfidence: clamp01(raw.roomTypeConfidence),
    estimatedAreaM2: raw.estimatedAreaM2,
    walls: raw.walls,
    floor: raw.floor,
    ceiling: raw.ceiling,
    openings: raw.openings,
    furniture: raw.furniture ?? [],
    fixedElements: raw.fixedElements ?? [],
    detectedMaterials: raw.detectedMaterials ?? [],
    currentStyle: raw.currentStyle,
    dominantColors: raw.dominantColors ?? [],
    notes: raw.notes ?? "",
    createdAt: new Date().toISOString(),
  };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
