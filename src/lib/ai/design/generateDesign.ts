import { randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DesignGeneration } from "@/lib/types";
import { uploadRenderImage } from "@/lib/supabase/storage";

const AI_DISCLAIMER =
  "Visualisation IA — le résultat final peut différer de la réalisation.";

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

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

/**
 * Real image-generation backend: Google Gemini 2.5 Flash Image, in
 * image-editing mode (source photo + instruction in, edited photo out).
 * This is what keeps the same room, walls and windows while only changing
 * the finishes (spec section 5) — an instruction-based edit of the real
 * photo, not a from-scratch text-to-image generation.
 *
 * Requires GEMINI_API_KEY. Needs the source photo's bytes (not just its
 * URL), since Gemini takes the image as input alongside the text prompt.
 */
export class GeminiDesignProvider implements DesignProvider {
  readonly name = "gemini-2.5-flash-image";
  private client: GoogleGenAI;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to .env.local to enable AI-generated renders, " +
          "or remove it to fall back to the placeholder visualization. See .env.example."
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    this.supabase = supabase;
  }

  async generate(input: GenerateDesignInput): Promise<DesignGeneration> {
    if (!input.sourceImageBase64 || !input.sourceImageMediaType) {
      throw new Error("GeminiDesignProvider requires the source image bytes (sourceImageBase64).");
    }

    // input.prompt is already the full SYSTEM CONSTRAINTS + ROOM ANALYSIS +
    // USER REQUEST + BUDGET + STYLE prompt built by generateRenovationPrompt.
    // The user's free text is never sent to the model on its own.
    const response = await this.client.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: input.sourceImageMediaType, data: input.sourceImageBase64 } },
            { text: input.prompt },
          ],
        },
      ],
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      throw new Error("Gemini did not return an image. It may have refused the request — try rephrasing.");
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    const contentType = imagePart.inlineData.mimeType || "image/png";

    const imageUrl = await uploadRenderImage(this.supabase, {
      projectId: input.projectId,
      version: input.version,
      buffer,
      contentType,
    });

    return {
      id: randomUUID(),
      projectId: input.projectId,
      prompt: input.prompt,
      imageUrl,
      sourceImageUrl: input.sourceImageUrl,
      version: input.version,
      createdAt: new Date().toISOString(),
      disclaimer: AI_DISCLAIMER,
    };
  }
}

export function getDesignProvider(supabase: SupabaseClient): DesignProvider {
  // Uses Gemini 2.5 Flash Image when GEMINI_API_KEY is configured, and falls
  // back to the honest placeholder stub otherwise — never fakes a render.
  if (process.env.GEMINI_API_KEY) {
    return new GeminiDesignProvider(supabase);
  }
  return new StubDesignProvider();
}
