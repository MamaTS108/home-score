import { ACCESSORY_CATEGORIES } from "@/lib/products/catalog";
import type { ProductProvider } from "@/lib/products/ProductProvider";
import type {
  BudgetSummary,
  Currency,
  ProductBudget,
  ProductLine,
  RenovationPlan,
} from "@/lib/types";

/**
 * Budget Engine
 *
 * Takes a RenovationPlan (list of required material categories + quantities
 * derived from the plan's tasks) and a ProductProvider, and returns a
 * ProductBudget. This is a plain estimate, never a professional quote
 * (see section 10/24 of the spec) — the calling code must display it as such.
 *
 * The LLM is only ever allowed to produce material *types* and *quantities*.
 * All prices come from here, resolved through the ProductProvider.
 */

export interface MaterialRequirement {
  category: string;
  quantity: number;
  unit: string;
}

/**
 * Derives the material requirements to price from a renovation plan.
 * Quantities are approximate by nature (vision + LLM derived upstream) —
 * this function does not invent numbers, it only forwards what the plan
 * already estimated, defaulting sensibly when a task has no explicit quantity.
 */
export function deriveMaterialRequirements(plan: RenovationPlan): MaterialRequirement[] {
  const byCategory = new Map<string, MaterialRequirement>();

  for (const category of plan.requiredMaterialCategories) {
    const relatedTask = plan.tasks.find((t) =>
      normalize(t.name).includes(normalize(category)) || normalize(category).includes(normalize(t.name))
    );

    const quantity = relatedTask?.quantityEstimated ?? 1;
    const unit = relatedTask?.unit ?? "unit";

    const key = normalize(category);
    if (!byCategory.has(key)) {
      byCategory.set(key, { category, quantity, unit });
    }
  }

  return Array.from(byCategory.values());
}

export async function computeProductBudget(
  plan: RenovationPlan,
  provider: ProductProvider,
  currency: Currency = "EUR"
): Promise<ProductBudget> {
  const requirements = deriveMaterialRequirements(plan);

  const lines: ProductLine[] = [];

  for (const requirement of requirements) {
    const estimate = await provider.estimatePrice({
      category: requirement.category,
      quantity: requirement.quantity,
      unit: requirement.unit,
    });

    if (!estimate) continue;

    lines.push({
      id: `${estimate.product.id}-${lines.length}`,
      productId: estimate.product.id,
      name: estimate.product.name,
      category: estimate.product.category,
      quantity: estimate.quantity,
      unit: estimate.unit,
      estimatedUnitPrice: estimate.product.estimatedUnitPrice,
      estimatedTotal: estimate.estimatedTotal,
      currency: estimate.product.currency,
      provider: provider.name,
    });
  }

  return summarizeLines(lines, currency);
}

/** Splits already-resolved product lines into materials vs. accessories and totals them. */
export function summarizeLines(lines: ProductLine[], currency: Currency = "EUR"): ProductBudget {
  let materials = 0;
  let accessories = 0;

  for (const line of lines) {
    if (ACCESSORY_CATEGORIES.has(normalize(line.category))) {
      accessories += line.estimatedTotal;
    } else {
      materials += line.estimatedTotal;
    }
  }

  materials = round2(materials);
  accessories = round2(accessories);

  return {
    materials,
    accessories,
    estimatedProductsTotal: round2(materials + accessories),
    currency,
    lines,
  };
}

/** Compares the estimated product budget against the user's stated max budget. */
export function computeBudgetSummary(
  productBudget: ProductBudget,
  userBudgetMax: number | null
): BudgetSummary {
  const remaining = userBudgetMax !== null ? round2(userBudgetMax - productBudget.estimatedProductsTotal) : null;

  return {
    userBudgetMax,
    estimatedProductsTotal: productBudget.estimatedProductsTotal,
    remaining,
    isOverBudget: remaining !== null && remaining < 0,
    currency: productBudget.currency,
  };
}

/**
 * Suggests which product lines to look at first when trying to bring a
 * project back under budget — largest lines first. Pure/deterministic so the
 * UI (and the AI assistant) can rely on it without another AI call.
 */
export function suggestOptimizationTargets(productBudget: ProductBudget, count = 3): ProductLine[] {
  return [...productBudget.lines].sort((a, b) => b.estimatedTotal - a.estimatedTotal).slice(0, count);
}

/**
 * VERY rough labor cost estimate — deterministic, not from the LLM. Never
 * presented as a quote (spec section 10/24): this exists only to give the
 * user a ballpark "total project" figure alongside the materials estimate.
 *
 * Heuristic: a base multiplier of the materials cost, bumped up when the
 * plan includes tasks that require a professional (which usually cost more
 * per hour and take longer) or are marked "hard".
 */
export function estimateLaborCost(plan: RenovationPlan, productBudget: ProductBudget): number {
  if (productBudget.materials <= 0) return 0;

  const totalTasks = plan.tasks.length || 1;
  const proTasks = plan.tasks.filter((t) => t.requiresProfessional || t.difficulty === "hard").length;
  const proRatio = proTasks / totalTasks;

  // 0.8x materials when everything is DIY-friendly, up to ~2x when most
  // tasks need a professional — intentionally coarse.
  const multiplier = 0.8 + proRatio * 1.2;

  return round2(productBudget.materials * multiplier);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
