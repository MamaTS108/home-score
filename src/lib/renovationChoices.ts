export interface ChoiceOption {
  value: string;
  label: string;
}

export interface ChoiceCategory {
  key: string;
  label: string;
  question: string;
  options: ChoiceOption[];
}

/**
 * Structured choices shown to the user instead of a blank free-text box.
 * Picking from these produces a precise, disambiguated renovation
 * description — which means a more accurate prompt on the first try, fewer
 * regenerations needed, and lower AI cost than parsing open-ended text.
 */
export const RENOVATION_CHOICE_CATEGORIES: ChoiceCategory[] = [
  {
    key: "walls",
    label: "Murs",
    question: "Quelle couleur pour les murs ?",
    options: [
      { value: "blanc", label: "Blanc" },
      { value: "beige", label: "Beige" },
      { value: "gris clair", label: "Gris clair" },
      { value: "vert bouteille", label: "Vert bouteille" },
      { value: "bleu nuit", label: "Bleu nuit" },
      { value: "terracotta", label: "Terracotta" },
      { value: "anthracite", label: "Anthracite" },
    ],
  },
  {
    key: "floor",
    label: "Sol",
    question: "Quel revêtement de sol ?",
    options: [
      { value: "parquet bois clair", label: "Parquet bois clair" },
      { value: "parquet bois foncé", label: "Parquet bois foncé" },
      { value: "carrelage clair", label: "Carrelage clair" },
      { value: "carrelage anthracite", label: "Carrelage anthracite" },
      { value: "béton ciré", label: "Béton ciré" },
      { value: "moquette", label: "Moquette" },
    ],
  },
  {
    key: "furniture",
    label: "Meubles / rangements",
    question: "Quel style de meubles et rangements ?",
    options: [
      { value: "blanc mat", label: "Blanc mat" },
      { value: "bois clair", label: "Bois clair" },
      { value: "bois foncé", label: "Bois foncé" },
      { value: "anthracite", label: "Anthracite" },
      { value: "vert bouteille", label: "Vert bouteille" },
    ],
  },
  {
    key: "lighting",
    label: "Éclairage",
    question: "Quelle ambiance lumineuse ?",
    options: [
      { value: "chaleureux et tamisé", label: "Chaleureux et tamisé" },
      { value: "lumineux et naturel", label: "Lumineux et naturel" },
      { value: "spots modernes", label: "Spots modernes" },
      { value: "suspensions design", label: "Suspensions design" },
    ],
  },
  {
    key: "decor",
    label: "Décoration",
    question: "Quelle ambiance générale ?",
    options: [
      { value: "minimaliste", label: "Minimaliste" },
      { value: "chaleureuse et cosy", label: "Chaleureuse et cosy" },
      { value: "végétale", label: "Végétale" },
      { value: "épurée haut de gamme", label: "Épurée haut de gamme" },
    ],
  },
];

/**
 * Turns the structured selections + optional free-text notes into a single,
 * coherent French description — this is what feeds `brief.description`,
 * so the rest of the pipeline (plan, prompt) doesn't need to change at all.
 */
export function composeDescription(
  selections: Record<string, string | null>,
  notes: string
): string {
  const parts: string[] = [];

  for (const category of RENOVATION_CHOICE_CATEGORIES) {
    const selected = selections[category.key];
    if (!selected) continue;
    const option = category.options.find((o) => o.value === selected);
    if (!option) continue;

    switch (category.key) {
      case "walls":
        parts.push(`murs en ${option.value}`);
        break;
      case "floor":
        parts.push(`sol en ${option.value}`);
        break;
      case "furniture":
        parts.push(`meubles et rangements en ${option.value}`);
        break;
      case "lighting":
        parts.push(`éclairage ${option.value}`);
        break;
      case "decor":
        parts.push(`ambiance ${option.value}`);
        break;
    }
  }

  let description = parts.length > 0 ? `Je veux : ${parts.join(", ")}.` : "";

  if (notes.trim()) {
    description = description ? `${description} Précisions : ${notes.trim()}` : notes.trim();
  }

  return description;
}
