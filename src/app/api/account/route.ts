import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";

/**
 * Deletes the current user's account entirely. Every table that references
 * auth.users (renovation_projects, user_subscriptions, product_interest,
 * artisan_interest, profiles...) is set up with `on delete cascade`, so
 * deleting the auth user is enough to remove all of their data.
 *
 * Does NOT cancel an active Stripe subscription automatically — that's a
 * deliberate choice: canceling billing is a separate, consequential action
 * we don't want to silently bundle into account deletion. The UI should
 * point people to cancel their subscription first if they have one.
 */
export async function DELETE() {
  try {
    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous d'abord." }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/account failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
