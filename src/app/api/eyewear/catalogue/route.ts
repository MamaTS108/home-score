import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";
import { errorMessage } from "@/lib/utils";

/** Public catalogue, no auth required — anonymous visitors can try glasses on. */
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const repo = new EyewearRepository(supabase);
    const products = await repo.listActive();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/eyewear/catalogue failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
