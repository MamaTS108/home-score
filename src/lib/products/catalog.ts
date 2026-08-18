import type { CatalogProduct } from "./ProductProvider";

/**
 * Our own simplified, indicative price list for the MVP.
 *
 * These are NOT Leroy Merlin (or any retailer) prices. They exist so the
 * Budget Engine has something real to compute against while the product
 * catalog integration (section 9 / 14 of the spec) is still MockProductProvider.
 *
 * Prices are per unit, in EUR, and intentionally conservative/round so they
 * read clearly as indicative rather than a real quote.
 */
export const MOCK_CATALOG: CatalogProduct[] = [
  // Peinture & préparation des murs
  { id: "paint-wall-matte", name: "Peinture murale mate (10L)", category: "peinture murale", unit: "L", estimatedUnitPrice: 15, currency: "EUR", provider: "mock" },
  { id: "primer-undercoat", name: "Sous-couche universelle (10L)", category: "sous-couche", unit: "L", estimatedUnitPrice: 9, currency: "EUR", provider: "mock" },
  { id: "wall-filler", name: "Enduit de rebouchage / lissage", category: "préparation des murs", unit: "kg", estimatedUnitPrice: 4.5, currency: "EUR", provider: "mock" },
  { id: "sandpaper-pack", name: "Lot de papier abrasif", category: "préparation des murs", unit: "unit", estimatedUnitPrice: 8, currency: "EUR", provider: "mock" },

  // Sol
  { id: "flooring-laminate-light", name: "Parquet stratifié bois clair", category: "sol", unit: "m2", estimatedUnitPrice: 22, currency: "EUR", provider: "mock" },
  { id: "flooring-tile-beige", name: "Carrelage grès cérame beige", category: "sol", unit: "m2", estimatedUnitPrice: 28, currency: "EUR", provider: "mock" },
  { id: "flooring-underlay", name: "Sous-couche isolante pour sol", category: "sol", unit: "m2", estimatedUnitPrice: 3.5, currency: "EUR", provider: "mock" },
  { id: "skirting-board", name: "Plinthes assorties", category: "plinthes", unit: "m", estimatedUnitPrice: 6, currency: "EUR", provider: "mock" },

  // Rangement / mobilier
  { id: "storage-modular-unit", name: "Meuble de rangement modulaire", category: "rangement", unit: "unit", estimatedUnitPrice: 220, currency: "EUR", provider: "mock" },
  { id: "shelving-open", name: "Étagères murales", category: "rangement", unit: "unit", estimatedUnitPrice: 65, currency: "EUR", provider: "mock" },
  { id: "wardrobe-basic", name: "Armoire / penderie", category: "rangement", unit: "unit", estimatedUnitPrice: 260, currency: "EUR", provider: "mock" },

  // Cuisine
  { id: "kitchen-cabinet-module", name: "Module de cuisine (bas ou haut)", category: "cuisine", unit: "unit", estimatedUnitPrice: 180, currency: "EUR", provider: "mock" },
  { id: "kitchen-worktop", name: "Plan de travail stratifié", category: "cuisine", unit: "m", estimatedUnitPrice: 90, currency: "EUR", provider: "mock" },
  { id: "kitchen-backsplash", name: "Crédence de cuisine", category: "cuisine", unit: "m2", estimatedUnitPrice: 45, currency: "EUR", provider: "mock" },

  // Salle de bain
  { id: "bathroom-tile", name: "Carrelage mural salle de bain", category: "salle de bain", unit: "m2", estimatedUnitPrice: 32, currency: "EUR", provider: "mock" },
  { id: "bathroom-vanity", name: "Meuble vasque", category: "salle de bain", unit: "unit", estimatedUnitPrice: 240, currency: "EUR", provider: "mock" },
  { id: "bathroom-fixtures", name: "Robinetterie", category: "salle de bain", unit: "unit", estimatedUnitPrice: 95, currency: "EUR", provider: "mock" },

  // Éclairage
  { id: "lighting-fixture", name: "Suspension / plafonnier", category: "éclairage", unit: "unit", estimatedUnitPrice: 55, currency: "EUR", provider: "mock" },
  { id: "lighting-spot", name: "Spot encastrable (lot de 4)", category: "éclairage", unit: "unit", estimatedUnitPrice: 38, currency: "EUR", provider: "mock" },

  // Accessoires / quincaillerie
  { id: "hardware-screws", name: "Visserie et fixations", category: "accessoires", unit: "unit", estimatedUnitPrice: 25, currency: "EUR", provider: "mock" },
  { id: "hardware-tools", name: "Petit outillage / consommables", category: "accessoires", unit: "unit", estimatedUnitPrice: 40, currency: "EUR", provider: "mock" },
  { id: "hardware-paint-tools", name: "Rouleaux, pinceaux, bâches", category: "accessoires", unit: "unit", estimatedUnitPrice: 30, currency: "EUR", provider: "mock" },

  // Décoration textile
  { id: "textile-curtains", name: "Rideaux / voilages", category: "décoration", unit: "unit", estimatedUnitPrice: 45, currency: "EUR", provider: "mock" },
  { id: "textile-rug", name: "Tapis", category: "décoration", unit: "unit", estimatedUnitPrice: 85, currency: "EUR", provider: "mock" },
];

export const ACCESSORY_CATEGORIES = new Set(["accessoires", "décoration", "éclairage"]);

/**
 * The exact, closed set of category strings that exist in the catalog.
 * The renovation plan (LLM output) is constrained to only use these values
 * for `requiredMaterialCategories` — otherwise free-text categories like
 * "cuisine", "meubles cuisine", "électroménager cuisine" all fuzzy-match the
 * same first catalog product and produce confusing duplicate line items.
 */
export const ALLOWED_MATERIAL_CATEGORIES = Array.from(
  new Set(MOCK_CATALOG.map((p) => p.category))
).sort();
