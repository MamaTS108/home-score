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
