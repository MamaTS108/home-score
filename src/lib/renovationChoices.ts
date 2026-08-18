export interface ChoiceOption {
  value: string;
  label: string;
  /** Hex swatch shown next to the label, for color-like categories. */
  swatch?: string;
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
      { value: "blanc", label: "Blanc", swatch: "#FFFFFF" },
      { value: "blanc cassé", label: "Blanc cassé", swatch: "#F5F1EA" },
      { value: "ivoire", label: "Ivoire", swatch: "#F2EAD3" },
      { value: "crème", label: "Crème", swatch: "#F0E6D2" },
      { value: "beige", label: "Beige", swatch: "#E3D3B8" },
      { value: "beige clair", label: "Beige clair", swatch: "#EDE1CC" },
      { value: "taupe", label: "Taupe", swatch: "#B8A99A" },
      { value: "sable", label: "Sable", swatch: "#D8C6A3" },
      { value: "gris clair", label: "Gris clair", swatch: "#D6D6D2" },
      { value: "gris perle", label: "Gris perle", swatch: "#C9CACB" },
      { value: "gris anthracite", label: "Gris anthracite", swatch: "#4B4C4E" },
      { value: "anthracite", label: "Anthracite", swatch: "#383A3D" },
      { value: "noir", label: "Noir", swatch: "#1A1A1A" },
      { value: "vert sauge", label: "Vert sauge", swatch: "#9CAF88" },
      { value: "vert olive", label: "Vert olive", swatch: "#6B6E3A" },
      { value: "vert bouteille", label: "Vert bouteille", swatch: "#1F4D3A" },
      { value: "vert émeraude", label: "Vert émeraude", swatch: "#0F6E4E" },
      { value: "bleu pastel", label: "Bleu pastel", swatch: "#AFC9D9" },
      { value: "bleu canard", label: "Bleu canard", swatch: "#1E5C6B" },
      { value: "bleu nuit", label: "Bleu nuit", swatch: "#1B2A4A" },
      { value: "bleu ardoise", label: "Bleu ardoise", swatch: "#4A5B6B" },
      { value: "terracotta", label: "Terracotta", swatch: "#C1633D" },
      { value: "ocre", label: "Ocre", swatch: "#CC9A3A" },
      { value: "moutarde", label: "Moutarde", swatch: "#D3A62C" },
      { value: "rose poudré", label: "Rose poudré", swatch: "#E3BFB8" },
      { value: "rose terracotta", label: "Rose terracotta", swatch: "#D89A85" },
      { value: "bordeaux", label: "Bordeaux", swatch: "#6B1F2A" },
      { value: "marron chocolat", label: "Marron chocolat", swatch: "#4A3324" },
      { value: "jaune pâle", label: "Jaune pâle", swatch: "#EEDFA0" },
      { value: "lilas", label: "Lilas", swatch: "#C6B4D6" },
    ],
  },
  {
    key: "floor",
    label: "Sol",
    question: "Quel revêtement de sol ?",
    options: [
      { value: "parquet bois clair", label: "Parquet bois clair", swatch: "#D2B48C" },
      { value: "parquet bois miel", label: "Parquet bois miel", swatch: "#C9924D" },
      { value: "parquet bois foncé", label: "Parquet bois foncé", swatch: "#6B4A2E" },
      { value: "parquet chevrons", label: "Parquet chevrons", swatch: "#B98A54" },
      { value: "carrelage blanc", label: "Carrelage blanc", swatch: "#F5F5F3" },
      { value: "carrelage clair", label: "Carrelage clair", swatch: "#E4E1D8" },
      { value: "carrelage beige", label: "Carrelage beige", swatch: "#DCC9A8" },
      { value: "carrelage gris", label: "Carrelage gris", swatch: "#A9ACA9" },
      { value: "carrelage anthracite", label: "Carrelage anthracite", swatch: "#3D3F41" },
      { value: "carrelage à motifs", label: "Carrelage à motifs", swatch: "#9C8B6E" },
      { value: "béton ciré clair", label: "Béton ciré clair", swatch: "#C7C3BB" },
      { value: "béton ciré gris", label: "Béton ciré gris", swatch: "#8C8B87" },
      { value: "pierre naturelle", label: "Pierre naturelle", swatch: "#B4AC9C" },
      { value: "moquette", label: "Moquette", swatch: "#8E7A63" },
      { value: "sisal / fibres naturelles", label: "Sisal / fibres naturelles", swatch: "#C6B08A" },
    ],
  },
  {
    key: "furniture",
    label: "Meubles / rangements",
    question: "Quel style de meubles et rangements ?",
    options: [
      { value: "blanc mat", label: "Blanc mat", swatch: "#FAFAF8" },
      { value: "blanc laqué", label: "Blanc laqué", swatch: "#FFFFFF" },
      { value: "beige", label: "Beige", swatch: "#E3D3B8" },
      { value: "bois clair", label: "Bois clair", swatch: "#D2B48C" },
      { value: "bois naturel", label: "Bois naturel", swatch: "#C9A46A" },
      { value: "bois foncé", label: "Bois foncé", swatch: "#6B4A2E" },
      { value: "chêne", label: "Chêne", swatch: "#B98A54" },
      { value: "noyer", label: "Noyer", swatch: "#5A3E2B" },
      { value: "gris clair", label: "Gris clair", swatch: "#D6D6D2" },
      { value: "anthracite", label: "Anthracite", swatch: "#383A3D" },
      { value: "noir mat", label: "Noir mat", swatch: "#1A1A1A" },
      { value: "vert bouteille", label: "Vert bouteille", swatch: "#1F4D3A" },
      { value: "vert sauge", label: "Vert sauge", swatch: "#9CAF88" },
      { value: "bleu canard", label: "Bleu canard", swatch: "#1E5C6B" },
      { value: "terracotta", label: "Terracotta", swatch: "#C1633D" },
      { value: "rotin / osier", label: "Rotin / osier", swatch: "#C9A66B" },
      { value: "métal noir", label: "Métal noir", swatch: "#2B2B2B" },
      { value: "laiton / doré", label: "Laiton / doré", swatch: "#C9A44C" },
    ],
  },
  {
    key: "lighting",
    label: "Éclairage",
    question: "Quelle ambiance lumineuse ?",
    options: [
      { value: "chaleureux et tamisé", label: "Chaleureux et tamisé", swatch: "#E8C27A" },
      { value: "lumineux et naturel", label: "Lumineux et naturel", swatch: "#F5F0E1" },
      { value: "spots modernes", label: "Spots modernes", swatch: "#D9D9D9" },
      { value: "suspensions design", label: "Suspensions design", swatch: "#B8A88A" },
    ],
  },
  {
    key: "decor",
    label: "Décoration",
    question: "Quelle ambiance générale ?",
    options: [
      { value: "minimaliste", label: "Minimaliste", swatch: "#E7E5DF" },
      { value: "chaleureuse et cosy", label: "Chaleureuse et cosy", swatch: "#C9924D" },
      { value: "végétale", label: "Végétale", swatch: "#6B8E5A" },
      { value: "épurée haut de gamme", label: "Épurée haut de gamme", swatch: "#3D3F41" },
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
