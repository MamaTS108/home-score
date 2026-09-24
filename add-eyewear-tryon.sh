#!/bin/bash
set -e
echo "Ajout de la fonctionnalite essayage virtuel de lunettes..."

mkdir -p "supabase/migrations"
cat > "supabase/migrations/0007_eyewear_catalog.sql" << 'TEELTE_EOF'
-- Eyewear catalog + virtual try-on for opticians.
--
-- Any authenticated user can become an "optician" simply by adding a product
-- (no separate approval flow for V1 — same demand-validation posture as the
-- rest of the product catalog). Each product belongs to the optician who
-- created it (optician_id -> auth.users.id) and is shown in the public
-- try-on catalogue once marked active.

create table if not exists eyewear_products (
  id uuid primary key default gen_random_uuid(),
  optician_id uuid not null references auth.users (id) on delete cascade,
  brand text not null,
  name text not null,
  category text not null default 'optique'
    check (category in ('optique', 'solaire')),
  price numeric,
  currency text not null default 'EUR',
  description text not null default '',
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_eyewear_products_optician_id on eyewear_products (optician_id);
create index if not exists idx_eyewear_products_active on eyewear_products (active);

alter table eyewear_products enable row level security;

-- The optician who owns a product can fully manage it.
create policy "eyewear_products: owner can manage" on eyewear_products
  for all using (auth.uid() = optician_id) with check (auth.uid() = optician_id);

-- Anyone (including anonymous visitors trying glasses on) can read active
-- products, so the public try-on catalogue works without an account.
create policy "eyewear_products: public read active" on eyewear_products
  for select using (active = true);

-- Storage bucket for glasses cutout images (ideally transparent PNG).
insert into storage.buckets (id, name, public)
values ('eyewear-photos', 'eyewear-photos', true)
on conflict (id) do nothing;
TEELTE_EOF

mkdir -p "src/lib/supabase"
cat > "src/lib/supabase/storage.ts" << 'TEELTE_EOF'
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "room-photos";

export async function uploadRoomPhoto(
  supabase: SupabaseClient,
  params: { projectId: string; buffer: Buffer; contentType: string; extension: string }
): Promise<string> {
  const path = `${params.projectId}/original.${params.extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, params.buffer, {
    contentType: params.contentType,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const EYEWEAR_BUCKET = "eyewear-photos";

/** Uploads an optician's glasses cutout photo and returns its public URL. */
export async function uploadEyewearImage(
  supabase: SupabaseClient,
  params: { opticianId: string; buffer: Buffer; contentType: string; extension: string }
): Promise<string> {
  const path = `${params.opticianId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${params.extension}`;

  const { error } = await supabase.storage.from(EYEWEAR_BUCKET).upload(path, params.buffer, {
    contentType: params.contentType,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(EYEWEAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function extensionFromMimeType(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Uploads an AI-generated "after" render (raw bytes) and returns its public URL. */
export async function uploadRenderImage(
  supabase: SupabaseClient,
  params: { projectId: string; version: number; buffer: Buffer; contentType: string }
): Promise<string> {
  const extension = extensionFromMimeType(params.contentType);
  const path = `${params.projectId}/render-v${params.version}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, params.buffer, {
    contentType: params.contentType,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
TEELTE_EOF

mkdir -p "src/lib"
cat > "src/lib/types.ts" << 'TEELTE_EOF'
/**
 * Teelte — Domain types
 *
 * These types are the contract between every layer of the app:
 * Vision -> Renovation planning -> Product provider -> Budget engine -> UI.
 *
 * Keeping them centralized means a future LeroyMerlinProvider or a real
 * image-generation provider can be swapped in without touching the UI.
 */

export type Currency = "EUR";

export type RoomType =
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "hallway"
  | "office"
  | "dining_room"
  | "other";

export type RenovationStyle =
  | "modern"
  | "scandinavian"
  | "minimalist"
  | "industrial"
  | "contemporary"
  | "classic"
  | "japandi"
  | "free";

export type ProjectStatus =
  | "draft" // photo uploaded, no analysis yet
  | "analyzing"
  | "analyzed" // room analysis done, ready for plan/design
  | "planning"
  | "ready" // plan + design + budget available
  | "archived";

export type DifficultyLevel = "easy" | "medium" | "hard" | "professional_required";

/** Approximate, vision-derived understanding of the uploaded room photo. */
export interface RoomAnalysis {
  id: string;
  projectId: string;
  roomType: RoomType;
  roomTypeConfidence: number; // 0-1
  /** All numeric measurements are approximations, never exact measures. */
  estimatedAreaM2: number | null;
  walls: {
    description: string;
    material: string | null;
    color: string | null;
    condition: string | null;
  };
  floor: {
    description: string;
    material: string | null;
    color: string | null;
    condition: string | null;
  };
  ceiling: {
    description: string;
    condition: string | null;
  };
  openings: {
    doors: number | null;
    windows: number | null;
  };
  furniture: string[];
  fixedElements: string[];
  detectedMaterials: string[];
  currentStyle: string | null;
  dominantColors: string[];
  notes: string;
  createdAt: string;
}

/** What the user typed + selected before generation. */
export interface ProjectBrief {
  description: string;
  style: RenovationStyle;
  budgetMax: number | null;
  currency: Currency;
}

export interface RenovationTask {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  diyPossible: boolean;
  quantityEstimated: number | null;
  unit: string | null;
  requiresProfessional: boolean;
  order: number;
}

export interface RenovationPlan {
  id: string;
  projectId: string;
  summary: string;
  tasks: RenovationTask[];
  requiredMaterialCategories: string[]; // feeds the ProductProvider
  createdAt: string;
  version: number;
}

/** A line item resolved through a ProductProvider (mock today, real catalog later). */
export interface ProductLine {
  id: string;
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  currency: Currency;
  provider: string; // e.g. "mock"
}

export interface ProductBudget {
  materials: number;
  accessories: number;
  estimatedProductsTotal: number;
  currency: Currency;
  lines: ProductLine[];
}

export interface BudgetSummary {
  userBudgetMax: number | null;
  estimatedProductsTotal: number;
  remaining: number | null;
  isOverBudget: boolean;
  currency: Currency;
}

export interface DesignGeneration {
  id: string;
  projectId: string;
  prompt: string;
  imageUrl: string;
  sourceImageUrl: string;
  version: number;
  createdAt: string;
  disclaimer: string;
}

/**
 * Home Score: an INDICATIVE energy-performance estimate derived from the
 * room's visible materials and the renovation plan — NOT an official French
 * DPE (Diagnostic de Performance Énergétique), which requires a certified
 * diagnostician and real thermal measurements (spec section 24: never
 * present the product as a diagnostiqueur).
 */
export interface HomeScoreBreakdown {
  overall: number; // 0-100
  isolation: number;
  chauffageVentilation: number;
  ouvertures: number; // windows / glazing
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  projectId: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface RenovationProject {
  id: string;
  userId: string | null;
  name: string;
  roomType: RoomType | null;
  description: string;
  style: RenovationStyle;
  budgetMax: number | null;
  currency: Currency;
  status: ProjectStatus;
  originalImageUrl: string;
  /** True once the user has paid to unlock the 3rd+ AI visualization for this project. */
  premiumUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EyewearCategory = "optique" | "solaire";

/** A pair of glasses added by an optician to the public try-on catalogue. */
export interface EyewearProduct {
  id: string;
  opticianId: string;
  brand: string;
  name: string;
  category: EyewearCategory;
  price: number | null;
  currency: Currency;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Full aggregate used by the UI — everything needed to render a project page. */
export interface ProjectDetail {
  project: RenovationProject;
  analysis: RoomAnalysis | null;
  plan: RenovationPlan | null;
  productBudget: ProductBudget | null;
  budgetSummary: BudgetSummary | null;
  /** Very rough, deterministic labor estimate — never a quote. See budgetEngine.estimateLaborCost. */
  laborEstimate: number | null;
  designs: DesignGeneration[];
  homeScore: HomeScoreBreakdown | null;
  messages: AiMessage[];
}
TEELTE_EOF

mkdir -p "src/lib/repositories"
cat > "src/lib/repositories/eyewearRepository.ts" << 'TEELTE_EOF'
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EyewearProduct } from "@/lib/types";

/**
 * All Supabase reads/writes for the eyewear catalog. Mirrors the shape of
 * ProjectRepository so API routes stay thin.
 */
export class EyewearRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createProduct(params: {
    opticianId: string;
    brand: string;
    name: string;
    category: "optique" | "solaire";
    price: number | null;
    description: string;
    imageUrl: string;
  }): Promise<EyewearProduct> {
    const { data, error } = await this.supabase
      .from("eyewear_products")
      .insert({
        optician_id: params.opticianId,
        brand: params.brand,
        name: params.name,
        category: params.category,
        price: params.price,
        description: params.description,
        image_url: params.imageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return mapProduct(data);
  }

  async listByOptician(opticianId: string): Promise<EyewearProduct[]> {
    const { data, error } = await this.supabase
      .from("eyewear_products")
      .select()
      .eq("optician_id", opticianId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  }

  /** Public catalogue: only active products, from every optician. */
  async listActive(): Promise<EyewearProduct[]> {
    const { data, error } = await this.supabase
      .from("eyewear_products")
      .select()
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  }

  async setActive(productId: string, opticianId: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("eyewear_products")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("optician_id", opticianId);
    if (error) throw error;
  }

  async deleteProduct(productId: string, opticianId: string): Promise<void> {
    const { error } = await this.supabase
      .from("eyewear_products")
      .delete()
      .eq("id", productId)
      .eq("optician_id", opticianId);
    if (error) throw error;
  }
}

function mapProduct(row: {
  id: string;
  optician_id: string;
  brand: string;
  name: string;
  category: EyewearProduct["category"];
  price: number | null;
  currency: EyewearProduct["currency"];
  description: string;
  image_url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}): EyewearProduct {
  return {
    id: row.id,
    opticianId: row.optician_id,
    brand: row.brand,
    name: row.name,
    category: row.category,
    price: row.price !== null ? Number(row.price) : null,
    currency: row.currency,
    description: row.description,
    imageUrl: row.image_url,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
TEELTE_EOF

mkdir -p "src/app/api/eyewear/products"
cat > "src/app/api/eyewear/products/route.ts" << 'TEELTE_EOF'
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
TEELTE_EOF

mkdir -p "src/app/api/eyewear/products/[id]"
cat > "src/app/api/eyewear/products/[id]/route.ts" << 'TEELTE_EOF'
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
TEELTE_EOF

mkdir -p "src/app/api/eyewear/catalogue"
cat > "src/app/api/eyewear/catalogue/route.ts" << 'TEELTE_EOF'
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
TEELTE_EOF

mkdir -p "src/app/opticien"
cat > "src/app/opticien/page.tsx" << 'TEELTE_EOF'
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EyewearDashboard } from "@/components/eyewear/EyewearDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";

export default async function OpticianPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/opticien");
  }

  const repo = new EyewearRepository(supabase);
  const products = await repo.listByOptician(user.id);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Espace opticien</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ajoutez vos montures pour que vos clients puissent les essayer virtuellement sur le site.
          </p>
        </div>

        <EyewearDashboard initialProducts={products} />
      </main>
    </>
  );
}
TEELTE_EOF

mkdir -p "src/components/eyewear"
cat > "src/components/eyewear/EyewearDashboard.tsx" << 'TEELTE_EOF'
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea, Select } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/utils";
import type { EyewearProduct } from "@/lib/types";

export function EyewearDashboard({ initialProducts }: { initialProducts: EyewearProduct[] }) {
  const [products, setProducts] = useState<EyewearProduct[]>(initialProducts);
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"optique" | "solaire">("optique");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setError("Ajoutez une photo de la monture (idéalement détourée, fond transparent).");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("brand", brand);
    formData.set("name", name);
    formData.set("category", category);
    formData.set("price", price);
    formData.set("description", description);
    formData.set("photo", photo);

    const res = await fetch("/api/eyewear/products", { method: "POST", body: formData });
    const json = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue.");
      return;
    }

    setProducts((prev) => [json.product, ...prev]);
    setBrand("");
    setName("");
    setCategory("optique");
    setPrice("");
    setDescription("");
    setPhoto(null);
    const fileInput = document.getElementById("eyewear-photo-input") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  }

  async function toggleActive(product: EyewearProduct) {
    setBusyId(product.id);
    const res = await fetch(`/api/eyewear/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    setBusyId(null);
    if (!res.ok) return;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
  }

  async function deleteProduct(product: EyewearProduct) {
    if (!confirm(`Supprimer "${product.brand} ${product.name}" ?`)) return;
    setBusyId(product.id);
    const res = await fetch(`/api/eyewear/products/${product.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) return;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Ajouter une monture</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marque</Label>
                <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="name">Nom du modèle</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as "optique" | "solaire")}>
                  <option value="optique">Optique (vue)</option>
                  <option value="solaire">Solaire</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Prix (EUR, optionnel)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="eyewear-photo-input">Photo de la monture</Label>
              <input
                id="eyewear-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-[var(--radius-button)] file:border-0 file:bg-accent-soft file:text-accent file:text-sm file:font-medium"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Idéalement une photo de face, fond transparent ou uni, pour un rendu propre à l&apos;essayage.
              </p>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter au catalogue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold">Mes montures ({products.length})</h2>
          <Link href="/essayage" className="text-sm text-accent font-medium">
            Voir la page d&apos;essayage →
          </Link>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune monture ajoutée pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-4 rounded-[var(--radius-button)] border border-border p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 rounded-md bg-surface overflow-hidden border border-border">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {product.brand} — {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.category === "solaire" ? "Solaire" : "Optique"}
                      {product.price !== null ? ` · ${formatCurrency(product.price, product.currency)}` : ""}
                    </p>
                  </div>
                  <Badge tone={product.active ? "accent" : "muted"}>
                    {product.active ? "Visible" : "Masqué"}
                  </Badge>
                  <Button variant="secondary" size="sm" disabled={busyId === product.id} onClick={() => toggleActive(product)}>
                    {product.active ? "Masquer" : "Afficher"}
                  </Button>
                  <Button variant="danger" size="sm" disabled={busyId === product.id} onClick={() => deleteProduct(product)}>
                    Supprimer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
TEELTE_EOF

mkdir -p "src/app/essayage"
cat > "src/app/essayage/page.tsx" << 'TEELTE_EOF'
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { EyewearTryOnPage } from "@/components/eyewear/EyewearTryOnPage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";

export default async function EssayagePage() {
  const supabase = createSupabaseAdminClient();
  const repo = new EyewearRepository(supabase);
  const products = await repo.listActive();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-12 pb-20">
          <Badge tone="accent">Essayage virtuel</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Essayez des lunettes avec votre webcam</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Choisissez une monture ci-dessous, autorisez l&apos;accès à votre webcam, et visualisez le rendu en
            temps réel sur votre visage. Aucune image n&apos;est enregistrée ni envoyée à un serveur : tout se
            passe directement dans votre navigateur.
          </p>

          <div className="mt-8">
            <EyewearTryOnPage products={products} />
          </div>
        </section>
      </main>
    </>
  );
}
TEELTE_EOF

mkdir -p "src/components/eyewear"
cat > "src/components/eyewear/EyewearTryOn.tsx" << 'TEELTE_EOF'
"use client";

import { useEffect, useRef, useState } from "react";
import type { EyewearProduct } from "@/lib/types";

// Landmark indices from MediaPipe's 468-point face mesh. Outer eye corners
// give us a stable reference for both the glasses' width and their rotation
// (roll); the nose bridge point pulls the vertical position down toward
// where frames actually rest.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_BRIDGE = 168;

// Glasses frames are noticeably wider than the outer-eye-corner distance
// (they extend out to the temples), so we scale the measured distance up.
const GLASSES_WIDTH_FACTOR = 2.3;

interface Props {
  product: EyewearProduct;
  onClose: () => void;
}

type Status = "loading-model" | "requesting-camera" | "running" | "error";

export function EyewearTryOn({ product, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);

  const [status, setStatus] = useState<Status>("loading-model");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const glassesImage = new Image();
    glassesImage.crossOrigin = "anonymous";
    glassesImage.src = product.imageUrl;
    glassesImageRef.current = glassesImage;

    async function start() {
      try {
        // Dynamic import: this library only works in the browser and is
        // fairly large, so it should never end up in the server bundle.
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (cancelled) {
          faceLandmarker.close();
          return;
        }
        landmarkerRef.current = faceLandmarker;

        setStatus("requesting-camera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        setStatus("running");
        renderLoop();
      } catch (err) {
        if (cancelled) return;
        console.error("Eyewear try-on failed to start", err);
        setStatus("error");
        setErrorMessage(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Accès à la webcam refusé. Autorisez la caméra dans votre navigateur pour essayer les lunettes."
            : "Impossible de démarrer l'essayage virtuel sur cet appareil."
        );
      }
    }

    function renderLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result?.faceLandmarks?.[0];
      const glassesImg = glassesImageRef.current;

      if (landmarks && glassesImg && glassesImg.complete && glassesImg.naturalWidth > 0) {
        const left = landmarks[LEFT_EYE_OUTER];
        const right = landmarks[RIGHT_EYE_OUTER];
        const nose = landmarks[NOSE_BRIDGE];

        const leftPx = { x: left.x * canvas.width, y: left.y * canvas.height };
        const rightPx = { x: right.x * canvas.width, y: right.y * canvas.height };
        const nosePx = { x: nose.x * canvas.width, y: nose.y * canvas.height };

        const dx = rightPx.x - leftPx.x;
        const dy = rightPx.y - leftPx.y;
        const eyeDistance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const glassesWidth = eyeDistance * GLASSES_WIDTH_FACTOR;
        const glassesHeight = glassesWidth * (glassesImg.naturalHeight / glassesImg.naturalWidth);

        const eyeMidX = (leftPx.x + rightPx.x) / 2;
        const eyeMidY = (leftPx.y + rightPx.y) / 2;
        // Blend the eye-corner midpoint with the nose bridge so the frame
        // sits slightly lower, closer to where glasses actually rest.
        const centerX = eyeMidX * 0.5 + nosePx.x * 0.5;
        const centerY = eyeMidY * 0.45 + nosePx.y * 0.55;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.drawImage(glassesImg, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close?.();
    };
    // Re-running this effect on every product change would restart the
    // camera/model unnecessarily; the glasses image swap is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the overlaid glasses without restarting the camera or the model.
  useEffect(() => {
    const glassesImage = new Image();
    glassesImage.crossOrigin = "anonymous";
    glassesImage.src = product.imageUrl;
    glassesImageRef.current = glassesImage;
  }, [product.imageUrl]);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <p className="font-medium">
            {product.brand} — {product.name}
          </p>
          <p className="text-xs text-muted-foreground">Essayage en direct, rien n&apos;est enregistré.</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
          Fermer
        </button>
      </div>

      <div className="relative bg-black aspect-[4/3] max-h-[70vh]">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-contain" style={{ transform: "scaleX(-1)" }} />

        {status !== "running" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm text-center px-6">
            {status === "loading-model" && "Chargement du modèle de détection de visage..."}
            {status === "requesting-camera" && "Autorisez l'accès à votre webcam..."}
            {status === "error" && (errorMessage ?? "Une erreur est survenue.")}
          </div>
        )}
      </div>
    </div>
  );
}
TEELTE_EOF

mkdir -p "src/components/eyewear"
cat > "src/components/eyewear/EyewearTryOnPage.tsx" << 'TEELTE_EOF'
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { EyewearTryOn } from "@/components/eyewear/EyewearTryOn";
import type { EyewearProduct } from "@/lib/types";

export function EyewearTryOnPage({ products }: { products: EyewearProduct[] }) {
  const [selected, setSelected] = useState<EyewearProduct | null>(null);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <p className="font-medium mb-1">Aucune monture disponible pour le moment.</p>
          <p className="text-sm text-muted-foreground mb-5">
            Les opticiens partenaires ajoutent progressivement leur catalogue.
          </p>
          <a href="/opticien">
            <Button variant="secondary">Je suis opticien, ajouter mon catalogue</Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  if (selected) {
    return <EyewearTryOn product={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => setSelected(product)}
          className="text-left rounded-[var(--radius-card)] border border-border bg-surface overflow-hidden hover:border-border-strong transition-colors"
        >
          <div className="relative aspect-square bg-white">
            <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4" unoptimized />
            <Badge tone={product.category === "solaire" ? "accent" : "default"} className="absolute top-2 left-2">
              {product.category === "solaire" ? "Solaire" : "Optique"}
            </Badge>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium truncate">{product.brand}</p>
            <p className="text-xs text-muted-foreground truncate">{product.name}</p>
            {product.price !== null && (
              <p className="text-sm mt-1 font-medium">{formatCurrency(product.price, product.currency)}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
TEELTE_EOF

mkdir -p "src/components/layout"
cat > "src/components/layout/SiteHeader.tsx" << 'TEELTE_EOF'
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ADMIN_EMAIL } from "@/lib/email/resend";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lets the login link bring people back to wherever they were, after
  // signing in — set by proxy.ts on every request.
  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") ?? "/";
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  const isAdmin = !!user?.email && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar: logo, search, account, cart */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-20 flex items-center gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/images/logo-teelte.png" alt="Teelte" width={130} height={36} className="h-9 w-auto" unoptimized />
          </Link>

          {/* Search bar — visual for now, will search the marketplace catalog once it exists */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="flex w-full h-11 rounded-full border border-border-strong bg-surface overflow-hidden">
              <input
                type="search"
                placeholder="Rechercher un produit..."
                disabled
                className="flex-1 px-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-5 bg-accent text-accent-foreground text-sm font-medium disabled:opacity-90 disabled:cursor-not-allowed"
                title="Bientôt disponible"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Rechercher
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <Link
                  href="/compte"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="hidden sm:inline">{user.email}</span>
                  <span className="sm:hidden">Compte</span>
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href={loginHref} className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
                  Se connecter
                </Link>
                <Link href="/renovate">
                  <Button size="sm" className="whitespace-nowrap">
                    <span className="hidden sm:inline">Démarrer ma rénovation</span>
                    <span className="sm:hidden">Démarrer...</span>
                  </Button>
                </Link>
              </>
            )}
            <button
              type="button"
              disabled
              title="Panier, bientôt disponible"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground disabled:cursor-not-allowed"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                <path
                  d="M2 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] leading-4 text-center font-medium">
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary nav bar */}
      <div className="bg-accent text-accent-foreground">
        <div className="mx-auto max-w-6xl px-6 h-11 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <Link href="/renovate" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Nouveau projet
          </Link>
          <Link href="/app" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Mes projets
          </Link>
          <Link href="/catalogue" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Catalogue produits
          </Link>
          <Link href="/tarifs" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Tarifs
          </Link>
          <Link href="/essayage" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Essayer des lunettes
          </Link>
          <Link href="/opticien" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Espace opticien
          </Link>
          {isAdmin && (
            <Link
              href="/admin/demandes"
              className="whitespace-nowrap hover:opacity-80 transition-opacity font-semibold"
            >
              📊 Demandes (admin)
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
TEELTE_EOF

echo "Installation de la dependance MediaPipe..."
npm install @mediapipe/tasks-vision@1.0.1

echo "Verification du build..."
npm run build

echo "Commit + push..."
git add -A
git commit -m "Add eyewear catalog for opticians + browser-based virtual try-on (MediaPipe Face Landmarker)"
git push

echo "Termine. Pensez a executer la migration 0007_eyewear_catalog.sql dans Supabase (SQL editor)."
