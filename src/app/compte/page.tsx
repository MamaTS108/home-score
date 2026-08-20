import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { SubscriptionCard } from "@/components/account/SubscriptionCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPremiumStatus } from "@/lib/stripe/isUserPremium";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/compte");
  }

  const premium = await getPremiumStatus(supabase, user.id);
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mon compte</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez votre profil, votre abonnement et votre sécurité.</p>
        </div>

        <ProfileForm initialFullName={fullName} email={user.email ?? ""} />

        <SubscriptionCard
          isPremium={premium.isPremium}
          generationsUsed={premium.generationsUsed}
          generationsLimit={premium.generationsLimit}
          currentPeriodEnd={premium.currentPeriodEnd}
        />

        <ChangePasswordForm />

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Session</h2>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>

        <DeleteAccountButton isPremium={premium.isPremium} />
      </main>
    </>
  );
}
