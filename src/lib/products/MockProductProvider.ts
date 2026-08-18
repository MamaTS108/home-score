import { MOCK_CATALOG } from "./catalog";
import type {
  CatalogProduct,
  ProductEstimateRequest,
  ProductEstimateResult,
  ProductProvider,
  ProductSearchQuery,
} from "./ProductProvider";

/**
 * MVP implementation of ProductProvider.
 *
 * Uses our own indicative catalog (never presented as Leroy Merlin or any
 * other retailer's real prices — see section 8/14 of the spec). A future
 * `LeroyMerlinProvider` (or Castorama/ManoMano/IKEA) can implement the same
 * `ProductProvider` interface and be swapped in via dependency injection,
 * with zero changes to the Renovation Engine or the Budget Engine.
 */
export class MockProductProvider implements ProductProvider {
  readonly name = "mock";

  async searchProducts(query: ProductSearchQuery): Promise<CatalogProduct[]> {
    const normalized = normalize(query.category);
    const matches = MOCK_CATALOG.filter(
      (p) => normalize(p.category).includes(normalized) || normalized.includes(normalize(p.category))
    );
    return matches.length > 0 ? matches : [];
  }

  async getProduct(productId: string): Promise<CatalogProduct | null> {
    return MOCK_CATALOG.find((p) => p.id === productId) ?? null;
  }

  async estimatePrice(request: ProductEstimateRequest): Promise<ProductEstimateResult | null> {
    const candidates = await this.searchProducts({ category: request.category });
    if (candidates.length === 0) return null;

    // Pick the first matching product as the representative estimate for
    // this category. This is intentionally simple for the MVP.
    const product = candidates[0];
    const quantity = request.quantity > 0 ? request.quantity : 1;
    const estimatedTotal = round2(quantity * product.estimatedUnitPrice);

    return {
      product,
      quantity,
      unit: request.unit || product.unit,
      estimatedTotal,
    };
  }
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
