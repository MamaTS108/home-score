import { randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DesignGeneration } from "@/lib/types";
import { uploadRenderImage } from "@/lib/supabase/storage";

const AI_DISCLAIMER =
  "Visualisation IA — le résultat final peut différer de la réalisation.";

const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-lite-image";

export interface GenerateDesignInput {
  projectId: string;
  prompt: string;
  sourceImageUrl: string;
  sourceImageBase64?: string;
  sourceImageMediaType?: "image/jpeg" | "image/png" | "image/webp";
  version: number;
}

export interface DesignProvider {
  readonly name: string;
  generate(input: GenerateDesignInput): Promise<DesignGeneration>;
}

export class StubDesignProvider implements DesignProvider {
  readonly name = "stub";

  async generate(input: GenerateDesignInput): Promise<DesignGeneration> {
    return {
      id: randomUUID(),
      projectId: input.projectId,
      prompt: input.prompt,
      imageUrl: input.sourceImageUrl,
      sourceImageUrl: input.sourceImageUrl,
      version: input.version,
      createdAt: new Date().toISOString(),
      disclaimer: AI_DISCLAIMER,
    };
  }
}

/**
 * Requires GEMINI_API_KEY, AND that key's Google Cloud project ("Default
 * Gemini Project" by default) must have a real billing account linked with
 * prepaid credit — a free-trial billing account does not unlock image
 * generation. Check status at https://ai.studio/projects.
 */
export class GeminiDesignProvider implements DesignProvider {
  readonly name = "gemini-3.1-flash-lite-image";
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
  if (process.env.GEMINI_API_KEY) {
    return new GeminiDesignProvider(supabase);
  }
  return new StubDesignProvider();
}
