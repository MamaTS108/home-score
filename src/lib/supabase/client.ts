import { createBrowserClient } from "@supabase/ssr";

/** Use in client components. Reads the public (anon) env vars only. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
