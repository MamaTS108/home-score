import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client, used ONLY in server-side Route Handlers.
 *
 * Why: per the build order (spec section 29), the core PHOTO -> DESIGN ->
 * MATERIALS -> BUDGET flow must work *before* auth/dashboard are added, and
 * must also work for anonymous visitors trying the product. This client
 * intentionally bypasses Row Level Security so anonymous projects
 * (user_id = null) can be created and fetched by anyone holding the project's
 * UUID — the same "unguessable link" model used by many no-login MVPs.
 *
 * IMPORTANT before going to production with real accounts:
 * - Once a user is logged in, prefer `createSupabaseServerClient()` (RLS-scoped)
 *   for anything that should be strictly private.
 * - Never import this file in client components — the service role key must
 *   stay server-only (SUPABASE_SERVICE_ROLE_KEY, not NEXT_PUBLIC_*).
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local " +
        "(see .env.example)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
