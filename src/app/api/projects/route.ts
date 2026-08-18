import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { extensionFromMimeType, uploadRoomPhoto } from "@/lib/supabase/storage";
import { ProjectRepository } from "@/lib/repositories/projectRepository";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    const name = (formData.get("name") as string | null) ?? "Mon projet de rénovation";
    const userId = (formData.get("userId") as string | null) || null;

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Une photo est requise." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: "Formats acceptés : JPG, PNG, WEBP." }, { status: 400 });
    }
    if (photo.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "La photo est trop volumineuse (10MB max)." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);

    const buffer = Buffer.from(await photo.arrayBuffer());

    // Create the row first to get an id, then upload under that id.
    const project = await repo.createProject({ userId, name, originalImageUrl: "" });

    const publicUrl = await uploadRoomPhoto(supabase, {
      projectId: project.id,
      buffer,
      contentType: photo.type,
      extension: extensionFromMimeType(photo.type),
    });

    await supabase.from("renovation_projects").update({ original_image_url: publicUrl }).eq("id", project.id);

    return NextResponse.json({ project: { ...project, originalImageUrl: publicUrl } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }
    const supabase = createSupabaseAdminClient();
    const repo = new ProjectRepository(supabase);
    const projects = await repo.listProjects(userId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur inattendue.";
}
