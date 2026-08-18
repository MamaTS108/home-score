import { randomUUID } from "crypto";
import { callClaudeForJson } from "@/lib/ai/client";
import type { DifficultyLevel, ProjectBrief, RenovationPlan, RoomAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `Tu es un assistant de planification de travaux de rénovation intérieure pour particuliers.

RÈGLES STRICTES :
- Tu proposes une liste de travaux réalistes en te basant sur l'analyse de la pièce et la demande de l'utilisateur.
- Pour chaque travail, indique une quantité ESTIMATIVE et son unité (ex: m2, L, m, unit). Précise que ce sont des estimations.
- N'affirme JAMAIS qu'un travail nécessite obligatoirement un professionnel, SAUF s'il s'agit manifestement d'une opération réglementée ou dangereuse (électricité, gaz, plomberie lourde, structure porteuse, amiante).
- Tu ne donnes AUCUN prix. Les prix sont calculés séparément par le backend.
- Réponds UNIQUEMENT avec un JSON valide, sans texte avant/après, sans balises markdown.

Format de réponse JSON attendu :
{
  "summary": string (titre court du projet, ex: "Salon moderne chaleureux"),
  "tasks": [
    {
      "name": string,
      "description": string,
      "difficulty": "easy" | "medium" | "hard" | "professional_required",
      "diyPossible": boolean,
      "quantityEstimated": number | null,
      "unit": string | null,
      "requiresProfessional": boolean
    }
  ],
  "requiredMaterialCategories": string[] (catégories de matériaux nécessaires, ex: "peinture murale", "sol", "plinthes", "rangement", "accessoires")
}`;

interface RawPlanResult {
  summary: string;
  tasks: {
    name: string;
    description: string;
    difficulty: DifficultyLevel;
    diyPossible: boolean;
    quantityEstimated: number | null;
    unit: string | null;
    requiresProfessional: boolean;
  }[];
  requiredMaterialCategories: string[];
}

export async function generatePlan(
  projectId: string,
  analysis: RoomAnalysis,
  brief: ProjectBrief,
  version = 1
): Promise<RenovationPlan> {
  const userPrompt = buildUserPrompt(analysis, brief);

  const raw = await callClaudeForJson<RawPlanResult>({
    system: SYSTEM_PROMPT,
    content: [{ type: "text", text: userPrompt }],
    maxTokens: 2000,
  });

  return {
    id: randomUUID(),
    projectId,
    summary: raw.summary,
    tasks: raw.tasks.map((task, index) => ({
      id: randomUUID(),
      name: task.name,
      description: task.description,
      difficulty: task.difficulty,
      diyPossible: task.diyPossible,
      quantityEstimated: task.quantityEstimated,
      unit: task.unit,
      requiresProfessional: task.requiresProfessional,
      order: index,
    })),
    requiredMaterialCategories: raw.requiredMaterialCategories ?? [],
    createdAt: new Date().toISOString(),
    version,
  };
}

function buildUserPrompt(analysis: RoomAnalysis, brief: ProjectBrief): string {
  return `ANALYSE DE LA PIÈCE :
Type de pièce : ${analysis.roomType} (confiance ${Math.round(analysis.roomTypeConfidence * 100)}%)
Surface estimée : ${analysis.estimatedAreaM2 ? `~${analysis.estimatedAreaM2} m²` : "inconnue"}
Murs : ${analysis.walls.description}
Sol : ${analysis.floor.description}
Plafond : ${analysis.ceiling.description}
Style actuel : ${analysis.currentStyle ?? "non déterminé"}
Couleurs dominantes : ${analysis.dominantColors.join(", ") || "non déterminées"}
Mobilier détecté : ${analysis.furniture.join(", ") || "aucun"}
Éléments fixes : ${analysis.fixedElements.join(", ") || "aucun"}

DEMANDE DE L'UTILISATEUR :
"${brief.description}"

Style souhaité : ${brief.style}
Budget maximum : ${brief.budgetMax ? `${brief.budgetMax} ${brief.currency}` : "non précisé"}

Génère la liste des travaux et les catégories de matériaux nécessaires au format JSON demandé.`;
}
