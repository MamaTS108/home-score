import { describe, expect, it } from "vitest";
import { composeDescription } from "@/lib/renovationChoices";

describe("composeDescription", () => {
  it("returns empty string when nothing is selected and no notes", () => {
    expect(composeDescription({}, "")).toBe("");
  });

  it("composes a single selection into a coherent sentence", () => {
    const result = composeDescription({ walls: "vert bouteille" }, "");
    expect(result).toBe("Je veux : murs en vert bouteille.");
  });

  it("composes multiple selections in category order", () => {
    const result = composeDescription(
      { walls: "beige", floor: "parquet bois clair", furniture: "blanc mat" },
      ""
    );
    expect(result).toBe("Je veux : murs en beige, sol en parquet bois clair, meubles et rangements en blanc mat.");
  });

  it("ignores null selections", () => {
    const result = composeDescription({ walls: "beige", floor: null }, "");
    expect(result).toBe("Je veux : murs en beige.");
  });

  it("appends free-text notes after the structured selections", () => {
    const result = composeDescription({ walls: "blanc" }, "garder la cheminée");
    expect(result).toBe("Je veux : murs en blanc. Précisions : garder la cheminée");
  });

  it("uses notes alone when no category is selected", () => {
    const result = composeDescription({}, "je veux une cuisine ouverte sur le salon");
    expect(result).toBe("je veux une cuisine ouverte sur le salon");
  });

  it("ignores unknown category keys gracefully", () => {
    const result = composeDescription({ unknown_category: "value" }, "");
    expect(result).toBe("");
  });
});
