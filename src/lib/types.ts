/**
 * Teelte — Domain types
 *
 * These types are the contract between every layer of the app:
 * Vision -> Renovation planning -> Product provider -> Budget engine -> UI.
 *
 * Keeping them centralized means a future LeroyMerlinProvider or a real
 * image-generation provider can be swapped in without touching the UI.
 */

export type Currency = "EUR";

export type RoomType =
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "hallway"
  | "office"
  | "dining_room"
  | "other";

export type RenovationStyle =
  | "modern"
  | "scandinavian"
  | "minimalist"
  | "industrial"
  | "contemporary"
  | "classic"
  | "japandi"
  | "free";

export type ProjectStatus =
  | "draft" // photo uploaded, no analysis yet
  | "analyzing"
  | "analyzed" // room analysis done, ready for plan/design
  | "planning"
  | "ready" // plan + design + budget available
  | "archived";

export type DifficultyLevel = "easy" | "medium" | "hard" | "professional_required";

/** Approximate, vision-derived understanding of the uploaded room photo. */
export interface RoomAnalysis {
  id: string;
  projectId: string;
  roomType: RoomType;
  roomTypeConfidence: number; // 0-1
  /** All numeric measurements are approximations, never exact measures. */
  estimatedAreaM2: number | null;
  walls: {
    description: string;
    material: string | null;
    color: string | null;
    condition: string | null;
  };
  floor: {
    description: string;
    material: string | null;
    color: string | null;
    condition: string | null;
  };
  ceiling: {
    description: string;
    condition: string | null;
  };
  openings: {
    doors: number | null;
    windows: number | null;
  };
  furniture: string[];
  fixedElements: string[];
  detectedMaterials: string[];
  currentStyle: string | null;
  dominantColors: string[];
  notes: string;
  createdAt: string;
}

/** What the user typed + selected before generation. */
export interface ProjectBrief {
  description: string;
  style: RenovationStyle;
  budgetMax: number | null;
  currency: Currency;
}

export interface RenovationTask {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  diyPossible: boolean;
  quantityEstimated: number | null;
  unit: string | null;
  requiresProfessional: boolean;
  order: number;
}

export interface RenovationPlan {
  id: string;
  projectId: string;
  summary: string;
  tasks: RenovationTask[];
  requiredMaterialCategories: string[]; // feeds the ProductProvider
  createdAt: string;
  version: number;
}

/** A line item resolved through a ProductProvider (mock today, real catalog later). */
export interface ProductLine {
  id: string;
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  currency: Currency;
  provider: string; // e.g. "mock"
}

export interface ProductBudget {
  materials: number;
  accessories: number;
  estimatedProductsTotal: number;
  currency: Currency;
  lines: ProductLine[];
}

export interface BudgetSummary {
  userBudgetMax: number | null;
  estimatedProductsTotal: number;
  remaining: number | null;
  isOverBudget: boolean;
  currency: Currency;
}

export interface DesignGeneration {
  id: string;
  projectId: string;
  prompt: string;
  imageUrl: string;
  sourceImageUrl: string;
  version: number;
  createdAt: string;
  disclaimer: string;
}

/**
 * Home Score: an INDICATIVE energy-performance estimate derived from the
 * room's visible materials and the renovation plan — NOT an official French
 * DPE (Diagnostic de Performance Énergétique), which requires a certified
 * diagnostician and real thermal measurements (spec section 24: never
 * present the product as a diagnostiqueur).
 */
export interface HomeScoreBreakdown {
  overall: number; // 0-100
  isolation: number;
  chauffageVentilation: number;
  ouvertures: number; // windows / glazing
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  projectId: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface RenovationProject {
  id: string;
  userId: string | null;
  name: string;
  roomType: RoomType | null;
  description: string;
  style: RenovationStyle;
  budgetMax: number | null;
  currency: Currency;
  status: ProjectStatus;
  originalImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

/** Full aggregate used by the UI — everything needed to render a project page. */
export interface ProjectDetail {
  project: RenovationProject;
  analysis: RoomAnalysis | null;
  plan: RenovationPlan | null;
  productBudget: ProductBudget | null;
  budgetSummary: BudgetSummary | null;
  designs: DesignGeneration[];
  homeScore: HomeScoreBreakdown | null;
  messages: AiMessage[];
}
