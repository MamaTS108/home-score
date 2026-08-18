import { randomUUID } from "crypto";
import type { DesignGeneration } from "@/lib/types";

const AI_DISCLAIMER =
  "Visualisation IA — le résultat final peut différer de la réalisation.";

export interface GenerateDesignInput {
  projectId: string;
  prompt: string;
  sourceImageUrl: string;
  sourceImageBase64?: string;
  sourceImageMediaType?: "image/jpeg" | "image/png" | "image/webp";
  version: number;
}

/**
 * A DesignProvider turns a prompt + source photo into a rendered "after" image.
 *
 * The MVP ships a StubDesignProvider (no real image-generation backend wired
 * in yet — see the spec: the MVP must not fake a capability it doesn't have).
 * To go live, implement this interface against a real provider (e.g. Gemini
 * image generation, fal.ai, Replicate...) and swap it in `getDesignProvider()`
 * below — nothing else in the app needs to change.
 */
export interface DesignProvider {
  readonly name: string;
  generate(input: GenerateDesignInput): Promise<DesignGeneration>;
}

/**
 * MVP stub: does NOT call any image-generation model. It returns the original
 * photo annotated as a placeholder so the rest of the product (tasks,
 * materials, budget, iteration) can be fully exercised end-to-end while a
 * real image-generation integration is added.
 *
 * IMPORTANT: this must stay honest in the UI — always label the result as a
 * placeholder, never as a finished AI rendering, unless a real provider is
 * configured.
 */
export class StubDesignProvider implements DesignProvider {
  readonly name = "stub";

  async generate(input: GenerateDesignInput): Promise<DesignGeneration> {
    return {
      id: randomUUID(),
      projectId: input.projectId,
      prompt: input.prompt,
      // No image model wired in yet: MVP shows the original photo.
      imageUrl: input.sourceImageUrl,
      sourceImageUrl: input.sourceImageUrl,
      version: input.version,
      createdAt: new Date().toISOString(),
      disclaimer: AI_DISCLAIMER,
    };
  }
}

export function getDesignProvider(): DesignProvider {
  // Swap this for a real provider once an image-generation backend is chosen
  // and approved (see section 27 roadmap). Kept as a single seam on purpose.
  return new StubDesignProvider();
}
