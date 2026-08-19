import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";

/**
 * Same demand-capture principle as /api/projects/[id]/interest/products, but
 * for the standalone /catalogue page (no specific project context yet).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const categories = Array.isArray(body?.categories)
      ? body.categories.filter((c: unknown) => typeof c === "string")
      : [];

    if (categories.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins une catégorie." }, { status: 400 });
    }

    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("product_interest").insert({
      project_id: null,
      user_id: user?.id ?? null,
      categories,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/interest/catalogue failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
