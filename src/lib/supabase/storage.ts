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
