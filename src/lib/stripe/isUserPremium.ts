import type { SupabaseClient } from "@supabase/supabase-js";

/** Generous but real cap, protects against unbounded AI cost exposure per subscriber. */
export const PREMIUM_MONTHLY_GENERATIONS = 200;

export interface PremiumStatus {
  isPremium: boolean;
  /** AI generations used across all of this user's projects since the current billing period started. */
  generationsUsed: number;
  generationsLimit: number;
  quotaExceeded: boolean;
}

/** Checks whether a user has an active Premium subscription. Cheap, single-row lookup. */
export async function isUserPremium(supabase: SupabaseClient, userId: string | null): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.status === "active";
}

/**
 * Full Premium status including the monthly generation quota (200/month by
 * default), counted from design_generations across every project this user
 * owns, since their current Stripe billing period started.
 */
export async function getPremiumStatus(supabase: SupabaseClient, userId: string | null): Promise<PremiumStatus> {
  const inactive: PremiumStatus = {
    isPremium: false,
    generationsUsed: 0,
    generationsLimit: PREMIUM_MONTHLY_GENERATIONS,
    quotaExceeded: false,
  };
  if (!userId) return inactive;

  const { data: sub, error: subError } = await supabase
    .from("user_subscriptions")
    .select("status, current_period_start")
    .eq("user_id", userId)
    .maybeSingle();

  if (subError || !sub || sub.status !== "active") return inactive;

  const periodStart = sub.current_period_start ?? new Date(0).toISOString();

  const { count, error: countError } = await supabase
    .from("design_generations")
    .select("id, renovation_projects!inner(user_id)", { count: "exact", head: true })
    .eq("renovation_projects.user_id", userId)
    .gte("created_at", periodStart);

  const generationsUsed = countError ? 0 : (count ?? 0);

  return {
    isPremium: true,
    generationsUsed,
    generationsLimit: PREMIUM_MONTHLY_GENERATIONS,
    quotaExceeded: generationsUsed >= PREMIUM_MONTHLY_GENERATIONS,
  };
}
