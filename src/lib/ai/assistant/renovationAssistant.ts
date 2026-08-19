import { callClaudeForJson } from "@/lib/ai/client";
import type { AiMessage, ProjectBrief, RenovationPlan, RoomAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `Tu es l'assistant IA de rénovation de Teelte. L'utilisateur a déjà un projet de rénovation avec une analyse de pièce et un plan de travaux existant. Il souhaite maintenant ajuster son projet (changer un matériau, un style, réduire le budget, etc).

RÈGLES STRICTES :
- Ne donne aucun prix toi-même : tu ne fais que mettre à jour la description du projet, le style et le budget si demandé.
- Réponds UNIQUEMENT en JSON valide, sans texte avant/après, sans balises markdown.
- Le champ "reply" doit être une réponse conversationnelle courte et sympathique en français, confirmant le changement compris.
- Le champ "updatedDescription" doit être la description du projet mise à jour pour refléter la demande (fusionne avec la description précédente, ne perds pas les éléments non contredits).
- Le champ "updatedBudgetMax" doit être un nombre si l'utilisateur mentionne un nouveau budget, sinon null.
- Le champ "requiresNewPlan" doit être true si le changement affecte les travaux/matériaux (style, matériaux, budget), false si c'est une simple question.

Format JSON attendu :
{
  "reply": string,
  "updatedDescription": string,
  "updatedBudgetMax": number | null,
  "requiresNewPlan": boolean
}`;

interface RawAssistantResult {
  reply: string;
  updatedDescription: string;
  updatedBudgetMax: number | null;
  requiresNewPlan: boolean;
}

export interface AssistantIterationResult {
  reply: string;
  updatedBrief: ProjectBrief;
  requiresNewPlan: boolean;
}

export async function iterateOnProject(
  userMessage: string,
  currentBrief: ProjectBrief,
  analysis: RoomAnalysis | null,
  plan: RenovationPlan | null,
  history: AiMessage[]
): Promise<AssistantIterationResult> {
  const context = buildContext(currentBrief, analysis, plan, history, userMessage);

  const raw = await callClaudeForJson<RawAssistantResult>({
    system: SYSTEM_PROMPT,
    content: [{ type: "text", text: context }],
    maxTokens: 1200,
  });

  return {
    reply: raw.reply,
    updatedBrief: {
      ...currentBrief,
      description: raw.updatedDescription || currentBrief.description,
      budgetMax: raw.updatedBudgetMax ?? currentBrief.budgetMax,
    },
    requiresNewPlan: raw.requiresNewPlan,
  };
}

function buildContext(
  brief: ProjectBrief,
  analysis: RoomAnalysis | null,
  plan: RenovationPlan | null,
  history: AiMessage[],
  userMessage: string
): string {
  const historyText = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `PROJET ACTUEL :
Description : "${brief.description}"
Style : ${brief.style}
Budget max : ${brief.budgetMax ? `${brief.budgetMax} ${brief.currency}` : "non précisé"}
${analysis ? `Type de pièce : ${analysis.roomType}` : ""}
${plan ? `Résumé du plan actuel : ${plan.summary}` : ""}

HISTORIQUE RÉCENT :
${historyText || "(aucun)"}

NOUVEAU MESSAGE DE L'UTILISATEUR :
"${userMessage}"

Réponds au format JSON demandé.`;
}
