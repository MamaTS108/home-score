import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: "EUR" = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/** Fetches an already-uploaded image (e.g. from Supabase Storage) back as base64 for the vision model. */
export async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch image at ${url} (${response.status})`);

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const mediaType: "image/jpeg" | "image/png" | "image/webp" = contentType.includes("png")
    ? "image/png"
    : contentType.includes("webp")
      ? "image/webp"
      : "image/jpeg";

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mediaType };
}

export function difficultyLabel(difficulty: string): string {
  const map: Record<string, string> = {
    easy: "Facile",
    medium: "Intermédiaire",
    hard: "Difficile",
    professional_required: "Professionnel requis",
  };
  return map[difficulty] ?? difficulty;
}

export function roomTypeLabel(roomType: string | null): string {
  const map: Record<string, string> = {
    living_room: "Salon",
    kitchen: "Cuisine",
    bedroom: "Chambre",
    bathroom: "Salle de bain",
    hallway: "Entrée / couloir",
    office: "Bureau",
    dining_room: "Salle à manger",
    other: "Pièce",
  };
  return roomType ? (map[roomType] ?? roomType) : "Pièce";
}

export function styleLabel(style: string): string {
  const map: Record<string, string> = {
    modern: "Moderne",
    scandinavian: "Scandinave",
    minimalist: "Minimaliste",
    industrial: "Industriel",
    contemporary: "Contemporain",
    classic: "Classique",
    japandi: "Japandi",
    free: "Libre",
  };
  return map[style] ?? style;
}
