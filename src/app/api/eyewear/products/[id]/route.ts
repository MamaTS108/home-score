import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";
import { errorMessage } from "@/lib/utils";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Champ 'active' (booléen) requis." }, { status: 400 });
    }

    const repo = new EyewearRepository(supabase);
    await repo.setActive(id, user.id, body.active);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/eyewear/products/[id] failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
    }

    const repo = new EyewearRepository(supabase);
    await repo.deleteProduct(id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/eyewear/products/[id] failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
