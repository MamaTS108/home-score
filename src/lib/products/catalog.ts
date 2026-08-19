import type { CatalogProduct } from "./ProductProvider";

export const MOCK_CATALOG: CatalogProduct[] = [
  { id: "paint-wall-matte", name: "Peinture murale mate (10L)", category: "peinture murale", unit: "L", estimatedUnitPrice: 15, currency: "EUR", provider: "mock" },
  { id: "primer-undercoat", name: "Sous-couche universelle (10L)", category: "sous-couche", unit: "L", estimatedUnitPrice: 9, currency: "EUR", provider: "mock" },
  { id: "wall-filler", name: "Enduit de rebouchage / lissage", category: "préparation des murs", unit: "kg", estimatedUnitPrice: 4.5, currency: "EUR", provider: "mock" },
  { id: "sandpaper-pack", name: "Lot de papier abrasif", category: "préparation des murs", unit: "unit", estimatedUnitPrice: 8, currency: "EUR", provider: "mock" },
  { id: "flooring-laminate-light", name: "Parquet stratifié bois clair", category: "sol", unit: "m2", estimatedUnitPrice: 22, currency: "EUR", provider: "mock" },
  { id: "flooring-tile-beige", name: "Carrelage grès cérame beige", category: "sol", unit: "m2", estimatedUnitPrice: 28, currency: "EUR", provider: "mock" },
  { id: "flooring-underlay", name: "Sous-couche isolante pour sol", category: "sol", unit: "m2", estimatedUnitPrice: 3.5, currency: "EUR", provider: "mock" },
  { id: "skirting-board", name: "Plinthes assorties", category: "plinthes", unit: "m", estimatedUnitPrice: 6, currency: "EUR", provider: "mock" },
  { id: "storage-modular-unit", name: "Meuble de rangement modulaire", category: "rangement", unit: "unit", estimatedUnitPrice: 220, currency: "EUR", provider: "mock" },
  { id: "shelving-open", name: "Étagères murales", category: "rangement", unit: "unit", estimatedUnitPrice: 65, currency: "EUR", provider: "mock" },
  { id: "wardrobe-basic", name: "Armoire / penderie", category: "rangement", unit: "unit", estimatedUnitPrice: 260, currency: "EUR", provider: "mock" },
  { id: "kitchen-cabinet-module", name: "Module de cuisine (bas ou haut)", category: "cuisine", unit: "unit", estimatedUnitPrice: 180, currency: "EUR", provider: "mock" },
  { id: "kitchen-worktop", name: "Plan de travail stratifié", category: "cuisine", unit: "m", estimatedUnitPrice: 90, currency: "EUR", provider: "mock" },
  { id: "kitchen-backsplash", name: "Crédence de cuisine", category: "cuisine", unit: "m2", estimatedUnitPrice: 45, currency: "EUR", provider: "mock" },
  { id: "bathroom-tile", name: "Carrelage mural salle de bain", category: "salle de bain", unit: "m2", estimatedUnitPrice: 32, currency: "EUR", provider: "mock" },
  { id: "bathroom-vanity", name: "Meuble vasque", category: "salle de bain", unit: "unit", estimatedUnitPrice: 240, currency: "EUR", provider: "mock" },
  { id: "bathroom-fixtures", name: "Robinetterie", category: "salle de bain", unit: "unit", estimatedUnitPrice: 95, currency: "EUR", provider: "mock" },
  { id: "lighting-fixture", name: "Suspension / plafonnier", category: "éclairage", unit: "unit", estimatedUnitPrice: 55, currency: "EUR", provider: "mock" },
  { id: "lighting-spot", name: "Spot encastrable (lot de 4)", category: "éclairage", unit: "unit", estimatedUnitPrice: 38, currency: "EUR", provider: "mock" },
  { id: "hardware-screws", name: "Visserie et fixations", category: "accessoires", unit: "unit", estimatedUnitPrice: 25, currency: "EUR", provider: "mock" },
  { id: "hardware-tools", name: "Petit outillage / consommables", category: "accessoires", unit: "unit", estimatedUnitPrice: 40, currency: "EUR", provider: "mock" },
  { id: "hardware-paint-tools", name: "Rouleaux, pinceaux, bâches", category: "accessoires", unit: "unit", estimatedUnitPrice: 30, currency: "EUR", provider: "mock" },
  { id: "textile-curtains", name: "Rideaux / voilages", category: "décoration", unit: "unit", estimatedUnitPrice: 45, currency: "EUR", provider: "mock" },
  { id: "textile-rug", name: "Tapis", category: "décoration", unit: "unit", estimatedUnitPrice: 85, currency: "EUR", provider: "mock" },
  { id: "insulation-wall", name: "Isolation thermique des murs (par l'intérieur)", category: "isolation", unit: "m2", estimatedUnitPrice: 45, currency: "EUR", provider: "mock" },
  { id: "insulation-roof", name: "Isolation thermique de la toiture / combles", category: "isolation", unit: "m2", estimatedUnitPrice: 35, currency: "EUR", provider: "mock" },
  { id: "insulation-floor", name: "Isolation thermique du sol", category: "isolation", unit: "m2", estimatedUnitPrice: 30, currency: "EUR", provider: "mock" },
  { id: "window-double-glazing", name: "Fenêtre double vitrage (remplacement)", category: "fenêtres", unit: "unit", estimatedUnitPrice: 420, currency: "EUR", provider: "mock" },
  { id: "window-triple-glazing", name: "Fenêtre triple vitrage (remplacement)", category: "fenêtres", unit: "unit", estimatedUnitPrice: 580, currency: "EUR", provider: "mock" },
  { id: "heating-heat-pump", name: "Pompe à chaleur (installation)", category: "chauffage", unit: "unit", estimatedUnitPrice: 8500, currency: "EUR", provider: "mock" },
  { id: "heating-boiler", name: "Chaudière à condensation", category: "chauffage", unit: "unit", estimatedUnitPrice: 3200, currency: "EUR", provider: "mock" },
  { id: "heating-radiator", name: "Radiateur basse consommation", category: "chauffage", unit: "unit", estimatedUnitPrice: 180, currency: "EUR", provider: "mock" },
  { id: "ventilation-vmc", name: "VMC simple flux", category: "ventilation", unit: "unit", estimatedUnitPrice: 320, currency: "EUR", provider: "mock" },
  { id: "ventilation-vmc-double-flux", name: "VMC double flux (avec récupération de chaleur)", category: "ventilation", unit: "unit", estimatedUnitPrice: 2800, currency: "EUR", provider: "mock" },
  { id: "solar-panels", name: "Panneaux solaires photovoltaïques", category: "énergie solaire", unit: "unit", estimatedUnitPrice: 6500, currency: "EUR", provider: "mock" },
];

export const ACCESSORY_CATEGORIES = new Set(["accessoires", "décoration", "éclairage"]);

export const ENERGY_CATEGORIES = {
  insulation: "isolation",
  heating: "chauffage",
  ventilation: "ventilation",
  windows: "fenêtres",
  solar: "énergie solaire",
} as const;

export const ALLOWED_MATERIAL_CATEGORIES = Array.from(
  new Set(MOCK_CATALOG.map((p) => p.category))
).sort();
