import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { extensionFromMimeType, uploadEyewearImage } from "@/lib/supabase/storage";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";
import { errorMessage } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous pour ajouter un produit." }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    const brand = (formData.get("brand") as string | null)?.trim();
    const name = (formData.get("name") as string | null)?.trim();
    const category = (formData.get("category") as string | null) === "solaire" ? "solaire" : "optique";
    const priceRaw = formData.get("price") as string | null;
    const price = priceRaw && priceRaw.trim() !== "" ? Number(priceRaw) : null;
    const description = ((formData.get("description") as string | null) ?? "").trim();

    if (!brand || !name) {
      return NextResponse.json({ error: "La marque et le nom du modèle sont requis." }, { status: 400 });
    }
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Une photo de la monture est requise." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: "Formats acceptés : JPG, PNG, WEBP." }, { status: 400 });
    }
    if (photo.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "L'image est trop volumineuse (8MB max)." }, { status: 400 });
    }
    if (price !== null && (Number.isNaN(price) || price < 0)) {
      return NextResponse.json({ error: "Le prix doit être un nombre positif." }, { status: 400 });
    }

    // Use the admin client only for the storage upload (service role bypasses
    // the public bucket policy check cleanly); the row insert below still
    // goes through the RLS-scoped server client, so ownership is enforced by
    // Postgres, not by trusting the request.
    const adminClient = createSupabaseAdminClient();
    const buffer = Buffer.from(await photo.arrayBuffer());
    const imageUrl = await uploadEyewearImage(adminClient, {
      opticianId: user.id,
      buffer,
      contentType: photo.type,
      extension: extensionFromMimeType(photo.type),
    });

    const repo = new EyewearRepository(supabase);
    const product = await repo.createProduct({
      opticianId: user.id,
      brand,
      name,
      category,
      price,
      description,
      imageUrl,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/eyewear/products failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous pour voir votre catalogue." }, { status: 401 });
    }

    const repo = new EyewearRepository(supabase);
    const products = await repo.listByOptician(user.id);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/eyewear/products failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
