import { describe, expect, it } from "vitest";
import { MockProductProvider } from "@/lib/products/MockProductProvider";

describe("MockProductProvider", () => {
  const provider = new MockProductProvider();

  it("finds products by category, accent/case-insensitive", async () => {
    const results = await provider.searchProducts({ category: "Peinture Murale" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe("peinture murale");
  });

  it("returns an empty array for an unknown category", async () => {
    const results = await provider.searchProducts({ category: "zzz-unknown" });
    expect(results).toEqual([]);
  });

  it("estimates price as quantity * unit price", async () => {
    const estimate = await provider.estimatePrice({ category: "sol", quantity: 25, unit: "m2" });
    expect(estimate).not.toBeNull();
    expect(estimate!.estimatedTotal).toBeCloseTo(25 * estimate!.product.estimatedUnitPrice, 5);
  });

  it("defaults quantity to 1 when given a non-positive quantity", async () => {
    const estimate = await provider.estimatePrice({ category: "accessoires", quantity: 0, unit: "unit" });
    expect(estimate!.quantity).toBe(1);
  });

  it("never labels products as coming from a real retailer", async () => {
    const results = await provider.searchProducts({ category: "sol" });
    for (const product of results) {
      expect(product.provider).toBe("mock");
    }
  });
});
