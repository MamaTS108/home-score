import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { errorMessage } from "@/lib/utils";
import { notifyArtisanInterest } from "@/lib/email/notifications";

/**
 * Captures "I'm interested in an artisan for this project" instead of
 * pretending a real matching network exists. Auto-fills what we already
 * know about the project (work type, budget) so the user barely has to
 * type anything — only an optional location is asked for.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const location = typeof body?.location === "string" ? body.location.trim() || null : null;

    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);
    const detail = await repo.getProjectDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const workType = detail.plan?.summary ?? detail.project.description.slice(0, 200);

    const { error } = await supabase.from("artisan_interest").insert({
      project_id: id,
      user_id: user?.id ?? null,
      work_type: workType,
      location,
      budget: detail.project.budgetMax,
    });

    if (error) throw error;

    void notifyArtisanInterest({ userEmail: user?.email ?? null, workType, location });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/projects/[id]/interest/artisan failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
