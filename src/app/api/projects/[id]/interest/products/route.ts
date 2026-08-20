import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";
import { notifyProductInterest } from "@/lib/email/notifications";

/**
 * Captures "which product categories are you interested in" instead of
 * showing a fake marketplace. Lets us see real demand (spec: V1 demand
 * validation) before building a real supplier catalog/integration.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const categories = Array.isArray(body?.categories) ? body.categories.filter((c: unknown) => typeof c === "string") : [];

    if (categories.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins une catégorie." }, { status: 400 });
    }

    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("product_interest").insert({
      project_id: id,
      user_id: user?.id ?? null,
      categories,
    });

    if (error) throw error;

    // Best-effort — never blocks the response, and never fails the request.
    void notifyProductInterest({ userEmail: user?.email ?? null, categories });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/projects/[id]/interest/products failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
