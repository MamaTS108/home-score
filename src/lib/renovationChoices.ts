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
      { value: "blanc cassé", label: "Blanc cassé" },
      { value: "ivoire", label: "Ivoire" },
      { value: "crème", label: "Crème" },
      { value: "beige", label: "Beige" },
      { value: "beige clair", label: "Beige clair" },
      { value: "taupe", label: "Taupe" },
      { value: "sable", label: "Sable" },
      { value: "gris clair", label: "Gris clair" },
      { value: "gris perle", label: "Gris perle" },
      { value: "gris anthracite", label: "Gris anthracite" },
      { value: "anthracite", label: "Anthracite" },
      { value: "noir", label: "Noir" },
      { value: "vert sauge", label: "Vert sauge" },
      { value: "vert olive", label: "Vert olive" },
      { value: "vert bouteille", label: "Vert bouteille" },
      { value: "vert émeraude", label: "Vert émeraude" },
      { value: "bleu pastel", label: "Bleu pastel" },
      { value: "bleu canard", label: "Bleu canard" },
      { value: "bleu nuit", label: "Bleu nuit" },
      { value: "bleu ardoise", label: "Bleu ardoise" },
      { value: "terracotta", label: "Terracotta" },
      { value: "ocre", label: "Ocre" },
      { value: "moutarde", label: "Moutarde" },
      { value: "rose poudré", label: "Rose poudré" },
      { value: "rose terracotta", label: "Rose terracotta" },
      { value: "bordeaux", label: "Bordeaux" },
      { value: "marron chocolat", label: "Marron chocolat" },
      { value: "jaune pâle", label: "Jaune pâle" },
      { value: "lilas", label: "Lilas" },
    ],
  },
  {
    key: "floor",
    label: "Sol",
    question: "Quel revêtement de sol ?",
    options: [
      { value: "parquet bois clair", label: "Parquet bois clair" },
      { value: "parquet bois miel", label: "Parquet bois miel" },
      { value: "parquet bois foncé", label: "Parquet bois foncé" },
      { value: "parquet chevrons", label: "Parquet chevrons" },
      { value: "carrelage blanc", label: "Carrelage blanc" },
      { value: "carrelage clair", label: "Carrelage clair" },
      { value: "carrelage beige", label: "Carrelage beige" },
      { value: "carrelage gris", label: "Carrelage gris" },
      { value: "carrelage anthracite", label: "Carrelage anthracite" },
      { value: "carrelage à motifs", label: "Carrelage à motifs" },
      { value: "béton ciré clair", label: "Béton ciré clair" },
      { value: "béton ciré gris", label: "Béton ciré gris" },
      { value: "pierre naturelle", label: "Pierre naturelle" },
      { value: "moquette", label: "Moquette" },
      { value: "sisal / fibres naturelles", label: "Sisal / fibres naturelles" },
    ],
  },
  {
    key: "furniture",
    label: "Meubles / rangements",
    question: "Quel style de meubles et rangements ?",
    options: [
      { value: "blanc mat", label: "Blanc mat" },
      { value: "blanc laqué", label: "Blanc laqué" },
      { value: "beige", label: "Beige" },
      { value: "bois clair", label: "Bois clair" },
      { value: "bois naturel", label: "Bois naturel" },
      { value: "bois foncé", label: "Bois foncé" },
      { value: "chêne", label: "Chêne" },
      { value: "noyer", label: "Noyer" },
      { value: "gris clair", label: "Gris clair" },
      { value: "anthracite", label: "Anthracite" },
      { value: "noir mat", label: "Noir mat" },
      { value: "vert bouteille", label: "Vert bouteille" },
      { value: "vert sauge", label: "Vert sauge" },
      { value: "bleu canard", label: "Bleu canard" },
      { value: "terracotta", label: "Terracotta" },
      { value: "rotin / osier", label: "Rotin / osier" },
      { value: "métal noir", label: "Métal noir" },
      { value: "laiton / doré", label: "Laiton / doré" },
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
