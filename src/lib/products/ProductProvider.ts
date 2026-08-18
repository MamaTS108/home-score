import type { Currency } from "@/lib/types";

/**
 * A catalog product, provider-agnostic.
 *
 * Today: MockProductProvider (our own indicative price list).
 * Tomorrow: LeroyMerlinProvider / CastoramaProvider / ManoManoProvider / IkeaProvider,
 * implementing this exact interface, without any change to the rest of the app.
 */
export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  estimatedUnitPrice: number;
  currency: Currency;
  provider: string;
}

export interface ProductSearchQuery {
  /** Free-text category/keyword coming from the renovation plan, e.g. "peinture murale". */
  category: string;
  style?: string;
}

export interface ProductEstimateRequest {
  category: string;
  quantity: number;
  unit: string;
}

export interface ProductEstimateResult {
  product: CatalogProduct;
  quantity: number;
  unit: string;
  estimatedTotal: number;
}

/**
 * The contract every product source must implement.
 *
 * IMPORTANT: implementations must never claim to be sourced from a specific
 * retailer (e.g. Leroy Merlin) unless a real, authorized integration exists.
 */
export interface ProductProvider {
  readonly name: string;

  searchProducts(query: ProductSearchQuery): Promise<CatalogProduct[]>;

  getProduct(productId: string): Promise<CatalogProduct | null>;

  estimatePrice(request: ProductEstimateRequest): Promise<ProductEstimateResult | null>;
}
