import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { errorMessage } from "@/lib/utils";
import type { RenovationStyle } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);
    const detail = await repo.getProjectDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    return NextResponse.json({ detail });
  } catch (error) {
    console.error("GET /api/projects/[id] failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      description?: string;
      style?: RenovationStyle;
      budgetMax?: number | null;
    };

    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);

    await repo.updateBrief(id, {
      description: body.description ?? "",
      style: body.style ?? "free",
      budgetMax: body.budgetMax ?? null,
      currency: "EUR",
    });

    const detail = await repo.getProjectDetail(id);
    return NextResponse.json({ detail });
  } catch (error) {
    console.error("PATCH /api/projects/[id] failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous pour supprimer un projet." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);
    await repo.deleteProject(id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
